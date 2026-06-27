import { Sidebar } from "@/components/layout";
import { HeroSearch } from "@/components/search";
import { FeatureCards, HeroGeometric } from "@/components/ui";

export default function Home() {
  return (
    <>
      <Sidebar />
      <HeroGeometric className="flex-1 flex flex-col h-full !min-h-0 bg-perplex-bg relative z-10">
        <main className="flex-1 w-full flex flex-col items-center px-4 pt-[15vh] pb-24 overflow-y-auto">
          <HeroSearch />
          <FeatureCards />
        </main>
      </HeroGeometric>
    </>
  );
}
