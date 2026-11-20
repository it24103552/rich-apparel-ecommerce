import { Link } from "react-router-dom";
import { motion as Motion, MotionConfig } from "framer-motion";
import { AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";

export const authLabelClass =
  "block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3a3530] mb-1.5";

export const authInputBaseClass =
  "w-full h-11 sm:h-[46px] px-4 rounded-[10px] bg-white text-[14px] font-medium text-[#171615] placeholder:text-[#9c9489] placeholder:font-normal border transition-all duration-200 outline-none";

export const authInputNormalClass =
  "border-[#ddd4c8] hover:border-[#c6bba9] focus:border-[#171615] focus:ring-2 focus:ring-[#c9a77a]/25";

export const authInputErrorClass =
  "border-[#c94a4a] focus:border-[#c94a4a] focus:ring-2 focus:ring-[#c94a4a]/15";

export const authPrimaryButtonClass =
  "w-full h-12 rounded-[10px] bg-[#171615] hover:bg-[#2a2826] active:scale-[0.99] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_6px_18px_rgba(23,22,21,0.14)] hover:shadow-[0_10px_24px_rgba(23,22,21,0.2)] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer";

export const AuthApiError = ({ message }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mt-5 px-3.5 py-3 rounded-[10px] bg-[#fdf4f4] border border-[#f0c7c7] text-[#9b2c2c] text-[13px] font-medium flex items-start gap-2.5"
    >
      <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#b43232]" />
      <span>{message}</span>
    </div>
  );
};

export const AuthFieldError = ({ message }) => {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#b43232]"
    >
      <AlertCircle size={13} className="shrink-0" />
      <span>{message}</span>
    </p>
  );
};

export const AuthPasswordField = ({
  id,
  label,
  placeholder,
  registerProps,
  error,
  showPassword,
  onToggleVisibility,
  autoComplete = "new-password",
}) => (
  <div>
    <label htmlFor={id} className={authLabelClass}>
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        {...registerProps}
        className={`${authInputBaseClass} pr-11 ${
          error ? authInputErrorClass : authInputNormalClass
        }`}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#8a8277] hover:text-[#171615] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a77a] transition-colors cursor-pointer"
      >
        {showPassword ? (
          <EyeOff size={18} strokeWidth={1.75} />
        ) : (
          <Eye size={18} strokeWidth={1.75} />
        )}
      </button>
    </div>
    <AuthFieldError message={error} />
  </div>
);

