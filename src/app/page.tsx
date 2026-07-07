import { Sidebar } from "@/components/layout";
import { HeroSearch } from "@/components/search";
import { FeatureCards, HeroGeometric, DomainsSection } from "@/components/ui";

export default function Home() {
  return (
    <>
      <Sidebar />
      <HeroGeometric className="flex-1 flex flex-col h-full !min-h-0 bg-perplex-bg relative z-10">
        <main className="flex-1 w-full flex flex-col items-center px-4 pt-8 md:pt-12 pb-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="w-full flex flex-col items-center pb-0">
            <HeroSearch />
            <FeatureCards />
          </div>
          <DomainsSection />
        </main>
      </HeroGeometric>
    </>
  );
}
