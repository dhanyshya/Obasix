import {
  Collections,
  ExploreProducts,
  PremiumHero,
  TrendingProducts,
} from "@/components/home/premium";

export default function HomePage() {
  return (
    <div style={{ backgroundColor: "#FFFFFF" }}>
      <PremiumHero />
      <Collections />
      <ExploreProducts />
      <TrendingProducts />
    </div>
  );
}
