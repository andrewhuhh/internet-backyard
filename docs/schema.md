# Internet Backyard Settlement Schema

This prototype has no backend yet, but the component is designed around a database-ready domain model. The UI uses seeded records and local persistence while preserving the entity boundaries a production system would need.

## Entity Model

### `counterparties`

Represents the recipient side of an AI usage settlement.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable primary key, prefixed `cp_`. |
| `displayName` | string | Human-readable counterparty name. |
| `type` | enum | `model_provider`, `agent_vendor`, `workspace`, `compute_market`. |
| `riskTier` | enum | `low`, `medium`, `high`, used for review posture. |
| `status` | enum | `verified`, `pending_review`, `missing_evidence`, `blocked`. |
| `network` | string | Settlement or platform network context. |
| `externalRef` | string | External vendor, contract, or ledger reference. |

### `settlement_rails`

Represents a funding or settlement path.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable primary key, prefixed `rail_`. |
| `label` | string | Name shown to operators. |
| `type` | enum | `operating_balance`, `bank_account`, `wire`, `usage_credit`, `invoice_agreement`. |
| `currency` | string | ISO-style currency code. |
| `status` | enum | `ready`, `requires_microdeposit`, `requires_approval`, `suspended`. |
| `limitCents` | number | Per-transfer limit in minor units. |
| `availableCents` | number | Demo balance/availability. |
| `settlementWindow` | string | Expected clearing window. |

### `usage_evidence`

Represents the auditable AI work being settled.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable primary key, prefixed `usage_`. |
| `workloadName` | string | Operator-facing workload label. |
| `meteringBasis` | enum | `tokens`, `gpu_seconds`, `agent_task`, `benchmark_unit`, `hybrid`. |
| `periodStart` / `periodEnd` | datetime string | Usage period. |
| `quantity` | number | Amount of metered usage. |
| `unitLabel` | string | Display unit. |
| `evidenceHash` | string | Hash or digest of source evidence. |
| `confidence` | number | 0-100 confidence score. |

### `benchmark_quotes`

Represents pricing context for settlement review.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable primary key, prefixed `bench_`. |
| `label` | string | Benchmark or quote name. |
| `basis` | enum | Same basis family as usage evidence. |
| `unitPriceCents` | number | Benchmark price in minor units. |
| `source` | string | Quote, contract, or market source. |
| `asOf` | datetime string | Timestamp for price context. |
| `confidence` | number | 0-100 benchmark confidence. |

### `settlement_intents`

Represents the transfer object created by the dialog.

| Field | Type | Notes |
| --- | --- | --- |
| `counterpartyId` | string | Required dependency. |
| `railId` | string | Required dependency. |
| `usageEvidenceId` | string | Required audit evidence. |
| `benchmarkQuoteId` | string | Required price context. |
| `amountCents` | number | Settlement amount. |
| `currency` | string | Currency code. |
| `memo` | string | Operator memo. |
| `reviewMode` | enum | `standard`, `expedited`, `manual_review`. |

## State Rules

- A settlement can only submit when both dependencies exist and are usable.
- Missing counterparties and missing rails are resolved inside the dialog, then the user returns to the settlement form.
- Runtime validation uses Zod schemas in `src/lib/settlement/schema.ts`.
- Local mutations are stored with Zustand persistence in `localStorage` under `internet-backyard-settlement-demo`.
- Demo submissions may intentionally fail to exercise error recovery states.
