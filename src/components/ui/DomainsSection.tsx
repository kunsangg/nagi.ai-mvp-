"use client";

import { useState, useEffect, useRef } from "react";

const DOMAINS = [
  {
    id: "pharma",
    label: "Pharmaceuticals",
    img: "https://images.pexels.com/photos/12672390/pexels-photo-12672390.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    id: "academia",
    label: "Academia",
    img: "https://images.pexels.com/photos/35730384/pexels-photo-35730384.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    id: "tech",
    label: "Technology & Engineering",
    img: "https://images.pexels.com/photos/5324968/pexels-photo-5324968.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    id: "policy",
    label: "Policy & Government",
    img: "https://images.pexels.com/photos/4468974/pexels-photo-4468974.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    id: "biotech",
    label: "Biotechnology",
    img: "https://images.pexels.com/photos/8539881/pexels-photo-8539881.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    id: "health",
    label: "Healthcare & Medicine",
    img: "https://images.pexels.com/photos/7659891/pexels-photo-7659891.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    id: "finance",
    label: "Finance & Quant",
    img: "https://images.pexels.com/photos/35118242/pexels-photo-35118242.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    id: "defense",
    label: "Defense & Aerospace",
    img: "https://images.pexels.com/photos/15127547/pexels-photo-15127547.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    id: "energy",
    label: "Energy & Sustainability",
    img: "https://images.pexels.com/photos/30037320/pexels-photo-30037320.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    id: "materials",
    label: "Advanced Materials",
    img: "https://images.pexels.com/photos/3861438/pexels-photo-3861438.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
];

export default function DomainsSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgOpacity, setImgOpacity] = useState(1);
  const [shownIdx, setShownIdx] = useState(0);
  const cycleRef = useRef<NodeJS.Timeout | null>(null);
  const isHovering = useRef(false);

  /* Cross-fade image swap */
  const goTo = (i: number) => {
    if (i === activeIdx) return;
    setImgOpacity(0);
    setTimeout(() => {
      setShownIdx(i);
      setActiveIdx(i);
      setImgOpacity(1);
    }, 200);
  };

  /* Auto-cycle */
  const startCycle = () => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => {
      if (!isHovering.current) {
        setActiveIdx(prev => {
          const next = (prev + 1) % DOMAINS.length;
          setImgOpacity(0);
          setTimeout(() => { setShownIdx(next); setImgOpacity(1); }, 200);
          return next;
        });
      }
    }, 2400);
  };

  useEffect(() => {
    startCycle();
    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      style={{ background: "#06090f" }}
      className="w-full"
    >
      {/* ─── top rule ─── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#1a2035] to-transparent" />

      <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-20 grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-12 lg:gap-20">

        {/* LEFT — label block */}
        <div className="flex flex-col justify-start pt-3">
          <p className="text-[10px] font-[700] uppercase tracking-[0.2em] text-[#3bc9db] mb-5">
            WHO IT'S FOR
          </p>
          <h2
            className="text-[20px] font-[600] leading-snug"
            style={{ color: "rgba(255,255,255,0.75)", maxWidth: 220 }}
          >
            Built for every field that runs on research.
          </h2>
        </div>

        {/* MIDDLE — giant scrollable list */}
        <ul className="list-none m-0 p-0 flex flex-col">
          {DOMAINS.map((d, i) => {
            const isActive = i === activeIdx;
            return (
              <li
                key={d.id}
                onMouseEnter={() => { isHovering.current = true; goTo(i); }}
                onMouseLeave={() => { isHovering.current = false; startCycle(); }}
                className="relative overflow-hidden border-b last:border-0"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <span
                  className="block py-4 select-none cursor-default font-[700] leading-none tracking-tight transition-all duration-300"
                  style={{
                    fontSize: "clamp(28px, 4vw, 52px)",
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.14)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {d.label}
                </span>
                {/* Active underline accent */}
                <span
                  className="absolute bottom-0 left-0 h-px transition-all duration-400"
                  style={{
                    width: isActive ? "100%" : "0%",
                    background: "linear-gradient(90deg,#3bc9db,transparent)",
                  }}
                />
              </li>
            );
          })}
        </ul>

        {/* RIGHT — sticky image */}
        <div className="hidden lg:block">
          <div
            className="sticky top-24"
            style={{ width: 360, height: 420, borderRadius: 12, overflow: "hidden" }}
          >
            <img
              src={DOMAINS[shownIdx].img}
              alt={DOMAINS[shownIdx].label}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: imgOpacity,
                transition: "opacity 0.2s ease",
                borderRadius: 12,
              }}
            />
            {/* Overlay label */}
            <div
              className="absolute bottom-0 left-0 right-0 p-5"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                borderRadius: "0 0 12px 12px",
                opacity: imgOpacity,
                transition: "opacity 0.2s ease",
              }}
            >
              <span
                className="text-[10px] font-[700] uppercase tracking-[0.18em]"
                style={{ color: "#3bc9db" }}
              >
                {DOMAINS[shownIdx].label}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ─── bottom rule ─── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#1a2035] to-transparent" />
    </section>
  );
}
