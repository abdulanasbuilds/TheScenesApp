# The Scenes — Decision Register

Use this file for durable architectural/product decisions.

## ADR-001 — Product identity

Status: Accepted

The product is **The Scenes**.

## ADR-002 — Platform scope

Status: Accepted

The Scenes is broader than AI. AI is a flagship category, not the full product boundary.

## ADR-003 — Competitor relationship

Status: Accepted

Skool, Circle, Kajabi, and similar products are reference points for proven patterns, not templates to copy one-to-one.

## ADR-004 — Public landing page

Status: Accepted

The Scenes has a dedicated marketing landing page separate from authenticated discovery/home.

## ADR-005 — Frontend first

Status: Accepted

Design and implement the frontend with deterministic fixtures before production authentication, database, security policy, payments, and integrations.

## ADR-006 — Provider adapters

Status: Accepted

External providers are isolated behind internal adapters.

## ADR-007 — Payments

Status: Deferred

Payment processor selection and implementation remain intentionally on hold.

## ADR-008 — Mobile first

Status: Accepted

Mobile is a primary design target.

## ADR-009 — Search

Status: Deferred

Start with database/full-text search. Add intelligent search only when justified.

## ADR-010 — PWA

Status: Accepted direction

Support installability and consented web push where browser/platform capability permits.

When a decision changes, add an entry instead of rewriting history silently.
