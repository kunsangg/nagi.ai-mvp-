"use client";

import { useRef, useEffect, useCallback } from "react";

const DOMAINS = [
  { id: "pharma",    label: "Pharmaceuticals",          img: "https://images.pexels.com/photos/12672390/pexels-photo-12672390.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "academia",  label: "Academia",                  img: "https://images.pexels.com/photos/35730384/pexels-photo-35730384.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "tech",      label: "Technology & Engineering",  img: "https://images.pexels.com/photos/5324968/pexels-photo-5324968.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "policy",    label: "Policy & Government",       img: "https://images.pexels.com/photos/4468974/pexels-photo-4468974.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "biotech",   label: "Biotechnology",             img: "https://images.pexels.com/photos/8539881/pexels-photo-8539881.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "health",    label: "Healthcare & Medicine",     img: "https://images.pexels.com/photos/7659891/pexels-photo-7659891.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "finance",   label: "Finance & Quant",           img: "https://images.pexels.com/photos/35118242/pexels-photo-35118242.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "defense",   label: "Defense & Aerospace",       img: "https://images.pexels.com/photos/15127547/pexels-photo-15127547.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "energy",    label: "Energy & Sustainability",   img: "https://images.pexels.com/photos/30037320/pexels-photo-30037320.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "materials", label: "Advanced Materials",        img: "https://images.pexels.com/photos/3861438/pexels-photo-3861438.jpeg?auto=compress&cs=tinysrgb&w=900" },
];

const DIM   = "rgba(255,255,255,0.11)";
const BRIGHT = "#ffffff";
const EASING = "0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

export default function DomainsSection() {
  /* DOM refs — no React state so updates are synchronous & zero-latency */
  const listRef       = useRef<HTMLUListElement>(null);
  const rightColRef   = useRef<HTMLDivElement>(null);
  const trackRef      = useRef<HTMLDivElement>(null);
  const spanRefs      = useRef<(HTMLSpanElement | null)[]>([]);
  const imgRefs       = useRef<(HTMLImageElement | null)[]>([]);
  const liRefs        = useRef<(HTMLLIElement | null)[]>([]);

  const currentIdx    = useRef(0);
  const isHovering    = useRef(false);
  const cycleRef      = useRef<NodeJS.Timeout | null>(null);

  /* Move the image track so the active slot's vertical center
     aligns with the hovered <li>'s center — exactly like the reference */
  const moveTrack = useCallback((liEl: HTMLLIElement) => {
    const track = trackRef.current;
    const right = rightColRef.current;
    if (!track || !right) return;
    const liRect    = liEl.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    const targetCY  = liEl.offsetTop + liEl.offsetHeight / 2;
    void targetCY;
    // Use viewport-relative math (same as reference)
    const relY = liRect.top + liRect.height / 2 - rightRect.top;
    track.style.transform = `translateY(calc(-50% + ${relY}px))`;
  }, []);

  /* Activate domain i — pure DOM, zero React re-renders */
  const activate = useCallback((i: number) => {
    currentIdx.current = i;
    spanRefs.current.forEach((el, idx) => {
      if (el) el.style.color = idx === i ? BRIGHT : DIM;
    });
    imgRefs.current.forEach((el, idx) => {
      if (el) el.style.opacity = idx === i ? "1" : "0";
    });
    const li = liRefs.current[i];
    if (li) moveTrack(li);
  }, [moveTrack]);

  /* Auto-cycle */
  const startCycle = useCallback(() => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => {
      if (!isHovering.current) {
        activate((currentIdx.current + 1) % DOMAINS.length);
      }
    }, 2400);
  }, [activate]);

  useEffect(() => {
    // Initial state — first item active after layout
    const t = setTimeout(() => { activate(0); }, 80);
    startCycle();

    const onResize = () => {
      const li = liRefs.current[currentIdx.current];
      if (li) moveTrack(li);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(t);
      if (cycleRef.current) clearInterval(cycleRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [activate, startCycle, moveTrack]);

  return (
    <section style={{ background: "#06090f" }} className="w-full">
      <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

      <div className="max-w-[1400px] mx-auto px-8 md:px-16 pt-20 pb-28">

        {/* ── HEADING ── */}
        <div className="mb-14">
          <p
            className="mb-3 font-[700] uppercase tracking-[0.22em]"
            style={{ fontSize: 10, color: "#3bc9db" }}
          >
            WHO IT&apos;S FOR
          </p>
          <h2
            className="font-[750] leading-none"
            style={{
              fontSize: "clamp(40px, 5.5vw, 80px)",
              letterSpacing: "-0.035em",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Explore Domains
          </h2>
          <p
            className="mt-4"
            style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", maxWidth: 460, lineHeight: 1.6 }}
          >
            Built for every field that runs on research.
          </p>
        </div>

        {/* ── BODY GRID ── */}
        <div className="flex gap-16 lg:gap-24 items-start">

          {/* ── LIST ── */}
          <ul
            ref={listRef}
            className="list-none m-0 p-0 flex flex-col flex-1"
            onMouseLeave={() => {
              isHovering.current = false;
              startCycle();
            }}
          >
            {DOMAINS.map((d, i) => (
              <li
                key={d.id}
                ref={(el) => { liRefs.current[i] = el; }}
                onMouseEnter={() => {
                  isHovering.current = true;
                  activate(i);
                }}
                className="relative border-b last:border-0"
                style={{ borderColor: "rgba(255,255,255,0.055)", cursor: "default" }}
              >
                <span
                  ref={(el) => { spanRefs.current[i] = el; }}
                  style={{
                    display: "block",
                    padding: "16px 0",
                    fontSize: "clamp(24px, 3.4vw, 50px)",
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.05,
                    color: i === 0 ? BRIGHT : DIM,
                    transition: `color ${EASING}`,
                    userSelect: "none",
                  }}
                >
                  {d.label}
                </span>
              </li>
            ))}
          </ul>

          {/* ── IMAGE COLUMN ── */}
          <div
            ref={rightColRef}
            className="hidden lg:block flex-shrink-0"
            style={{ width: 360, position: "relative", height: "100%" }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                height: "100vh",
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              {/* Stacked image track — moves vertically to match hovered row */}
              <div
                ref={trackRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transition: `transform ${EASING}`,
                }}
              >
                {DOMAINS.map((d, i) => (
                  <div
                    key={d.id}
                    style={{
                      width: "100%",
                      height: 300,
                      marginBottom: 20,
                      borderRadius: 10,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      ref={(el) => { imgRefs.current[i] = el; }}
                      src={d.img}
                      alt={d.label}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: i === 0 ? 1 : 0,
                        transition: "opacity 0.4s ease",
                        display: "block",
                      }}
                    />
                    {/* Bottom label */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "flex-end",
                        padding: "0 16px 14px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "#3bc9db",
                        }}
                      >
                        {d.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
    </section>
  );
}
