import {
  AIAssistantCTASection,
  CustomizeCTASection,
  FeaturedProductsSection,
  FeaturedProjectsSection,
  FindBoardSection,
  HeroSection,
  ShopByApplicationSection,
  SmartSpaceSection,
  WhyObasixSection,
} from "@/components/home/HomeSections";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FindBoardSection />
      <FeaturedProductsSection />
      <ShopByApplicationSection />
      <CustomizeCTASection />
      <SmartSpaceSection />
      <WhyObasixSection />
      <FeaturedProjectsSection />
      <AIAssistantCTASection />
    </>
  );
}
