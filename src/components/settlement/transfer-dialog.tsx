"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Database,
  FileCheck2,
  Loader2,
  Plus,
  ReceiptText,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { scenarioPresets } from "@/lib/settlement/seed";
import {
  cents,
  selectAvailableCounterparties,
  selectAvailableRails,
  selectResolvedDependencies,
  useSettlementStore,
} from "@/lib/settlement/store";
import type { CounterpartyType, RailType } from "@/lib/settlement/schema";

const panelTransition = { type: "spring", stiffness: 520, damping: 42, mass: 0.7 } as const;

export function TransferDialog() {
  const [open, setOpen] = useState(false);
  const state = useSettlementStore();
  const counterparties = selectAvailableCounterparties(state);
  const rails = selectAvailableRails(state);
  const { counterparty, rail } = selectResolvedDependencies(state);
  const usage = state.usageEvidence.find((item) => item.id === state.draft.usageEvidenceId);
  const quote = state.benchmarkQuotes.find((item) => item.id === state.draft.benchmarkQuoteId);
  const validation = state.validateDraft();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-lg px-4">
          <Banknote className="size-4" />
          Open settlement dialog
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-hidden border border-border/80 bg-background p-0 sm:max-w-4xl">
        <div className="grid min-h-[680px] md:grid-cols-[260px_1fr]">
          <aside className="border-b border-border bg-card/70 p-5 md:border-r md:border-b-0">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <TerminalSquare className="size-4 text-primary" />
              IBY transfer
            </div>
            <div className="mt-8 space-y-4">
              <DependencyMeter
                label="Counterparty"
                ready={Boolean(counterparty)}
                detail={counterparty?.displayName ?? "Not resolved"}
              />
              <DependencyMeter label="Rail" ready={Boolean(rail)} detail={rail?.label ?? "Not resolved"} />
              <DependencyMeter
                label="Evidence"
                ready={Boolean(usage && quote)}
                detail={usage?.workloadName ?? "No usage evidence"}
              />
            </div>
            <Separator className="my-6" />
            <Label className="text-xs text-muted-foreground">Scenario</Label>
            <Select value={state.scenarioId} onValueChange={(value) => state.setScenario(value as typeof state.scenarioId)}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenarioPresets.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-6 rounded-lg border border-border bg-background/55 p-3 font-mono text-[11px] leading-5 text-muted-foreground">
              localStorage: internet-backyard-settlement-demo
            </div>
          </aside>

          <section className="relative overflow-hidden p-5">
            <DialogHeader className="pr-9">
              <DialogTitle className="text-xl">Settle AI usage</DialogTitle>
              <DialogDescription>
                Compose a settlement intent with counterparty, rail, usage evidence, and benchmark context.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 h-[560px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout" custom={state.direction}>
                <motion.div
                  key={state.step}
                  custom={state.direction}
                  initial={{ opacity: 0, x: 32 * state.direction, filter: "blur(3px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -24 * state.direction, filter: "blur(3px)" }}
                  transition={panelTransition}
                >
                  {state.step === "compose" && (
                    <ComposePanel
                      counterparties={counterparties}
                      rails={rails}
                      counterpartyReady={Boolean(counterparty)}
                      railReady={Boolean(rail)}
                      validationMessage={validation.ok ? null : validation.message}
                    />
                  )}
                  {state.step === "counterparty" && <CounterpartyPanel />}
                  {state.step === "rail" && <RailPanel />}
                  {state.step === "review" && <ReviewPanel />}
                  {state.step === "submitting" && <SubmittingPanel />}
                  {state.step === "success" && <SuccessPanel close={() => setOpen(false)} />}
                  {state.step === "failed" && <FailurePanel />}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DependencyMeter({ label, ready, detail }: { label: string; ready: boolean; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/55 p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        {ready ? <CheckCircle2 className="size-4 text-primary" /> : <AlertCircle className="size-4 text-amber-300" />}
      </div>
      <p className="mt-2 truncate text-sm">{detail}</p>
    </div>
  );
}

function ComposePanel({
  counterparties,
  rails,
  counterpartyReady,
  railReady,
  validationMessage,
}: {
  counterparties: ReturnType<typeof selectAvailableCounterparties>;
  rails: ReturnType<typeof selectAvailableRails>;
  counterpartyReady: boolean;
  railReady: boolean;
  validationMessage: string | null;
}) {
  const state = useSettlementStore();
  const selectedUsage = state.usageEvidence.find((item) => item.id === state.draft.usageEvidenceId);
  const compatibleQuotes = useMemo(
    () => state.benchmarkQuotes.filter((quote) => quote.basis === selectedUsage?.meteringBasis),
    [selectedUsage?.meteringBasis, state.benchmarkQuotes],
  );

  return (
    <div className="space-y-4">
      {(!counterpartyReady || !railReady) && (
        <Alert className="border-amber-300/35 bg-amber-300/10">
          <AlertCircle className="size-4" />
          <AlertTitle>Dependency resolution required</AlertTitle>
          <AlertDescription>
            Missing objects can be created inside this dialog. The settlement draft stays intact.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell title="Counterparty" icon={<BadgeCheck className="size-4" />}>
          {counterparties.length ? (
            <Select value={state.draft.counterpartyId} onValueChange={(counterpartyId) => state.updateDraft({ counterpartyId })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select counterparty" />
              </SelectTrigger>
              <SelectContent>
                {counterparties.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <EmptyDependency label="No counterparties available" onAdd={() => state.setStep("counterparty")} />
          )}
          {counterparties.length > 0 && (
            <Button variant="outline" className="mt-3 w-full" onClick={() => state.setStep("counterparty")}>
              <Plus className="size-4" />
              Add counterparty
            </Button>
          )}
        </FieldShell>

        <FieldShell title="Settlement rail" icon={<Banknote className="size-4" />}>
          {rails.length ? (
            <Select value={state.draft.railId} onValueChange={(railId) => state.updateDraft({ railId })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select rail" />
              </SelectTrigger>
              <SelectContent>
                {rails.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label} - {cents(item.availableCents)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <EmptyDependency label="No settlement rails available" onAdd={() => state.setStep("rail")} />
          )}
          {rails.length > 0 && (
            <Button variant="outline" className="mt-3 w-full" onClick={() => state.setStep("rail")}>
              <Plus className="size-4" />
              Add rail
            </Button>
          )}
        </FieldShell>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell title="Usage evidence" icon={<Database className="size-4" />}>
          <Select value={state.draft.usageEvidenceId} onValueChange={(usageEvidenceId) => state.updateDraft({ usageEvidenceId })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {state.usageEvidence.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.workloadName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedUsage && (
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              {selectedUsage.quantity.toLocaleString()} {selectedUsage.unitLabel} · {selectedUsage.confidence}% confidence
            </p>
          )}
        </FieldShell>
        <FieldShell title="Benchmark quote" icon={<FileCheck2 className="size-4" />}>
          <Select value={state.draft.benchmarkQuoteId} onValueChange={(benchmarkQuoteId) => state.updateDraft({ benchmarkQuoteId })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {compatibleQuotes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-3 font-mono text-xs text-muted-foreground">Matched to current usage basis.</p>
        </FieldShell>
      </div>

      <FieldShell title="Settlement terms" icon={<ReceiptText className="size-4" />}>
        <div className="grid gap-3 md:grid-cols-[1fr_150px]">
          <div>
            <Label>Amount</Label>
            <Input
              className="mt-2"
              inputMode="decimal"
              value={(state.draft.amountCents / 100).toString()}
              onChange={(event) => state.updateDraft({ amountCents: Math.round(Number(event.target.value || 0) * 100) })}
            />
          </div>
          <div>
            <Label>Review mode</Label>
            <Select value={state.draft.reviewMode} onValueChange={(reviewMode) => state.updateDraft({ reviewMode: reviewMode as typeof state.draft.reviewMode })}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="expedited">Expedited</SelectItem>
                <SelectItem value="manual_review">Manual review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Label>Memo</Label>
          <Textarea
            className="mt-2 min-h-20"
            value={state.draft.memo}
            onChange={(event) => state.updateDraft({ memo: event.target.value })}
          />
        </div>
      </FieldShell>

      {validationMessage && <p className="font-mono text-xs text-destructive">{validationMessage}</p>}
      <div className="flex justify-end">
        <Button
          disabled={!counterpartyReady || !railReady}
          onClick={() => {
            const result = state.validateDraft();
            if (result.ok) state.setStep("review");
          }}
        >
          Verify settlement
        </Button>
      </div>
    </div>
  );
}

function FieldShell({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="rounded-lg border border-border bg-card/80 py-0">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <span className="text-primary">{icon}</span>
          {title}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyDependency({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <button
      className="flex h-24 w-full flex-col items-center justify-center rounded-lg border border-dashed border-amber-300/40 bg-amber-300/10 text-sm text-amber-100"
      onClick={onAdd}
      type="button"
    >
      <Plus className="mb-2 size-4" />
      {label}
    </button>
  );
}

function CounterpartyPanel() {
  const state = useSettlementStore();
  const [displayName, setDisplayName] = useState("");
  const [type, setType] = useState<CounterpartyType>("model_provider");
  const [network, setNetwork] = useState("IBY onboarding desk");
  const [externalRef, setExternalRef] = useState("draft:counterparty");

  return (
    <DetourShell title="Add counterparty" description="Create a recipient-side object without leaving settlement composition.">
      <div className="grid gap-3">
        <Label>Name</Label>
        <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="e.g. Meridian Agents" />
        <Label>Type</Label>
        <Select value={type} onValueChange={(value) => setType(value as CounterpartyType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="model_provider">Model provider</SelectItem>
            <SelectItem value="agent_vendor">Agent vendor</SelectItem>
            <SelectItem value="workspace">Workspace</SelectItem>
            <SelectItem value="compute_market">Compute market</SelectItem>
          </SelectContent>
        </Select>
        <Label>Network</Label>
        <Input value={network} onChange={(event) => setNetwork(event.target.value)} />
        <Label>External reference</Label>
        <Input value={externalRef} onChange={(event) => setExternalRef(event.target.value)} />
      </div>
      <Button className="mt-5 w-full" disabled={displayName.length < 2} onClick={() => state.addCounterparty({ displayName, type, network, externalRef })}>
        Add and return to settlement
      </Button>
    </DetourShell>
  );
}

function RailPanel() {
  const state = useSettlementStore();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<RailType>("operating_balance");
  const [currency, setCurrency] = useState("USD");
  const [available, setAvailable] = useState("50000");

  return (
    <DetourShell title="Add settlement rail" description="Create a funding path for this usage settlement.">
      <div className="grid gap-3">
        <Label>Label</Label>
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Compute ops balance" />
        <Label>Rail type</Label>
        <Select value={type} onValueChange={(value) => setType(value as RailType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="operating_balance">Operating balance</SelectItem>
            <SelectItem value="bank_account">Bank account</SelectItem>
            <SelectItem value="wire">Wire</SelectItem>
            <SelectItem value="usage_credit">Usage credit</SelectItem>
            <SelectItem value="invoice_agreement">Invoice agreement</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Currency</Label>
            <Input className="mt-2" value={currency} onChange={(event) => setCurrency(event.target.value)} />
          </div>
          <div>
            <Label>Available</Label>
            <Input className="mt-2" value={available} onChange={(event) => setAvailable(event.target.value)} />
          </div>
        </div>
      </div>
      <Button
        className="mt-5 w-full"
        disabled={label.length < 2}
        onClick={() => state.addRail({ label, type, currency, availableCents: Math.round(Number(available || 0) * 100) })}
      >
        Add and return to settlement
      </Button>
    </DetourShell>
  );
}

function DetourShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const state = useSettlementStore();
  return (
    <div className="mx-auto max-w-xl">
      <Button variant="ghost" className="mb-4" onClick={() => state.setStep("compose", -1)}>
        <ArrowLeft className="size-4" />
        Back to draft
      </Button>
      <FieldShell title={title} icon={<Plus className="size-4" />}>
        <p className="mb-5 text-sm text-muted-foreground">{description}</p>
        {children}
      </FieldShell>
    </div>
  );
}

function ReviewPanel() {
  const state = useSettlementStore();
  const { counterparty, rail } = selectResolvedDependencies(state);
  const usage = state.usageEvidence.find((item) => item.id === state.draft.usageEvidenceId);
  const quote = state.benchmarkQuotes.find((item) => item.id === state.draft.benchmarkQuoteId);

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => state.setStep("compose", -1)}>
        <ArrowLeft className="size-4" />
        Back to edit
      </Button>
      <FieldShell title="Settlement verification" icon={<ShieldCheck className="size-4" />}>
        <div className="grid gap-3 text-sm">
          <ReviewRow label="Counterparty" value={counterparty?.displayName ?? "Missing"} badge={counterparty?.status} />
          <ReviewRow label="Rail" value={`${rail?.label ?? "Missing"} · ${rail ? cents(rail.availableCents) : ""}`} badge={rail?.status} />
          <ReviewRow label="Usage" value={usage?.workloadName ?? "Missing"} badge={`${usage?.confidence ?? 0}% confidence`} />
          <ReviewRow label="Benchmark" value={quote?.label ?? "Missing"} badge={`${quote?.confidence ?? 0}% quote`} />
          <ReviewRow label="Amount" value={cents(state.draft.amountCents)} badge={state.draft.reviewMode} />
        </div>
      </FieldShell>
      <Button className="w-full" onClick={() => void state.submit()}>
        Submit settlement intent
      </Button>
    </div>
  );
}

function ReviewRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/45 p-3">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
        <div className="mt-1">{value}</div>
      </div>
      {badge && <Badge variant="secondary">{badge.replaceAll("_", " ")}</Badge>}
    </div>
  );
}

function SubmittingPanel() {
  return (
    <div className="flex h-[420px] flex-col items-center justify-center text-center">
      <Loader2 className="mb-5 size-10 animate-spin text-primary" />
      <h3 className="text-2xl font-semibold">Writing settlement intent</h3>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
        Validating dependencies, benchmark context, rail limits, and audit memo.
      </p>
    </div>
  );
}

function SuccessPanel({ close }: { close: () => void }) {
  const receipt = useSettlementStore((state) => state.receipts[0]);
  return (
    <div className="flex h-[440px] flex-col items-center justify-center text-center">
      <CheckCircle2 className="mb-5 size-12 text-primary" />
      <h3 className="text-2xl font-semibold">Settlement recorded</h3>
      <p className="mt-3 font-mono text-sm text-muted-foreground">{receipt?.auditRef}</p>
      <Button className="mt-8" onClick={close}>
        Close dialog
      </Button>
    </div>
  );
}

function FailurePanel() {
  const state = useSettlementStore();
  return (
    <div className="flex h-[440px] flex-col items-center justify-center text-center">
      <AlertCircle className="mb-5 size-12 text-destructive" />
      <h3 className="text-2xl font-semibold">Settlement needs attention</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {state.lastError ?? "The settlement failed validation."}
      </p>
      <Button className="mt-8" variant="outline" onClick={state.resetFailure}>
        Return to draft
      </Button>
    </div>
  );
}
