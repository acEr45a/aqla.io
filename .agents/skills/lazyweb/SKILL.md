---
name: lazyweb
description: Use Lazyweb to find real product evidence, improve conversion, and turn research into clear product decisions.
version: 0.15.5
tags:
  - growth
  - product-research
  - mcp
---

# Lazyweb

Use Lazyweb to ground product decisions in real screens, flows, experiments, website scores, and growth recommendations. Choose the capability that best helps the user reach their goal; they do not need to know the feature name first.

## Token Handling

Lazyweb MCP tokens are account-bound bearer setup credentials, not proof of paid access. They do not authorize purchases, spend, private user data, or destructive actions. An agent may write one into ignored local MCP config such as `.agents/mcp_config.json` when asked to make setup work. Never commit it to public repos because anyone with it can use that account's MCP access.

## What You Can Do

| Goal | Skill / Command | MCP tool |
| --- | --- | --- |
| Score a website or compare progress | `/lazyweb-growth-score` | `lazyweb_growth_score` |
| Improve a product screen or webpage | `/lazyweb-growth-report` | `lazyweb_growth_report` |
| Review or save growth recommendations | `/lazyweb-growth-backlog` | `lazyweb_growth_backlog` |
| Find real product experiments | `/lazyweb-search-experiments` | `lazyweb_search_experiments` |
| Study complete product journeys | `/lazyweb-search-flows` | `lazyweb_search_flows` |
| Find real product screens and UI patterns | `/lazyweb-search-screens` | `lazyweb_search_screens` |

Use the live MCP tool list and schema as the source of truth. Broad improvement requests may use a Growth Report when that is the most helpful way to fulfill the user's goal.

## Agent Guidance & Workflow

- **DEFAULT for ANY design/redesign/optimize/improve/critique request**: call `lazyweb_generate_report` (one call, server-side, ~3-4 min) — pass a screenshot of the screen + product context + the goal, then poll `lazyweb_get_report` for the hosted report.
- **Reference Lookups**: Use `lazyweb_search` or `lazyweb_search_screens` / `lazyweb_search_flows` / `lazyweb_search_experiments` for specific UI patterns or teardowns.
- **Agentic Search**: Carry one explicit `agentic_search_id` across screen, experiment, flow, and refinement calls. Finalize selected stable `result_ref` values with `lazyweb_agentic_search_finalize`.
- **Completion**: Successful actions return `lazyweb.resource-link.v1`. Give the user the stable URL.
