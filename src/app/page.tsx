import { Sidebar, Footer } from "@/components/layout";
import { HeroSearch } from "@/components/search";
import { FeatureCards, HeroGeometric, DomainsSection } from "@/components/ui";

export default function Home() {
  return (
    <div className="w-full h-full flex overflow-hidden bg-[#06090f]">
      <Sidebar />

      {/* Full scrollable right area */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* Hero section — fills viewport, content centered */}
        <HeroGeometric className="w-full flex flex-col relative z-10" style={{ height: "100vh" }}>
          <main className="w-full flex flex-col items-center px-4 pb-8">
            <HeroSearch />
            <FeatureCards />
          </main>
        </HeroGeometric>

        {/* Domains section — below the fold, scrolls in naturally */}
        <DomainsSection />

        <Footer />
      </div>
    </div>
  );
}
