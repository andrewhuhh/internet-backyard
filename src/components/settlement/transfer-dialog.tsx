"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Loader2,
  Plus,
  UserRound,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const panelTransition = { type: "spring", stiffness: 520, damping: 44, mass: 0.7 } as const;

export function SendTransferDialog() {
  const [open, setOpen] = useState(false);
  const state = useSettlementStore();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-lg px-4">
          <Banknote className="size-4" />
          Send transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-hidden border border-border bg-background p-0 sm:max-w-xl">
        <div className="px-5 pt-5 pb-3">
          <DialogHeader className="gap-1 pr-8">
            <DialogTitle>{titleForStep(state.step)}</DialogTitle>
            <DialogDescription>{descriptionForStep(state.step)}</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-5 pb-4 pt-1">
          <AnimatePresence mode="popLayout" custom={state.direction}>
            <motion.div
              key={state.step}
              custom={state.direction}
              initial={{ opacity: 0, x: 24 * state.direction, filter: "blur(2px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -18 * state.direction, filter: "blur(2px)" }}
              transition={panelTransition}
            >
              {state.step === "compose" && <ComposePanel />}
              {state.step === "counterparty" && <RecipientPanel />}
              {state.step === "rail" && <FundingSourcePanel />}
              {state.step === "review" && <ReviewPanel />}
              {state.step === "submitting" && <SubmittingPanel />}
              {state.step === "success" && <SuccessPanel close={() => setOpen(false)} />}
              {state.step === "failed" && <FailurePanel />}
            </motion.div>
          </AnimatePresence>
        </div>
        {(state.step === "compose" || state.step === "review") && (
          <>
            <Separator />
            <DialogFooterActions />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TransferDemoControls() {
  const state = useSettlementStore();
  const counterparties = selectAvailableCounterparties(state);
  const rails = selectAvailableRails(state);
  const { counterparty, rail } = selectResolvedDependencies(state);

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
      <div className="rounded-lg border border-border bg-card p-4">
        <Label className="text-xs text-muted-foreground">Demo scenario</Label>
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
      </div>
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
        <DemoStatus
          label="Recipient"
          value={counterparty?.displayName ?? `${counterparties.length} available`}
          ready={Boolean(counterparty)}
        />
        <DemoStatus label="Funding source" value={rail?.label ?? `${rails.length} available`} ready={Boolean(rail)} />
      </div>
    </div>
  );
}

function ComposePanel() {
  const state = useSettlementStore();
  const recipients = selectAvailableCounterparties(state);
  const fundingSources = selectAvailableRails(state);
  const { counterparty, rail } = selectResolvedDependencies(state);
  const selectedUsage = state.usageEvidence.find((item) => item.id === state.draft.usageEvidenceId);
  const compatibleQuotes = useMemo(
    () => state.benchmarkQuotes.filter((quote) => quote.basis === selectedUsage?.meteringBasis),
    [selectedUsage?.meteringBasis, state.benchmarkQuotes],
  );
  const validation = state.validateDraft();
  const missingRecipient = recipients.length === 0 || !counterparty;
  const missingFunding = fundingSources.length === 0 || !rail;

  return (
    <div className="space-y-3">
      {(missingRecipient || missingFunding) && (
        <Alert className="border-amber-300/35 bg-amber-300/10 py-2">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {missingRecipient && missingFunding
              ? "Add a recipient and funding source to continue."
              : missingRecipient
                ? "Add a recipient to continue."
                : "Add a funding source to continue."}
          </AlertDescription>
        </Alert>
      )}

      <Field label="Recipient">
        {recipients.length ? (
          <div className="grid gap-1.5">
            <Select value={state.draft.counterpartyId} onValueChange={(counterpartyId) => state.updateDraft({ counterpartyId })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {counterparty && <QuietMeta>{counterparty.status.replaceAll("_", " ")}</QuietMeta>}
          </div>
        ) : (
          <AddInline icon={<UserRound className="size-4" />} label="Add recipient" onClick={() => state.setStep("counterparty")} />
        )}
        {recipients.length > 0 && (
          <Button variant="ghost" size="sm" className="mt-1 h-6 px-0 text-muted-foreground" onClick={() => state.setStep("counterparty")}>
            <Plus className="size-4" />
            New recipient
          </Button>
        )}
      </Field>

      <Field label="Funding source">
        {fundingSources.length ? (
          <div className="grid gap-1.5">
            <Select value={state.draft.railId} onValueChange={(railId) => state.updateDraft({ railId })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select funding source" />
              </SelectTrigger>
              <SelectContent>
                {fundingSources.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rail && <QuietMeta>{cents(rail.availableCents)} available</QuietMeta>}
          </div>
        ) : (
          <AddInline icon={<Banknote className="size-4" />} label="Add funding source" onClick={() => state.setStep("rail")} />
        )}
        {fundingSources.length > 0 && (
          <Button variant="ghost" size="sm" className="mt-1 h-6 px-0 text-muted-foreground" onClick={() => state.setStep("rail")}>
            <Plus className="size-4" />
            New funding source
          </Button>
        )}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Usage evidence">
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
          {selectedUsage && <QuietMeta>{selectedUsage.confidence}% confidence</QuietMeta>}
        </Field>

        <Field label="Benchmark">
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
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_90px]">
        <Field label="Amount">
          <Input
            inputMode="decimal"
            value={(state.draft.amountCents / 100).toString()}
            onChange={(event) => state.updateDraft({ amountCents: Math.round(Number(event.target.value || 0) * 100) })}
          />
        </Field>
        <Field label="Currency">
          <Input value={state.draft.currency} onChange={(event) => state.updateDraft({ currency: event.target.value.toUpperCase() })} />
        </Field>
      </div>

      <Field label="Reference">
        <Textarea
          className="min-h-16 resize-none"
          value={state.draft.memo}
          onChange={(event) => state.updateDraft({ memo: event.target.value })}
        />
      </Field>

      {!validation.ok && <p className="text-sm text-destructive">{validation.message}</p>}
    </div>
  );
}

function RecipientPanel() {
  const state = useSettlementStore();
  const [displayName, setDisplayName] = useState("");
  const [type, setType] = useState<CounterpartyType>("model_provider");
  const [network, setNetwork] = useState("IBY onboarding desk");
  const [externalRef, setExternalRef] = useState("draft:recipient");

  return (
    <DetourShell>
      <Field label="Name">
        <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Recipient name" />
      </Field>
      <Field label="Type">
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
      </Field>
      <Field label="Network">
        <Input value={network} onChange={(event) => setNetwork(event.target.value)} />
      </Field>
      <Field label="Reference">
        <Input value={externalRef} onChange={(event) => setExternalRef(event.target.value)} />
      </Field>
      <Button className="w-full" disabled={displayName.length < 2} onClick={() => state.addCounterparty({ displayName, type, network, externalRef })}>
        Add recipient
      </Button>
    </DetourShell>
  );
}

function FundingSourcePanel() {
  const state = useSettlementStore();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<RailType>("operating_balance");
  const [currency, setCurrency] = useState("USD");
  const [available, setAvailable] = useState("50000");

  return (
    <DetourShell>
      <Field label="Name">
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Funding source name" />
      </Field>
      <Field label="Type">
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
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Currency">
          <Input value={currency} onChange={(event) => setCurrency(event.target.value)} />
        </Field>
        <Field label="Available">
          <Input value={available} onChange={(event) => setAvailable(event.target.value)} />
        </Field>
      </div>
      <Button
        className="w-full"
        disabled={label.length < 2}
        onClick={() => state.addRail({ label, type, currency, availableCents: Math.round(Number(available || 0) * 100) })}
      >
        Add funding source
      </Button>
    </DetourShell>
  );
}

function ReviewPanel() {
  const state = useSettlementStore();
  const { counterparty, rail } = selectResolvedDependencies(state);
  const usage = state.usageEvidence.find((item) => item.id === state.draft.usageEvidenceId);

  return (
    <div className="space-y-4">
      <ReviewRow label="Recipient" value={counterparty?.displayName ?? "Missing"} />
      <ReviewRow label="Funding source" value={rail?.label ?? "Missing"} />
      <ReviewRow label="Usage" value={usage?.workloadName ?? "Missing"} />
      <ReviewRow label="Amount" value={cents(state.draft.amountCents)} badge={state.draft.currency} />
      <ReviewRow label="Reference" value={state.draft.memo} />
    </div>
  );
}

function SubmittingPanel() {
  return (
    <StatePanel icon={<Loader2 className="size-9 animate-spin text-primary" />} title="Submitting transfer" />
  );
}

function SuccessPanel({ close }: { close: () => void }) {
  const receipt = useSettlementStore((state) => state.receipts[0]);
  return (
    <StatePanel
      icon={<CheckCircle2 className="size-10 text-primary" />}
      title="Transfer recorded"
      body={receipt?.auditRef}
      action={<Button onClick={close}>Done</Button>}
    />
  );
}

function FailurePanel() {
  const state = useSettlementStore();
  return (
    <StatePanel
      icon={<AlertCircle className="size-10 text-destructive" />}
      title="Transfer failed"
      body={state.lastError ?? "The transfer could not be submitted."}
      action={
        <Button variant="outline" onClick={state.resetFailure}>
          Back to edit
        </Button>
      }
    />
  );
}

function DetourShell({ children }: { children: React.ReactNode }) {
  const state = useSettlementStore();
  return (
    <div className="space-y-5">
      <Button variant="ghost" className="px-0 text-muted-foreground" onClick={() => state.setStep("compose", -1)}>
        <ArrowLeft className="size-4" />
        Back
      </Button>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function QuietMeta({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs text-muted-foreground">{children}</p>;
}

function AddInline({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300/45 bg-amber-300/10 text-sm text-amber-100 transition hover:bg-amber-300/15"
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function DialogFooterActions() {
  const state = useSettlementStore();
  const recipients = selectAvailableCounterparties(state);
  const fundingSources = selectAvailableRails(state);
  const { counterparty, rail } = selectResolvedDependencies(state);
  const missingRecipient = recipients.length === 0 || !counterparty;
  const missingFunding = fundingSources.length === 0 || !rail;

  if (state.step === "review") {
    return (
      <div className="flex items-center justify-end gap-2 px-5 py-3">
        <Button variant="outline" onClick={() => state.setStep("compose", -1)}>
          Back
        </Button>
        <Button onClick={() => void state.submit()}>Submit transfer</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2 px-5 py-3">
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button
        disabled={missingRecipient || missingFunding}
        onClick={() => {
          const result = state.validateDraft();
          if (result.ok) state.setStep("review");
        }}
      >
        Review transfer
      </Button>
    </div>
  );
}

function ReviewRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0">
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm leading-6">{value}</div>
      </div>
      {badge && <Badge variant="secondary">{badge}</Badge>}
    </div>
  );
}

function StatePanel({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center text-center">
      {icon}
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function DemoStatus({ label, value, ready }: { label: string; value: string; ready: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {ready ? <CheckCircle2 className="size-4 text-primary" /> : <AlertCircle className="size-4 text-amber-300" />}
        {label}
      </div>
      <p className="mt-1 truncate text-sm">{value}</p>
    </div>
  );
}

function titleForStep(step: ReturnType<typeof useSettlementStore.getState>["step"]) {
  switch (step) {
    case "counterparty":
      return "Add recipient";
    case "rail":
      return "Add funding source";
    case "review":
      return "Review transfer";
    case "submitting":
      return "Submitting";
    case "success":
      return "Complete";
    case "failed":
      return "Needs attention";
    default:
      return "Send transfer";
  }
}

function descriptionForStep(step: ReturnType<typeof useSettlementStore.getState>["step"]) {
  switch (step) {
    case "counterparty":
      return "Create the recipient and return to the transfer.";
    case "rail":
      return "Create the funding source and return to the transfer.";
    case "review":
      return "Confirm the details before submission.";
    case "submitting":
      return "Validating and recording the transfer.";
    case "success":
    case "failed":
      return "";
    default:
      return "Choose the recipient, funding source, usage, and amount.";
  }
}

export { SendTransferDialog as TransferDialog };
