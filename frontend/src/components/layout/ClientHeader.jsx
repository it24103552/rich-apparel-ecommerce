import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { productsService } from "../../services";
import { formatPrice } from "../../utils/formatters";
import { ShoppingCart, LogOut, User, LogIn, Search, Truck, Menu, X, ShoppingBag, Ticket } from "lucide-react";

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
  const debounceRef = useRef(null);
  const couponRef = useRef(null);
  const userDropdownRef = useRef(null);

  const [showCoupons, setShowCoupons] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close Dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (couponRef.current && !couponRef.current.contains(e.target)) {
        setShowCoupons(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setShowDropdown(false);
    setShowCoupons(false);
    setShowUserDropdown(false);
    setSearchQuery("");
  }, [location.pathname]);

  const handleToggleCoupons = async () => {
    setShowCoupons((prev) => !prev);
    if (!showCoupons && availableCoupons.length === 0) {
      setCouponsLoading(true);
      try {
        const { couponsService } = await import("../../services");
        const res = await couponsService.getAvailable();
        setAvailableCoupons(res.data.data.coupons || []);
      } catch (err) {
        console.error("Failed to fetch coupons", err);
      } finally {
        setCouponsLoading(false);
      }
    }
  };

  // Debounced search
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
        const allProducts = res.data.data.products || [];
        const q = query.toLowerCase();
        const filtered = allProducts.filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q)
        ).slice(0, 6);
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

  const isTransparentPage = location.pathname === "/";
  const isLightHeader = !isTransparentPage || isScrolled;

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    dispatch({ type: "AUTH_LOGOUT" });
    navigate("/");
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

  // Effect to handle scrolling when landing on home page with hash
  useEffect(() => {
    if (location.pathname === "/" && location.hash === "#new-arrivals") {
      const element = document.getElementById("new-arrivals");
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  const navLinks = [
    { name: "WOMEN", path: "/category/women" },
    { name: "MEN", path: "/category/men" },
    { name: "SPORTY", path: "/category/sporty" },
    { name: "NEW ARRIVAL", path: "/#new-arrivals", isScroll: true },

  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-500 ${isLightHeader ? 'translate-y-0' : ''}`}>
      {/* Top Promo Bar */}
      <div className={`transition-all duration-500 overflow-hidden ${isScrolled ? 'h-0 opacity-0' : 'h-auto py-2 opacity-100'} bg-black/40 backdrop-blur-md text-white text-center text-[10px] font-bold tracking-widest uppercase px-4 border-b border-white/5`}>
        Timeless Looks, Everyday Comfort for Every Moment
      </div>

      {/* Main Navbar */}
      <div className={`transition-all duration-700 border-t border-white/0 ${isLightHeader ? 'bg-black/[0.30] backdrop-blur-[40px] border border-white/50 shadow-2xl' : 'bg-black/20 backdrop-blur-[40px] border border-white/10 shadow-2xl shadow-black/50'}`}>
        <div className={`max-w-full mx-auto px-[10%] transition-all duration-700 ${isScrolled ? 'h-16 md:h-20' : 'h-20 md:h-24'} flex items-center justify-between gap-4 md:gap-8`}>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex flex-col items-center justify-center -space-y-1 hover:scale-105 transition-transform" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <span className={`font-bold text-2xl md:text-3xl tracking-[0.2em] leading-none transition-colors duration-500 ${isLightHeader ? 'text-white' : 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]'}`}>
              RICH
            </span>
            <span className={`font-medium text-xs md:text-sm tracking-[0.3em] leading-none transition-colors duration-500 ${isLightHeader ? 'text-white/100' : 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]'}`}>
              APPAREL
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={(e) => handleNavLinkClick(e, link)}
                className={`text-[12px] font-bold transition-all duration-300 tracking-[0.1em] ${isLightHeader ? 'text-white hover:text-white' : 'text-white/90 hover:text-white drop-shadow-md'}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop with Live Suggestions */}
          <div ref={searchRef} className="hidden md:flex relative flex-1 max-w-xs group" style={{ zIndex: 999 }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              className={`w-full rounded-full py-2.5 pl-10 pr-4 text-[13px] transition-all outline-none backdrop-blur-md ${isLightHeader ? 'bg-white/5 border-white/50 text-white placeholder-white/80 focus:ring-white focus:bg-white/20 shadow-inner' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/40 focus:bg-white/20 shadow-inner'}`}
            />
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${isLightHeader ? 'text-white/50 group-focus-within:text-white' : 'text-white/50 group-focus-within:text-white'}`} />

            {/* Live Search Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/30 border border-white/20 overflow-hidden" style={{ maxHeight: "420px", minWidth: "380px" }}>
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    <span className="text-[11px] font-bold text-black/40 uppercase tracking-widest">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2 overflow-y-auto" style={{ maxHeight: "400px" }}>
                    <p className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-black/30">{searchResults.length} Result{searchResults.length > 1 ? "s" : ""}</p>
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleResultClick(product.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-all cursor-pointer group/item"
                      >
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200/50 shadow-sm">
                          {getImageUrl(product) ? (
                            <img src={getImageUrl(product)} alt="" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                              <ShoppingBag size={16} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[12px] font-bold text-black truncate leading-tight">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-black text-black/70">{formatPrice(product.price)}</span>
                            {product.category?.name && (
                              <span className="text-[8px] font-bold uppercase tracking-wider text-black/40 bg-black/5 px-1.5 py-0.5 rounded-full">{product.category.name}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-black/20 group-hover/item:text-black/50 transition-colors flex-shrink-0">View →</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Search className="w-6 h-6 text-black/15 mb-2" />
                    <p className="text-[11px] font-bold text-black/30 uppercase tracking-widest">No products found</p>
                    <p className="text-[10px] text-black/20 mt-0.5">Try a different keyword</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="flex items-center gap-3 md:gap-5">
            <button onClick={() => navigate("/orders")} className={`p-2 rounded-full transition-colors hidden sm:block group cursor-pointer ${isLightHeader ? 'hover:bg-white/10' : 'hover:bg-white/10'}`} title="Track Order">
              <Truck className={`w-5 h-5 transition-colors ${isLightHeader ? 'text-white/80 group-hover:text-white drop-shadow-md' : 'text-white/80 group-hover:text-white drop-shadow-md'}`} />
            </button>

            {/* Promo / Coupons Dropdown */}
            <div ref={couponRef} className="relative hidden sm:block">
              <button onClick={handleToggleCoupons} className={`p-2 rounded-full transition-colors group cursor-pointer ${isLightHeader ? 'hover:bg-white/10' : 'hover:bg-white/10'}`} title="Available Promos">
                <Ticket className={`w-5 h-5 transition-colors ${isLightHeader ? 'text-white/80 group-hover:text-white drop-shadow-md' : 'text-white/80 group-hover:text-white drop-shadow-md'}`} />
              </button>

              {/* Coupon List Dropdown */}
              {showCoupons && (
                <div className="absolute top-full right-0 mt-3 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/30 border border-white/20 overflow-hidden z-[999] p-4" style={{ width: "320px" }}>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5">
                    <span className="text-[12px] font-black text-black uppercase tracking-widest">Active Promos</span>
                    <Ticket className="w-4 h-4 text-black/40" />
                  </div>

                  {!isAuthenticated ? (
                    <div className="py-6 px-2 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-4 relative">
                        <Ticket className="w-8 h-8 text-black/20" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="material-symbols-outlined text-white text-[14px]">lock</span>
                        </div>
                      </div>
                      <h3 className="text-[14px] font-black text-black uppercase tracking-widest mb-2">Unlock Exclusive Rewards</h3>
                      <p className="text-[11px] text-black/50 font-bold leading-relaxed mb-6">
                        Sign up or login to reveal hidden coupon codes and exclusive member-only discounts!
                      </p>
                      <button
                        onClick={() => { setShowCoupons(false); navigate("/login"); }}
                        className="w-full py-3 bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-800 transition-all shadow-xl shadow-black/10 active:scale-95"
                      >
                        Join Now to Save
                      </button>
                    </div>
                  ) : couponsLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    </div>
                  ) : availableCoupons.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {availableCoupons.map((c) => (
                        <div key={c.id} className="bg-black/[0.03] border border-black/5 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group">
                          <div className="absolute -right-6 -top-6 text-black/[0.03] rotate-12 transition-transform duration-500 group-hover:rotate-45 group-hover:scale-110">
                            <Ticket size={80} />
                          </div>
                          <div className="flex justify-between items-start z-10">
                            <span className="text-[14px] font-black text-black tracking-[0.2em] bg-white px-2 py-1 rounded shadow-sm inline-block">
                              {c.code}
                            </span>
                            <span className="text-[14px] font-bold text-indigo-600">
                              {c.discountType === 'percentage' ? `${c.discount}% OFF` : `LKR ${c.discount} OFF`}
                            </span>
                          </div>
                          <div className="text-[10px] text-black/60 font-semibold uppercase tracking-widest mt-1 z-10 leading-relaxed space-y-0.5">
                            <div>{c.minCartValue > 0 ? `Min. spend LKR ${c.minCartValue}` : 'No minimum spend'}</div>

                            {/* Targeted inventory detail */}
                            {c.targetType === 'all' && <div className="text-emerald-600 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">done_all</span> Valid on all items</div>}
                            {c.targetType === 'category' && <div className="text-indigo-500 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">category</span> For selected categories</div>}
                            {c.targetType === 'product' && <div className="text-indigo-500 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">inventory_2</span> For selected products</div>}

                            {/* Audience detail */}
                            {c.audienceType === 'new' && <div className="text-pink-500 font-black italic">✨ New Customers Only</div>}
                            {c.audienceType === 'specific' && <div className="text-black/40 italic flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">lock</span> Private Offer</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-black/40 text-[11px] font-bold uppercase tracking-widest">
                      No active promos right now
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={() => toggleCart(true)}
              className={`relative p-2 rounded-full transition-colors group cursor-pointer ${isLightHeader ? 'hover:bg-white/10' : 'hover:bg-white/10'}`}
            >
              <ShoppingBag className={`w-5 h-5 transition-colors ${isLightHeader ? 'text-white/80 group-hover:text-white drop-shadow-md' : 'text-white/80 group-hover:text-white drop-shadow-md'}`} />
              {items.length > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 text-[10px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center border transition-all ${isLightHeader ? 'bg-white text-black border-black shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white text-black border-black shadow-[0_0_10px_rgba(255,255,255,0.5)]'}`}>
                  {items.length}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div ref={userDropdownRef} className="relative flex items-center pl-3 border-l border-white/20">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[11px] font-black uppercase tracking-widest transition-all shadow-xl group-hover:scale-110 ${isLightHeader ? 'bg-white/10 backdrop-blur-md border-white/40 text-white hover:bg-white/20' : 'bg-white/10 backdrop-blur-md border-white/40 text-white hover:bg-white/20'}`}>
                    {user?.name?.charAt(0)}
                  </div>
                </button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <div className="absolute top-full right-0 mt-3 bg-white/95 backdrop-blur-3xl rounded-2xl shadow-2xl shadow-black/40 border border-white/20 overflow-hidden z-[999] min-w-[200px] p-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="px-4 py-3 border-b border-black/5 mb-1">
                      <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mb-0.5">Account User</p>
                      <p className="text-[13px] font-black text-black truncate">{user?.name || 'Customer'}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 rounded-xl transition-all group/item"
                    >
                      <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center group-hover/item:bg-white transition-colors">
                        <User className="w-4 h-4 text-black/60" />
                      </div>
                      <span className="text-[12px] font-bold text-black/80">Profile Settings</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 rounded-xl transition-all group/logout mt-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover/logout:bg-red-500 transition-colors">
                        <LogOut className="w-4 h-4 text-red-500 group-hover/logout:text-white" />
                      </div>
                      <span className="text-[12px] font-bold text-red-500">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className={`flex items-center gap-2 group ml-2 rounded-full py-1.5 px-4 transition-all duration-300 shadow-lg ${isLightHeader ? 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white hover:border-white hover:text-black' : 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white hover:border-white hover:text-black'}`}>
                <User className={`w-4 h-4 transition-colors ${isLightHeader ? 'text-white' : 'text-white group-hover:text-black'}`} />
                <span className={`text-[12px] font-extrabold uppercase tracking-tight transition-colors ${isLightHeader ? 'text-white' : 'text-white group-hover:text-black'}`}>Login</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className={`lg:hidden p-2 rounded-full border transition-all shadow-md cursor-pointer ${isLightHeader ? 'bg-black/20 border-white/10 text-white' : 'bg-black/20 border-white/10 text-white'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden border-t transition-all duration-700 animate-fade-in ${isLightHeader ? 'bg-black/95 backdrop-blur-3xl border-white/10' : 'bg-black/95 backdrop-blur-3xl border-white/10'}`}>
            <div className="p-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={(e) => {
                    handleNavLinkClick(e, link);
                    if (!link.isScroll) setIsMobileMenuOpen(false);
                  }}
                  className={`block py-3 text-[14px] font-bold tracking-[0.15em] hover:translate-x-2 transition-all border-b last:border-0 uppercase ${isLightHeader ? 'text-white/70 hover:text-white border-white/5' : 'text-white/70 hover:text-white border-white/5'}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
