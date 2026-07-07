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

const DIM   = "rgba(255,255,255,0.22)";
const BRIGHT = "#ffffff";
const EASING_TRACK = "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)";
const EASING_COLOR = "color 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)";
const EASING_IMG   = "opacity 0.4s ease, visibility 0.4s ease, transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.1)";

export default function DomainsSection() {
  /* DOM refs — no React state so updates are synchronous & zero-latency */
  const listRef       = useRef<HTMLUListElement>(null);
  const rightColRef   = useRef<HTMLDivElement>(null);
  const trackRef      = useRef<HTMLDivElement>(null);
  const liRefs        = useRef<(HTMLLIElement | null)[]>([]);
  const imgRefs       = useRef<(HTMLImageElement | null)[]>([]);
  const isHovering    = useRef(false);
  const currentIdx    = useRef(0);

  /* Move the image track so its vertical center matches the hovered <li>'s center, but clamped within the container */
  const moveTrack = useCallback((liEl: HTMLLIElement) => {
    const track = trackRef.current;
    const right = rightColRef.current;
    if (!track || !right) return;
    const liRect    = liEl.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    
    // Calculate exactly how far down the right container the center of the text is
    const targetCenterY = liRect.top + (liRect.height / 2);
    let relativeY = targetCenterY - rightRect.top;
    
    // Clamp the movement so the image never overflows the glass box
    const trackHeight = track.getBoundingClientRect().height;
    const minY = trackHeight / 2;
    const maxY = rightRect.height - (trackHeight / 2);
    
    // Only clamp if the container is actually taller than the image
    if (rightRect.height > trackHeight) {
      if (relativeY < minY) relativeY = minY;
      if (relativeY > maxY) relativeY = maxY;
    }
    
    // Move the image track so its center (-50%) matches relativeY
    track.style.transform = `translateY(calc(-50% + ${relativeY}px))`;
  }, []);

  /* Activate domain i — pure DOM, zero React re-renders */
  const activate = useCallback((index: number) => {
    currentIdx.current = index;
    liRefs.current.forEach((el, idx) => {
      if (el) {
        if (isHovering.current) {
          el.style.color = idx === index ? BRIGHT : DIM;
        } else {
          el.style.color = idx === 0 ? BRIGHT : DIM; // Default state when not hovered
        }
      }
    });
    
    const activeImageIdx = isHovering.current ? index : 0;
    
    imgRefs.current.forEach((el, idx) => {
      if (el) {
        if (idx === activeImageIdx) {
          el.style.opacity = "1";
          el.style.visibility = "visible";
          el.style.transform = "scale(1) translateY(0)";
        } else {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          el.style.transform = "scale(0.95) translateY(20px)";
        }
      }
    });
    
    const li = liRefs.current[activeImageIdx];
    if (li) moveTrack(li);
  }, [moveTrack]);

  useEffect(() => {
    // Initial position
    const t = setTimeout(() => { activate(0); }, 100);

    const onResize = () => {
      const li = liRefs.current[currentIdx.current];
      if (li) moveTrack(li);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [activate, moveTrack]);

  return (
    <section className="w-full relative bg-transparent" style={{ padding: "80px 4vw 120px 4vw", overflow: "hidden" }}>
      {/* ── ENTIRE GLASS CARD ── */}
      <div className="w-full max-w-full relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[48px] p-10 lg:p-20 shadow-2xl">
        
        {/* ── TOP HEADING ── */}
        <div className="w-full mb-20 flex flex-col justify-start">
          <p
            className="mb-4 font-[600] uppercase tracking-[2px] text-[12px]"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            WHO IT&apos;S FOR
          </p>
          <h2
            className="font-[400]"
            style={{
              fontSize: "clamp(32px, 4vw, 56px)",
              lineHeight: 1.1,
              color: "#fff",
              maxWidth: 600,
              letterSpacing: "-1px"
            }}
          >
            Explore your domain interest.
          </h2>
        </div>

        {/* ── CONTENT (LIST + IMAGE) ── */}
        <div 
          className="flex justify-between items-stretch w-full m-0 p-0 relative"
        >
          
          {/* ── LEFT COLUMN (LIST) ── */}
          <div className="flex-grow mr-[4vw] lg:mr-[8vw]">
          <ul
            ref={listRef}
            className="list-none m-0 p-0 flex flex-col relative"
            onMouseLeave={() => {
              isHovering.current = false;
              activate(0);
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
                className="block w-full box-border font-[600] cursor-pointer"
                style={{
                  paddingLeft: 24,
                  marginBottom: 16,
                  fontSize: "clamp(40px, 5vw, 80px)",
                  lineHeight: 1.1,
                  letterSpacing: "-1.5px",
                  color: i === 0 ? BRIGHT : DIM,
                  transition: EASING_COLOR,
                  transformOrigin: "left center"
                }}
              >
                {d.label}
              </li>
            ))}
          </ul>
        </div>

        {/* ── RIGHT COLUMN (IMAGE TRACK) ── */}
        <div
          ref={rightColRef}
          className="hidden lg:block relative w-[400px] xl:w-[480px] flex-shrink-0 h-auto"
        >
          <div
            ref={trackRef}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: "100%",
              aspectRatio: "4/4.5",
              backgroundColor: "transparent",
              overflow: "hidden",
              borderRadius: 4,
              pointerEvents: "none",
              transition: EASING_TRACK,
              transform: "translateY(-50%)",
              zIndex: 10,
            }}
          >
            {DOMAINS.map((d, i) => (
              <img
                key={d.id}
                ref={(el) => { imgRefs.current[i] = el; }}
                src={d.img}
                alt={d.label}
                loading="lazy"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: i === 0 ? 1 : 0,
                  visibility: i === 0 ? "visible" : "hidden",
                  transition: EASING_IMG,
                  transform: i === 0 ? "scale(1) translateY(0)" : "scale(0.95) translateY(20px)",
                }}
              />
            ))}
          </div>
        </div>

      </div>
      </div>
    </section>
  );
}

