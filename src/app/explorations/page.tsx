import Link from "next/link";

const explorations = [
  {
    name: "Market terminal",
    note: "Dense quote context, benchmark confidence, and variance posture.",
  },
  {
    name: "Developer console",
    note: "Evidence hashes, workload periods, IDs, and failure states stay visible.",
  },
  {
    name: "Finance operations desk",
    note: "Rail readiness, limits, balances, approval posture, and receipts.",
  },
];

export default function ExplorationsPage() {
  return (
    <main className="min-h-screen bg-[#0d0f0d] px-6 py-8 text-[#f2efe4] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link className="font-mono text-sm text-[#9aa997]" href="/">
          / home
        </Link>
        <h1 className="mt-12 max-w-3xl text-5xl font-semibold tracking-tight">
          Design explorations
        </h1>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {explorations.map((item) => (
            <section
              className="min-h-64 rounded-lg border border-[#2d332d] bg-[#141814] p-5"
              key={item.name}
            >
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#90a58c]">
                Direction
              </p>
              <h2 className="mt-6 text-2xl font-medium">{item.name}</h2>
              <p className="mt-4 text-sm leading-6 text-[#aaa599]">
                {item.note}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
