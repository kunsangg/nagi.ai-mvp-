"use client";

import { useState, useEffect, useRef } from "react";

const DOMAINS = [
  {
    id: "pharma",
    label: "Pharmaceuticals",
    img: "https://images.pexels.com/photos/12672390/pexels-photo-12672390.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "academia",
    label: "Academia",
    img: "https://images.pexels.com/photos/35730384/pexels-photo-35730384.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "tech",
    label: "Technology & Engineering",
    img: "https://images.pexels.com/photos/5324968/pexels-photo-5324968.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "policy",
    label: "Policy & Government",
    img: "https://images.pexels.com/photos/4468974/pexels-photo-4468974.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "biotech",
    label: "Biotechnology",
    img: "https://images.pexels.com/photos/8539881/pexels-photo-8539881.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "health",
    label: "Healthcare & Medicine",
    img: "https://images.pexels.com/photos/7659891/pexels-photo-7659891.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "finance",
    label: "Finance & Quant",
    img: "https://images.pexels.com/photos/35118242/pexels-photo-35118242.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "defense",
    label: "Defense & Aerospace",
    img: "https://images.pexels.com/photos/15127547/pexels-photo-15127547.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "energy",
    label: "Energy & Sustainability",
    img: "https://images.pexels.com/photos/30037320/pexels-photo-30037320.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "materials",
    label: "Advanced Materials",
    img: "https://images.pexels.com/photos/3861438/pexels-photo-3861438.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

export default function DomainsSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayedIdx, setDisplayedIdx] = useState(0);
  const [imgFading, setImgFading] = useState(false);
  const cycleRef = useRef<NodeJS.Timeout | null>(null);
  const hoveringRef = useRef(false);

  // Auto-cycle through domains when not hovering
  const startCycle = () => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => {
      if (!hoveringRef.current) {
        setActiveIdx(prev => (prev + 1) % DOMAINS.length);
      }
    }, 2200);
  };

  useEffect(() => {
    startCycle();
    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-fade image when activeIdx changes
  useEffect(() => {
    setImgFading(true);
    const t = setTimeout(() => {
      setDisplayedIdx(activeIdx);
      setImgFading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [activeIdx]);

  const handleMouseEnter = (i: number) => {
    hoveringRef.current = true;
    setActiveIdx(i);
  };

  const handleMouseLeave = () => {
    hoveringRef.current = false;
    startCycle();
  };

  return (
    <section className="w-full bg-[#0a0d14] border-t border-[#1a1a2e] py-20 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr_340px] gap-0 lg:gap-16 items-start">

        {/* Left — label */}
        <div className="mb-10 lg:mb-0 pt-1">
          <p className="text-[10px] font-[700] uppercase tracking-[0.18em] text-[#3bc9db] mb-4">
            WHO IT'S FOR
          </p>
          <h2 className="text-[22px] lg:text-[26px] font-[650] text-[#e2e8f0] leading-snug">
            Built for every field that runs on research.
          </h2>
        </div>

        {/* Middle — domain list */}
        <ul className="list-none p-0 m-0 flex flex-col">
          {DOMAINS.map((d, i) => {
            const isActive = i === activeIdx;
            return (
              <li
                key={d.id}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
                className="group relative cursor-default select-none border-b border-[#1a1a2e] last:border-0"
              >
                <span
                  className={`block py-3.5 text-[28px] lg:text-[36px] font-[700] tracking-tight leading-none transition-all duration-300 ${
                    isActive
                      ? "text-[#e2e8f0]"
                      : "text-[#2a3150] hover:text-[#4a5680]"
                  }`}
                >
                  {d.label}

                  {/* Mobile image shown inline below active item */}
                  {isActive && (
                    <img
                      src={d.img}
                      alt={d.label}
                      className="lg:hidden block mt-3 w-full max-w-[280px] rounded-lg object-cover h-36"
                    />
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Right — image */}
        <div className="hidden lg:block sticky top-24 rounded-xl overflow-hidden" style={{ height: 320 }}>
          <img
            key={displayedIdx}
            src={DOMAINS[displayedIdx].img}
            alt={DOMAINS[displayedIdx].label}
            className="w-full h-full object-cover rounded-xl"
            style={{
              opacity: imgFading ? 0 : 1,
              transition: "opacity 0.22s ease",
            }}
          />
          {/* Dark overlay + label */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14]/70 via-transparent to-transparent rounded-xl pointer-events-none" />
          <span
            className="absolute bottom-4 left-4 text-[11px] font-[600] uppercase tracking-[0.12em] text-[#3bc9db]"
            style={{ opacity: imgFading ? 0 : 1, transition: "opacity 0.22s ease" }}
          >
            {DOMAINS[displayedIdx].label}
          </span>
        </div>

      </div>
    </section>
  );
}
