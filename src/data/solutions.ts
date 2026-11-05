import { getProductById, products } from "@/data/catalogue";
import { images } from "@/data/images";
import type { Product } from "@/lib/types";

export type SolutionFocus = {
  id: string;
  label: string;
};

export type Solution = {
  id: string;
  name: string;
  headline: string;
  summary: string;
  image: string;
  focuses: SolutionFocus[];
};

const mentions = (product: Product, word: string) => {
  const text = `${product.name} ${product.shortDescription} ${product.description}`.toLowerCase();
  return text.includes(word);
};

export const solutions: Solution[] = [
  {
    id: "office",
    name: "Office",
    headline: "Boards designed for productive workspaces",
    summary:
      "Help your team plan, present and collaborate with OBASIX boards and accessories.",
    image: images.wallModernOffice,
    focuses: [
      { id: "all", label: "All" },
      { id: "meeting-rooms", label: "Meeting Rooms" },
      { id: "workspaces", label: "Workspaces" },
      { id: "collaboration", label: "Collaboration" },
    ],
  },
  {
    id: "meeting-room",
    name: "Meeting Room",
    headline: "Boards for rooms where decisions get made",
    summary: "Presentation surfaces, mobile stands and accessories matched to meeting rooms.",
    image: images.wallMeetingRoom,
    focuses: [{ id: "all", label: "All" }],
  },
  {
    id: "classroom",
    name: "Classroom",
    headline: "Writing walls for teaching spaces",
    summary: "Boards and pin-ups sized for classrooms, coaching and everyday instruction.",
    image: images.wallClassroom,
    focuses: [{ id: "all", label: "All" }],
  },
  {
    id: "training-room",
    name: "Training Room",
    headline: "Boards described for training use",
    summary: "Catalogue products whose OBASIX descriptions call out training rooms and sessions.",
    image: images.wallTrainingRoom,
    focuses: [{ id: "all", label: "All" }],
  },
  {
    id: "collaboration",
    name: "Collaboration Space",
    headline: "Shared surfaces for group work",
    summary: "Boards listed for both office and meeting-room use.",
    image: images.wallStartup,
    focuses: [{ id: "all", label: "All" }],
  },
  {
    id: "reception",
    name: "Reception",
    headline: "Notice and display for arrival spaces",
    summary: "Pin-up and notice boards tagged for reception in the OBASIX catalogue.",
    image: images.wallReception,
    focuses: [{ id: "all", label: "All" }],
  },
  {
    id: "retail",
    name: "Retail / Display",
    headline: "Display pieces for retail floors",
    summary: "Stands and boards tagged for retail in the existing catalogue.",
    image: images.retail,
    focuses: [{ id: "all", label: "All" }],
  },
  {
    id: "home",
    name: "Home",
    headline: "Compact boards for home study",
    summary: "Smaller boards and wooden frames tagged for home use.",
    image: images.wallHomeOffice,
    focuses: [{ id: "all", label: "All" }],
  },
  {
    id: "studio",
    name: "Studio",
    headline: "Easels and boards for studio work",
    summary: "Catalogue pieces tagged for studio spaces.",
    image: images.studio,
    focuses: [{ id: "all", label: "All" }],
  },
  {
    id: "commercial",
    name: "Commercial",
    headline: "Boards for commercial interiors",
    summary: "Larger boards and stands tagged for commercial spaces.",
    image: images.wallCommercial,
    focuses: [{ id: "all", label: "All" }],
  },
];

function belongsToSolution(solutionId: string, product: Product) {
  switch (solutionId) {
    case "office":
      return product.applications.includes("office");
    case "meeting-room":
      return product.applications.includes("meeting-room");
    case "classroom":
      return product.applications.includes("classroom");
    case "training-room":
      return mentions(product, "training");
    case "collaboration":
      return (
        product.applications.includes("office") &&
        product.applications.includes("meeting-room")
      );
    case "reception":
      return product.applications.includes("reception");
    case "retail":
      return product.applications.includes("retail");
    case "home":
      return product.applications.includes("home");
    case "studio":
      return product.applications.includes("studio");
    case "commercial":
      return product.applications.includes("commercial");
    default:
      return false;
  }
}

/** Product ids per solution, resolved from the live catalogue. */
export const solutionProducts: Record<string, string[]> = Object.fromEntries(
  solutions.map((solution) => [
    solution.id,
    products.filter((product) => belongsToSolution(solution.id, product)).map((product) => product.id),
  ]),
);

export function getSolution(id: string) {
  return solutions.find((solution) => solution.id === id);
}

export function getSolutionProducts(id: string): Product[] {
  return (solutionProducts[id] ?? [])
    .map((productId) => getProductById(productId))
    .filter((product): product is Product => Boolean(product));
}

export function getVisibleSolutions() {
  return solutions.filter((solution) => getSolutionProducts(solution.id).length > 0);
}


