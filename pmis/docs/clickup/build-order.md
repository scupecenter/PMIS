# Build order: 8 phases mapped to the clone-spec items

> **PMIS overrides (2026-11-09, see `DECISIONS.md`; they win over the text below):**
> Fonts are Inter (Latin) + Cairo (Arabic) only, no Plus Jakarta Sans or IBM Plex Sans Arabic (DEC-01). Default preset is `neutral`, `pmis` is a switch (DEC-02).
> D1/D1b: drag pre-check uses `GET /sites/{id}`; a drop opens the existing task action, never a site move (DEC-04). D2: skip only after the gate checklist shows all gates met, one transition per milestone, stops at a milestone the user has no rights on (DEC-03, DEC-08).
> D3: saved views use flat filters + `filters._layout`; nested And/Or needs backend approval (DEC-05). D5b: server-side register sort is approved, before Phase 3 (DEC-06). No right-click menu (DEC-07). Frames live in `frames/*.jpg` next to this file.


Item numbers refer to `clone-spec.md`. Phases follow study §8 and run in order. Every phase ends with: Playwright in AR and EN, light and dark, both presets (`pmis`, `neutral`); before/after screenshots (replica-diff); `contrast.py` on the token pairs (0 AA failures); bundle size within the phase budget; all existing tests green. No phase changes business logic, permissions or the DB; anything that would (open decisions D1, D3, D5) is a separate approval.

## Dependencies

| Package | Phase | Why this one | Why not build it / why not another |
| --- | --- | --- | --- |
| `@tanstack/react-table` | 3 | Headless: sorting, grouping, column order/visibility/sizing, row selection and aggregation as state, no markup or CSS imposed, so it renders inside the existing `TableKit` grid and tokens. Same family as `@tanstack/react-query` already used. | Replacing 42 hand-written tables with a home-grown engine repeats grouping/selection bugs 42 times. Styled grids (AG Grid, MUI) bring their own look and licence tiers. |
| `@tanstack/react-virtual` | 3 | Variable-height and grouped virtualization (group headers 40 + rows 36, "Wrap text" rows, board columns with many cards), horizontal column virtualization for 20+ column registers. | The existing `useVirtual.ts` handles one fixed row height only; keep it where it already works and use react-virtual for the DataTable and Board. |
| `cmdk` | 2 | Small, accessible command menu (listbox semantics, arrow/Home/End, filtering, groups) that composes inside the existing Radix Dialog. | The current palette lacks arrow keys and grouping; writing a correct combobox+listbox by hand is the costlier path. |
| `@radix-ui/react-dropdown-menu` | 3 | Toolbar menus, column header menu, row "..." menu, view tab context menu, split buttons: roving focus, typeahead, submenus, RTL, `data-state` hooks for the motion tokens. Same family as the four Radix packages already installed. Add `@radix-ui/react-context-menu` (same family) for right-click on rows and tabs if approved. | Popover (current) has no menu semantics or keyboard model. |
| `@dnd-kit/core` | 7 (spike in 4) | Board drag with pointer + keyboard sensors, screen reader announcements, `onDragOver` per droppable (needed to check gates before drop), custom drop animation (180ms ease-out) and snap-back, works with virtualized columns. | HTML5 drag has no keyboard path and no drag-over control on touch; react-beautiful-dnd is deprecated. Only `@dnd-kit/core` is needed (no sortable: milestone columns have no manual order). |

Not added: Framer Motion / GSAP (CSS + Radix `data-state` covers the motion budget), a Gantt library (item 11 is read-only SVG/CSS), a hotkeys library (one `useShortcuts` hook), a date library beyond what exists.

## Phases

### Phase 1: Tokens and system
- Items: tokens for all; 1 App shell (preset/density attributes only), 18 Toasts (motion), 19 Empty/loading (geometry), focus ring and bell badge fix.
- Work: import `tokens.clone.css` after `tokens.css`; Tailwind theme names for the new tokens (`bg-selected`, `bg-rowHover`, `border-lineStrong`, `ring-focusRing`, `h-row`, `duration-menu`...); Inter + Plus Jakarta Sans + Arabic face self-hosted (woff2, `font-display:swap`); Radix `data-state` enter/exit classes; ECharts `animation:false` under reduced motion; `/design` route with every primitive in 4 combinations.
- Deps: none.
- Acceptance: `contrast.test.ts` extended to the clone pairs passes; preset switch changes no layout (pixel diff limited to colour); bell badge 5.2:1 in dark.

