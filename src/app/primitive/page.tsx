import Link from "next/link";
import { TransferDialog } from "@/components/settlement/transfer-dialog";

export default function PrimitivePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link className="font-mono text-sm text-[#9aa997]" href="/">
          / home
        </Link>
        <section className="mt-12 rounded-lg border border-border bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#90a58c]">
            Component primitive
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight">
            Resolve dependencies, verify usage, settle AI work.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d8d0c0]">
            A composable dialog for AI billing transfers. It handles missing
            counterparties and settlement rails inside the modal, validates the
            intent, and records a local demo receipt.
          </p>
          <div className="mt-8">
            <TransferDialog />
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["Schema-first", "Zod contracts define counterparties, rails, evidence, benchmarks, and settlement intents."],
            ["Local demo DB", "Seed records plus localStorage-backed mutations keep the demo interactive without a backend."],
            ["Motion as state", "Panel direction communicates detours, returns, review, failure, and completion."],
          ].map(([title, body]) => (
            <div className="rounded-lg border border-border bg-card/75 p-4" key={title}>
              <h2 className="text-base font-medium">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
