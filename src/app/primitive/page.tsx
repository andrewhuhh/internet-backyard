import Link from "next/link";

export default function PrimitivePage() {
  return (
    <main className="min-h-screen bg-[#0d0f0d] px-6 py-8 text-[#f2efe4] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="font-mono text-sm text-[#9aa997]" href="/">
          / home
        </Link>
        <section className="mt-12 rounded-lg border border-[#2d332d] bg-[#141814] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#90a58c]">
            Build target
          </p>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight">
            Send a transfer dialog primitive
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d8d0c0]">
            This page will host the composable dialog with mocked dependency
            states for counterparty and settlement rail resolution.
          </p>
        </section>
      </div>
    </main>
  );
}
