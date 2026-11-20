import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Star,
  Check,
  Truck,
  CreditCard,
  ShieldCheck,
  Headphones,
  Instagram,
  Facebook,
  Twitter,
  ShoppingCart,
  X,
  Heart,
  Eye
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { productsService } from "../../services";
import { formatPrice } from "../../utils/formatters";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { useCart } from "../../hooks/useCart";


import { ProductCard } from "../../components/common/ProductCard";

const CategoryProductRow = ({ title, subtitle, products, linkPath, accent, isEven }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [products]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('.category-card')?.offsetWidth || 300;
    const scrollAmount = cardWidth + 20; // card width + gap
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className={`py-20 ${isEven ? 'bg-white' : 'bg-[#f7f7f7]'} overflow-hidden`}>
      <div className="max-w-full mx-auto px-[10%]">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-1 h-10 bg-black rounded-full mt-1" />
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-black uppercase tracking-tight mb-1">{title}</h2>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400">{subtitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Arrow Buttons */}
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 cursor-pointer ${canScrollLeft
                  ? 'border-black text-black hover:bg-black hover:text-white shadow-sm'
                  : 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                }`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 cursor-pointer ${canScrollRight
                  ? 'border-black text-black hover:bg-black hover:text-white shadow-sm'
                  : 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                }`}
            >
              <ChevronRight size={20} />
            </button>

            {/* See All Button */}
            <Link
              to={linkPath || "/"}
              className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.25em] bg-black text-white hover:bg-neutral-800 rounded-full px-7 py-3 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)] hover:-translate-y-1 group/btn cursor-pointer"
            >
              SEE ALL <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          {/* Left gradient fade */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" style={isEven ? {} : { background: 'linear-gradient(to right, #f7f7f7, transparent)' }} />
          )}
          {/* Right gradient fade */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" style={isEven ? {} : { background: 'linear-gradient(to left, #f7f7f7, transparent)' }} />
          )}

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <div key={product.id} className="category-card flex-shrink-0 w-[260px] md:w-[280px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Women');
  const [currentHero, setCurrentHero] = useState(0);
  const { addToCart } = useCart();

  const heroBanners = [
    { id: 1, image: "/assets/img/hero1.jpg", title: "New Arrivals", sub: "Explore the latest in fashion" },
    { id: 2, image: "/assets/img/hero2.jpg", title: "Summer Sale", sub: "Up to 50% off sitewide" },
    { id: 3, image: "/assets/img/hero3.png", title: "Modern Style", sub: "Designed for the bold" }
  ];

  const brandLogos = [
    "/assets/img/brand1.jpg",
    "/assets/img/brand2.jpg",
    "/assets/img/brand3.jpg",
    "/assets/img/brand4.png",
    "/assets/img/brand1.jpg",
    "/assets/img/brand2.jpg"
  ];

  const branches = [
    { name: "KEGALLE", address: "No. 88, Kandy Road, Kegalle", phone: "035 222 2222" },
    { name: "MATALE", address: "No. 45, Trinco Street, Matale", phone: "066 222 2222" },
    { name: "KURUNEGALA", address: "No. 12, Puttlam Road, Kurunegala", phone: "037 222 2222" },
    { name: "KANDY", address: "No. 202, Peradeniya Road, Kandy", phone: "081 222 2222" },
    { name: "NEGOMBO", address: "No. 15, Greens Road, Negombo", phone: "031 222 2222" }
  ];

  useEffect(() => {
    // Fetch a larger set (100) to ensure plenty of items for each tab
    productsService.getAll(0, 100)
      .then((res) => {
        // Handle various potential API response shapes
        const responseData = res.data?.data?.products || res.data?.products || res.data?.data || res.data || [];
        setProducts(Array.isArray(responseData) ? responseData : []);
      })
      .catch((err) => console.error("Filter Error:", err))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      setCurrentHero(prev => (prev + 1) % heroBanners.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Hero slide carousel — 10 second rotation
  const [heroSlide, setHeroSlide] = useState(0);
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  const handleViewProduct = (product) => {
    navigate(`/product/${product.id}`);
  };

  // Parallax scroll spread effect for hero models
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  // Left model drifts further left, right model drifts further right
  const modelLeftX = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const modelRightX = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const modelCenterY = useTransform(scrollYProgress, [0, 1], [0, -1]);

  // Filter products by collection/category name or variant attribute
  const filteredNewArrivals = React.useMemo(() => {
    if (!products || products.length === 0) return [];

    return products.filter(product => {
      const tab = activeTab.toLowerCase();
      const prodCategoryStr = String(product.gender || (product.category && product.category.name) || product.category || '').toLowerCase();

      const matchesTab = (str) => {
        if (!str) return false;
        if (tab === 'sporty') {
          return str.includes('sport') || str.includes('active') || str.includes('athletic') || str.includes('gym');
        } else if (tab === 'men') {
          return (str.includes('men') && !str.includes('women')) || str.includes('male') || str.includes('boy');
        } else if (tab === 'women') {
          return str.includes('women') || str.includes('female') || str.includes('girl');
        }
        return false;
      };

      // Check product's assigned collection/category first
      if (matchesTab(prodCategoryStr)) return true;

      if (!product.variants || product.variants.length === 0) {
        return false;
      }

      return product.variants.some(v => {
        if (!v.attributes) return false;
        const allAttrValues = Object.entries(v.attributes).flatMap(([key, value]) => {
          const k = key.toLowerCase();
          if (k.includes('sex') || k.includes('gender') || k.includes('category') || k.includes('collection')) {
            return (Array.isArray(value) ? value : [value]).map(v => String(v).toLowerCase().trim());
          }
          return [];
        });

        if (allAttrValues.length === 0) return false;

        return allAttrValues.some(val => matchesTab(val));
      });
    });
  }, [products, activeTab]);

  return (
    <div className="bg-white min-h-screen" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Hero Section — Auto-rotating carousel */}
      <section ref={heroRef} className="relative min-h-[100vh] bg-[#111] overflow-hidden flex flex-col justify-center">
        {/* Dark Background Image (halftone/texture) */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/img/main hero bg.png"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
        </div>

        <AnimatePresence mode="wait">
          {/* === SLIDE 1: Men === */}
          {heroSlide === 0 && (
            <motion.div
              key="slide-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              {/* Ghosted left-side figure */}
              <div className="absolute inset-0 z-[1] hidden md:block pointer-events-none">
                <motion.img
                  src="/assets/img/leftside img 1.png"
                  alt=""
                  className="absolute bottom-0 left-[0] h-[100%] w-auto object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Model Cutout Images */}
              <div className="absolute inset-0 z-[5] hidden md:block overflow-hidden">
                <motion.img
                  src="/assets/img/index men img2.png"
                  alt="Model"
                  className="absolute bottom-0 h-[83%] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                  style={{ zIndex: 1, right: '35%', x: modelLeftX }}
                  initial={{ y: '100%', opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.img
                  src="/assets/img/index girl img 1.png"
                  alt="Model"
                  className="absolute bottom-0 h-[78%] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                  style={{ zIndex: 2, right: '22%', y: modelCenterY }}
                  initial={{ y: '100%', opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.img
                  src="/assets/img/index men img1.png"
                  alt="Model"
                  className="absolute bottom-0 h-[70%] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                  style={{ zIndex: 3, right: '10%', x: modelRightX }}
                  initial={{ y: '100%', opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              {/* Hero Text */}
              <div className="relative z-10 w-full max-w-full mx-auto px-[10%] mt-24 h-full flex items-center">
                <div className="max-w-2xl text-left">
                  <h1 className="text-white flex flex-col items-start drop-shadow-2xl">
                    <motion.span
                      className="text-3xl md:text-5xl font-medium mb-1 text-white/90 pl-[4px]"
                      style={{ letterSpacing: '-0.02em' }}
                      initial={{ x: -80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >NOT JUST</motion.span>
                    <motion.span
                      className="text-7xl md:text-9xl font-bold uppercase leading-[0.85] mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      style={{ letterSpacing: '0em' }}
                      initial={{ x: -120, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >FASHION</motion.span>
                    <motion.span
                      className="text-6xl md:text-[5.5rem] font-semibold uppercase leading-[0.9] mb-12 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] pl-[3px]"
                      style={{ letterSpacing: '-0.02em' }}
                      initial={{ x: -120, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.9, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >IT'S ATTITUDE</motion.span>
                  </h1>

                  <motion.button
                    onClick={() => document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group relative px-14 py-4 rounded-full font-bold uppercase tracking-[0.25em] text-sm text-white overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] border border-white/30 backdrop-blur-md bg-white/10 cursor-pointer"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="relative z-10 flex items-center gap-3">SHOP NOW <span className="group-hover:translate-x-1 transition-transform"><ArrowRight size={16} /></span></span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* === SLIDE 2: Girls === */}
          {heroSlide === 1 && (
            <motion.div
              key="slide-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 z-[1] hidden md:block pointer-events-none">
                <motion.img
                  src="/assets/img/leftside img 2.png"
                  alt=""
                  className="absolute bottom-0 left-[0] h-[100%] w-auto object-contain"
                  initial={{ opacity: 60 }}
                  animate={{ opacity: 70 }}
                  transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Girl Model Cutout Images */}
              <div className="absolute inset-0 z-[5] hidden md:block overflow-hidden">
                {/* Girl 1 (black t-shirt) — behind-left, partially covered by white girl */}
                <motion.img
                  src="/assets/img/cover 2 girl img 1.png"
                  alt="Model"
                  className="absolute bottom-0 h-[75%] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                  style={{ zIndex: 1, right: '45%', x: modelLeftX }}
                  initial={{ y: '100%', opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Girl 2 (white t-shirt) — center-FRONT, tallest, in front of both */}
                <motion.img
                  src="/assets/img/cover 2 girl img 2.png"
                  alt="Model"
                  className="absolute bottom-0 h-[82%] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                  style={{ zIndex: 3, right: '20%', y: modelCenterY }}
                  initial={{ y: '100%', opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Girl 3 (maroon t-shirt) — behind-right */}
                <motion.img
                  src="/assets/img/cover 2 girl img 3.png"
                  alt="Model"
                  className="absolute bottom-0 h-[73%] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                  style={{ zIndex: 2, right: '10%', x: modelRightX }}
                  initial={{ y: '100%', opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              {/* Hero Text — Slide 2 */}
              <div className="relative z-10 w-full max-w-full mx-auto px-[10%] mt-24 h-full flex items-center">
                <div className="max-w-2xl text-left">
                  <h1 className="text-white flex flex-col items-start drop-shadow-2xl">
                    <motion.span
                      className="text-5xl md:text-8xl font-medium uppercase leading-[0.85] mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      initial={{ x: -120, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >REAL BEAUTY</motion.span>
                    <motion.span
                      className="text-6xl md:text-[5.5rem] font-bold uppercase leading-[0.9] mb-12 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      style={{ letterSpacing: '-0.02em' }}
                      initial={{ x: -120, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >REAL ATTITUDE</motion.span>
                  </h1>

                  <motion.button
                    onClick={() => document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group relative px-14 py-4 rounded-full font-bold uppercase tracking-[0.25em] text-sm text-white overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] border border-white/30 backdrop-blur-md bg-white/10 cursor-pointer"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="relative z-10 flex items-center gap-3">SHOP NOW <span className="group-hover:translate-x-1 transition-transform"><ArrowRight size={16} /></span></span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
          {/* === SLIDE 3: Men Casual === */}
          {heroSlide === 2 && (
            <motion.div
              key="slide-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              {/* Ghosted left-side figure */}
              <div className="absolute inset-0 z-[1] hidden md:block pointer-events-none">
                <motion.img
                  src="/assets/img/leftside img 3.png"
                  alt=""
                  className="absolute bottom-0 left-[0] h-[100%] w-auto object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Casual Men Model Cutout Images */}
              <div className="absolute inset-0 z-[5] hidden md:block overflow-hidden">
                {/* Man 1 (black t-shirt) — behind-left */}
                <motion.img
                  src="/assets/img/cover 3 img 1.png"
                  alt="Model"
                  className="absolute bottom-[-5%] h-[90%] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                  style={{ zIndex: 3, right: '19%', y: modelCenterY }}
                  initial={{ y: '100%', opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Man 2 (white t-shirt) — center-FRONT, tallest & largest */}
                <motion.img
                  src="/assets/img/cover 3 img 2.png"
                  alt="Model"
                  className="absolute bottom-[-5%] h-[80%] w-auto object-contain drop-shadow-[0_15px_40px_rgba(0,0,0,0.9)]"
                  style={{ zIndex: 1, right: '35%', x: modelLeftX }}
                  initial={{ y: '100%', opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Man 3 (grey t-shirt) — behind-right */}
                <motion.img
                  src="/assets/img/cover 3 img 3.png"
                  alt="Model"
                  className="absolute bottom-[-5%] h-[80%] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                  style={{ zIndex: 2, right: '10%', x: modelRightX }}
                  initial={{ y: '100%', opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              {/* Hero Text — Slide 3 */}
              <div className="relative z-10 w-full max-w-full mx-auto px-[10%] mt-24 h-full flex items-center">
                <div className="max-w-2xl text-left">
                  <h1 className="text-white flex flex-col items-start drop-shadow-2xl">
                    <motion.span
                      className="text-5xl md:text-8xl font-medium uppercase leading-[0.85] mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      initial={{ x: -120, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >LESS NOISE</motion.span>
                    <motion.span
                      className="text-6xl md:text-[5.5rem] font-bold uppercase leading-[0.9] mb-12 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      style={{ letterSpacing: '-0.02em' }}
                      initial={{ x: -120, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >MORE CLASS</motion.span>
                  </h1>

                  <motion.button
                    onClick={() => document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group relative px-14 py-4 rounded-full font-bold uppercase tracking-[0.25em] text-sm text-white overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] border border-white/30 backdrop-blur-md bg-white/10 cursor-pointer"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="relative z-10 flex items-center gap-3">SHOP NOW <span className="group-hover:translate-x-1 transition-transform"><ArrowRight size={16} /></span></span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>


      {/* ══════════════════════════════════════════════════ */}
      {/* Category Grid Section — Premium White/Black       */}
      {/* ══════════════════════════════════════════════════ */}
      <section id="shop-section" className="py-24 bg-white">
        <div className="max-w-full mx-auto px-[10%]">
          {/* Category Grid Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400 block mb-3">Curated Collections</span>
            <h2 className="text-5xl font-bold text-black uppercase tracking-tighter mb-4">Shop By Category</h2>
            <div className="w-16 h-[3px] bg-black mx-auto" />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 h-full md:h-[620px]"
          >
            {/* Women Large Banner */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
              }}
              className="relative group overflow-hidden rounded-3xl h-[420px] md:h-full cursor-pointer"
            >
              <img src="/assets/img/split image 2.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1200ms] ease-out" alt="Women" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent group-hover:from-black/95 transition-all duration-500 flex flex-col justify-end p-10 text-white">
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60 mb-3">Exclusive</span>
                <h3 className="text-4xl font-bold uppercase tracking-tighter mb-5 leading-none">WOMEN'S<br />COLLECTION</h3>
                <Link
                  to="/category/women"
                  className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] border border-white/30 bg-white/10 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-full px-6 py-3 w-fit hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 cursor-pointer"
                >
                  SHOP NOW <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Men Banner */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
              }}
              className="relative group overflow-hidden rounded-3xl h-[420px] md:h-full cursor-pointer"
            >
              <img src="/assets/img/split image .png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1200ms] ease-out" alt="Men" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent group-hover:from-black/95 transition-all duration-500 flex flex-col justify-end p-10 text-white">
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60 mb-3">Premium</span>
                <h3 className="text-4xl font-bold uppercase tracking-tighter mb-5 leading-none">MEN'S<br />WEAR</h3>
                <Link
                  to="/category/men"
                  className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] border border-white/30 bg-white/10 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-full px-6 py-3 w-fit hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 cursor-pointer"
                >
                  EXPLORE <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Sporty Banner */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
              }}
              className="relative group overflow-hidden rounded-3xl h-[420px] md:h-full cursor-pointer md:col-span-2 lg:col-span-1"
            >
              <img src="/assets/img/split image 3.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1200ms] ease-out" alt="Sporty" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent group-hover:from-black/95 transition-all duration-500 flex flex-col justify-end p-10 text-white">
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60 mb-3">Trendy</span>
                <h3 className="text-4xl font-bold uppercase tracking-tighter mb-5 leading-none">SPORTY<br />WEAR</h3>
                <Link
                  to="/category/sporty"
                  className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] border border-white/30 bg-white/10 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-full px-6 py-3 w-fit hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 cursor-pointer"
                >
                  VIEW ALL <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* New Arrivals — Split Layout: Image + 3x2 Grid    */}
      {/* ══════════════════════════════════════════════════ */}
      <section id="new-arrivals" className="py-24 bg-[#ebebeb]">
        <div className="max-w-full mx-auto px-[10%]">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-12 bg-black rounded-full mt-1" />
              <div>
                <h2 className="text-5xl font-bold text-black uppercase tracking-tighter mb-1">New Arrivals</h2>
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400">Latest drops from our collection</span>
              </div>
            </div>

            <div className="flex bg-white p-1 rounded-full shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-neutral-100/80 w-fit">
              {['Women', 'Men', 'Sporty'].map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(tab)}
                  className={`px-7 py-2.5 rounded-full text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 cursor-pointer ${activeTab === tab ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Split Layout: Left Image + Right Product Grid */}
          {loading ? (
            <div className="py-40 flex justify-center"><Spinner /></div>
          ) : filteredNewArrivals.length === 0 ? (
            <EmptyState title={`No ${activeTab} products found`} description="Check back later for exciting new drops in this category." />
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Side — Promotional Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full lg:w-[38%] shrink-0"
              >
                <div className="relative group overflow-hidden rounded-3xl h-[400px] lg:h-full min-h-[600px] cursor-pointer bg-neutral-100">
                  <img
                    src="/assets/img/split image .png"
                    alt="New Arrivals Promo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-10">
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60 mb-2">Spring 2026</span>
                    <h3 className="text-3xl font-bold uppercase tracking-tighter text-white mb-4 leading-none">Fresh<br />Season<br />Essentials</h3>
                    <button className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] border border-white/30 bg-white/10 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-full px-6 py-3 w-fit text-white hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 cursor-pointer">
                      Shop Collection <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>

              <div className="flex-1">
                <motion.div
                  key={activeTab}
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-100px" }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-5 content-start"
                >
                  {filteredNewArrivals.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </motion.div>
              </div>
            </div>
          )}

          {/* View All Products CTA */}
          <div className="text-center mt-16">
            <Link to="/products" className="group inline-flex items-center gap-3 px-12 py-4 bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-[0.25em] shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-500">
              View All Products <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* Category Product Rows — Women / Men / Sport       */}
      {/* ══════════════════════════════════════════════════ */}
      {(() => {
        // Helper: filter products by category name (case-insensitive partial match)
        const filterByCategory = (catKeywords) => {
          if (!products || products.length === 0) return [];
          return products.filter(product => {
            const catName = (product.category?.name || '').toLowerCase();
            return catKeywords.some(kw => {
              const lowerKW = kw.toLowerCase();
              // Prevent 'men'/'mens' from matching 'women'
              if ((lowerKW === 'men' || lowerKW === 'mens') && catName.includes('women')) return false;
              return catName.includes(lowerKW);
            });
          });
        };

        // Helper: filter products by variant gender attribute
        const filterByGender = (genderKeywords) => {
          if (!products || products.length === 0) return [];
          return products.filter(product => {
            const matchesKeywords = (str) => {
              const lowerStr = (str || '').toLowerCase();
              return genderKeywords.some(kw => {
                const lowerKW = kw.toLowerCase();
                // Strict check: if looking for men/mens, it shouldn't be women
                if ((lowerKW === 'men' || lowerKW === 'mens') && lowerStr.includes('women')) return false;
                return lowerStr.includes(lowerKW);
              });
            };

            // Check category name first
            if (matchesKeywords(product.category?.name)) return true;
            if (matchesKeywords(product.gender)) return true;

            // Check variant attributes for sex/gender
            if (!product.variants || !Array.isArray(product.variants)) return false;
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
          });
        };

        const categoryRows = [
          {
            title: "Women's Collection",
            subtitle: "Elegant styles curated for her",
            products: filterByGender(['women', 'womens', 'female', 'girl']),
            linkPath: "/category/women",
            accent: 'from-rose-500/10 via-transparent to-transparent'
          },
          {
            title: "Men's Collection",
            subtitle: "Bold essentials built for him",
            products: filterByGender(['men', 'mens', 'male', 'boy']),
            linkPath: "/category/men",
            accent: 'from-blue-500/10 via-transparent to-transparent'
          },
          {
            title: "Sport & Active",
            subtitle: "Performance wear for every move",
            products: filterByCategory(['sport', 'active', 'athletic', 'gym', 'fitness']),
            linkPath: "/category/sporty",
            accent: 'from-emerald-500/10 via-transparent to-transparent'
          }
        ];

        return categoryRows.map((row, rowIdx) => {
          if (row.products.length === 0) return null;
          return (
            <CategoryProductRow
              key={rowIdx}
              title={row.title}
              subtitle={row.subtitle}
              products={row.products}
              linkPath={row.linkPath}
              accent={row.accent}
              isEven={rowIdx % 2 === 0}
            />
          );
        });
      })()}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* Feature Icon Bar â€” Premium White Background       */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="bg-white py-20 border-y border-neutral-100 overflow-hidden">
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-full mx-auto px-[10%] grid grid-cols-2 lg:grid-cols-4 gap-12"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "backOut" } }
            }}
            className="flex flex-col items-center text-center group cursor-default"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-5 group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-500 shadow-sm text-black">
              <Truck size={24} />
            </div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] mb-1.5 text-black">Quick Delivery</h4>
            <p className="text-[11px] text-neutral-400 font-medium">Islandwide within 3-5 days</p>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "backOut", delay: 0.1 } }
            }}
            className="flex flex-col items-center text-center group cursor-default"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-5 group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-500 shadow-sm text-black">
              <CreditCard size={24} />
            </div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] mb-1.5 text-black">Secure Payment</h4>
            <p className="text-[11px] text-neutral-400 font-medium">100% Protected transfers</p>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "backOut", delay: 0.2 } }
            }}
            className="flex flex-col items-center text-center group cursor-default"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-5 group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-500 shadow-sm text-black">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] mb-1.5 text-black">Authentic Gear</h4>
            <p className="text-[11px] text-neutral-400 font-medium">No 1. In Sri Lanka</p>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "backOut", delay: 0.3 } }
            }}
            className="flex flex-col items-center text-center group cursor-default"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-5 group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-500 shadow-sm text-black">
              <Headphones size={24} />
            </div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] mb-1.5 text-black">24/7 Support</h4>
            <p className="text-[11px] text-neutral-400 font-medium">We're here to help anytime</p>
          </motion.div>
        </motion.div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* Branches Network â€” Premium White/Black            */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="pt-24 pb-28 md:pt-28 md:pb-32 bg-[#f6f4f0] border-t border-neutral-200/60 overflow-hidden">
        <div className="max-w-full mx-auto px-[6%] lg:px-[10%]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8a7965] block mb-3">Nationwide Presence</span>
            <h2 className="text-4xl md:text-5xl font-bold text-black uppercase tracking-tighter mb-4">Visit Our Outlets</h2>
            <div className="w-14 h-[2px] bg-black mx-auto mb-5" />
            <p className="max-w-lg mx-auto text-neutral-600 font-medium text-[13px] leading-relaxed">Find your nearest Rich Apparel branch and experience fashion excellence first-hand across the island.</p>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5"
          >
            {branches.map(branch => (
              <motion.div
                key={branch.name}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                }}
                className="p-6 sm:p-7 bg-white rounded-2xl border border-[#ebe6dd] hover:border-[#d5cab8] shadow-[0_2px_14px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_34px_rgba(0,0,0,0.07)] transition-all duration-300 group flex flex-col justify-between h-full"
              >
                <div>
                  <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center text-white mb-5 group-hover:bg-[#1f1f1f] transition-colors duration-300 shadow-sm">
                    <Truck size={19} strokeWidth={1.75} />
                  </div>
                  <div className="w-6 h-[2px] bg-[#d8c4a6] mb-3" />
                  <h4 className="text-lg font-bold uppercase tracking-tight mb-2 text-black">{branch.name}</h4>
                  <p className="text-xs text-neutral-600 font-medium leading-relaxed mb-6">{branch.address}</p>
                </div>

                <div className="pt-4 border-t border-neutral-100 mt-auto">
                  <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#9b8a74] mb-1">Outlet Phone</span>
                  <a href={`tel:${branch.phone}`} className="inline-block text-[13px] font-bold text-black border-b border-neutral-300 hover:border-[#7c6950] hover:text-[#7c6950] transition-colors pb-0.5">
                    {branch.phone}
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};
