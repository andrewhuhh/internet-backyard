import Link from "next/link";
import { ModernBillPaymentDialog } from "@/components/settlement/modern-bill-payment-dialog";
import { SendTransferDialog, TransferDemoControls } from "@/components/settlement/transfer-dialog";

export default function PrimitivePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="font-mono text-sm text-[#9aa997]" href="/">
          / home
        </Link>

        <section className="mt-12 grid min-h-[520px] place-items-center rounded-lg border border-border bg-card p-6">
          <div className="max-w-xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#90a58c]">
              Production UI demo
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">
              Send an AI usage transfer.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-7 text-muted-foreground">
              The dialog handles missing recipients and funding sources without
              leaving the transfer flow.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <SendTransferDialog />
              <ModernBillPaymentDialog />
            </div>
          </div>
        </section>

        <section className="mt-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Demo scaffolding
          </p>
          <TransferDemoControls />
        </section>
      </div>
    </main>
  );
}
