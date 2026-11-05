import { notFound } from "next/navigation";
import { SolutionExperience } from "@/components/solutions/SolutionExperience";
import { getSolution, getVisibleSolutions } from "@/data/solutions";

export function generateStaticParams() {
  return getVisibleSolutions().map((solution) => ({ slug: solution.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = getSolution(slug);
  return { title: solution ? `${solution.name} Solutions` : "Solutions" };
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = getSolution(slug);
  if (!solution || getVisibleSolutions().every((item) => item.id !== solution.id)) {
    notFound();
  }

  return (
    <SolutionExperience
      solution={{
        id: solution.id,
        name: solution.name,
        headline: solution.headline,
        summary: solution.summary,
        image: solution.image,
        focuses: solution.focuses.map((focus) => ({ id: focus.id, label: focus.label })),
      }}
    />
  );
}
