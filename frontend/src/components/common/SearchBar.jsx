import { Search, X } from "lucide-react";

export const SearchBar = ({ value, onChange, placeholder = "Search...", dark, className = "" }) => {
  const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  return (
    <div className="relative group">
      <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors ${isDark ? "text-neutral-500 group-focus-within:text-white" : "text-[#77736E] group-focus-within:text-[#171717]"}`} size={18} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-11 pr-10 py-2.5 transition-all outline-none text-[13.5px] font-medium ${
          isDark
            ? "h-12 bg-[#0b0b0b] hover:bg-[#0f0f0f] focus:bg-[#0f0f0f] border border-white/[0.06] focus:border-white/20 rounded-2xl text-white placeholder-neutral-500"
            : "h-12 bg-[#FAF8F5] hover:bg-white focus:bg-white border border-[#E4DED6] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 rounded-2xl text-[#171717] placeholder-[#8a857d]"
        } ${className}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className={`absolute right-3.5 top-1/2 transform -translate-y-1/2 transition-colors ${isDark ? "text-neutral-500 hover:text-white" : "text-[#8a857d] hover:text-[#171717]"}`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
