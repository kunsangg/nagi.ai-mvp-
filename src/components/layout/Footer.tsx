import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#030303] pt-24 pb-12 px-8 md:px-16 border-t border-white/5 relative z-20 font-['Inter',sans-serif] overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#3bc9db]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        
        {/* Top CTA Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 pb-16 border-b border-white/5">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Accelerate your <br />
              <span className="text-[#3bc9db]">research workflow.</span>
            </h2>
            <p className="text-[#8b949e] text-lg">
              Join thousands of researchers using Nagi to synthesize literature and uncover gaps in seconds.
            </p>
          </div>
          <div className="mt-8 md:mt-0 flex gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3bc9db] to-[#004fb0] rounded-full blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
              <button className="relative px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
                Get Started <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-12 mb-20">
          
          {/* Logo & Social */}
          <div className="col-span-2 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl font-bold bg-gradient-to-b from-[#3bc9db] to-[#004fb0] text-transparent bg-clip-text">
                  海
                </span>
                <span className="text-white font-bold text-xl tracking-widest">
                  NAGI
                </span>
              </div>
              <p className="text-[#8b949e] text-sm leading-relaxed max-w-xs mb-8">
                The infinite canvas for academic synthesis. Powered by open-weight AI and AMD hardware.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[#64748b]">
              <a href="https://twitter.com" className="hover:text-white hover:bg-white/5 p-2 rounded-full transition-all" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
              </a>
              <a href="https://github.com/nagiai" className="hover:text-white hover:bg-white/5 p-2 rounded-full transition-all" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>
              </a>
              <a href="https://linkedin.com/in/kunsangdorjay" className="hover:text-white hover:bg-white/5 p-2 rounded-full transition-all" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
            </div>
          </div>

          {/* Column: Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-sm tracking-wider uppercase">Product</h3>
            <ul className="flex flex-col gap-4">
              <li><a href="/map" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Infinite Canvas</a></li>
              <li><a href="/writer" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Writer Agent</a></li>
              <li><a href="/review" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Literature Review</a></li>
              <li><a href="/pricing" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Pricing</a></li>
            </ul>
          </div>

          {/* Column: Resources */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-sm tracking-wider uppercase">Resources</h3>
            <ul className="flex flex-col gap-4">
              <li><a href="#" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Documentation</a></li>
              <li><a href="#" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">API Reference</a></li>
              <li><a href="#" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Blog</a></li>
              <li><a href="#" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Community</a></li>
            </ul>
          </div>

          {/* Column: Legal */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-sm tracking-wider uppercase">Company</h3>
            <ul className="flex flex-col gap-4">
              <li><a href="#" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">About</a></li>
              <li><a href="#" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Privacy</a></li>
              <li><a href="#" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Terms</a></li>
              <li><a href="#" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5">
          <p className="text-[#64748b] text-xs font-medium">
            © 2026 Nagi Research AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <span className="text-[#64748b] text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
