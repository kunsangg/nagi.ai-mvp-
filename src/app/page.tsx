import { Sidebar, Footer } from "@/components/layout";
import { HeroSearch } from "@/components/search";
import { FeatureCards, HeroGeometric, DomainsSection } from "@/components/ui";

export default function Home() {
  return (
    <div className="w-full h-full flex overflow-hidden bg-[#06090f] relative">
      {/* Global Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <HeroGeometric className="w-full h-full" />
      </div>

      {/* Sidebar must sit above the background */}
      <div className="z-20 relative">
        <Sidebar />
      </div>

      {/* Full scrollable right area */}
      <div className="flex-1 overflow-y-auto relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* Hero section — fills viewport, content centered */}
        <div className="w-full flex flex-col relative z-10" style={{ minHeight: "100vh" }}>
          <main className="w-full h-full flex flex-col items-center justify-center px-4 pb-8 flex-1 mt-20">
            <HeroSearch />
            <FeatureCards />
          </main>
        </div>

        {/* Domains section — below the fold, scrolls in naturally */}
        <DomainsSection />

        <Footer />
      </div>
    </div>
  );
}
