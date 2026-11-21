import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { productsService } from "../../services";
import { formatPrice } from "../../utils/formatters";
import {
  LogOut,
  User,
  Search,
  Truck,
  Menu,
  X,
  ShoppingBag,
  Heart,
  RotateCcw,
  Headphones,
  MapPin,
  ChevronDown,
  Package,
} from "lucide-react";

export const ClientHeader = () => {
  const { user, isAuthenticated, dispatch } = useAuth();
  const { items, toggleCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Live Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const debounceRef = useRef(null);
  const wishlistRef = useRef(null);
  const userDropdownRef = useRef(null);

  const [showWishlist, setShowWishlist] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close Dropdowns on outside click & Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      const inDesktopSearch = searchRef.current && searchRef.current.contains(e.target);
      const inMobileSearch = mobileSearchRef.current && mobileSearchRef.current.contains(e.target);
      if (!inDesktopSearch && !inMobileSearch) {
        setShowDropdown(false);
      }
      if (wishlistRef.current && !wishlistRef.current.contains(e.target)) {
        setShowWishlist(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setShowWishlist(false);
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setShowDropdown(false);
    setShowWishlist(false);
    setShowUserDropdown(false);
    setIsMobileMenuOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Debounced live search
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    setShowDropdown(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await productsService.getAll(0, 1000);
        const allProducts = res.data?.data?.products || res.data?.products || [];
        const q = query.toLowerCase();
        const filtered = allProducts
          .filter(
            (p) =>
              p.name?.toLowerCase().includes(q) ||
              p.description?.toLowerCase().includes(q) ||
              p.sku?.toLowerCase().includes(q) ||
              p.category?.name?.toLowerCase().includes(q)
          )
          .slice(0, 6);
        setSearchResults(filtered);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const handleResultClick = (productId) => {
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
    setSearchQuery("");
    navigate(`/product/${productId}`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const getImageUrl = (product) => {
    const img = product.images?.[0] || product.imageUrl;
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `http://localhost:5001${img.startsWith("/") ? "" : "/"}${img}`;
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    dispatch({ type: "AUTH_LOGOUT" });
    setShowUserDropdown(false);
    navigate("/");
  };

  const scrollToOutlets = () => {
    const outletHeading = Array.from(document.querySelectorAll("h2")).find((el) =>
      el.textContent?.toLowerCase().includes("visit our outlets")
    );
    const target = outletHeading?.closest("section") || document.querySelector("footer");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleStoreLocatorClick = () => {
    setIsMobileMenuOpen(false);
    if (location.pathname === "/") {
      scrollToOutlets();
    } else {
      navigate("/#store-locator");
    }
  };

  const handleHelpSupportClick = () => {
    setIsMobileMenuOpen(false);
    const supportBtn = document.querySelector(
      '[aria-label*="Support" i], [aria-label*="Chat" i], [title*="Support" i]'
    );
    if (supportBtn && typeof supportBtn.click === "function") {
      supportBtn.click();
      return;
    }
    document.querySelector("footer")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNavLinkClick = (e, link) => {
    if (link.isScroll) {
      e.preventDefault();
      if (location.pathname === "/") {
        const element = document.getElementById("new-arrivals");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        navigate(link.path);
      }
      setIsMobileMenuOpen(false);
    }
  };

  // Handle scrolling when landing on home page with hash
  useEffect(() => {
    if (location.pathname === "/" && location.hash === "#new-arrivals") {
      const element = document.getElementById("new-arrivals");
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 120);
      }
    } else if (location.pathname === "/" && location.hash === "#store-locator") {
      setTimeout(() => {
        scrollToOutlets();
      }, 150);
    }
  }, [location]);

  const navLinks = [
    { name: "Women", path: "/category/women", hasChevron: true },
    { name: "Men", path: "/category/men", hasChevron: true },
    { name: "Sporty", path: "/category/sporty", hasChevron: true },
    { name: "New Arrival", path: "/#new-arrivals", isScroll: true, hasChevron: false },
    { name: "My Orders", path: "/orders", hasChevron: false, matchPrefix: true },
  ];

  const renderSearchDropdown = () => (
    <div
      className="absolute top-full left-0 right-0 md:left-auto md:right-0 mt-2 bg-white rounded-2xl shadow-[0_18px_48px_rgba(24,20,16,0.14)] border border-[#e9e2d8] overflow-hidden z-[999] md:min-w-[360px]"
      style={{ maxHeight: "420px" }}
    >
      {searchLoading ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <div className="w-4 h-4 border-2 border-neutral-200 border-t-[#1a1816] rounded-full animate-spin" />
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
            Searching...
          </span>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="py-2 overflow-y-auto" style={{ maxHeight: "400px" }}>
          <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d8276]">
            {searchResults.length} Result{searchResults.length > 1 ? "s" : ""}
          </p>
          {searchResults.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleResultClick(product.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f3ed] transition-colors cursor-pointer group/item"
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#f4f1ec] flex-shrink-0 border border-[#ebe4da]">
                {getImageUrl(product) ? (
                  <img
                    src={getImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <ShoppingBag size={16} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[12.5px] font-semibold text-[#1a1816] truncate leading-tight">
                  {product.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11.5px] font-bold text-[#3f3831]">
                    {formatPrice(product.price)}
                  </span>
                  {product.category?.name && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#7c7063] bg-[#f1ebe2] px-1.5 py-0.5 rounded-full">
                      {product.category.name}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9a8d7f] group-hover/item:text-[#1a1816] transition-colors flex-shrink-0">
                View →
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <Search className="w-5 h-5 text-[#c2b8ac] mb-2" />
          <p className="text-[11px] font-bold text-[#6e6459] uppercase tracking-widest">
            No products found
          </p>
          <p className="text-[11px] text-[#9b9084] mt-0.5">Try a different keyword</p>
        </div>
      )}
    </div>
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] w-full"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Slim Dark Top Utility Bar */}
      <div
        className={`bg-[#151413] text-neutral-200 transition-all duration-300 overflow-hidden ${
          isScrolled ? "max-h-0 opacity-0 border-b-0" : "max-h-12 opacity-100 border-b border-white/10"
        }`}
      >
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-9 flex items-center justify-between text-[11px] font-medium tracking-[0.02em]">
          {/* Left Utility Info */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-white/90 truncate">
              <Truck className="w-3.5 h-3.5 text-[#d8c4a6] shrink-0" strokeWidth={1.75} />
              <span className="truncate">Free Shipping Over LKR 10,000</span>
            </span>
            <span className="hidden sm:inline-block h-3 w-px bg-white/20 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-white/85 whitespace-nowrap">
              <RotateCcw className="w-3.5 h-3.5 text-[#d8c4a6] shrink-0" strokeWidth={1.75} />
              <span>30-Day Easy Returns</span>
            </span>
          </div>

          {/* Right Utility Actions */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <button
              type="button"
              onClick={handleHelpSupportClick}
              className="inline-flex items-center gap-1.5 text-white/85 hover:text-[#e7d6be] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Headphones className="w-3.5 h-3.5 text-[#d8c4a6] shrink-0" strokeWidth={1.75} />
              <span className="sm:hidden">Support</span>
              <span className="hidden sm:inline">Help &amp; Support</span>
            </button>
            <span className="hidden sm:inline-block h-3 w-px bg-white/20 shrink-0" aria-hidden="true" />
            <button
              type="button"
              onClick={handleStoreLocatorClick}
              className="hidden sm:inline-flex items-center gap-1.5 text-white/85 hover:text-[#e7d6be] transition-colors cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-[#d8c4a6] shrink-0" strokeWidth={1.75} />
              <span>Store Locator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main White Navigation Bar */}
      <div
        className={`bg-white/98 backdrop-blur-md border-b border-[#ece6dd] transition-shadow duration-300 ${
          isScrolled ? "shadow-[0_6px_26px_rgba(24,20,16,0.08)]" : "shadow-[0_1px_0_rgba(24,20,16,0.03)]"
        }`}
      >
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-[66px] md:h-[74px] flex items-center justify-between gap-4 lg:gap-8">
          {/* Brand Wordmark */}
          <Link
            to="/"
            className="flex-shrink-0 flex flex-col items-start justify-center group"
            aria-label="Rich Apparel Home"
          >
            <span className="font-extrabold text-[21px] md:text-[24px] tracking-[0.2em] leading-none text-[#141312] group-hover:opacity-80 transition-opacity">
              RICH
            </span>
            <span className="font-medium text-[8.5px] md:text-[9.5px] tracking-[0.42em] leading-none text-[#4d463e] mt-1 pl-[1px]">
              APPAREL
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const currentPath = location.pathname.toLowerCase();
              const targetPath = link.path.toLowerCase();
              const isActive =
                !link.isScroll &&
                (link.matchPrefix
                  ? currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
                  : currentPath === targetPath);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={(e) => handleNavLinkClick(e, link)}
                  className={`relative py-2 inline-flex items-center gap-1 whitespace-nowrap text-[14px] font-bold tracking-[0.01em] transition-colors group ${
                    isActive ? "text-black" : "text-[#1a1816] hover:text-black"
                  }`}
                >
                  <span>{link.name}</span>
                  {link.hasChevron && (
                    <ChevronDown
                      className="w-3.5 h-3.5 text-[#5c544b] group-hover:text-black transition-colors"
                      strokeWidth={2.25}
                    />
                  )}
                  <span
                    className={`absolute left-0 right-0 bottom-0 h-[2px] bg-[#141312] rounded-full transition-transform duration-300 origin-left ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right Utility Group: Search, Account, Wishlist, Cart */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 lg:flex-initial justify-end">
            {/* Desktop Search Bar with Live Suggestions */}
            <div ref={searchRef} className="hidden md:flex relative w-[265px] lg:w-[235px] xl:w-[310px] group">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8276] group-focus-within:text-[#1a1816] transition-colors pointer-events-none"
                strokeWidth={1.85}
              />
              <input
                type="text"
                placeholder="Search products, collections..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                aria-label="Search products and collections"
                className="w-full rounded-full py-2.5 pl-10 pr-8 text-[12.5px] font-medium bg-[#f4f0ea] hover:bg-[#eee8df] focus:bg-white text-[#1a1816] placeholder-[#8c8276] border border-transparent focus:border-[#d4c7b6] focus:shadow-[0_0_0_3px_rgba(212,199,182,0.22)] transition-all outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowDropdown(false);
                  }}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8c8276] hover:text-[#1a1816] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {showDropdown && renderSearchDropdown()}
            </div>

            {/* Account */}
            {isAuthenticated ? (
              <div ref={userDropdownRef} className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown((prev) => !prev);
                    setShowWishlist(false);
                  }}
                  aria-label="Account Menu"
                  title={user?.name || "Account"}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-[#f4f0ea] hover:bg-[#161514] text-[#1a1816] hover:text-white border border-[#e5ddd2] transition-all duration-200 cursor-pointer text-[12px] font-bold uppercase"
                >
                  {user?.name?.charAt(0) || <User className="w-[18px] h-[18px]" strokeWidth={1.75} />}
                </button>

                {showUserDropdown && (
                  <div className="absolute top-full right-0 mt-2.5 bg-white rounded-2xl shadow-[0_18px_48px_rgba(24,20,16,0.14)] border border-[#e9e2d8] overflow-hidden z-[999] min-w-[220px] p-2 animate-fade-in">
                    <div className="px-3.5 py-2.5 border-b border-[#f0eae2] mb-1">
                      <p className="text-[10px] font-bold text-[#9a8e80] uppercase tracking-[0.18em]">
                        Signed In As
                      </p>
                      <p className="text-[13px] font-bold text-[#1a1816] truncate mt-0.5">
                        {user?.name || "Customer"}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#f7f3ed] rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4 text-[#5e554b]" strokeWidth={1.8} />
                      <span className="text-[12.5px] font-semibold text-[#23201d]">
                        Profile Settings
                      </span>
                    </Link>

                    <Link
                      to="/orders"
                      className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#f7f3ed] rounded-xl transition-colors"
                    >
                      <Package className="w-4 h-4 text-[#5e554b]" strokeWidth={1.8} />
                      <span className="text-[12.5px] font-semibold text-[#23201d]">My Orders</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-red-50 rounded-xl transition-colors mt-1 cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-600" strokeWidth={1.8} />
                      <span className="text-[12.5px] font-semibold text-red-600">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                aria-label="Account"
                title="Sign In"
                className="p-2 rounded-full text-[#1d1b19] hover:bg-[#f4f0ea] hover:text-black transition-colors"
              >
                <User className="w-[20px] h-[20px]" strokeWidth={1.75} />
              </Link>
            )}

            {/* Wishlist */}
            <div ref={wishlistRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowWishlist((prev) => !prev);
                  setShowUserDropdown(false);
                }}
                aria-label="Wishlist"
                title="Wishlist"
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  showWishlist
                    ? "bg-[#f4f0ea] text-[#141312]"
                    : "text-[#1d1b19] hover:bg-[#f4f0ea] hover:text-black"
                }`}
              >
                <Heart className="w-[20px] h-[20px]" strokeWidth={1.75} />
              </button>

              {showWishlist && (
                <div className="absolute top-full right-0 mt-2.5 w-[280px] sm:w-[300px] bg-white rounded-2xl shadow-[0_18px_48px_rgba(24,20,16,0.14)] border border-[#e9e2d8] p-4 z-[999] animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-[#f0eae2]">
                    <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1a1816]">
                      Wishlist
                    </span>
                    <Heart className="w-4 h-4 text-[#9a7f60]" strokeWidth={1.75} />
                  </div>
                  <div className="py-6 px-2 text-center">
                    <div className="w-11 h-11 rounded-full bg-[#f6f1ea] border border-[#eae1d5] flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-5 h-5 text-[#9a7f60]" strokeWidth={1.6} />
                    </div>
                    <p className="text-[13px] font-bold text-[#1a1816] mb-1">
                      Your wishlist is empty
                    </p>
                    <p className="text-[11.5px] text-[#7a7064] leading-relaxed mb-4">
                      Explore our latest collections to discover pieces curated for your wardrobe.
                    </p>
                    <Link
                      to="/category/women"
                      onClick={() => setShowWishlist(false)}
                      className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-full bg-[#161514] hover:bg-[#2c2926] text-white text-[11px] font-bold uppercase tracking-[0.14em] transition-colors"
                    >
                      Explore Collection
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Cart + Existing Badge */}
            <button
              type="button"
              onClick={() => toggleCart(true)}
              aria-label="Shopping Cart"
              title="Shopping Cart"
              className="relative p-2 rounded-full text-[#1d1b19] hover:bg-[#f4f0ea] hover:text-black transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-[20px] h-[20px]" strokeWidth={1.75} />
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#9a7b56] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {items.length}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="lg:hidden p-2 rounded-full text-[#1a1816] hover:bg-[#f4f0ea] border border-[#eae2d8] transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-[#ece6dd] shadow-[0_16px_40px_rgba(24,20,16,0.1)] animate-fade-in">
            <div className="px-4 sm:px-6 py-4 space-y-4">
              {/* Mobile Live Search */}
              <div ref={mobileSearchRef} className="relative md:hidden">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8276] pointer-events-none"
                  strokeWidth={1.85}
                />
                <input
                  type="text"
                  placeholder="Search products, collections..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  aria-label="Search products"
                  className="w-full rounded-full py-2.5 pl-10 pr-4 text-[13px] bg-[#f4f0ea] text-[#1a1816] placeholder-[#8c8276] border border-transparent focus:border-[#d4c7b6] focus:bg-white outline-none"
                />
                {showDropdown && renderSearchDropdown()}
              </div>

              {/* Mobile Links */}
              <div className="divide-y divide-[#f1ece4]">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={(e) => {
                      handleNavLinkClick(e, link);
                      if (!link.isScroll) setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between py-3 text-[14px] font-semibold text-[#1d1b19] hover:text-[#7c664c] transition-colors"
                  >
                    <span>{link.name}</span>
                    {link.hasChevron && <ChevronDown className="w-4 h-4 text-[#9a8e80] -rotate-90" />}
                  </Link>
                ))}
              </div>

              {/* Mobile Quick Utility Row */}
              <div className="pt-2 border-t border-[#efe9e0] flex flex-wrap items-center gap-3 text-[12px] font-semibold text-[#5a5147]">
                <button
                  type="button"
                  onClick={handleHelpSupportClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f1eb] hover:bg-[#ebe4da] transition-colors cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-[#8a7054]" />
                  <span>Help &amp; Support</span>
                </button>
                <button
                  type="button"
                  onClick={handleStoreLocatorClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f1eb] hover:bg-[#ebe4da] transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#8a7054]" />
                  <span>Store Locator</span>
                </button>
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161514] text-white transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