export const AuthSplitLayout = ({
  imageSrc,
  imageAlt,
  eyebrow = "Curated Collection",
  headline = "Rich Apparel",
  tagline = "Modern fashion • Everyday confidence • Premium style",
  cardHeading,
  cardSubtitle,
  maxWidthClass = "max-w-[448px]",
  footerNote = "Quiet luxury for everyday wear",
  children,
}) => (
  <MotionConfig reducedMotion="user">
    <div
      className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 bg-[#faf8f5] text-[#171615] selection:bg-[#171615] selection:text-white overflow-x-hidden"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Left Side — Desktop Brand & Editorial Visual Area */}
      <Motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:col-span-6 relative bg-[#171615] flex-col justify-between p-12 xl:p-14 overflow-hidden"
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#171615]/60 via-[#171615]/15 to-[#171615]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171615]/50 via-transparent to-transparent" />

        {/* Top Brand Lockup */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex flex-col group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8c4a6] rounded-sm"
          >
            <span className="font-bold text-2xl tracking-[0.22em] leading-none text-white">
              RICH
            </span>
            <span className="font-medium text-[11px] tracking-[0.34em] leading-none text-white/85 mt-1">
              APPAREL
            </span>
            <span className="w-8 h-[2px] bg-[#d8c4a6] mt-3 transition-all duration-300 group-hover:w-12" />
          </Link>
        </div>

        {/* Bottom Minimal Brand Messaging */}
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-md space-y-3"
        >
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.32em] text-[#d8c4a6]">
            {eyebrow}
          </span>
          <h2 className="text-3xl xl:text-[40px] font-bold tracking-tight text-white leading-[1.15]">
            {headline}
          </h2>
          <p className="text-sm text-white/80 font-normal tracking-wide leading-relaxed">
            {tagline}
          </p>
          <div className="w-12 h-[1.5px] bg-[#c9a77a]/80 pt-1" />
        </Motion.div>
      </Motion.aside>

      {/* Tablet Compact Editorial Header (md only) */}
      <div className="hidden md:block lg:hidden relative h-44 bg-[#171615] overflow-hidden shrink-0">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover object-[center_18%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171615]/85 via-[#171615]/55 to-[#171615]/30" />
        <div className="relative z-10 h-full max-w-[540px] mx-auto px-6 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d8c4a6] block mb-1">
              {headline}
            </span>
            <p className="text-base sm:text-lg font-bold text-white tracking-tight">
              {tagline}
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 hover:text-white bg-white/10 border border-white/20 rounded-lg px-3.5 py-2 transition-colors shrink-0"
          >
            <ArrowLeft size={14} />
            Store
          </Link>
        </div>
      </div>

      {/* Mobile Compact Brand Bar (< md) */}
      <div className="flex md:hidden items-center justify-between px-5 pt-5 pb-1">
        <Link to="/" className="inline-flex flex-col">
          <span className="font-bold text-base tracking-[0.22em] leading-none text-[#171615]">
            RICH APPAREL
          </span>
          <span className="w-6 h-[2px] bg-[#c9a77a] mt-1.5" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b655e] hover:text-[#171615] transition-colors py-1.5"
        >
          <ArrowLeft size={14} />
          Back to store
        </Link>
      </div>

      {/* Right Side — Form Card Container */}
      <main className="flex-1 lg:col-span-6 flex flex-col justify-between px-5 py-6 sm:px-10 sm:py-9 lg:px-14 lg:py-9">
        <div className="hidden lg:flex items-center justify-end">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b655e] hover:text-[#171615] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to store
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center py-2 sm:py-5">
          <Motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full ${maxWidthClass} bg-white rounded-2xl border border-[#e5ded4] shadow-[0_12px_36px_rgba(23,22,21,0.05)] p-6 sm:p-8`}
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a6d43]">
                  Rich Apparel
                </span>
                <span className="h-[1px] w-6 bg-[#d8c4a6]" />
              </div>
              <h1 className="text-2xl sm:text-[27px] font-bold tracking-tight text-[#171615] mt-3">
                {cardHeading}
              </h1>
              {cardSubtitle && (
                <p className="text-[13.5px] text-[#6b655e] mt-1.5 leading-relaxed">
                  {cardSubtitle}
                </p>
              )}
            </div>

            {children}
          </Motion.div>
        </div>

        <div className="hidden lg:flex items-center justify-between text-[11px] text-[#8c847a] tracking-wide pt-4">
          <span>&copy; 2026 Rich Apparel</span>
          <span>{footerNote}</span>
        </div>
      </main>
    </div>
  </MotionConfig>
);

export const AuthCenteredLayout = ({ cardHeading, cardSubtitle, children }) => (
  <MotionConfig reducedMotion="user">
    <div
      className="min-h-screen flex flex-col justify-between bg-[#faf8f5] text-[#171615] selection:bg-[#171615] selection:text-white overflow-x-hidden px-5 py-6 sm:px-10 sm:py-8"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Top Brand Navigation Bar */}
      <header className="w-full max-w-[1160px] mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex flex-col group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a77a] rounded-sm"
        >
          <span className="font-bold text-lg sm:text-xl tracking-[0.22em] leading-none text-[#171615]">
            RICH APPAREL
          </span>
          <span className="w-7 h-[2px] bg-[#c9a77a] mt-1.5 transition-all duration-300 group-hover:w-11" />
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b655e] hover:text-[#171615] transition-colors py-1.5"
        >
          <ArrowLeft size={14} />
          Back to store
        </Link>
      </header>

      {/* Focused Centered Card */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12">
        <Motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px] bg-white rounded-2xl border border-[#e5ded4] shadow-[0_12px_36px_rgba(23,22,21,0.05)] p-6 sm:p-9"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a6d43]">
                Rich Apparel
              </span>
              <span className="h-[1px] w-6 bg-[#d8c4a6]" />
            </div>
            <h1 className="text-2xl sm:text-[27px] font-bold tracking-tight text-[#171615] mt-3">
              {cardHeading}
            </h1>
            {cardSubtitle && (
              <p className="text-[13.5px] text-[#6b655e] mt-1.5 leading-relaxed">
                {cardSubtitle}
              </p>
            )}
          </div>

          {children}
        </Motion.div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full max-w-[1160px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8c847a] tracking-wide">
        <span>&copy; 2026 Rich Apparel</span>
        <span>Quiet luxury for everyday wear</span>
      </footer>
    </div>
  </MotionConfig>
);
