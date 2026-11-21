import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

export const ClientFooter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [footerEmail, setFooterEmail] = useState("");

  const handleHelpSupport = () => {
    const supportBtn = document.querySelector(
      '[aria-label*="Support" i], [aria-label*="Chat" i], [title*="Support" i]'
    );
    if (supportBtn && typeof supportBtn.click === "function") {
      supportBtn.click();
      return;
    }
    toast("Contact us at richapparel@contact.com or 011300400.");
  };

  const handleNewArrivalsClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      document.getElementById("new-arrivals")?.scrollIntoView({ behavior: "smooth" });
    } else {
      e.preventDefault();
      navigate("/#new-arrivals");
    }
  };

  const handleShippingInfoClick = () => {
    if (location.pathname === "/") {
      const heading = Array.from(document.querySelectorAll("section h2")).find((h) =>
        h.textContent?.toLowerCase().includes("why choose rich apparel")
      );
      heading?.closest("section")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const handleFooterNewsletterSubmit = (e) => {
    e.preventDefault();
    const email = footerEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setFooterEmail("");
    toast.success("Thank you for staying in the loop with Rich Apparel!");
  };

  return (
    <footer
      className="bg-[#141312] text-white pt-16 pb-10 border-t border-[#252320]"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">
          {/* Brand Column */}
          <div className="lg:col-span-3 space-y-5">
            <Link to="/" className="inline-flex flex-col items-start group">
              <span className="font-extrabold text-[24px] tracking-[0.2em] leading-none text-white group-hover:opacity-85 transition-opacity">
                RICH
              </span>
              <span className="font-medium text-[9.5px] tracking-[0.42em] leading-none text-neutral-300 mt-1 pl-[1px]">
                APPAREL
              </span>
            </Link>

            <p className="text-[13px] font-medium text-neutral-300">
              Wear the Difference.
            </p>

            <div className="space-y-2.5 text-[12.5px] text-neutral-400 pt-1">
              <div className="flex items-start gap-2.5">
                <MapPin size={14} strokeWidth={1.75} className="text-[#d8c4a6] shrink-0 mt-0.5" />
                <span>Colombo 7, New Road, Sri Lanka.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={14} strokeWidth={1.75} className="text-[#d8c4a6] shrink-0" />
                <a href="tel:011300400" className="hover:text-[#e6d7c3] transition-colors">
                  011300400
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={14} strokeWidth={1.75} className="text-[#d8c4a6] shrink-0" />
                <a
                  href="mailto:richapparel@contact.com"
                  className="hover:text-[#e6d7c3] transition-colors break-all"
                >
                  richapparel@contact.com
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-[12px] font-bold uppercase tracking-[0.18em] mb-5 text-white">
              Quick Links
            </h4>
            <ul className="space-y-3 text-[13px] text-neutral-400 font-medium">
              <li>
                <Link to="/" className="hover:text-[#e6d7c3] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/category/women" className="hover:text-[#e6d7c3] transition-colors">
                  Women
                </Link>
              </li>
              <li>
                <Link to="/category/men" className="hover:text-[#e6d7c3] transition-colors">
                  Men
                </Link>
              </li>
              <li>
                <Link to="/category/sporty" className="hover:text-[#e6d7c3] transition-colors">
                  Sporty
                </Link>
              </li>
              <li>
                <Link
                  to="/#new-arrivals"
                  onClick={handleNewArrivalsClick}
                  className="hover:text-[#e6d7c3] transition-colors"
                >
                  New Arrival
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="lg:col-span-2">
            <h4 className="text-[12px] font-bold uppercase tracking-[0.18em] mb-5 text-white">
              Customer Care
            </h4>
            <ul className="space-y-3 text-[13px] text-neutral-400 font-medium">
              <li>
                <button
                  type="button"
                  onClick={handleHelpSupport}
                  className="hover:text-[#e6d7c3] transition-colors cursor-pointer text-left"
                >
                  Help &amp; Support
                </button>
              </li>
              <li>
                <Link to="/orders" className="hover:text-[#e6d7c3] transition-colors">
                  Returns &amp; Exchanges
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleShippingInfoClick}
                  className="hover:text-[#e6d7c3] transition-colors cursor-pointer text-left"
                >
                  Shipping Information
                </button>
              </li>
              <li>
                <Link to="/category/all" className="hover:text-[#e6d7c3] transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <a
                  href="mailto:richapparel@contact.com"
                  className="hover:text-[#e6d7c3] transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div className="lg:col-span-2">
            <h4 className="text-[12px] font-bold uppercase tracking-[0.18em] mb-5 text-white">
              Connect With Us
            </h4>
            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-[#1f1d1b] border border-[#2f2c28] flex items-center justify-center text-neutral-300 hover:bg-[#d8c4a6] hover:border-[#d8c4a6] hover:text-[#141312] transition-all duration-200"
              >
                <Facebook size={15} strokeWidth={1.75} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-[#1f1d1b] border border-[#2f2c28] flex items-center justify-center text-neutral-300 hover:bg-[#d8c4a6] hover:border-[#d8c4a6] hover:text-[#141312] transition-all duration-200"
              >
                <Instagram size={15} strokeWidth={1.75} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="w-9 h-9 rounded-full bg-[#1f1d1b] border border-[#2f2c28] flex items-center justify-center text-neutral-300 hover:bg-[#d8c4a6] hover:border-[#d8c4a6] hover:text-[#141312] transition-all duration-200"
              >
                <Twitter size={15} strokeWidth={1.75} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-[#1f1d1b] border border-[#2f2c28] flex items-center justify-center text-neutral-300 hover:bg-[#d8c4a6] hover:border-[#d8c4a6] hover:text-[#141312] transition-all duration-200"
              >
                <Youtube size={15} strokeWidth={1.75} />
              </a>
            </div>
          </div>

          {/* Right Mini Newsletter Input */}
          <div className="lg:col-span-3">
            <p className="text-[13px] font-medium text-neutral-200 leading-relaxed mb-4">
              Be the first to know about new collections and exclusive offers.
            </p>
            <form onSubmit={handleFooterNewsletterSubmit} noValidate className="flex items-stretch">
              <input
                type="email"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Footer email subscription"
                className="flex-1 min-w-0 bg-[#1d1c1a] border border-[#302d28] border-r-0 rounded-l-lg px-3.5 py-2.5 text-[12.5px] text-white placeholder-neutral-500 focus:border-[#d8c4a6] outline-none transition-colors"
              />
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="px-4 rounded-r-lg bg-white hover:bg-[#e6d7c3] text-[#141312] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-[#24221f] pt-7 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11.5px] text-neutral-400">
          <p className="text-center sm:text-left">
            &copy; 2026 Rich Apparel. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => toast("Privacy Policy — Rich Apparel protects your customer data.")}
              className="hover:text-[#e6d7c3] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => toast("Terms & Conditions — Standard Rich Apparel storefront terms apply.")}
              className="hover:text-[#e6d7c3] transition-colors cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <button
              type="button"
              onClick={() => toast("Cookies Settings — Essential session cookies are active.")}
              className="hover:text-[#e6d7c3] transition-colors cursor-pointer"
            >
              Cookies Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
