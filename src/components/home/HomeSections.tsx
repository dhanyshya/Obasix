"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Layers,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { getFeaturedProducts, projects } from "@/data/products";
import { rooms } from "@/data/rooms";
import { ProductCard } from "@/components/product/ProductCard";
import { useAIChat } from "@/context/AIChatContext";

const boardFinder = [
  {
    title: "By Application",
    description: "Kitchen, wardrobe, office or commercial — start with the space.",
    href: "/smart-space",
    image:
      "https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "By Finish",
    description: "Matte, gloss, wood and textured surfaces for every aesthetic.",
    href: "/products",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "By Material",
    description: "MDF, HDF, plywood and acrylic boards engineered for performance.",
    href: "/products",
    image:
      "https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=900&q=80",
  },
];

const whyItems = [
  {
    icon: Layers,
    title: "Precision Boards",
    text: "Calibrated surfaces and consistent cores built for clean fabrication.",
  },
  {
    icon: Wand2,
    title: "Configure Freely",
    text: "Colour, finish, thickness and size — preview before you commit.",
  },
  {
    icon: Sparkles,
    title: "AI-Guided Discovery",
    text: "Ask OBASIX AI to shortlist boards for your space and budget.",
  },
  {
    icon: ShieldCheck,
    title: "Project-Ready Support",
    text: "Move from browse to custom quote with your configuration attached.",
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-var(--header-h))] overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=80"
        alt="Modern interior with premium board finishes"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--obx-green-deep)]/90 via-[var(--obx-green-dark)]/70 to-black/35" />
      <div className="container-obx relative flex min-h-[calc(100vh-var(--header-h))] items-end pb-16 pt-24 md:items-center md:pb-20">
        <div className="max-w-2xl fade-up text-white">
          <div className="relative mb-6 h-12 w-[180px] rounded-[var(--radius-sm)] bg-white p-2 sm:h-14 sm:w-[210px]">
            <Image
              src="/obasix-logo.png"
              alt="OBASIX"
              fill
              className="object-contain p-1"
              sizes="210px"
              priority
            />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Better Boards.
            <br />
            Better Spaces.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Explore OBASIX boards, accessories and material solutions designed
            for modern spaces.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="btn btn-primary">
              Explore Products
            </Link>
            <Link
              href="/smart-space"
              className="btn border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white hover:text-[var(--obx-green)]"
            >
              Customize Your Space
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FindBoardSection() {
  return (
    <section className="section-pad">
      <div className="container-obx">
        <p className="section-label">Discover</p>
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="max-w-xl font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Find Your Perfect Board
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-[var(--obx-muted)]">
            Start with how you work — by space, finish or material — then refine
            with the customizer.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {boardFinder.map((item, index) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative overflow-hidden rounded-[var(--radius-lg)]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="relative aspect-[4/5]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--obx-green-deep)] via-[var(--obx-green-dark)]/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/80">{item.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--obx-orange)]">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedProductsSection() {
  const featured = getFeaturedProducts().slice(0, 3);
  return (
    <section className="section-pad bg-white">
      <div className="container-obx">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="section-label">Catalogue</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              Featured Products
            </h2>
          </div>
          <Link href="/products" className="btn btn-outline">
            View all products
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ShopByApplicationSection() {
  return (
    <section className="section-pad">
      <div className="container-obx">
        <p className="section-label">Applications</p>
        <h2 className="mb-10 font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
          Shop by Application
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/smart-space?space=${room.id}`}
              className="group relative overflow-hidden rounded-[var(--radius-lg)]"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={room.image}
                  alt={room.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/35 transition group-hover:bg-black/45" />
                <div className="absolute inset-0 flex items-end p-5">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
                      {room.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/80">{room.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CustomizeCTASection() {
  return (
    <section className="section-pad bg-[var(--obx-green)] text-white">
      <div className="container-obx grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--obx-orange)]">
            Product Customizer
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Customize Your Product
          </h2>
          <p className="mt-4 max-w-lg text-white/80">
            Select board type, colour, finish and dimensions. Watch a live
            preview update as you configure — then add to cart or request a
            custom quote.
          </p>
          <Link href="/customize" className="btn btn-primary mt-8">
            Open Customizer <ArrowRight size={16} />
          </Link>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-white/15">
          <Image
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80"
            alt="Board finish customization"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}

export function SmartSpaceSection() {
  return (
    <section className="section-pad bg-white">
      <div className="container-obx grid items-center gap-10 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)]">
          <Image
            src="https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=1200&q=80"
            alt="Smart space room visualization"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div>
          <p className="section-label">Smart Space</p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Room & Space Solutions
          </h2>
          <p className="mt-4 text-[var(--obx-muted)]">
            Choose a kitchen, bedroom, wardrobe or commercial space. Get
            recommended boards, colours, finishes and accessories — then preview
            and customize.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-[var(--obx-charcoal)]">
            <li className="flex items-center gap-2">
              <Boxes size={16} className="text-[var(--obx-orange)]" /> Select space → recommended products
            </li>
            <li className="flex items-center gap-2">
              <Wand2 size={16} className="text-[var(--obx-orange)]" /> Colour & finish preview
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight size={16} className="text-[var(--obx-orange)]" /> Customize → cart or quote
            </li>
          </ul>
          <Link href="/smart-space" className="btn btn-secondary mt-8">
            Plan Your Space
          </Link>
        </div>
      </div>
    </section>
  );
}

export function WhyObasixSection() {
  return (
    <section className="section-pad">
      <div className="container-obx">
        <p className="section-label">Why OBASIX</p>
        <h2 className="mb-10 max-w-2xl font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
          Built for discovery, customization and confident buying
        </h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {whyItems.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white p-6 transition hover:border-[var(--obx-green)] hover:shadow-[var(--shadow-sm)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-brand)] bg-[var(--obx-green-soft)] text-[var(--obx-green)]">
                <item.icon size={20} />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--obx-muted)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedProjectsSection() {
  return (
    <section className="section-pad bg-white">
      <div className="container-obx">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="section-label">Projects</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              Featured Projects
            </h2>
          </div>
          <Link href="/projects" className="btn btn-ghost">
            View projects
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {projects.map((project) => (
            <article
              key={project.id}
              className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--obx-line)]"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--obx-green)]">
                  {project.location}
                </p>
                <h3 className="mt-1 font-semibold">{project.title}</h3>
                <p className="mt-2 text-sm text-[var(--obx-muted)]">{project.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AIAssistantCTASection() {
  const { openChat, applySuggestion } = useAIChat();

  return (
    <section className="section-pad">
      <div className="container-obx overflow-hidden rounded-[var(--radius-lg)] bg-[var(--obx-green-deep)] px-6 py-12 text-white md:px-12 md:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--obx-orange)]">
              <Sparkles size={14} /> Ask OBASIX AI
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              Not sure which board fits your space?
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              Describe your room, finish preference or budget. OBASIX AI guides
              you toward product, finish, colour and thickness — then into the
              customizer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" onClick={openChat}>
                Ask OBASIX AI
              </button>
              <button
                type="button"
                className="btn border-white/30 bg-white/10 text-white hover:bg-white hover:text-[var(--obx-green)]"
                onClick={() =>
                  applySuggestion("I need a light wood finish board for my bedroom.")
                }
              >
                Try a sample question
              </button>
            </div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm font-semibold">Suggested questions</p>
            <ul className="mt-4 space-y-2">
              {[
                "Which board is suitable for my kitchen?",
                "Show me boards for wardrobes.",
                "I need a wood finish for my bedroom.",
              ].map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => applySuggestion(q)}
                    className="w-full rounded-[var(--radius-md)] border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm text-white/85 transition hover:bg-white/10"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
