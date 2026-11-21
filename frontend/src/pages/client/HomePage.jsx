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
  Eye,
  RotateCcw,
  Leaf,
  MapPin,
  Phone,
  Quote
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { productsService, reviewsService } from "../../services";
import { formatPrice } from "../../utils/formatters";
import { resolveImageUrl } from "../../utils/imageHelpers";
import { NewArrivalsSkeleton } from "../../components/loading/ClientSkeletons";
import { EmptyState } from "../../components/common/EmptyState";
import { useCart } from "../../hooks/useCart";


import { ProductCard } from "../../components/common/ProductCard";

const CategoryProductRow = ({ title, subtitle, products, linkPath, isEven }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [products]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(".category-card")?.offsetWidth || 260;
    const scrollAmount = cardWidth + 20;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section
      className={`py-12 md:py-14 border-t border-[#f0e9df] ${
        isEven ? "bg-[#faf7f2]" : "bg-white"
      }`}
    >
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-7 gap-5">
          <div>
            <h2 className="text-[24px] sm:text-[30px] lg:text-[36px] font-extrabold text-[#151413] uppercase tracking-[-0.025em] leading-none">
              {title}
            </h2>
            <p className="text-[14px] sm:text-[15px] font-medium text-[#6c6257] mt-2">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Previous / Next Arrow Buttons */}
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label={`Previous ${title}`}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200 ${
                canScrollLeft
                  ? "border-[#dcd2c5] bg-white text-[#161514] hover:bg-[#161514] hover:border-[#161514] hover:text-white cursor-pointer"
                  : "border-[#e7dfd5] bg-white/70 text-[#c9bfb2] cursor-not-allowed"
              }`}
            >
              <ChevronLeft size={19} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label={`Next ${title}`}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200 ${
                canScrollRight
                  ? "border-[#161514] bg-[#161514] text-white hover:bg-[#2d2926] cursor-pointer"
                  : "border-[#e7dfd5] bg-white/70 text-[#c9bfb2] cursor-not-allowed"
              }`}
            >
              <ChevronRight size={19} />
            </button>

            {/* View All Button */}
            <Link
              to={linkPath || "/"}
              className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.015em] bg-[#161514] text-white hover:bg-[#2c2926] rounded-full px-7 py-3 transition-all duration-200 group/btn cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight
                size={15}
                className="group-hover/btn:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>

        {/* Horizontal Product Row */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="category-card shrink-0 w-[72vw] sm:w-[236px] md:w-[244px] lg:w-[calc((100%-60px)/4)] xl:w-[calc((100%-80px)/5)]"
              >
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
  const [activeTab, setActiveTab] = useState("All");
  const newArrivalsScrollRef = useRef(null);
  const [canScrollNewLeft, setCanScrollNewLeft] = useState(false);
  const [canScrollNewRight, setCanScrollNewRight] = useState(false);
  const [heroPaused, setHeroPaused] = useState(false);
  const { addToCart } = useCart();

  const heroSlides = [
    {
      id: "slide-1",
      eyebrow: "SPRING 2026 COLLECTION",
      headlineLines: ["NOT JUST", "FASHION", "IT'S ATTITUDE"],
      subtitle: "Elevated everyday apparel for men and women.",
      primaryCta: { label: "Shop Collection", targetId: "shop-section" },
      secondaryCta: { label: "New Arrivals", targetId: "new-arrivals" },
      mobileImage: "/assets/img/index girl img 1.png",
      models: [
        {
          src: "/assets/img/index men img2.png",
          alt: "Men's street essentials model",
          className: "h-[90%] lg:h-[94%]",
          style: { zIndex: 1, right: "39%" },
          parallax: "left",
          delay: 0.25,
        },
        {
          src: "/assets/img/index girl img 1.png",
          alt: "Women's signature tee model",
          className: "h-[90%] lg:h-[95%]",
          style: { zIndex: 3, right: "20%" },
          parallax: "center",
          delay: 0.15,
        },
        {
          src: "/assets/img/index men img1.png",
          alt: "Men's graphic tee model",
          className: "h-[82%] lg:h-[86%]",
          style: { zIndex: 2, right: "4%" },
          parallax: "right",
          delay: 0.35,
        },
      ],
    },
    {
      id: "slide-2",
      eyebrow: "WOMEN'S SIGNATURE EDIT",
      headlineLines: ["REAL BEAUTY", "REAL ATTITUDE"],
      subtitle: "Timeless silhouettes crafted for effortless everyday confidence.",
      primaryCta: { label: "Shop Collection", targetId: "shop-section" },
      secondaryCta: { label: "New Arrivals", targetId: "new-arrivals" },
      mobileImage: "/assets/img/cover 2 girl img 2.png",
      models: [
        {
          src: "/assets/img/cover 2 girl img 1.png",
          alt: "Women's black essential tee model",
          className: "h-[85%] lg:h-[90%]",
          style: { zIndex: 1, right: "44%" },
          parallax: "left",
          delay: 0.18,
        },
        {
          src: "/assets/img/cover 2 girl img 2.png",
          alt: "Women's white relaxed tee model",
          className: "h-[93%] lg:h-[97%]",
          style: { zIndex: 3, right: "20%" },
          parallax: "center",
          delay: 0.08,
        },
        {
          src: "/assets/img/cover 2 girl img 3.png",
          alt: "Women's maroon floral tee model",
          className: "h-[84%] lg:h-[88%]",
          style: { zIndex: 2, right: "4%" },
          parallax: "right",
          delay: 0.22,
        },
      ],
    },
    {
      id: "slide-3",
      eyebrow: "MODERN MENSWEAR EDIT",
      headlineLines: ["LESS NOISE", "MORE CLASS"],
      subtitle: "Refined casual essentials built for modern everyday comfort.",
      primaryCta: { label: "Shop Collection", targetId: "shop-section" },
      secondaryCta: { label: "New Arrivals", targetId: "new-arrivals" },
      mobileImage: "/assets/img/cover 3 img 1.png",
      models: [
        {
          src: "/assets/img/cover 3 img 2.png",
          alt: "Men's black casual tee model",
          className: "h-[88%] lg:h-[93%]",
          style: { zIndex: 1, right: "40%" },
          parallax: "left",
          delay: 0.3,
        },
        {
          src: "/assets/img/cover 3 img 1.png",
          alt: "Men's white oversized tee model",
          className: "h-[94%] lg:h-[98%]",
          style: { zIndex: 3, right: "19%" },
          parallax: "center",
          delay: 0.15,
        },
        {
          src: "/assets/img/cover 3 img 3.png",
          alt: "Men's charcoal graphic tee model",
          className: "h-[86%] lg:h-[91%]",
          style: { zIndex: 2, right: "4%" },
          parallax: "right",
          delay: 0.35,
        },
      ],
    },
  ];

  const visualCategories = [
    {
      name: "T-Shirts",
      icon: (
        <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9 sm:w-10 sm:h-10" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 6.5L6.5 8.5L3.5 13.5L7.5 15.8L9.5 13V26H22.5V13L24.5 15.8L28.5 13.5L25.5 8.5L21 6.5" />
          <path d="M11 6.5C12.2 8.7 13.9 9.8 16 9.8C18.1 9.8 19.8 8.7 21 6.5" />
        </svg>
      ),
    },
    {
      name: "Pants",
      icon: (
        <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9 sm:w-10 sm:h-10" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 5.5H22L23.5 26.5H18L16 14.5L14 26.5H8.5L10 5.5Z" />
          <path d="M10 9.5H22" />
          <path d="M16 5.5V11" />
        </svg>
      ),
    },
    {
      name: "Hoodies",
      icon: (
        <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9 sm:w-10 sm:h-10" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 9L6.5 11.5L4.5 21.5L8.2 22.5L10 15.5V26H22V15.5L23.8 22.5L27.5 21.5L25.5 11.5L21 9" />
          <path d="M11 9C11 5.8 13.2 4.5 16 4.5C18.8 4.5 21 5.8 21 9C19.6 10.6 17.9 11.3 16 11.3C14.1 11.3 12.4 10.6 11 9Z" />
          <path d="M14.2 11.3V14.8" />
          <path d="M17.8 11.3V14.8" />
          <path d="M12.5 21.5H19.5V24.5H12.5V21.5Z" />
        </svg>
      ),
    },
    {
      name: "Shorts",
      icon: (
        <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9 sm:w-10 sm:h-10" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 7.5H23.5L25.5 23.5H18.2L16 17.5L13.8 23.5H6.5L8.5 7.5Z" />
          <path d="M8.5 11.5H23.5" />
          <path d="M16 7.5V13" />
        </svg>
      ),
    },
    {
      name: "Activewear",
      icon: (
        <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9 sm:w-10 sm:h-10" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11.5 6.5L6.5 9.5L4.5 20.5L8.5 21.5L10 14.5V26H22V14.5L23.5 21.5L27.5 20.5L25.5 9.5L20.5 6.5" />
          <path d="M11.5 6.5H20.5" />
          <path d="M16 6.5V26" />
          <path d="M12.5 13H14" />
          <path d="M18 13H19.5" />
        </svg>
      ),
    },
    {
      name: "Accessories",
      icon: (
        <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9 sm:w-10 sm:h-10" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 19.5C6.5 13.7 10.6 9.5 16 9.5C21.4 9.5 25.5 13.7 25.5 19.5" />
          <path d="M5 19.5H26.5C27.6 19.5 28.5 20.4 28.5 21.5C28.5 22.3 27.8 23 27 23H7.5C6.1 23 5 21.9 5 20.5V19.5Z" />
          <path d="M16 9.5V19.5" />
          <circle cx="16" cy="8.2" r="1.1" />
        </svg>
      ),
    },
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

  const [testimonials, setTestimonials] = useState([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setNewsletterSubscribed(true);
    setNewsletterEmail("");
    toast.success("Thank you for staying in the loop with Rich Apparel!");
  };

  const benefits = [
    {
      title: "Quick Delivery",
      description: "Islandwide within 3-5 days",
      Icon: Truck,
    },
    {
      title: "Secure Payment",
      description: "100% Protected transfers",
      Icon: CreditCard,
    },
    {
      title: "Authentic Gear",
      description: "No 1. In Sri Lanka",
      Icon: ShieldCheck,
    },
    {
      title: "24/7 Support",
      description: "We're here to help anytime",
      Icon: Headphones,
    },
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

    // Read-only fetch of existing public product reviews for testimonial showcase
    reviewsService.getAll(0, 20)
      .then((res) => {
        const rawReviews = res.data?.data?.reviews || res.data?.reviews || [];
        const valid = (Array.isArray(rawReviews) ? rawReviews : []).filter(
          (r) =>
            r &&
            !r.isDeleted &&
            Number(r.rating) >= 4 &&
            typeof r.comment === "string" &&
            r.comment.trim().length > 0
        );
        setTestimonials(valid);
      })
      .catch(() => {
        setTestimonials([]);
      });
  }, []);

  const currentTestimonial =
    testimonials.length > 0 ? testimonials[activeTestimonial % testimonials.length] : null;

  const formatTestimonialQuote = (text, maxLength = 155) => {
    const clean = String(text || "").trim().replace(/\s+/g, " ");
    if (clean.length <= maxLength) return clean;
    const sliced = clean.slice(0, maxLength);
    const lastSpace = sliced.lastIndexOf(" ");
    return `${lastSpace > 60 ? sliced.slice(0, lastSpace) : sliced}...`;
  };

  const getTestimonialThumb = (review) => {
    if (!review) return null;
    const imgPath =
      review.product?.images?.[0] || review.product?.imageUrl || review.imageUrl;
    return imgPath ? resolveImageUrl(imgPath, null) : null;
  };

  // Hero slide carousel — 5 second automatic rotation
  const [heroSlide, setHeroSlide] = useState(0);
  useEffect(() => {
    if (heroPaused) return;
    const slideInterval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [heroPaused, heroSlides.length]);

  const handleNextSlide = () => {
    setHeroSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const activeHeroSlide = heroSlides[heroSlide] || heroSlides[0];

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
    const tab = activeTab.toLowerCase();
    if (tab === "all") return products;

    return products.filter(product => {
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

  const checkNewArrivalsScroll = () => {
    const el = newArrivalsScrollRef.current;
    if (!el) return;
    setCanScrollNewLeft(el.scrollLeft > 8);
    setCanScrollNewRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = newArrivalsScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: "auto" });
    checkNewArrivalsScroll();
    el.addEventListener("scroll", checkNewArrivalsScroll, { passive: true });
    window.addEventListener("resize", checkNewArrivalsScroll);
    return () => {
      el.removeEventListener("scroll", checkNewArrivalsScroll);
      window.removeEventListener("resize", checkNewArrivalsScroll);
    };
  }, [filteredNewArrivals, loading]);

  const scrollNewArrivals = (direction) => {
    const el = newArrivalsScrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(".new-arrival-card")?.offsetWidth || 260;
    const scrollAmount = cardWidth + 20;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="bg-white min-h-screen overflow-x-clip" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Hero Section — Editorial Auto-Rotating Carousel */}
      <section
        ref={heroRef}
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        className="relative pt-[102px] md:pt-[110px] overflow-hidden bg-gradient-to-br from-[#f5eee6] via-[#ece2d6] to-[#dfd1c0]"
      >
        {/* Editorial Abstract Background Shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {/* Soft warm radial highlight behind left typography */}
          <div
            className="absolute -top-24 -left-24 w-[620px] h-[620px] rounded-full opacity-75"
            style={{
              background: "radial-gradient(circle, rgba(255,252,247,0.92) 0%, rgba(245,238,230,0) 70%)",
            }}
          />

          {/* Large warm taupe organic wave sweeping behind models */}
          <svg
            viewBox="0 0 1440 680"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <path
              d="M500,680 C550,390 660,165 840,0 L1440,0 L1440,680 Z"
              fill="#b59d84"
              fillOpacity="0.32"
            />
            <path
              d="M615,680 C665,425 755,195 940,0 L1440,0 L1440,680 Z"
              fill="#6e5742"
              fillOpacity="0.28"
            />
            <path
              d="M445,680 C505,495 600,320 755,165 C685,330 635,495 600,680 Z"
              fill="#faf5ee"
              fillOpacity="0.58"
            />
          </svg>
        </div>

        {/* Hero Carousel Stage */}
        <div className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-8 md:px-10 lg:px-12 xl:px-16 min-h-[500px] md:min-h-[540px] lg:min-h-[580px] xl:min-h-[610px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHeroSlide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: "easeInOut" }}
              className="relative flex-1 flex flex-col md:flex-row items-stretch"
            >
              {/* Left Editorial Typography & CTAs */}
              <div className="relative z-20 w-full md:w-[50%] lg:w-[49%] py-8 sm:py-10 lg:py-12 flex flex-col justify-center">
                <motion.span
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.04 }}
                  className="inline-block text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.3em] text-[#75624e] mb-3.5"
                >
                  {activeHeroSlide.eyebrow}
                </motion.span>

                <h1
                  className={`text-[#151311] font-extrabold uppercase tracking-[-0.03em] leading-[0.94] ${
                    activeHeroSlide.headlineLines.length > 2
                      ? "text-[2.35rem] sm:text-[3.1rem] md:text-[3.25rem] lg:text-[3.85rem] xl:text-[4.4rem]"
                      : "text-[2.45rem] sm:text-[3.25rem] md:text-[3.4rem] lg:text-[4rem] xl:text-[4.55rem]"
                  }`}
                >
                  {activeHeroSlide.headlineLines.map((line, idx) => (
                    <motion.span
                      key={line}
                      className="block"
                      initial={{ x: -24, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        duration: 0.45,
                        delay: 0.08 + idx * 0.07,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {line}
                    </motion.span>
                  ))}
                </h1>

                <motion.p
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.22 }}
                  className="text-[15px] sm:text-[16.5px] lg:text-[17.5px] text-[#453d35] font-medium max-w-lg mt-4 mb-6 leading-relaxed"
                >
                  {activeHeroSlide.subtitle}
                </motion.p>

                {/* Premium CTA Buttons */}
                <motion.div
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.28 }}
                  className="flex flex-wrap items-center gap-3.5"
                >
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(activeHeroSlide.primaryCta.targetId)
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="group inline-flex items-center gap-2.5 px-8 py-3.5 sm:py-4 rounded-full bg-[#161514] hover:bg-[#2b2825] text-white text-[13.5px] sm:text-[14px] font-semibold tracking-[0.02em] shadow-[0_12px_28px_rgba(22,21,20,0.2)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    <span>{activeHeroSlide.primaryCta.label}</span>
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(activeHeroSlide.secondaryCta.targetId)
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex items-center gap-2 px-8 py-3.5 sm:py-4 rounded-full bg-white/60 hover:bg-white text-[#171513] border border-[#c7b8a5] hover:border-[#171513] text-[13.5px] sm:text-[14px] font-semibold tracking-[0.02em] backdrop-blur-sm hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    {activeHeroSlide.secondaryCta.label}
                  </button>
                </motion.div>

                {/* Small Editorial Benefit Indicators */}
                <motion.div
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.55 }}
                  className="flex flex-wrap items-center gap-x-7 gap-y-2.5 mt-6 sm:mt-7 text-[12.5px] sm:text-[13px] font-medium text-[#52493f]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-[#7c664e]" strokeWidth={1.8} />
                    <span>Premium Fabrics</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#7c664e]" strokeWidth={1.8} />
                    <span>Secure Payments</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-[#7c664e]" strokeWidth={1.8} />
                    <span>Easy Returns</span>
                  </span>
                </motion.div>

                {/* Carousel Indicators + Slide Navigation */}
                <div className="flex items-center gap-5 mt-7 pt-1">
                  <div className="flex items-center gap-3" role="tablist" aria-label="Hero Slides">
                    {heroSlides.map((slide, index) => {
                      const isActive = index === heroSlide;
                      return (
                        <button
                          key={slide.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          aria-label={`Go to slide ${index + 1}`}
                          onClick={() => setHeroSlide(index)}
                          className="group flex items-center gap-2 cursor-pointer focus:outline-none"
                        >
                          <span
                            className={`text-[12.5px] tracking-[0.08em] transition-colors ${
                              isActive
                                ? "font-extrabold text-[#161514]"
                                : "font-semibold text-[#9a8c7c] group-hover:text-[#161514]"
                            }`}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`h-[2px] rounded-full transition-all duration-500 ${
                              isActive
                                ? "w-10 bg-[#161514]"
                                : "w-3.5 bg-[#c7b9a8] group-hover:bg-[#7c6d5c]"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Prev / Next Controls */}
                  <div className="flex items-center gap-2 ml-1">
                    <button
                      type="button"
                      onClick={handlePrevSlide}
                      aria-label="Previous hero slide"
                      className="w-8.5 h-8.5 rounded-full border border-[#cbbaa6] bg-white/65 hover:bg-[#161514] hover:border-[#161514] text-[#2b2621] hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSlide}
                      aria-label="Next hero slide"
                      className="w-8.5 h-8.5 rounded-full border border-[#cbbaa6] bg-white/65 hover:bg-[#161514] hover:border-[#161514] text-[#2b2621] hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Model Cutout Composition — Desktop & Tablet */}
              <div className="hidden md:block relative md:w-[52%] lg:w-[54%] min-h-[520px] lg:min-h-[580px] xl:min-h-[610px] pointer-events-none">
                {activeHeroSlide.models.map((model, idx) => {
                  const motionStyle = {
                    ...model.style,
                    ...(model.parallax === "left" ? { x: modelLeftX } : {}),
                    ...(model.parallax === "right" ? { x: modelRightX } : {}),
                    ...(model.parallax === "center" ? { y: modelCenterY } : {}),
                  };
                  return (
                    <motion.img
                      key={`${activeHeroSlide.id}-model-${idx}`}
                      src={model.src}
                      alt={model.alt}
                      className={`absolute bottom-0 w-auto max-w-none object-contain drop-shadow-[0_18px_28px_rgba(45,32,20,0.22)] ${model.className}`}
                      style={motionStyle}
                      initial={{ y: 42, opacity: 0, scale: 0.96 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.85,
                        delay: model.delay,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  );
                })}
              </div>

              {/* Compact Model Preview — Mobile */}
              <div className="md:hidden relative w-full h-[320px] sm:h-[370px] flex items-end justify-center overflow-hidden mt-2 pointer-events-none">
                <div
                  className="absolute bottom-0 w-[280px] h-[280px] rounded-full bg-[#9b8269]/20 blur-xl"
                  aria-hidden="true"
                />
                <motion.img
                  key={`${activeHeroSlide.id}-mobile-model`}
                  src={activeHeroSlide.mobileImage}
                  alt={activeHeroSlide.eyebrow}
                  className="relative z-10 h-[98%] w-auto object-contain drop-shadow-[0_14px_24px_rgba(45,32,20,0.2)]"
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* Shop By Category Row — UI Only                    */}
      {/* ══════════════════════════════════════════════════ */}
      <section id="shop-section" className="py-6 md:py-8 bg-white scroll-mt-24">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="bg-[#faf6f0] border border-[#efe7dc] rounded-[24px] px-5 sm:px-8 lg:px-10 py-6 sm:py-7 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-9 shadow-[0_4px_22px_rgba(45,35,25,0.035)]">
            {/* Left Heading */}
            <div className="shrink-0 lg:min-w-[165px] flex items-center justify-between lg:block">
              <div>
                <span className="block text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.26em] text-[#6d6256] leading-tight">
                  Shop By
                </span>
                <h2 className="text-[24px] sm:text-[28px] lg:text-[30px] font-extrabold uppercase tracking-[-0.02em] text-[#171513] leading-tight mt-0.5">
                  Category
                </h2>
                <div className="w-10 h-[3px] bg-[#b89f80] rounded-full mt-2.5" />
              </div>
            </div>

            <div className="hidden lg:block w-px h-16 bg-[#e5dccf] shrink-0" aria-hidden="true" />

            {/* Visual Category Items (UI Only) */}
            <div
              role="list"
              aria-label="Shop by Category"
              className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5"
            >
              {visualCategories.map((category) => (
                <div
                  key={category.name}
                  role="listitem"
                  className="group bg-[#f2eae0]/95 hover:bg-[#eadecf] border border-[#e7dcd0] hover:border-[#d3c1ab] rounded-[18px] py-5 sm:py-6 px-4 min-h-[106px] sm:min-h-[118px] flex flex-col items-center justify-center gap-2.5 text-[#1e1b18] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(45,35,25,0.07)] select-none cursor-default"
                >
                  <div className="text-[#1f1c18] group-hover:scale-105 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <span className="text-[13.5px] sm:text-[14.5px] font-semibold tracking-[-0.01em] text-[#221e1a] text-center">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* New Arrivals — Editorial Product Row              */}
      {/* ══════════════════════════════════════════════════ */}
      <section id="new-arrivals" className="py-10 md:py-14 bg-white scroll-mt-24">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7">
            <div>
              <h2 className="text-[26px] sm:text-[32px] lg:text-[38px] font-extrabold text-[#151413] uppercase tracking-[-0.025em] leading-none">
                New Arrivals
              </h2>
              <p className="text-[14px] sm:text-[15px] font-medium text-[#6c6257] mt-2">
                The latest styles, just dropped.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Tabs */}
              <div
                role="tablist"
                aria-label="Filter New Arrivals"
                className="inline-flex items-center bg-[#f6f1ea] border border-[#ebe3d8] p-1 rounded-full"
              >
                {["All", "Women", "Men", "Sporty"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 sm:px-5 py-2 rounded-full text-[11.5px] font-bold tracking-[0.06em] uppercase transition-all duration-200 cursor-pointer ${
                      activeTab === tab
                        ? "bg-[#161514] text-white shadow-xs"
                        : "text-[#6f655a] hover:text-[#161514]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Previous / Next Carousel Arrows + View All */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => scrollNewArrivals("left")}
                  disabled={!canScrollNewLeft}
                  aria-label="Previous new arrivals"
                  className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    canScrollNewLeft
                      ? "border-[#dcd2c5] bg-white text-[#161514] hover:bg-[#161514] hover:border-[#161514] hover:text-white cursor-pointer"
                      : "border-[#e7dfd5] bg-white/70 text-[#c9bfb2] cursor-not-allowed"
                  }`}
                >
                  <ChevronLeft size={19} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollNewArrivals("right")}
                  disabled={!canScrollNewRight}
                  aria-label="Next new arrivals"
                  className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    canScrollNewRight
                      ? "border-[#161514] bg-[#161514] text-white hover:bg-[#2d2926] cursor-pointer"
                      : "border-[#e7dfd5] bg-white/70 text-[#c9bfb2] cursor-not-allowed"
                  }`}
                >
                  <ChevronRight size={19} />
                </button>

                <Link
                  to={
                    activeTab === "All"
                      ? "/category/all"
                      : `/category/${activeTab.toLowerCase()}`
                  }
                  className="inline-flex items-center gap-2 px-7 py-3 bg-[#161514] hover:bg-[#2c2926] text-white rounded-full text-[13px] font-semibold tracking-[0.015em] transition-all duration-200 group/view"
                >
                  <span>View All</span>
                  <ArrowRight
                    size={15}
                    className="group-hover/view:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Product Row */}
          {loading ? (
            <NewArrivalsSkeleton />
          ) : filteredNewArrivals.length === 0 ? (
            <EmptyState
              title={`No ${activeTab === "All" ? "" : `${activeTab} `}products found`}
              description="Check back later for exciting new drops in this collection."
            />
          ) : (
            <div
              ref={newArrivalsScrollRef}
              className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filteredNewArrivals.map((product) => (
                <div
                  key={product.id}
                  className="new-arrival-card shrink-0 w-[72vw] sm:w-[236px] md:w-[244px] lg:w-[calc((100%-60px)/4)] xl:w-[calc((100%-80px)/5)]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
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
      {/* Promotional Two-Panel Banners */}
      <section className="py-12 md:py-14 bg-white border-t border-[#f0e9df]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT PANEL — Seasonal Sale Promo */}
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#ece1d4] via-[#e3d4c2] to-[#d5c1aa] min-h-[320px] sm:min-h-[360px] lg:min-h-[385px] flex items-center border border-[#e3d6c6] group">
              <div
                className="absolute -left-16 -top-16 w-80 h-80 rounded-full bg-white/35 blur-2xl pointer-events-none"
                aria-hidden="true"
              />

              <img
                src="/assets/img/cover 2 girl img 1.png"
                alt="Selected collections highlight"
                className="absolute bottom-0 right-1 sm:right-5 h-[97%] w-auto object-contain object-bottom pointer-events-none select-none drop-shadow-[0_16px_28px_rgba(38,28,18,0.2)] group-hover:scale-[1.02] transition-transform duration-500"
              />

              <div
                className="absolute inset-0 bg-gradient-to-r from-[#eae0d3] via-[#eae0d3]/92 to-transparent sm:via-[#eae0d3]/35 pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative z-10 p-7 sm:p-11 max-w-[66%] sm:max-w-[60%]">
                <span className="block text-[13px] sm:text-[14px] font-semibold uppercase tracking-[0.24em] text-[#5e5144]">
                  Up To
                </span>
                <h2 className="text-[2.5rem] sm:text-[3.25rem] lg:text-[3.75rem] font-extrabold uppercase tracking-[-0.03em] leading-[0.95] text-[#151413] mt-1.5 sm:whitespace-nowrap">
                  50% OFF
                </h2>
                <p className="text-[14.5px] sm:text-[16px] font-medium text-[#3b342d] mt-3 mb-8">
                  On Selected Collections
                </p>
                <Link
                  to="/category/all"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#161514] hover:bg-[#2c2926] text-white text-[13.5px] font-semibold tracking-[0.02em] shadow-[0_10px_24px_rgba(22,21,20,0.18)] hover:-translate-y-0.5 transition-all duration-200 group/cta"
                >
                  <span>Shop the Sale</span>
                  <ArrowRight
                    size={15}
                    className="group-hover/cta:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            </div>

            {/* RIGHT PANEL — Sporty Collection Promo */}
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#e2dfd9] via-[#d3cfc8] to-[#bdb8b0] min-h-[320px] sm:min-h-[360px] lg:min-h-[385px] flex items-center border border-[#d9d4cc] group">
              <svg
                viewBox="0 0 600 320"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
              >
                <polygon points="340,0 430,0 290,320 200,320" fill="#ffffff" fillOpacity="0.22" />
                <polygon points="520,0 565,0 445,320 400,320" fill="#161514" fillOpacity="0.1" />
                <polygon points="575,0 600,0 490,320 465,320" fill="#161514" fillOpacity="0.14" />
              </svg>

              <div className="absolute inset-y-0 right-0 w-[58%] sm:w-[56%] pointer-events-none overflow-hidden">
                <img
                  src="/assets/img/split image 3.png"
                  alt="Sporty Collection"
                  className="w-full h-full object-cover object-[center_12%] group-hover:scale-[1.03] transition-transform duration-500"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#d4d0c9] via-[#d4d0c9]/40 to-transparent"
                  aria-hidden="true"
                />
              </div>

              <div
                className="absolute inset-0 bg-gradient-to-r from-[#dcd8d1] via-[#dcd8d1]/88 to-transparent sm:via-[#dcd8d1]/42 pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative z-10 p-7 sm:p-11 max-w-[70%] sm:max-w-[62%]">
                <span className="block text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.26em] text-[#4e4942]">
                  Sporty Collection
                </span>
                <h2 className="text-[1.95rem] sm:text-[2.45rem] lg:text-[2.75rem] font-extrabold uppercase tracking-[-0.03em] leading-[0.98] text-[#151413] mt-2.5 mb-8">
                  <span className="block sm:whitespace-nowrap">Move Better.</span>
                  <span className="block sm:whitespace-nowrap">Live Bolder.</span>
                </h2>
                <Link
                  to="/category/sporty"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#161514] hover:bg-[#2c2926] text-white text-[13.5px] font-semibold tracking-[0.02em] shadow-[0_10px_24px_rgba(22,21,20,0.18)] hover:-translate-y-0.5 transition-all duration-200 group/cta"
                >
                  <span>Shop Sports</span>
                  <ArrowRight
                    size={15}
                    className="group-hover/cta:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits & Customer Testimonials */}
      <section className="py-12 md:py-14 bg-white border-t border-[#f0e9df]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* LEFT — Why Choose Rich Apparel (4 Premium Benefit Cards) */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="mb-6">
                <h2 className="text-[22px] sm:text-[25px] lg:text-[26px] font-extrabold uppercase tracking-[-0.02em] text-[#151413]">
                  Why Choose Rich Apparel?
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 flex-1">
                {benefits.map((benefit) => {
                  const Icon = benefit.Icon;
                  return (
                    <div
                      key={benefit.title}
                      className="bg-[#f8f4ee] border border-[#ece4d9] hover:border-[#d5c6b3] rounded-2xl px-4 py-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(32,25,18,0.065)] group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-[#e7ddd0] flex items-center justify-center text-[#1a1816] mb-4 group-hover:bg-[#161514] group-hover:border-[#161514] group-hover:text-white transition-colors duration-200">
                        <Icon size={23} strokeWidth={1.6} />
                      </div>
                      <h3 className="text-[13.5px] font-bold text-[#181614] leading-snug mb-1.5">
                        {benefit.title}
                      </h3>
                      <p className="text-[12px] font-medium text-[#70655a] leading-snug">
                        {benefit.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — What Our Customers Say (Existing Review Data) */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-[22px] sm:text-[25px] lg:text-[26px] font-extrabold uppercase tracking-[-0.02em] text-[#151413]">
                  What Our Customers Say
                </h2>
                {testimonials.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTestimonial(
                          (prev) => (prev - 1 + testimonials.length) % testimonials.length
                        )
                      }
                      aria-label="Previous testimonial"
                      className="w-9 h-9 rounded-full border border-[#dfd6ca] bg-white hover:bg-[#161514] hover:border-[#161514] text-[#1a1816] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
                      }
                      aria-label="Next testimonial"
                      className="w-9 h-9 rounded-full border border-[#dfd6ca] bg-white hover:bg-[#161514] hover:border-[#161514] text-[#1a1816] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-[#f8f4ee] border border-[#ece4d9] rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
                {currentTestimonial ? (
                  <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                      {getTestimonialThumb(currentTestimonial) ? (
                        <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-white shadow-sm bg-[#ede5db] shrink-0">
                          <img
                            src={getTestimonialThumb(currentTestimonial)}
                            alt={currentTestimonial.product?.name?.trim() || "Reviewed item"}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      ) : (
                        <div className="w-[72px] h-[72px] rounded-full bg-[#161514] text-white flex items-center justify-center text-xl font-bold shrink-0">
                          {(currentTestimonial.user?.name || "R").charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] sm:text-[15.5px] font-medium text-[#24201c] leading-relaxed">
                          &ldquo;{formatTestimonialQuote(currentTestimonial.comment)}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#e8dfd3] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[13px] min-w-0">
                        <span className="font-bold text-[#171513]">
                          — {currentTestimonial.user?.name?.trim() || "Verified Customer"}
                        </span>
                        {currentTestimonial.product?.id && currentTestimonial.product?.name && (
                          <>
                            <span className="text-[#b5a99b]">·</span>
                            <Link
                              to={`/product/${currentTestimonial.product.id}`}
                              className="text-[#6d6256] hover:text-[#161514] underline-offset-2 hover:underline truncate"
                            >
                              {currentTestimonial.product.name.trim()}
                            </Link>
                          </>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-0.5 shrink-0"
                        aria-label={`Rated ${currentTestimonial.rating} out of 5`}
                      >
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={15}
                            className={
                              idx < Math.round(Number(currentTestimonial.rating) || 0)
                                ? "fill-[#e4a63a] text-[#e4a63a]"
                                : "text-[#d5cabd]"
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {testimonials.length > 1 && (
                      <div className="flex items-center justify-center gap-1.5 mt-3.5">
                        {testimonials.map((t, idx) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTestimonial(idx)}
                            aria-label={`View testimonial ${idx + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              idx === activeTestimonial % testimonials.length
                                ? "w-5 bg-[#161514]"
                                : "w-1.5 bg-[#cfc4b6] hover:bg-[#9b8d7d]"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-start gap-4 my-auto">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#e7ddd0] flex items-center justify-center text-[#8c7356] shrink-0">
                      <Quote size={20} strokeWidth={1.6} />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#24201c] leading-relaxed">
                        Crafted for everyday comfort and lasting fit — verified customer feedback
                        appears directly from our shoppers across Sri Lanka.
                      </p>
                      <span className="inline-block text-[11.5px] font-semibold text-[#756a5e] mt-2">
                        — Rich Apparel Quality Promise
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* Branches Network â€” Premium White/Black            */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-14 md:py-16 bg-[#faf6f0] border-t border-[#ece4d9]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-9">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.26em] text-[#8a7660] mb-2">
                Nationwide Presence
              </span>
              <h2 className="text-[26px] sm:text-[32px] lg:text-[36px] font-extrabold text-[#151413] uppercase tracking-[-0.025em] leading-none">
                Visit Our Outlets
              </h2>
            </div>
            <p className="max-w-md text-[#6b6055] font-medium text-[14px] leading-relaxed">
              Find your nearest Rich Apparel branch and experience fashion excellence first-hand
              across the island.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
            {branches.map((branch) => (
              <div
                key={branch.name}
                className="p-6 bg-white rounded-[18px] border border-[#e9e1d6] hover:border-[#d2c3af] shadow-[0_2px_12px_rgba(32,25,18,0.03)] hover:shadow-[0_12px_28px_rgba(32,25,18,0.07)] transition-all duration-300 hover:-translate-y-0.5 group flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#f5efe6] border border-[#e8ddd0] group-hover:bg-[#161514] group-hover:border-[#161514] flex items-center justify-center text-[#1a1816] group-hover:text-white transition-colors duration-200">
                      <MapPin size={18} strokeWidth={1.75} />
                    </div>
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#9b8a76]">
                      Branch
                    </span>
                  </div>

                  <h3 className="text-[16px] font-extrabold uppercase tracking-[-0.01em] text-[#161514] mb-2">
                    {branch.name}
                  </h3>
                  <p className="text-[12.5px] text-[#5e544a] font-medium leading-relaxed mb-5">
                    {branch.address}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-[#f1ebe2] mt-auto">
                  <span className="block text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#9a8b79] mb-1">
                    Outlet Phone
                  </span>
                  <a
                    href={`tel:${branch.phone}`}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#161514] hover:text-[#7c6449] transition-colors"
                  >
                    <Phone size={13} strokeWidth={2} className="text-[#8d765c]" />
                    <span>{branch.phone}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section — Stay In The Loop */}
      <section className="py-10 md:py-12 bg-white border-t border-[#f0e9df]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-[#f0e6da] via-[#e9dccb] to-[#e0cfba] border border-[#e3d5c3] px-6 sm:px-10 lg:px-12 py-8 sm:py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Minimalist Editorial Coat-Hanger Line-Art Accent */}
            <svg
              viewBox="0 0 220 120"
              fill="none"
              className="hidden lg:block absolute right-4 bottom-0 h-[112px] w-auto text-[#5e4d3b]/20 pointer-events-none select-none"
              aria-hidden="true"
            >
              <path
                d="M110 34C110 25 117 19 124 19C131 19 136 24 136 30C136 36 130 39 124 43L124 49"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M124 49L42 92C36 95 38 103 45 103H203C210 103 212 95 206 92L124 49Z"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <path
                d="M68 22C68 15 73 10 79 10C84 10 88 14 88 19C88 23 84 26 79 29V34"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.5"
              />
              <path
                d="M79 34L14 68C9 70 11 77 17 77H141C147 77 149 70 144 68L79 34Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                opacity="0.45"
              />
            </svg>

            <div className="relative z-10 max-w-md">
              <h2 className="text-[22px] sm:text-[26px] font-extrabold uppercase tracking-[-0.025em] text-[#151413] leading-tight">
                Stay In The Loop
              </h2>
              <p className="text-[13px] sm:text-[14px] font-medium text-[#5a4f43] mt-1.5">
                Get exclusive offers, new arrivals and more.
              </p>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              noValidate
              className="relative z-10 w-full lg:w-auto lg:min-w-[450px] xl:min-w-[500px]"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white/95 p-1.5 rounded-2xl sm:rounded-full border border-[#e3d7c8] shadow-[0_6px_24px_rgba(32,25,18,0.06)]">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterSubscribed) setNewsletterSubscribed(false);
                  }}
                  placeholder="Enter your email address"
                  aria-label="Email address for newsletter"
                  className="flex-1 min-w-0 bg-transparent px-4 py-2.5 text-[13px] font-medium text-[#181614] placeholder-[#8f8579] outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl sm:rounded-full bg-[#161514] hover:bg-[#2b2825] text-white text-[12.5px] font-semibold tracking-[0.02em] transition-all duration-200 cursor-pointer shrink-0"
                >
                  <span>Subscribe</span>
                  <ArrowRight size={14} />
                </button>
              </div>
              {newsletterSubscribed && (
                <p className="text-[11.5px] font-semibold text-[#4b5d44] mt-2 pl-4">
                  Thank you — you&rsquo;re on our list for upcoming drops and offers.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
