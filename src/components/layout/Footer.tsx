import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    title: "Products",
    links: [
      { href: "/products", label: "All Boards" },
      { href: "/products?category=Decorative%20Boards", label: "Decorative" },
      { href: "/products?category=Structural", label: "Structural" },
      { href: "/products?category=Wall%20Systems", label: "Wall Systems" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { href: "/smart-space", label: "Smart Space" },
      { href: "/solutions", label: "Applications" },
      { href: "/customize", label: "Customize" },
      { href: "/projects", label: "Projects" },
    ],
  },
  {
    title: "Customize",
    links: [
      { href: "/customize", label: "Product Customizer" },
      { href: "/smart-space", label: "Room Planner" },
      { href: "/quote", label: "Request Quote" },
      { href: "/cart", label: "Your Setup" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/about", label: "Help Centre" },
      { href: "/quote", label: "Project Support" },
      { href: "#", label: "Shipping" },
      { href: "#", label: "Returns" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About OBASIX" },
      { href: "/projects", label: "Featured Work" },
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-[var(--obx-green-deep)] text-white">
      <div className="container-obx py-14 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="relative mb-5 h-12 w-[180px] rounded-[var(--radius-sm)] bg-white p-2">
              <Image
                src="/obasix-logo.png"
                alt="OBASIX"
                fill
                className="object-contain p-1"
                sizes="180px"
              />
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/75">
              OBASIX helps you discover, customize and buy the right board and
              material solutions for modern spaces.
            </p>
            <div className="mt-6 space-y-1 text-sm text-white/70">
              <p className="font-semibold text-white">Contact</p>
              <p>hello@obasix.com</p>
              <p>+91 1800 000 000</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--obx-orange)]">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/75 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} OBASIX. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="#" className="hover:text-white">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white">
              Terms
            </Link>
            <Link href="#" className="hover:text-white">
              Shipping
            </Link>
            <Link href="#" className="hover:text-white">
              Returns
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
