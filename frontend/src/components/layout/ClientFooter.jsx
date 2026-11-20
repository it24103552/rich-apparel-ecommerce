import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";

export const ClientFooter = () => {
  return (
    <footer className="bg-[#121212] text-white pt-16 pb-10 border-t border-[#242424] font-montserrat">
      <div className="max-w-[1400px] mx-auto px-[5%] lg:px-[6%]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">
          {/* Brand & Info */}
          <div className="lg:col-span-4 space-y-5">
            <div>
              <h3 className="text-2xl font-black tracking-[0.04em] uppercase text-white">RICH APPAREL</h3>
              <div className="w-10 h-[2px] bg-[#d8c4a6] mt-3" />
            </div>
            <p className="text-[13px] text-neutral-300/90 leading-[1.75] max-w-[310px]">
              Elevating your style with curated pieces that define modern sophistication.
              Quiet luxury for the discerning individual.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="#"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-neutral-300 hover:bg-[#d8c4a6] hover:border-[#d8c4a6] hover:text-[#121212] hover:-translate-y-0.5 transition-all duration-300"
              >
                <Facebook size={16} strokeWidth={1.75} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-neutral-300 hover:bg-[#d8c4a6] hover:border-[#d8c4a6] hover:text-[#121212] hover:-translate-y-0.5 transition-all duration-300"
              >
                <Instagram size={16} strokeWidth={1.75} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-neutral-300 hover:bg-[#d8c4a6] hover:border-[#d8c4a6] hover:text-[#121212] hover:-translate-y-0.5 transition-all duration-300"
              >
                <Twitter size={16} strokeWidth={1.75} />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-neutral-300 hover:bg-[#d8c4a6] hover:border-[#d8c4a6] hover:text-[#121212] hover:-translate-y-0.5 transition-all duration-300"
              >
                <Youtube size={16} strokeWidth={1.75} />
              </a>
            </div>
          </div>

          {/* Customer Service */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] mb-6 text-white">Client Services</h4>
            <ul className="space-y-3.5 text-[13px] text-neutral-400 font-medium">
              <li><a href="#" className="inline-block hover:text-[#e6d7c3] transition-colors duration-200">About Our Story</a></li>
              <li><a href="#" className="inline-block hover:text-[#e6d7c3] transition-colors duration-200">Delivery & Logistics</a></li>
              <li><a href="#" className="inline-block hover:text-[#e6d7c3] transition-colors duration-200">Privacy & Terms</a></li>
              <li><a href="#" className="inline-block hover:text-[#e6d7c3] transition-colors duration-200">Returns & Exchanges</a></li>
              <li><a href="#" className="inline-block hover:text-[#e6d7c3] transition-colors duration-200">Sustainable Practices</a></li>
            </ul>
          </div>

          {/* Quick Support */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3.5 text-[13px] text-neutral-400 font-medium">
              <li><a href="/login" className="inline-block hover:text-[#e6d7c3] transition-colors duration-200">Personal Boutique</a></li>
              <li><a href="/cart" className="inline-block hover:text-[#e6d7c3] transition-colors duration-200">Shopping Bag</a></li>
              <li><a href="#" className="inline-block hover:text-[#e6d7c3] transition-colors duration-200">Saved Items</a></li>
              <li><a href="#" className="inline-block hover:text-[#e6d7c3] transition-colors duration-200">Order Tracking</a></li>
              <li><a href="#" className="inline-block hover:text-[#e6d7c3] transition-colors duration-200">Concierge Help</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] mb-6 text-white">Keep In Touch</h4>
            <div className="space-y-4 text-[13px] text-neutral-300 font-medium">
              <div className="flex items-start gap-3.5 group">
                <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-[#d8c4a6] shrink-0 group-hover:border-[#d8c4a6]/50 transition-colors mt-0.5">
                  <MapPin size={15} strokeWidth={1.75} />
                </div>
                <span className="leading-relaxed">Colombo 7,<br />New road, Sri Lanka.</span>
              </div>
              <div className="flex items-center gap-3.5 group">
                <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-[#d8c4a6] shrink-0 group-hover:border-[#d8c4a6]/50 transition-colors">
                  <Phone size={15} strokeWidth={1.75} />
                </div>
                <a href="tel:011300400" className="hover:text-[#e6d7c3] transition-colors">011300400</a>
              </div>
              <div className="flex items-center gap-3.5 group">
                <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-[#d8c4a6] shrink-0 group-hover:border-[#d8c4a6]/50 transition-colors">
                  <Mail size={15} strokeWidth={1.75} />
                </div>
                <a href="mailto:richapparel@contact.com" className="hover:text-[#e6d7c3] transition-colors break-all">richapparel@contact.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-[#242424] pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] text-neutral-400 uppercase font-semibold tracking-[0.18em] text-center md:text-left">
            &copy; 2026 RICH APPAREL. All rights reserved. Devoloped by ITP Project Group 12.
          </p>

          {/* Premium Payment Icons */}
          <div className="flex items-center gap-3 opacity-40 hover:opacity-80 transition-opacity duration-500">
            <div className="h-5 w-9 bg-[#1f1f1f] border border-[#2e2e2e] rounded-[3px]"></div>
            <div className="h-5 w-9 bg-[#1f1f1f] border border-[#2e2e2e] rounded-[3px]"></div>
            <div className="h-5 w-9 bg-[#1f1f1f] border border-[#2e2e2e] rounded-[3px]"></div>
            <div className="h-5 w-9 bg-[#1f1f1f] border border-[#2e2e2e] rounded-[3px]"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};
