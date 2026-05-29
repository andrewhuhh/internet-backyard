# Goal

Build a polished Next.js prototype for Internet Backyard, a startup creating the transactions layer for AI billing beyond simple token counting.

## Core Product Idea

The main component is a composable "send a transfer" dialog primitive for settling AI usage. It must work whether the user already has the required dependencies or needs to resolve them inside the dialog:

- Counterparty: the AI provider, agent vendor, workspace, or compute market participant receiving settlement.
- Settlement rail: the balance, bank account, wire path, usage-credit facility, invoice agreement, or other funding path used to settle.

The dialog should guide users through missing dependencies without leaving the flow, then return them to the transfer.

## Domain Context

Internet Backyard is not building a generic fintech transfer widget. The prototype should feel native to AI billing, compute markets, and auditable usage settlement:

- AI monetization is moving from seats or tokens toward usage, agent credits, paid overages, compute consumption, and outcome-linked work.
- Compute markets are fragmented, thinly benchmarked, and increasingly important as financial infrastructure.
- Transaction records need provenance: usage evidence, benchmark context, counterparty identity, settlement rail, validation status, and final state.

## Prototype Requirements

- Use Next.js App Router with TypeScript.
- Use mocked data only; no backend required.
- Use a local state store when useful for flow state.
- Validate inputs at compile time and runtime, likely with Zod.
- Use deliberate motion for state transitions, not decorative animation.
- Handle every dependency combination: both exist, one exists, none exist, in progress, validation failure, and simulated submission failure.
- Include a few pages for design exploration before finalizing the primitive.

## Design Direction

The tone should be closer to a market terminal, developer console, and finance operations desk than a consumer payments app.

- Dense but readable.
- Dark graphite base with warm off-white text.
- Thin borders, compact metadata, status chips, evidence rows, and reference IDs.
- Avoid generic fintech gradients, large marketing sections, and casual peer-to-peer payment language.

## Competition

This repo is the Codex track in a design/development bakeoff against Cursor agent. The goal is to produce the better designed and better engineered prototype.

Evaluation priorities:

- Strong AI workflow and documented decision-making.
- High-quality visual design and meaningful motion.
- Clean, readable implementation.
- Robust state handling and validation.
- Clear local run instructions and deployable output.
