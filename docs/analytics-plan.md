# OfferLookup analytics plan

## Goal for this week

Build enough measurement to answer whether visitors understand the product, try the core workflow, and return to compare more than one offer.

## North-star metric

Saved offers per active visitor.

This matches the product promise: a visitor gets value only after saving offer data they can compare.

## Weekly scorecard

Review these every Friday:

| Metric | Why it matters |
| --- | --- |
| Visitors | Top-of-funnel reach |
| `offer_saved` visitors / visitors | Activation |
| Average saved offers per active visitor | Depth of use |
| `offers_sorted` visitors / `offer_saved` visitors | Comparison intent |
| `offer_removed` count | Cleanup, mistakes, or data quality friction |

## Event dictionary

All custom events are privacy-safe. Do not send company names, role titles, notes, salary, equity, bonus, or total compensation.

| Event | Trigger | Properties |
| --- | --- | --- |
| `cta_clicked` | Visitor clicks a primary navigation/action link | `cta` |
| `offer_saved` | Visitor successfully saves an offer | `has_equity`, `has_bonus`, `has_notes`, `saved_offer_count` |
| `offer_edited` | Visitor updates an existing saved offer | `has_equity`, `has_bonus`, `has_notes`, `saved_offer_count` |
| `offers_sorted` | Visitor changes the comparison sort | `sort_key`, `saved_offer_count` |
| `offers_exported` | Visitor exports saved offers to CSV | `sort_key`, `saved_offer_count` |
| `offer_removed` | Visitor removes a saved offer | `saved_offer_count` |

## This week's execution plan

1. Monday: ship baseline analytics instrumentation.
2. Tuesday: deploy and verify Vercel page views plus custom events.
3. Wednesday: add one friction reducer based on the first observed behavior, likely edit-offer or CSV export. Edit-offer shipped first because it directly reduces cleanup friction.
4. Thursday: add acquisition tracking to links from `jake-builds.github.io` to OfferLookup.
5. Friday: review the scorecard and choose next week's single product bet.

## Decision rules

- If visitors view but do not save offers, improve the landing message and sample data.
- If visitors save exactly one offer, add prompts that explain why comparing two or more offers is more useful.
- If visitors save offers but never sort or export, make the comparison insight more obvious.
- If removals are high, prioritize edit support over new features.
