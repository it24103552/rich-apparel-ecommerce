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
        eyebrow: "Women's Signature Edit",
        title: "Women's Collection",
        description: "Elegant, timeless styles designed for her everyday moments.",
        image: "/assets/img/split image 2.png",
        imagePosition: "object-[center_16%]",
        filter: ['women', 'womens', 'female', 'girl', 'unisex', 'all']
      };
    } else if (name === 'men') {
      return {
        eyebrow: "Modern Menswear Edit",
        title: "Men's Collection",
        description: "Bold essentials and modern fits built for the contemporary man.",
        image: "/assets/img/split image .png",
        imagePosition: "object-[center_18%]",
        filter: ['men', 'mens', 'male', 'boy', 'unisex', 'all']
      };
    } else if (name === 'kids' || name === 'sporty') {
      return {
        eyebrow: "Performance & Movement",
        title: "Sport & Active",
        description: "High-performance wear designed for movement and life.",
        image: "/assets/img/split image 3.png",
        imagePosition: "object-[center_14%]",
        filter: ['kids', 'sport', 'active', 'athletic', 'gym', 'fitness']
      };
    }
    return {
      eyebrow: "Rich Apparel Storefront",
      title: "Our Collection",
      description: "Discover our full range of premium apparel.",
      image: "/assets/img/main hero bg.png",
      imagePosition: "object-center",
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

  const activeCategoryKey = (categoryName || "all").toLowerCase();
  const collectionLinks = [
    { key: "all", label: "All", path: "/category/all" },
    { key: "women", label: "Women", path: "/category/women" },
    { key: "men", label: "Men", path: "/category/men" },
    { key: "sporty", label: "Sporty", path: "/category/sporty" },
  ];

  return (
    <div
      className="bg-white min-h-screen overflow-x-clip selection:bg-[#161514] selection:text-white"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Editorial Category Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f5eee6] via-[#ece2d6] to-[#dfd1c0] border-b border-[#e8dfd3]">
        {/* Soft Editorial Ambient Accents (matching HomePage) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div
            className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full opacity-75"
            style={{
              background:
                "radial-gradient(circle, rgba(255,252,247,0.92) 0%, rgba(245,238,230,0) 70%)",
            }}
          />
          <svg
            viewBox="0 0 1440 520"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <path
              d="M640,520 C700,300 810,130 980,0 L1440,0 L1440,520 Z"
              fill="#b59d84"
              fillOpacity="0.24"
            />
            <path
              d="M780,520 C840,335 930,165 1100,0 L1440,0 L1440,520 Z"
              fill="#6e5742"
              fillOpacity="0.18"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-center">
            {/* Left: Editorial Heading & Metadata */}
            <motion.div
              key={activeCategoryKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              {/* Breadcrumb */}
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-2 mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a6d5e]"
              >
                <Link to="/" className="hover:text-[#151413] transition-colors">
                  Home
                </Link>
                <ChevronRight size={11} className="text-[#a39482]" />
                <span>Shop</span>
                <ChevronRight size={11} className="text-[#a39482]" />
                <span className="text-[#151413] font-bold">{categoryInfo.title}</span>
              </nav>

              <span className="inline-block text-[11.5px] sm:text-[12.5px] font-bold uppercase tracking-[0.26em] text-[#7c664e] mb-2.5">
                {categoryInfo.eyebrow}
              </span>

              <h1 className="text-[2.15rem] sm:text-[2.85rem] lg:text-[3.35rem] xl:text-[3.85rem] font-extrabold text-[#151413] uppercase tracking-[-0.03em] leading-[0.98] mb-4">
                {categoryInfo.title}
              </h1>

              <p className="text-[14.5px] sm:text-[16px] text-[#453d35] font-medium max-w-xl leading-relaxed mb-6">
                {categoryInfo.description}
              </p>

              <div className="flex flex-wrap items-center gap-3.5">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xs border border-[#dfd4c6] shadow-[0_2px_10px_rgba(32,25,18,0.04)]">
                  <span className="w-2 h-2 rounded-full bg-[#9a7b56]" aria-hidden="true" />
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#151413]">
                    {loading
                      ? "Loading Collection..."
                      : `${filteredProducts.length} ${filteredProducts.length === 1 ? "Item" : "Items"} Available`}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right: Framed Editorial Category Visual */}
            <motion.div
              key={`${activeCategoryKey}-media`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <div className="relative rounded-[22px] overflow-hidden border border-[#ddd0bf] bg-[#e7dccf] shadow-[0_18px_44px_rgba(32,25,18,0.12)] aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/10] max-h-[340px] w-full">
                <img
                  src={categoryInfo.image}
                  alt={categoryInfo.title}
                  className={`w-full h-full object-cover ${categoryInfo.imagePosition}`}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#151413]/25 via-transparent to-transparent pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Listing Section */}
      <section className="py-10 md:py-14 bg-white min-h-[60vh]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          {/* Collection Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#f0e9df]">
            <div className="flex flex-wrap items-center gap-3.5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#161514] text-white rounded-full text-[11px] font-bold uppercase tracking-[0.14em]">
                <LayoutGrid size={13.5} />
                <span>Collection Grid</span>
              </div>
              <span className="text-[12.5px] font-semibold text-[#6c6257]">
                {loading
                  ? "Fetching items..."
                  : `Showing ${filteredProducts.length} ${filteredProducts.length === 1 ? "result" : "results"}`}
              </span>
            </div>

            {/* Quick Collection Tabs (matching HomePage New Arrivals tabs) */}
            <div
              role="navigation"
              aria-label="Browse Collections"
              className="inline-flex items-center bg-[#f6f1ea] border border-[#ebe3d8] p-1 rounded-full w-fit overflow-x-auto no-scrollbar max-w-full"
            >
              {collectionLinks.map((item) => {
                const isCurrent =
                  activeCategoryKey === item.key ||
                  (item.key === "sporty" && activeCategoryKey === "kids") ||
                  (item.key === "all" &&
                    !["women", "men", "sporty", "kids"].includes(activeCategoryKey));
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`px-4 sm:px-5 py-2 rounded-full text-[11.5px] font-bold tracking-[0.06em] uppercase whitespace-nowrap transition-all duration-200 ${
                      isCurrent
                        ? "bg-[#161514] text-white shadow-xs"
                        : "text-[#6f655a] hover:text-[#161514]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={10} />
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[#faf7f2] border border-[#ebe3d8] rounded-[20px] py-6">
              <EmptyState
                title="Nothing matching found"
                description="Try checking another collection or contact support if you're looking for something specific."
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Bottom Collection CTA */}
          {!loading && filteredProducts.length > 0 && activeCategoryKey !== "all" && (
            <div className="mt-14 pt-6 border-t border-[#f0e9df] flex justify-center">
              <Link
                to="/category/all"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white border border-[#d8cec0] hover:border-[#161514] hover:bg-[#161514] text-[#161514] hover:text-white text-[12px] font-bold uppercase tracking-[0.14em] transition-all duration-200 group"
              >
                <span>View Everything</span>
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Editorial Featured Collection Banner (aligned with HomePage promo panels) */}
      <section className="py-12 md:py-14 bg-[#faf7f2] border-t border-[#ece4d9]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#ece1d4] via-[#e3d4c2] to-[#d5c1aa] border border-[#e3d6c6] min-h-[290px] sm:min-h-[330px] flex items-center group">
            {/* Right Editorial Visual */}
            <div className="hidden md:block absolute inset-y-0 right-0 w-[46%] lg:w-[44%] pointer-events-none overflow-hidden">
              <img
                src="/assets/img/split image .png"
                alt="Seasonal Edit"
                className="w-full h-full object-cover object-[center_15%] group-hover:scale-[1.03] transition-transform duration-500"
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-[#dfcfbc] via-[#dfcfbc]/45 to-transparent"
                aria-hidden="true"
              />
            </div>

            <div className="relative z-10 p-7 sm:p-10 lg:p-12 max-w-xl">
              <span className="block text-[11.5px] sm:text-[12.5px] font-bold uppercase tracking-[0.26em] text-[#6d5d4d] mb-2.5">
                Seasonal Edit
              </span>
              <h2 className="text-[1.9rem] sm:text-[2.5rem] lg:text-[2.85rem] font-extrabold text-[#151413] uppercase tracking-[-0.03em] leading-[1.02] mb-4">
                The Ultimate
                <br />
                Style Protocol
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#453d35] font-medium leading-relaxed mb-7">
                Explore the curated essentials that define the next generation of streetwear.
                Premium fabrics meet timeless silhouettes.
              </p>
              <Link
                to="/new-arrivals"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#161514] hover:bg-[#2c2926] text-white text-[13px] font-semibold tracking-[0.02em] shadow-[0_10px_24px_rgba(22,21,20,0.18)] hover:-translate-y-0.5 transition-all duration-200 group/cta"
              >
                <span>Learn More</span>
                <ArrowRight
                  size={15}
                  className="group-hover/cta:translate-x-0.5 transition-transform"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
