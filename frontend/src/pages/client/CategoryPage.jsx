import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, LayoutGrid } from "lucide-react";
import { productsService } from "../../services";
import { ProductCard } from "../../components/common/ProductCard";
import { ProductGridSkeleton } from "../../components/loading/ClientSkeletons";
import { EmptyState } from "../../components/common/EmptyState";

export const CategoryPage = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    productsService.getAll(0, 1000)
      .then((res) => {
        const responseData = res.data?.data?.products || res.data?.products || res.data?.data || res.data || [];
        setProducts(Array.isArray(responseData) ? responseData : []);
      })
      .catch((err) => console.error("Fetch Error:", err))
      .finally(() => setLoading(false));
  }, []);

  const categoryInfo = useMemo(() => {
    const name = categoryName?.toLowerCase();
    if (name === 'women') {
      return {
        title: "Women's Collection",
        description: "Elegant, timeless styles designed for her everyday moments.",
        image: "/assets/img/split image 2.png",
        filter: ['women', 'womens', 'female', 'girl', 'unisex', 'all']
      };
    } else if (name === 'men') {
      return {
        title: "Men's Collection",
        description: "Bold essentials and modern fits built for the contemporary man.",
        image: "/assets/img/split image .png",
        filter: ['men', 'mens', 'male', 'boy', 'unisex', 'all']
      };
    } else if (name === 'kids' || name === 'sporty') {
      return {
        title: "Sport & Active",
        description: "High-performance wear designed for movement and life.",
        image: "/assets/img/split image 3.png",
        filter: ['kids', 'sport', 'active', 'athletic', 'gym', 'fitness']
      };
    }
    return {
      title: "Our Collection",
      description: "Discover our full range of premium apparel.",
      image: "/assets/img/main hero bg.png",
      filter: []
    };
  }, [categoryName]);

  const filteredProducts = useMemo(() => {
    if (!products.length || !categoryInfo.filter.length) return products;

    return products.filter(product => {
      const matchesKeywords = (str) => {
        const lowerStr = (str || '').toLowerCase();
        return categoryInfo.filter.some(kw => {
          const lowerKW = kw.toLowerCase();
          // Strict check: if looking for men/mens, it shouldn't be women
          if ((lowerKW === 'men' || lowerKW === 'mens') && lowerStr.includes('women')) return false;
          return lowerStr.includes(lowerKW);
        });
      };

      // Check category name
      if (matchesKeywords(product.category?.name)) return true;
      if (matchesKeywords(product.gender)) return true;

      // Check variants
      if (product.variants && Array.isArray(product.variants)) {
        return product.variants.some(v => {
          if (!v.attributes) return false;
          return Object.entries(v.attributes).some(([key, value]) => {
            const k = key.toLowerCase();
            if (k.includes('sex') || k.includes('gender') || k.includes('category')) {
              const vals = (Array.isArray(value) ? value : [value]).map(v => String(v).toLowerCase().trim());
              return vals.some(val => matchesKeywords(val));
            }
            return false;
          });
        });
      }
      return false;
    });
  }, [products, categoryInfo]);

  return (
    <div className="bg-white min-h-screen pt-20" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Hero Header */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={categoryInfo.image}
            className="w-full h-full object-cover scale-105"
            alt={categoryInfo.title}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-full mx-auto px-[10%] w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <nav className="flex items-center gap-2 mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={10} />
              <span className="text-white">Shop</span>
            </nav>
            <h1 className="text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter mb-4 leading-none">
              {categoryInfo.title}
            </h1>
            <p className="text-[14px] md:text-[16px] text-white/70 font-medium max-w-lg leading-relaxed mb-8">
              {categoryInfo.description}
            </p>
            <div className="flex items-center gap-4">
              <div className="h-[2px] w-12 bg-white" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/100">
                {filteredProducts.length} Items Found
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Listing */}
      <section className="py-24 bg-white min-h-[60vh]">
        <div className="max-w-full mx-auto px-[10%]">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 pb-8 border-b border-neutral-100 gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                <LayoutGrid size={14} /> Grid View
              </div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                Showing {filteredProducts.length} results
              </span>
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="Nothing matching found"
              description="Try checking another collection or contact support if you're looking for something specific."
            />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Load More CTA (Optional/Simulated) */}
          {!loading && filteredProducts.length > 0 && (
            <div className="mt-20 text-center">
              <button className="px-10 py-4 border-2 border-black text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-black hover:text-white transition-all duration-500 transform hover:-translate-y-1 cursor-pointer">
                View Everything
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Collection Banner */}
      <section className="py-24 bg-black overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 grayscale pointer-events-none">
          <img src="/assets/img/split image .png" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="max-w-full mx-auto px-[10%] relative z-10">
          <div className="max-w-xl">
            <span className="text-white/50 text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">Seasonal Edit</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-tighter mb-6 leading-tight">
              The Ultimate<br />Style Protocol
            </h2>
            <p className="text-white/60 text-[13px] font-medium leading-relaxed mb-10">
              Explore the curated essentials that define the next generation of streetwear. Premium fabrics meets timeless silhouettes.
            </p>
            <Link to="/new-arrivals" className="inline-flex items-center gap-3 px-8 py-3.5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] rounded-full hover:scale-105 transition-transform">
              Learn More <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
