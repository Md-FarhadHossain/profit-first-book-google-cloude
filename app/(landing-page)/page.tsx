import HeroSection from "./hero/page";
import HeaderSection from "./header/page"
import StickyOrderButton from "@/components/StickyOrderButton";

export default function Home() {
  return (
  <div>
    <main>
      {/* Order form */}
      {/* <HeroSection /> */}

      <HeaderSection />
      
      <StickyOrderButton />
    </main>
  </div>
  );
}
