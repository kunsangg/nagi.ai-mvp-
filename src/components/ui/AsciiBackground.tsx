"use client";

import { useEffect, useState } from "react";

const PROMPTS = [
  "/imagine a mystical forest with bioluminescent mushrooms, cinematic lighting --ar 16:9",
  "/imagine futuristic city floating in the clouds, cyberpunk style, neon lights --v 6.0",
  "/imagine portrait of a cybernetic knight, highly detailed, unreal engine 5, 8k",
  "/imagine the end of the universe, abstract, dark colors, beautiful --style raw",
  "/imagine a cute robotic dog playing fetch, pixar style, colorful --ar 3:2",
  "/imagine architectural design of a modern museum, glass, nature integrated, photorealistic",
  "/imagine underwater civilization, bioluminescence, ancient ruins, deep sea --v 5.2",
  "/imagine a tiny dragon resting on a gold coin, macro photography, shallow depth of field",
  "/imagine abstract geometric shapes, minimalism, bauhaus style, primary colors",
  "/imagine a space station orbiting a ringed planet, hard sci-fi, detailed textures --ar 2:1",
  "/imagine a library filled with glowing books, magical atmosphere, intricate details",
  "/imagine a cyberpunk samurai in a neon-lit alleyway, rain, reflections --style raw",
  "/imagine a peaceful zen garden, morning mist, cherry blossoms, photorealistic --ar 16:9",
  "/imagine a gigantic mecha walking through a ruined city, dramatic lighting, epic scale",
  "/imagine a portrait of a sorceress, ethereal glow, intricate robes, fantasy art",
  "/imagine a macro shot of a snowflake, perfect symmetry, winter, crisp details",
  "/imagine a futuristic racing car on a track, motion blur, speed, high octane",
  "/imagine a hidden temple in the jungle, ancient mysteries, overgrown vines, sunlight filtering",
  "/imagine a surreal landscape, floating islands, upside down waterfalls, dreamlike",
  "/imagine a cozy cafe interior, raining outside, warm lighting, lofi aesthetic",
];

export function AsciiBackground() {
  const [lines, setLines] = useState<{ id: number; text: string; x: number; speed: number; opacity: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate a lot of lines to fill the screen
    const newLines = Array.from({ length: 60 }, (_, i) => {
      // Create a long string by repeating a prompt with some gibberish or variations
      let text = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      // add some random characters to make it look like raw data
      text += "   " + Array.from({ length: 20 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/?-=&_"[Math.floor(Math.random() * 66)]).join("");
      text += "   " + PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

      const speed = Math.random() * 20 + 30; // 30s to 50s for a full loop
      return {
        id: i,
        text,
        x: Math.random() * 100 - 10, // Start somewhere between -10% and 90%
        speed,
        delay: -(Math.random() * speed), // Negative delay so they start already on screen
        opacity: Math.random() * 0.15 + 0.05,
        size: Math.random() * 3 + 9, // 9px to 12px
      };
    });
    setLines(newLines);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ background: "transparent" }}>
      <style>{`
        @keyframes scrollUp {
          from { transform: translateY(110vh); }
          to { transform: translateY(-10vh); }
        }
      `}</style>
      
      {lines.map((line) => {
        return (
          <div
            key={line.id}
            className="absolute whitespace-nowrap"
            style={{
              left: `${line.x}%`,
              opacity: line.opacity,
              fontSize: `${line.size}px`,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              color: "#3bc9db", // Nagi brand color / cyan
              animation: `scrollUp ${line.speed}s linear infinite`,
              animationDelay: `${line.delay}s`,
            }}
          >
            {line.text}
          </div>
        );
      })}
      
      {/* Vignette effect to fade edges */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          background: 'radial-gradient(circle at center, transparent 0%, #06051d 80%, #06051d 100%)',
          opacity: 0.8
        }} 
      />
    </div>
  );
}
