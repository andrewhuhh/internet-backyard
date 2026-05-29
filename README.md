# Internet Backyard

Internet Backyard is a polished Next.js prototype for an AI usage settlement primitive. It explores what "send money" looks like when the recipient is an AI provider, agent vendor, workspace, or compute market participant, and the payment needs enough provenance to be auditable beyond a simple token-count invoice.

The current app runs at `/` and presents a compact billing surface with an account balance, funding-source selector, payment history, and a multi-step bill-payment dialog.

## What We Built

- A mobile-sized settlement surface for sending AI billing payments from seeded funding sources.
- A modern bill-payment dialog with amount entry, source and recipient selection, instant or scheduled timing, confirmation, private memo support, and submission feedback.
- Recipient management inside the payment flow, including add, edit, hide, show, and remove states.
- Runtime validation for settlement intents, counterparties, bank accounts, rails, usage evidence, benchmark quotes, and receipts with Zod.
- Local persisted demo state with Zustand so added recipients, hidden recipients, and receipts survive reloads.
- Seeded domain data for AI-native counterparties, settlement rails, usage evidence, and benchmark quotes.
- A payment ledger with grouped history and receipt detail views.
- Deliberate step transitions and UI feedback using Motion and Sonner.

## Product Shape

This is not a generic peer-to-peer payment widget. The prototype is aimed at the transactions layer for AI billing, where a settlement needs to connect:

- `counterparty`: the model provider, agent vendor, workspace, or compute-market participant receiving payment.
- `settlement rail`: the operating balance, wire account, usage-credit facility, invoice agreement, or bank path used to fund the transfer.
- `usage evidence`: the auditable record of AI work being settled.
- `benchmark quote`: pricing context for review and variance checks.
- `settlement intent`: the transfer object tying the dependencies together.

The implementation is frontend-only today, but the data boundaries are documented in [docs/schema.md](docs/schema.md) and mirror the entities a backend would likely persist.

## Current Flow

1. Choose a funding source from the account selector.
2. Open `Send money`.
3. Select a source, recipient, amount, and timing.
4. Add or manage recipients without leaving the dialog when dependencies are missing or stale.
5. Confirm the recipient, bank detail, timing, and optional private memo.
6. Submit the payment and record a local receipt.
7. Review payment history and receipt details from the home surface.

## Tech Stack

- Next.js `16.2.6` with the App Router
- React `19.2.4`
- TypeScript
- Tailwind CSS `4`
- shadcn/Radix UI components
- Zustand with localStorage persistence
- Zod runtime schemas
- Motion for transitions
- Sonner for toast feedback
- Lucide React icons

## Project Structure

```text
src/app/
  page.tsx                         Home route rendering the settlement surface
  layout.tsx                       App shell and metadata
  globals.css                      Global Tailwind and theme styles

src/components/settlement/
  home-billing-surface.tsx         Balance, account selector, payment trigger, ledger
  payment-ledger.tsx               Local payment history and receipt drill-in
  account-select.tsx               Funding-source selector
  modern-bill-payment-dialog/      Multi-step bill-payment flow

src/lib/settlement/
  schema.ts                        Zod schemas and TypeScript domain types
  seed.ts                          Demo counterparties, rails, usage evidence, quotes
  store.ts                         Zustand store, selectors, validation, submit simulation
  bank-account.ts                  Bank account formatting/options
  settlement-networks.ts           Settlement network labels/options

docs/
  schema.md                        Backend-ready domain model notes
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm run lint
npm run build
```

## Notes

- The app uses mocked data only. There is no backend dependency.
- Local demo state is stored under `internet-backyard-settlement-demo`.
- Demo submissions can enter failed or review states depending on validation and review mode.
- The design direction is intentionally closer to a finance operations console than a consumer payments app.
