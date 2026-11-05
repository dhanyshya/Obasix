import { notFound } from "next/navigation";
import { getWallModelById, wallModels } from "@/data/wallModels";
import { WallStudio } from "@/components/visualize/WallStudio";

export function generateStaticParams() {
  return wallModels.map((w) => ({ wallId: w.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wallId: string }>;
}) {
  const { wallId } = await params;
  const wall = getWallModelById(wallId);
  return {
    title: wall ? `${wall.name} — Visualize Your Wall` : "Visualize Your Wall",
    description: wall?.description,
  };
}

export default async function VisualizeWallPage({
  params,
}: {
  params: Promise<{ wallId: string }>;
}) {
  const { wallId } = await params;
  const wall = getWallModelById(wallId);
  if (!wall) notFound();
  return <WallStudio wall={wall} />;
}
