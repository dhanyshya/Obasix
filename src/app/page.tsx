import { DirectoryHero } from "@/components/home/directory/DirectoryHero";
import { Bestsellers, CodeBand, Maker, RangeDirectory, Wayfinding } from "@/components/home/directory/HomeSections";

export default function HomePage() {
  return (
    <>
      <DirectoryHero />
      <CodeBand />
      <RangeDirectory />
      <Bestsellers />
      <Maker />
      <Wayfinding />
    </>
  );
}
