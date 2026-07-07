import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#06090f] py-16 px-8 md:px-16 border-t border-white/5 relative z-20 font-['Inter',sans-serif]">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-8 mb-16">
          
          {/* Column 1: Social Icons */}
          <div className="md:col-span-2 flex items-start gap-4 text-white">
            <span className="text-white/50 cursor-default">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
            </span>
            <a href="https://www.linkedin.com/in/kunsangdorjay" className="hover:text-white/70 transition-colors" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a href="https://github.com/nagiai" className="hover:text-white/70 transition-colors" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
          </div>

          {/* Column 2: Navigation */}
          <div className="md:col-span-2">
            <h3 className="text-white font-bold mb-4 text-[14px] tracking-wide">Navigation</h3>
            <ul className="flex flex-col gap-2">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Home</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Features</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Researchers</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Case Studies</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Blog</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Careers</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Contact</a></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="md:col-span-2">
            <h3 className="text-white font-bold mb-4 text-[14px] tracking-wide">Legal</h3>
            <ul className="flex flex-col gap-2">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Cookies</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Privacy</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Terms</a></li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div className="md:col-span-2">
            <h3 className="text-white font-bold mb-4 text-[14px] tracking-wide">Resources</h3>
            <ul className="flex flex-col gap-2">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Documentation</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">API Reference</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Help Center</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">Community</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-[13px]">System Status</a></li>
            </ul>
          </div>

          {/* Column 5: Newsletter */}
          <div className="md:col-span-4 pl-0 lg:pl-10">
            <h3 className="text-white font-bold mb-4 text-[14px] tracking-wide">Subscribe to our Newsletter</h3>
            <div className="relative border-b border-white/20 pb-2 flex items-center group focus-within:border-white/50 transition-colors">
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="bg-transparent text-[13px] text-white placeholder-white/30 w-full outline-none"
              />
              <button className="text-white/50 hover:text-white transition-colors ml-2">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar without horizontal line, aligned to the columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4">
          
          {/* Empty spacer to align logo under Navigation */}
          <div className="hidden md:block md:col-span-2"></div>
          
          {/* Left: Logo */}
          <div className="md:col-span-2 flex items-center gap-1.5">
            <span className="text-xl font-bold bg-gradient-to-b from-[#004fb0] to-[#46c2eb] text-transparent bg-clip-text font-['Noto_Sans_JP']">
              凪
            </span>
            <span className="text-white font-bold text-[18px] tracking-wide">
              Nagi
            </span>
          </div>
          
          {/* Center: Copyright aligned under Legal */}
          <div className="md:col-span-8 flex items-center">
            <p className="text-[#666] text-[13px] tracking-wide">
              © 2026 Nagi Research AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
