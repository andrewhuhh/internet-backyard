import Link from "next/link";

export default function BriefPage() {
  return (
    <main className="min-h-screen bg-[#0d0f0d] px-6 py-8 text-[#f2efe4] sm:px-10">
      <div className="mx-auto max-w-4xl">
        <Link className="font-mono text-sm text-[#9aa997]" href="/">
          / home
        </Link>
        <h1 className="mt-12 text-5xl font-semibold tracking-tight">
          Project brief
        </h1>
        <div className="mt-10 grid gap-5">
          {[
            "Internet Backyard is building the transaction layer for AI billing beyond token counting.",
            "The primitive should treat usage settlement as an auditable object: counterparty, rail, benchmark context, evidence, review, and final state.",
            "The prototype should compete on design quality, intentional motion, and resilient state handling.",
          ].map((item) => (
            <p
              className="rounded-lg border border-[#2d332d] bg-[#141814] p-5 text-lg leading-8 text-[#d8d0c0]"
              key={item}
            >
              {item}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
