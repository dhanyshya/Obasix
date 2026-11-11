import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Boards",
  description: "Compare OBASIX boards side by side: surface, frame, sizes, price and specifications.",
  robots: { index: false },
};

export default function CompareLayout({ children }: LayoutProps<"/compare">) {
  return children;
}