### Phase 2: Frame and navigation
- Items: 1 App shell (rail), 2 Sidebar, 3 Top bar + Ctrl+K, 4 Location header, 5 Views bar (tabs + picker, no new view types yet), 20 Keyboard shortcuts.
- Deps: `cmdk` (item 3).
- Depends on: Phase 1. Server search per register (D5) for the palette's register tab; Sites search already exists.
- Acceptance: F01 site by ID in <= 3 keys after typing; shortcut sheet complete; 400px width no horizontal scroll.

### Phase 3: Core components
- Items: 8 Table (DataTable), 6 Toolbar (Group, Columns, Filter chip, Closed, Search, Customize toggle), 7 List view (on the same DataTable with grouping), 16 Bulk bar, 18 Toasts + undo, header/row menus.
- Deps: `@tanstack/react-table`, `@tanstack/react-virtual`, `@radix-ui/react-dropdown-menu` (+ context-menu if approved).
- Depends on: Phase 1; server-side sort (D5).
- Acceptance: Sites and one Register run on one DataTable with no lost behaviour; bulk action list has no gate action (unit test over all registers); 10k rows smooth.

### Phase 4: Modules and data
- Items: 14 Filter builder, 15 Saved views scope (unified view object), 13 Customize panel, 6 Toolbar (Subtasks, Me, Assignee), 12 Site modal + activity panel, inline edit allow-list (8), migration of the remaining hand-written tables one PR at a time, Board read-only (9 without drag) + `@dnd-kit` spike behind a flag.
- Deps: none new (dnd-kit spike only behind a flag).
- Depends on: Phase 3; D3 (view payload), D5 (allow-list).
- Acceptance: nested filter round-trips; Save/Revert exact; no inline editor on gated fields (test over every ColDef with `gate:true`); no milestone transition can be reached except through the gate dialog.

### Phase 5: Dashboards and time views
- Items: 10 Calendar (read-only), 11 Gantt (read-only), dashboard cards show/hide/reorder with board-level filters (study §6), ECharts reduced motion.
- Deps: none.
- Depends on: Phase 4 (view object carries `calendar_settings` / `gantt_settings`).
- Acceptance: dates in Calendar and Gantt equal the table for the same filter; no write call from either view (network assertion); dashboard numbers identical before/after.

### Phase 6: Settings and admin
- Items: 17 Settings shell, 17a People, 17b Roles (diff view), 17c Notifications presets, 17d Security.
- Deps: none (react-router `useBlocker` is already available).
- Depends on: Phase 3 (DataTable for People and sessions).
- Acceptance: no edit lost on leaving any of the 17 sections; saved permission payload byte-identical to today's; presets produce the same flags as manual setting.

### Phase 7: Motion and micro-interactions
- Items: 9 Board drag with gate checks on drag-over (locked reason, snap-back + shake, skip checklist, pending until server confirms), Calendar drag-to-reschedule only if D5 allows the date field, motion audit of every item against `--dur-*`.
- Deps: `@dnd-kit/core` (production).
- Depends on: Phase 4 board; D1 (gate pre-check data), D2 (skip rule). Live ClickUp check of the unseen interactions (inline edit, bulk, toasts) if the owner logs in the sandbox.
- Acceptance: drag to a locked column never calls the transition endpoint; reject leaves counts unchanged; keyboard drag in AR/EN; reduced-motion run has zero transforms.

### Phase 8: Responsive and finish
- Items: all items at < 768px (cards instead of tables for My work and Approvals, bulk bar collapse, toolbar wrap, modal full-screen), a11y audit (axe, keyboard-only walk of F01-F07), performance (LCP, bundle budget), RTL screenshot pass of every item.
- Deps: none.
- Acceptance: 400px width without horizontal scroll on core pages; F01-F07 click counts at or below section 0.3; zero axe serious issues.

## Item-to-phase map
| Item | Phase | Item | Phase |
| --- | --- | --- | --- |
| 1 App shell | 1, 2 | 13 Customize | 4 |
| 2 Sidebar | 2 | 14 Filter builder | 4 |
| 3 Top bar + Ctrl+K | 2 | 15 Saved views scope | 4 |
| 4 Location header | 2 | 16 Bulk bar | 3 |
| 5 Views bar | 2 (types added 4-5) | 17 Settings shell | 6 |
| 6 Toolbar | 3, 4 | 17a-d People, Roles, Notifications, Security | 6 |
| 7 List | 3 | 18 Toasts + undo | 1, 3 |
| 8 Table | 3, 4 (inline edit) | 19 Empty/loading | 1 |
| 9 Board | 4 (read-only), 7 (drag) | 20 Keyboard shortcuts | 2 |
| 10 Calendar | 5 | 11 Gantt | 5 |
| 12 Site modal | 4 | | |
