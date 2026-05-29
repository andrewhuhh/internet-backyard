import Link from "next/link";

export default function Home() {
  const routes = [
    {
      href: "/brief",
      label: "Project Brief",
      detail: "Market context, product posture, and judging criteria.",
    },
    {
      href: "/explorations",
      label: "Design Explorations",
      detail: "A place to compare visual and interaction directions.",
    },
    {
      href: "/primitive",
      label: "Transfer Primitive",
      detail: "The eventual composable dialog prototype.",
    },
    {
      href: "/components",
      label: "Components",
      detail: "Inventory of the primitives and UI states used in the prototype.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0d0f0d] px-6 py-8 text-[#f2efe4] sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between">
        <header className="flex items-center justify-between border-b border-[#2d332d] pb-5">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#9aa997]">
            Internet Backyard
          </div>
          <div className="rounded-full border border-[#394238] px-3 py-1 font-mono text-xs text-[#b7c3b3]">
            Next.js prototype
          </div>
        </header>

        <section className="grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="mb-5 font-mono text-sm text-[#9aa997]">
              AI billing transaction layer
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl">
              Design explorations for settling AI work beyond token counting.
            </h1>
          </div>
          <p className="max-w-xl text-lg leading-8 text-[#c8c2b4]">
            This repo is the Codex prototype track for a composable transfer
            primitive: counterparty, settlement rail, usage evidence, validation,
            and motion-driven recovery flows inside one dialog.
          </p>
        </section>

        <nav className="grid gap-4 pb-6 md:grid-cols-4">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="group rounded-lg border border-[#2d332d] bg-[#141814] p-5 transition hover:-translate-y-0.5 hover:border-[#6c7b68] hover:bg-[#191f19]"
            >
              <div className="mb-8 font-mono text-xs text-[#90a58c]">
                {route.href}
              </div>
              <h2 className="mb-3 text-xl font-medium">{route.label}</h2>
              <p className="text-sm leading-6 text-[#aaa599]">{route.detail}</p>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
