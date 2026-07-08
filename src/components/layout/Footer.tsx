import { ArrowRight, Github, Twitter, Linkedin } from "lucide-react";

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
                <Twitter size={18} />
              </a>
              <a href="https://github.com/nagiai" className="hover:text-white hover:bg-white/5 p-2 rounded-full transition-all" target="_blank" rel="noreferrer">
                <Github size={18} />
              </a>
              <a href="https://linkedin.com/in/kunsangdorjay" className="hover:text-white hover:bg-white/5 p-2 rounded-full transition-all" target="_blank" rel="noreferrer">
                <Linkedin size={18} />
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
