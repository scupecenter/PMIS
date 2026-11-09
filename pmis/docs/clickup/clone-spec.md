# PMIS Workspace: ClickUp-grade clone spec

> **PMIS overrides (2026-11-09, see `DECISIONS.md`; they win over the text below):**
> Fonts are Inter (Latin) + Cairo (Arabic) only, no Plus Jakarta Sans or IBM Plex Sans Arabic (DEC-01). Default preset is `neutral`, `pmis` is a switch (DEC-02).
> D1/D1b: drag pre-check uses `GET /sites/{id}`; a drop opens the existing task action, never a site move (DEC-04). D2: skip only after the gate checklist shows all gates met, one transition per milestone, stops at a milestone the user has no rights on (DEC-03, DEC-08).
> D3: saved views use flat filters + `filters._layout`; nested And/Or needs backend approval (DEC-05). D5b: server-side register sort is approved, before Phase 3 (DEC-06). No right-click menu (DEC-07). Frames live in `frames/*.jpg` next to this file.


Status: spec only. Nothing in `pmis/apps/web` was changed. Companion files: `tokens.clone.css` (two presets) and `build-order.md` (8 phases).

## 0. Basis, method and global rules

### 0.1 Sources and how they were used (replica-recon, replica-design)
| Source | Use | Confidence |
| --- | --- | --- |
| `pmis-clickup-study.html` §1-14 | gap map, design system, 8-phase roadmap, measured timings | high for §11-14 (measured), medium for §1-4 (docs) |
| `clickup-config.json` | real ClickUp read-backs: view object shape, filter groups, board WIP limits, swimlanes, calendar settings, status types, custom field types | high |
| `frames/*.jpg`, `pub/*.jpg` (owner's own sandbox, sample data) | layout and density. Frames are 1920x1020 at 125% zoom: CSS px = source px / 1.25 (about display px in the 1400-wide previews) | +/-2px, colours +/-5 per channel |
| `apps/web/src` (tokens.css, Shell, Sidebar, TableKit, SavedViews, CommandPalette, DrawerFrame, navItems, plus ViewTabs, PageHeader, Pipeline, States, Toast, useVirtual) | the component each item extends | read, not changed |

replica-recon needs a live, logged-in app for Steps 2-4 (screen walk, every state). That is unavailable here (the ClickUp sandbox needs the owner's login), so the recon inventory below is built from the recordings, the config read-back and the study. The replica-design Step 4 (build primitives) and every build/deploy step were skipped: this is a spec.

Clean-room rules applied: ClickUp's patterns, sizes, density and timing are reproduced; its code, icons, logo, illustrations, copy, brand gradient (`#FF02F0 > #FC6D2D > #6647F0 > #0091FF`) and purple accent are not. Icons are lucide (already a dependency). All labels are written fresh, in Arabic and English.

### 0.2 Screen inventory (recon)
| ID | Screen | Route | States to build |
| --- | --- | --- | --- |
| S01 | App shell (rail, sidebar, top bar) | all | full, icons-only, mobile drawer, offline |
| S02 | Sites: List view | `/sites?view=<id>` | loading, filled, grouped, empty group, no results, no permission, error |
| S03 | Sites: Table view | same, `type=table` | as S02 + editing cell, cell error, bulk selection |
| S04 | Sites: Board (milestones) | `type=board` | idle, dragging, locked column, skip checklist, pending, rejected, WIP over |
| S05 | Sites: Calendar | `type=calendar` | month, week, today, unscheduled rail, overdue rail, empty |
| S06 | Sites: Gantt (read-only) | `type=gantt` | week/month/quarter zoom, today line, baseline vs forecast |
| S07 | Site modal + activity panel | `?site=<id>` over any view | loading, full, locked field, gate panel, dirty, comment loading |
| S08 | Registers (procurement, POWERCO, HPC, permits, quality, issues, risks, change control...) | `/registers/<code>` | same as S02/S03; record drawer instead of site modal where the register has a workflow drawer |
| S09 | Global search / command palette | Ctrl+K | recent, typing, no results, per-tab |
| S10 | Settings shell + People / Roles / Notifications / Security | `/admin/settings/<section>` | clean, dirty (leave guard), saving, error, no permission |

### 0.3 Core flows (happy-path click counts are the numbers to beat)
- F01 Find a site by ID: Ctrl+K, type `TRP-0041`, Enter. 1 shortcut + typing + 1 key. Edge: two matches, archived site, no access.
- F02 Move a site to the next milestone from the Board: drag card, drop on next column, confirm reason (if the existing transition asks for one). 1 drag + 1 click. Edge: gate not met, skip ahead, server rejects, offline.
- F03 Field engineer opens "My sites today": rail Home, view tab. 2 clicks. Edge: nothing assigned (empty state with one-click exit).
- F04 Re-group the register: toolbar Group, pick Contractor. 2 clicks, then Save appears.
- F05 Save a changed view for everyone: Save split button, "Save for everyone". 2 clicks. Edge: protected view, no share right.
- F06 Bulk assign 20 sites to an owner: select with Shift+click, Assign, pick person, confirm. 4 clicks. Edge: some rows not permitted.
- F07 Admin enforces 2FA for a role: Settings, Security, 2FA policy, Save. 3 clicks + StepUp.

### 0.4 Global gate rules (apply to every item below; tests in each acceptance check)
1. Stage/milestone/status/gate fields are never inline-editable anywhere (List, Table, Board card, Calendar, Gantt, bulk, Customize). Their cells render read-only with a 12px lucide `Lock` on hover; click opens the site modal on the "Milestones & gates" section.
2. Board drag is checked against gates on drag-over, not on drop: a locked column shows its reason, a rejected drop snaps back, a skip opens the gate checklist. The column count changes only after the server confirms.
3. Bulk actions exclude gate transitions (no milestone/status move, approve, reject, close, cancel, reopen).
4. Every write goes through the existing API, permission check, StepUp and reason dialog. No change to business logic, permissions or the DB. Hidden/forbidden columns stay governed by `useTablePrefs` reconcile.
5. The client never decides a gate on its own. It shows what the server says (allowed next milestones + blockers per site, fetched at drag start); the server's answer on the transition call is final.

### 0.5 Out of scope (ClickUp features excluded, and why)
| ClickUp feature | Decision | Why |
| --- | --- | --- |
| Chat, Channels, "Add Channel", DMs, Posts, Replies | excluded | PMIS has Messages and record Comments already; chat does not serve sites, milestones, registers or admin. |
| Docs, Wikis, Doc view | excluded | Documents in PMIS are controlled site/record attachments with slots and templates (`DocSlots`, `SiteDocuments`), not free documents. |
| Whiteboards, Mind maps, Form view | excluded | No site/register/admin use; forms already exist as register entry drawers. |
| AI (Brain, AI filters, AI fields, agents, AI chats) | excluded | Adds a data-processing path and cost with no gate-safe use; the filter builder stays deterministic. |
| Generic automations (trigger > condition > action builder, "Automate" button, automation items in column menus) | excluded | It edits business workflow. PMIS keeps its fixed SLA and alert rules. |
| Free status editing (custom statuses per list, rename/reorder/remap statuses, status templates) | excluded | Milestones and phase gates are fixed and tied to the responsibility matrix; editing them changes business logic. The list "..." menu shows milestones read-only ("Managed by PMO"). |
| Custom field creation per list, field manager writes | excluded | Fields are register definitions owned by admins in existing screens. Columns can be shown, hidden, moved, never created. |
| Per-item sharing and custom role toggles | excluded | PMIS permissions are region x module x matrix; Roles page only improves the existing editor. |
| Time tracking, sprints, points, goals, Planner, Teams, Upgrade/Install/Invite rail items | excluded | Not part of site rollout control. |
| Dashboard card library with free grid | deferred | Study §6: show/hide/reorder only (phase 5), no free grid. |
| Gantt editing (drag bars, dependencies, critical path writes) | excluded for now | Read-only first; dates change only through existing planning screens. |

### 0.6 Cross-cutting rules
- Fonts: Inter (UI), Plus Jakarta Sans (titles: modal title, page title, empty-state title), Arabic face via the same stack (IBM Plex Sans Arabic proposed, Cairo as current fallback; see open decision D4). Numbers tabular. Site IDs in mono.
- RTL: every item is specified in logical properties (inline-start/end). Under `dir=rtl`: sidebar and rail on the right, activity panel and customize panel on the left, Board columns flow right-to-left, arrow keys follow visual direction, `--drag-tilt` mirrors, carets and chevrons flip (`rtl:-scale-x-100`, already the house pattern), Gantt time axis runs right-to-left. Chips keep Latin uppercase only for Latin text (`:lang(ar)` turns it off).
- Themes: `data-preset` x `data-theme` = 4 combinations, all AA (contrast report in `_work/contrast-report.txt`, 208 pairs, 0 failures).
- Motion: only opacity and transform. All durations come from `--dur-*`; `prefers-reduced-motion` zeroes them (including ECharts `animation:false`). Closing is instant except the drawer.
- Focus: 2px `--focusRing` outline, 2px offset, on every interactive element; never removed.
- Hit targets: 28px on desktop toolbars (ClickUp density), 44px under 768px (existing `min-h-11` pattern).
- Size notation: W x H in CSS px. "row" = `--row-h` (36 default, 32 compact, 40 comfy).

---

## 1. App shell
- Anatomy: [top bar, full width] over [rail | sidebar | main]. Main = location header, views bar, toolbar, view body, optional customize panel at inline-end. Toast region bottom inline-end; bulk bar bottom center.
- Sizes: top bar 40; rail 56; sidebar 256 (resizable 200-400, existing); main min 640; content canvas `--canvas` with no outer padding (rows run edge to edge with 16px inline padding inside). Under 768: rail and sidebar hidden, top bar 48, sidebar opens as the existing 288 drawer.
- States: full; icons-only (sidebar collapsed, rail stays); mobile drawer open; offline banner (32, `--waitBg`); session expiring (existing).
- Motion: sidebar collapse/expand width 0ms (ClickUp is instant), drawer slide `--dur-drawer` `--ease-out`; nothing else in the shell animates.
- PMIS adaptation: the rail holds the five NAV groups as "spaces": Home (`work`), Sites (`site_register`), Registers (`registers`), Admin (`admin`), Logs (`logs`), plus Templates under Registers (`data`). Selecting a rail item filters the sidebar to that group. No Planner/AI/Teams/Upgrade items. Preset switch is a workspace setting (admin), theme stays per user.
- Extends: `Shell.tsx` (layout, `compact` width 56 becomes the rail, mobile drawer, breadcrumb), `navItems.ts` (`NAV[].group` drives the rail).
- Acceptance: at 1440x900 the first table row starts at y = 40+44+36+40+32 = 192px +/-4; at 400px width no horizontal page scroll; rail order and labels match in AR and EN; Ctrl+\ toggles the sidebar and the choice persists.

## 2. Sidebar
- Anatomy: header row (space name 15/600 + "New" button 28 high), filter input, Favourites (pinned, reorderable), Recent (last 5), groups with collapsible headers, footer (help, collapse). Items: icon 16, label, optional count badge, pin star on hover.
- Sizes: item row 30, inline padding 8, icon-label gap 8, radius 6, font 14/400 (active 14/500), section label 12/500 `--mute` with 12 top margin, filter input 28, header 44, badge 20 min-width, pill radius full.
- States: default; hover `--hover`; active `--selected` + `--selectedInk`; focus ring; collapsed group (caret rotated); drag-reorder of favourites (existing up/down buttons stay as the keyboard path); filter with no match ("No menu matches").
- Motion: caret rotate 90deg `--dur-hover`; hover fill `--dur-hover`; favourite reorder 0ms.
- PMIS adaptation: Sites group shows the stream sub-menus (`SITE_STREAM_SUBMENUS`, O&M view, Dismantle) as indented children, as today. Counts only where the API already gives them (Inbox unread, open alerts). Bell/alerts badges use `--lateOn` on `--late` (fixes the Shell.tsx:182 contrast bug).
- Extends: `Sidebar.tsx` (`SidebarBody`, favourites, recents, filter, group toggles, `SIDEBAR_DEFAULT` -> 256).
- Acceptance: 30px rows measured in Playwright; active item contrast >= 4.5 in all 4 preset/theme combinations; keyboard: Tab reaches filter, arrows move between items, Enter opens; RTL screenshot mirrored.

## 3. Top bar + Ctrl+K
### 3a Top bar
- Anatomy: inline-start: menu (mobile) / collapse; center: search field; inline-end: Create (+), notifications bell, language (ع/EN), theme, avatar menu.
- Sizes: 40 high; search 320 x 28, radius 6, border `--line`, placeholder + `Ctrl K` kbd chip 18 high; icon buttons 28 x 28; avatar 28.
- States: hover; focus; bell with unread badge (min 16, `--late`/`--lateOn`); offline.
- Motion: account menu `--dur-menu` (measured ~130ms in ClickUp; we use 90).
### 3b Command palette (global search)
- Anatomy: input row (search icon, input, scope chip); source tabs (All, Sites, Registers, People, Commands); type chips (site, permit, POWERCO case, procurement item, user); result list with columns [icon | title + secondary line | region chip | milestone pill | recency]; row hover actions (Open, Open in new tab, Copy link); footer with key hints.
- Sizes: 680 wide (min(680, 92vw)), top 72, max height 70vh; input 48 high, 16px text; tabs 36; result row 36 (two-line 48 when secondary text exists); recency column 48, 12px `--mute` ("16m", "3d"); footer 32.
- States: empty input shows Recent (last 8 opened) + top commands; typing (debounce 150ms, spinner in input end); results; no results (with "Search all registers" action); per-tab empty; no permission rows never shown (server filters).
- Motion: scrim `--dur-modal`, panel appears at 0ms (ClickUp is instant); result list never animates.
- PMIS adaptation: site ID detection first: input matching `LBY-`/region code/digits ranks exact site ID, then name prefix, then registers. Commands: New site (if permitted), My approvals, My sites today, Go to <any NAV item>, Switch language, Switch theme. Enter opens the site modal over the current view.
- Extends: `CommandPalette.tsx` (Radix Dialog stays), rebuilt on `cmdk`.
- Acceptance: F01 in <= 3 key presses after typing; arrows/Home/End/Enter/Ctrl+Enter/Tab/Esc work; screen reader announces "N results"; `/` also opens it when shortcuts are on; recent list survives reload.

## 4. Location header / breadcrumb
- Anatomy: breadcrumb (space / list, the last crumb is a menu button with caret), favourite star, list "..." menu; inline-end: Export, Share link (copy URL with view id), Activity (opens location-level audit, read-only).
- Sizes: 44 high, inline padding 16; crumbs 14/400 `--mute`, last crumb 14/600 `--ink`; separator `/` 12; icon buttons 28.
- States: long names truncate in the middle crumb first; menu open; favourite on/off (existing pin); no export right (button hidden).
- Motion: menus `--dur-menu`.
- PMIS adaptation: "..." menu contains: Columns, Milestones (read-only list, "Managed by PMO"), Export, Copy link, Saved views. No Automate, Brain, Manage statuses, Templates, Archive.
- Extends: `PageHeader.tsx` (`PageHeader`, `MoreMenu`), breadcrumb in `Shell.tsx` (moved down into the location header on view pages; the top bar keeps no breadcrumb).
- Acceptance: breadcrumb `aria-label`, `aria-current="page"` on the last crumb; star toggles the same favourite as the sidebar; no ClickUp-only actions present.

## 5. Views bar
- Anatomy: view tabs (icon 16 + name), overflow "N more" menu, "+ View" button opening the view picker; tab dirty dot; protected lock; per-tab context menu.
- Sizes: bar 36; tab 28 high, inline padding 8, gap 4, 13/500; active underline 2px `--tabUnderline` flush with the bar's bottom rule; dirty dot 6; view picker popover 320 wide, 2-column grid of type tiles 144 x 56, then "Private" and "Pin" toggles and a name input.
- States: default, hover `--hover`, active, dirty (dot), protected (lock 12), default view (star), overflow, keyboard focus.
- Motion: switching views is instant (0ms; measured); underline moves at 0ms; picker `--dur-menu` with `--shift-menu`.
- PMIS adaptation: types offered: List, Table, Board, Calendar, Gantt. Board and Calendar only on Sites and registers that have milestones/dates. Context menu: Rename, Duplicate, Pin, Set as default for me, Protect (owner/PMO), Delete (owner). System views ("All sites", stream views) cannot be deleted.
- Extends: `ViewTabs.tsx` (tabs), `SavedViews.tsx` (list, save, share, transfer, deactivate).
- Acceptance: switching tabs makes no network request beyond the data query of the new view; tabs keyboard as `role=tablist` with arrow keys; RTL order mirrored.

## 6. Toolbar
One 40px row: inline-start [Group] [Subtasks] [Columns]; inline-end [Filter] [Closed] [Me] [Assignee] [Search] [Customize] [Add site split button].
- Shared chip: 28 high, inline padding 10, radius 6, 1px `--line`, 13/500, icon 14, gap 6. Active chip (non-default value): `--selected` fill, no border, `--selectedInk`, value in the label ("Group: Milestone"). Always-visible state badges: "1 Filter", "Sorted 2" (ClickUp "↑2"), so a field engineer always knows the view is partial.
- Menus: 32 rows, 8px padding, radius 8, `--elev-pop`, `--dur-menu` enter with `--shift-menu`, close 0ms.
- Primary split button: 28 high, `--primary`/`--primaryInk`, radius 6, caret part 24 wide (menu: Add site, Import, Add from template if those exist and are permitted).

| Control | Anatomy and states | PMIS adaptation |
| --- | --- | --- |
| Group | menu 224 wide: None, Milestone, Region, Contractor, Site type, Owner, Planned On-Air month; asc/desc; "Collapse all / Expand all" | default Milestone; grouping by gate fields is read-only (grouping is display) |
| Subtasks | menu: Collapsed (default), Expanded, Separate rows (ClickUp values 1/2/3) | "subtasks" = the site's milestone tasks (`TaskGrid` rows) |
| Columns | panel 320: search, shown list (drag handle + eye), hidden list, density radio | gated columns marked with lock; forbidden columns never listed (`reconcile`) |
| Filter | popover = Filter builder (item 14); badge "N Filter" | |
| Closed | toggle chip | shows On Air and cancelled/closed sites (`data-ms=done/closed` columns) |
| Me | avatar chip; popover 256: "This view only" / "All views", "Save for everyone" (if permitted) | "My sites": owner = me OR my region/contractor assignment, per the existing scope rules; empty state with one-click exit (item 23) |
| Assignee | people picker popover (existing `PeoplePicker`) | |
| Search | icon 28 that expands to a 200 input in place; Esc collapses | searches name + site ID on the server |
| Customize | toggles the customize panel (item 13) | |

- Extends: `PageHeader.tsx` `Toolbar`, `TableKit.tsx` `QuickFilter`, `ActiveChips`, `ColumnMenu`.
- Acceptance: every chip reachable by Tab; menu opens <100ms after click (Playwright trace); badges visible whenever filter/sort differ from the saved view; chip row wraps to a second line under 768 with no scroll.

## 7. List view
- Anatomy: one sticky column header row (PMIS keeps a single header instead of repeating it per group, study §13), then per group: group header [caret | milestone pill | count | hover "..." | hover "+"], rows, "+ Add site" row. Row: [select 36 | name cell: milestone icon 16 + site ID (mono 13) + name 14 + tags | field cells]. Row tools on hover at inline-end: Open, Copy link, "..." (row menu).
- Sizes: header 32; group header 40 (`--group-head-h`), pill 20 high, radius 5, inline padding 8, 11/600 uppercase (`--chip-case`), dot 8; count 13 `--mute`; row `--row-h` (36), horizontal rule 1px `--rowRule` only (no vertical lines); name column min 320; "+ Add site" row 32, `--mute`; 24 gap between groups.
- States: hover `--rowHover` with tools shown instantly; selected `--selected`; focused row (ring inset); group collapsed; empty group ("No sites at this milestone", 32 row, `--faint`, kept so the pipeline keeps its shape); locked cell hover (lock icon + tooltip "Changes through the gate"); loading (skeleton rows at row height); no results.
- Motion: row tools 0ms (measured 33ms); caret `--dur-hover`; group collapse 0ms; group rename inline 0ms.
- PMIS adaptation: pill uses the milestone tint (`[data-ms] --col-chip` + `--ink`) not a solid fill (AA). Group rename is not offered (milestones are fixed). Inline-editable chips in rows: Region, Site type, Contractor, Owner, Planned dates only if the register's ColDef marks them `edit:'inline'` and the user has edit right; milestone/status never.
- Extends: `TableKit.tsx` (`HeaderRow`, `SelectBox`, `Trunc`, `rowPad`, `useTablePrefs`), `useVirtual.ts`, `MiniRail` for the name-cell milestone icon.
- Acceptance: 36/32/40 row heights; 1,000 sites scroll at 60fps (virtualized, group headers included); group counts match the server totals; no inline editor ever mounts on a milestone/status cell (unit test over every ColDef with `gate:true`).

## 8. Table
- Anatomy: same data as List without group headers by default; sticky header row with sort arrow and header menu button; pinned first column (name/site ID); vertical and horizontal cell rules; footer calculation row; column resize handles.
- Sizes: header 32, cells 13/400, `--cell-px` padding, row `--row-h`; select column 36 (`SEL_W`); min column 80, default 160, name 280; resize handle 6 (existing); header menu 224; footer 32; inline editor overlays the cell exactly, 2px `--focusRing`.
- Header menu: Sort ascending, Sort descending, Sort entire column (clears other sorts), Group by this field, Move to start, Move to end, Hide. No automation, no "Edit field", no "Fill down" on gated columns.
- Cell editing (allow-listed columns only): click or Enter opens editor; Enter/Tab saves and moves; Esc cancels; validation error = `--late` ring + message tooltip, value kept; saving = 12px spinner at inline-end, optimistic value at `--gate-pending-opacity`; success clears; server rejection restores old value + toast with reason. Fields needing a reason or approval open the drawer/modal instead of editing in place.
- States: default, hover row, selected rows, focused cell (roving tabindex), editing, saving, error, read-only cell (no hover affordance), locked gate cell (lock icon), sorted column (arrow + `aria-sort`), loading skeleton, empty, no permission.
- Motion: none on sort/resize; editor appears at 0ms; error ring 0ms; skeleton shimmer `--dur-skeleton`.
- PMIS adaptation: sorting is sent to the server (cursor paging, study §6); footer shows Count always, Sum/Avg for numeric money/quantity columns only where the API returns aggregates.
- Extends: `TableKit.tsx` (`HeaderRow`, `ColumnMenu`, `useTablePrefs`, `BulkBar`, `Empty`, `NotApplicable`), built on `@tanstack/react-table` + `@tanstack/react-virtual`; replaces the 42 hand-written tables one PR at a time.
- Acceptance: Sites and one Register page run on the one DataTable with no lost behaviour (existing tests green); arrow-key grid navigation; forbidden columns never rendered; sort round-trip through the URL; 10k rows x 20 cols scroll without jank.

## 9. Board (milestones)
- Anatomy: horizontal track of milestone columns; optional swimlanes by Region (ClickUp `board_settings.swimlanes`); column = header [pill | count | WIP | collapse | "..."] + cards + empty hint; card = [site ID mono 12 `--mute` | name 14/500, 2-line clamp | chips: region, site type | gate readiness meter "3/4 docs" with 4px bar | planned On-Air date | owner avatar 20].
- Sizes: column 264 wide, gap 8, inner padding 8, radius 8, background `--col-tint` (6% of the milestone colour over `--card`), header 40; card 248 x min 72, padding 10/12, radius 8, 1px `--line`, no shadow at rest; card gap 6; readiness bar 4 high, radius 2; collapsed column 40 wide with vertical label.
- Idle states: card hover border `--lineStrong` + `--elev-card-hover` (`--dur-hover`); WIP over limit ("4/3", from `board_settings.status.limit`): count in `--lateInk` on `--lateBg`, warning only, never a block; empty column keeps full width with "No sites at this milestone"; Closed off hides On Air/closed columns.
- Drag (dnd-kit):
  - Pick up: instant (one frame). Ghost card tilts `--drag-tilt`, `--elev-drag`, cursor `grabbing`; the origin slot becomes a placeholder (`--placeholder-border`, `--placeholder-fill`, same height).
  - At drag start the board asks the existing API for this site's allowed next milestones and blockers (one call, cached for the drag). Until it answers, every other column shows "Checking..." and drop is disabled.
  - Drag-over a column, by gate result:
    - Next milestone, gate met: 2px inset `--gate-ok-ring`, `--gate-ok-fill`, placeholder appears at the drop index.
    - Locked: overlay `--gate-locked-fill`, lucide `Lock` 16 + the server's reason in one line at the top of the column ("Permit not approved", "POWERCO connection missing"), cursor `not-allowed`, no placeholder.
    - Skip (two or more milestones ahead): `--gate-skip-ring` dashed, label "Gate checklist required (N gates)".
    - Backward move: treated as locked unless the server lists it (rework/return is a server decision).
    - Same column: no reorder (milestone columns have no manual order); drop is a no-op.
  - Drop on allowed: card settles into the placeholder in `--dur-drop` `--ease-out`, shows pending (`--gate-pending-opacity` + 12px spinner); the existing transition dialog (reason, StepUp) opens if the transition needs it. Column counts change only after the server confirms.
  - Drop rejected (locked column, or server says no): card flies back to origin in `--dur-drop`, then shakes `--shake-x` x 3 in `--dur-shake`; toast with the reason; live region announces it.
  - Drop on skip: card snaps back (no move yet) and the Gate checklist dialog opens: one row per gate between current and target (state icon, gate name, blocking item, link to fix). "Move" is enabled only when the server reports all gates met, then runs the existing transition(s); otherwise "Close" only.
  - Esc cancels the drag (snap back, no shake).
- Keyboard and AT: dnd-kit KeyboardSensor: focus card, Space to lift, Left/Right to move between columns (visual order, so mirrored in RTL), Space to drop, Esc to cancel; announcements give column name and gate result ("Civil works. Locked: permit not approved.").
- Motion: pickup 0ms; drop `--dur-drop`; reject `--dur-drop` + `--dur-shake`; WIP count 0ms; all zero under reduced motion (tilt 0).
- PMIS adaptation: columns are PMIS milestones in order (`--ms-n` by order; On Air uses `--done`). Card adds the gate readiness meter (ClickUp cards lack it). Board is read-only for users without transition rights (drag handle hidden, cursor default).
- Extends: `Pipeline.tsx` (milestone order and states), existing site transition dialogs/StepUp; new `BoardView` on `@dnd-kit/core`.
- Acceptance: Playwright: drag to locked column shows the reason before drop and never calls the transition endpoint; reject snaps back and counts are unchanged; skip opens the checklist; allowed drop calls the existing endpoint once; counts update only after 2xx; keyboard drag works in AR and EN; reduced-motion run has no transform animation.

## 10. Calendar
- Anatomy: header (Today, prev/next, month label, Month/Week switch, "Show weekends"), grid, inline-end rail with tabs "Unscheduled" and "Overdue" (ClickUp `sidebarTaskType`), events = site chips placed on the chosen date field.
- Sizes: header 40; month cell min 112 high, date number 12/600 at top inline-start; today: 2px `--focusRing` outline + filled date badge 20; event chip 22 high, radius 5, 12/500, dot 6 in milestone colour on `--col-chip`; "+N more" 12 `--mute`; rail 310 wide, rows 44 (site ID + name + milestone pill); week view rows 32 per day block.
- States: today; past days faded (`fadePastEvents`, `--mute` text); weekend columns `--card2`; hover chip; selected chip; overflow; empty month ("No planned On-Air dates this month"); rail empty.
- Motion: month change 0ms; popover on chip `--dur-menu`.
- PMIS adaptation: date field = Planned On-Air by default (ClickUp `customFieldDates`), selectable among milestone planned dates; colour by Region or Milestone (ClickUp `colorTasksBy`). v1 is read-only: no drag-to-reschedule. Phase 7 may enable drag only for a date that is inline-editable, with a confirm listing linked tasks (study §12).
- Extends: new `CalendarView`; data from the existing sites query; chip opens the site modal.
- Acceptance: event dates match the table for the same filter; today marked in both themes; rail lists sites with no date / past due; keyboard: arrows move day focus, Enter opens the day's list; RTL week starts Saturday (locale setting) and mirrors.

## 11. Gantt (read-only)
- Anatomy: inline-start label pane (site ID + name, grouped by Region or Contractor) | timeline pane (scale header with two tiers, today line, rows with one bar per milestone, baseline thin bar under forecast bar, late segment).
- Sizes: label pane 280 (resizable 200-480); scale header 2 x 24; row 32; bar 16 high, radius 4, colour `--col-solid` at 85%; baseline bar 4 high `--lineStrong`; late overrun hatched `--late`; today line 2px `--late` with "Today" tag; zoom Week/Month/Quarter.
- States: hover bar tooltip (milestone, planned, forecast, actual, delay days); row hover `--rowHover`; selected site; no dates ("Not planned" in `--faint`); loading skeleton bars.
- Motion: bars grow from start in `--dur-bar` on first paint only (measured ~130ms); zoom change 0ms.
- PMIS adaptation: no drag, no dependency editing, no critical path writes. Click a bar opens the site modal on that milestone.
- Extends: new `GanttView` (plain SVG or CSS grid; no Gantt library, study §9), dates from existing milestone dates.
- Acceptance: bars line up with dates to the day at Month zoom; RTL axis right-to-left; no write endpoint is ever called from the view (network assertion).

## 12. Site modal + activity panel
- Anatomy: header [prev/next | breadcrumb | ... | copy link | open full page | toggle activity | close]; main pane: site ID + title, milestone stepper (current milestone, gates, delays), properties grid (label | value), collapsible sections: Fields, Milestones & gates, Documents (slots), Linked registers (permits, POWERCO, procurement, issues), Tasks (milestone tasks), Snags; activity pane at inline-end: tabs Comments | Activity, merged timeline, composer.
- Sizes: modal fixed with `--modal-inset` 24 on all sides, radius 12, `--elev-modal`; scrim `--scrim-modal`; header 44; main pane padding 24 32; title 24/700 display face; stepper 40; property rows 36, label column 160, 13/500 `--mute` with 16 icon; section header 36 with caret; activity pane 400 (320-560 resizable, collapsible to a 48 icon strip), composer min 96; comment item padding 12, avatar 24.
- States: loading (skeleton for title + 6 rows; activity "Loading comments" with spinner); full; field hover (editable shows pencil affordance; gated shows lock + "Change through gate" button that scrolls to Milestones & gates); dirty (DraftBar + leave guard); saving; error; no permission (read-only fields, no composer); activity collapsed.
- Motion: open: scrim fade + panel opacity 0>1 and scale `--scale-modal`>1 in `--dur-modal` `--ease-out` (measured 150-185ms); close 0ms (measured instant); prev/next swaps content at 0ms; activity collapse 0ms.
- PMIS adaptation: milestone/status are read-only in the grid; transitions only through the gate panel (existing transition dialog, reason, StepUp). Activity tab merges Comments and FieldHistory into one read-only timeline (comments editable by author per existing rules). User preference "Open sites as: Modal | Side drawer" keeps the current drawer.
- Extends: `DrawerFrame.tsx` (nav prev/next, `useReportDirty`, discard dialog, `DrawerTabs`), `Comments.tsx`, `SiteFields`, `SiteIdentity`, `SiteDocuments`, `TaskGrid`, `Pipeline`/`MiniRail`, `DraftBar`.
- Acceptance: `?site=` deep link opens the modal over the current view and Back closes it; focus trapped and returned to the row; Esc closes (asks if dirty); no inline editor on milestone/status; the merged timeline is ordered and paginated; AR/EN, light/dark screenshots.

## 13. Customize panel
- Anatomy: header ("Customize view" + close), view name input with type icon, display toggles, navigation rows (Fields "N shown", Filter "None"/"N", Group "Milestone", Subtasks "Collapsed", Sort "N"), view behaviour toggles (Autosave for me, Pin view, Private view, Protect view), footer (Save for everyone, Save as new view, Revert).
- Sizes: 288 wide, full height below the views bar, inline-end, border-inline-start 1px `--line`, padding 12 16; rows 32; toggle switch 28 x 16, knob 12; nav row value 12 `--mute` + chevron 14; section gaps 12 with 1px rule; footer 56.
- Display toggles: Show empty milestones, Wrap text, Show region chips, Show closed sites, Show gate readiness (board), Card size S/M/L (board), Swimlanes by region (board).
- States: toggles on/off/disabled (no right); drilled-in sub-page (back arrow header); protected view (toggles work, Save for everyone disabled with reason "Protected by PMO"); dirty.
- Motion: panel appears at 0ms (measured one frame); drill-in 0ms; switch knob `--dur-press`.
- PMIS adaptation: no "Fast load mode", "Show task locations", "Templates", "Automations". Protect view is for PMO reference views.
- Extends: `SavedViews.tsx` (save/update/share), `ColumnMenu` (Fields sub-page), `useTablePrefs` (density, widths).
- Acceptance: every toggle writes into the view's `settings` object (item 15) and marks the view dirty; Esc closes; panel does not cover the toolbar; RTL on the left.

## 14. Filter builder
- Anatomy: popover with rule rows [conjunction (Where / And / Or) | field | operator | value | remove], "+ Add filter", "+ Add group" (one nesting level in v1), "Clear all", live result count.
- Sizes: 560 wide (min(560, 94vw)); rows 36, gap 8; conjunction 64, field 168, operator 128, value flexible >= 180; group box padding 8, radius 8, `--card2`; footer 40.
- Operators by type: text (contains, is, is not, is set, is not set); select (any of, none of, is set, is not set); date (is, before, after, between, relative: this week/month, overdue); number (=, !=, <, <=, >, >=, between); person (any of, me, is set).
- States: empty ("No filters. Add one."); incomplete rule (value missing, row outlined `--wait`, not applied); applied; error from server (`--late` row + message); group mixed And/Or shown explicitly; disabled fields the user may not see are absent.
- Motion: popover `--dur-menu`; rows add/remove 0ms; result count updates after 300ms debounce.
- PMIS adaptation: stored exactly in ClickUp's proven shape: `filters.fields[{field, op, values}]`, `filter_groups` (nested index arrays), `filter_group_ops` (AND/OR left to right), keyed by stable `ColDef.id` (never by label). Gated fields are filterable (read-only use). New site prefill from the active filter only for non-gated fields. No AI filter.
- Extends: `TableKit.tsx` `QuickFilter` + `ActiveChips` (chips stay as the summary).
- Acceptance: (f0) OR ((f1 AND f2) AND f3) round-trips through save and reload; the server receives the same filter tree; badge count = number of complete rules; keyboard-only build of a 3-rule filter.

## 15. Saved views scope
- Anatomy: Save split button appears in the toolbar only when the view is dirty (ClickUp pattern), next to a "Revert" ghost button; menu: Save for me (personal copy), Save for everyone (if `can_edit` and shared), Save as new view, Revert changes, Autosave for me (toggle). Me-mode popover scope: This view only / All views.
- View object (one JSON, read and written whole, study §11): `{type, name, visibility: personal|shared|public, protected, pinned, default_for, filters{fields, op, search, show_closed}, filter_groups, filter_group_ops, grouping{field, dir, collapsed[]}, sorting{fields[{field, dir}]}, columns{fields[{field, hidden, idx, width}]}, settings{subtasks, wrap, density, me_scope, ...}, board_settings{swimlanes, wip{<milestone>: limit}}, calendar_settings{date_field, color_by, rail}, gantt_settings{zoom, group_by}}`.
- Sizes: split button 28 high; menu 240; dirty dot 6 on the tab.
- States: clean (no Save button), dirty, saving, saved (toast "View saved"), protected (Save for everyone disabled + reason, Save as new enabled), no right (Save for me only), conflict (someone saved in between: "Reload / Save as new").
- Motion: Save button appears at 0ms; toast as item 22.
- PMIS adaptation: visibility uses the existing share dialog (roles, groups) and transfer; "Protect view" only for owners/PMO; personal autosave stored per user.
- Extends: `SavedViews.tsx` (`onSort` finally wired; `legacyKey` migration kept), server saved-views API (payload shape is open decision D3).
- Acceptance: changing group/sort/filter shows Save within one frame; Revert restores the exact saved object; protected view cannot be overwritten by a non-owner (API 403 shown as a toast, never silent).

## 16. Bulk bar
- Anatomy: floating bar: [count "12 selected" | Select all N matching | clear x] [Assign owner] [Set contractor] [Add watchers] [Export] [Copy IDs] [More]. Selection via row checkbox, Shift+click range, Ctrl/Cmd+A within view.
- Sizes: 48 high, radius 10, max 760 wide, 16 from the bottom, centered in the content area; `--bulkBg`/`--bulkInk`; buttons 32 high, 13/500, icon 16; divider 1px at 20% ink.
- States: hidden (0 selected); visible; action running (progress via existing `BatchProgress`); partial permission ("Applies to 9 of 12" shown before confirm, list on expand); partial failure (toast with "3 failed, view list"); done (selection kept, toast).
- Motion: enter translateY(`--shift-toast`)>0 + fade in `--dur-toast`; exit 0ms.
- PMIS adaptation: never contains Move milestone, Change status, Approve, Reject, Close, Cancel, Reopen, Delete. The "More" menu shows a disabled entry "Milestone changes: open each site's gate" so users know why. Every action runs the existing per-record API with the same permission and reason rules.
- Extends: `TableKit.tsx` `BulkBar`, `AssignDialog.tsx`, `BatchProgress.tsx`, `ExportDialog.tsx`.
- Acceptance: unit test asserts the bulk action list contains no gate action for every register; Esc clears selection; selection count announced; mobile bar fits 360px (actions collapse into More).

## 17. Settings shell (grouped sidebar)
- Anatomy: settings nav at inline-start with search and groups; content column with page title, sections as cards, sticky footer save bar when dirty.
- Groups: Work & schedule (calendars, SLA view, delay periods), Documents (templates, slots), People & access (People, Roles, Groups, Delegation, Matrix), Notifications, Security (2FA, sessions, security log link), System (announcements, integrations status, logs links). Built from the existing 17 tabs; no new setting is invented.
- Sizes: nav 240, rows 30, group label 12/500 `--mute`, search 28; content max 880, padding 24 32; section card radius 8, padding 20, gap 16; save bar 56 with Save (primary) + Discard.
- States: clean; dirty (save bar visible, dot on nav item); leave guard (react-router `useBlocker` dialog: Save, Discard, Stay); saving; error inline per field; no permission (nav item hidden); search no match.
- Motion: save bar enter `--dur-toast` from bottom; page switch 0ms.
- PMIS adaptation: settings that need StepUp keep it; the 7 tabs without dirty tracking get it here.
- Extends: `/admin/settings` page, `DraftBar.tsx`, `useReportDirty` pattern from `DrawerFrame`.
- Acceptance: no edit lost on navigation in any of the 17 sections (Playwright per section); deep link `/admin/settings/<section>`; nav search finds settings by label in AR and EN.

### 17a People page
- Anatomy: header (count, Invite/Add if permitted), filter chips (role, region, status, 2FA), table: avatar+name, email, role, regions, groups, 2FA (shield icon on/off), last active, status; row menu (edit, reset password, deactivate) via existing dialogs.
- Sizes: DataTable defaults; avatar 24; 2FA column 64.
- States: invited, active, suspended, locked; no results; bulk (assign group, export only).
- Extends: `PeopleAdmin.tsx`, `UserDialogs.tsx`, `TwoFactor.tsx`, `TempPassword.tsx`.
- Acceptance: 2FA column matches the security policy page; every action still goes through StepUp where it does today.

### 17b Roles page
- Anatomy: inline-start list of roles (name, member count); detail: module x action grid (existing profiles), "Show differences vs <role>" toggle highlighting changed cells, read-only legend.
- Sizes: role list 240, grid cells 36 x 96, sticky module column 200.
- States: viewing, editing (dirty bar), compare mode, built-in role (locked).
- PMIS adaptation: UI only; the permission model (region x module x matrix) is unchanged; no ClickUp-style per-item sharing or custom toggles.
- Extends: existing roles and matrix pages.
- Acceptance: the saved permission payload is byte-identical to today's for the same edits.

### 17c Notifications page
- Anatomy: preset selector (Default, Focused, Mentions only, Custom), channel columns (In-app, Email; Browser/Mobile only if they exist), event rows grouped (Approvals, Site milestones, Registers, Mentions, System).
- Sizes: preset cards 200 x 72 radio; matrix rows 40, toggles 28 x 16.
- States: preset selected; Custom when any cell changes; dirty; saved.
- PMIS adaptation: presets only set the existing per-event flags; sending logic unchanged.
- Acceptance: choosing a preset then saving produces the same flags as setting them by hand.

### 17d Security page
- Anatomy: 2FA enforcement (four levels: off, recommended, required for admins, required for everyone now), session timeout, active sessions list, link to security log.
- Sizes: radio cards 100% x 64; sessions table DataTable.
- States: policy change requires StepUp and a reason (existing); preview "N people will be asked to enrol".
- Extends: `TwoFactor.tsx`, `StepUp.tsx`, security log page.
- Acceptance: policy saves only after StepUp; the preview count matches the People 2FA column.

## 18. Toasts + undo
- Anatomy: stack at bottom inline-end; toast = [status icon 16 | message 14 | optional action (Undo / View) | close].
- Sizes: 360 wide, min 44 high, padding 10 12, radius 8, `--elev-pop`, gap 8, max 3 visible; Undo button 28 high ghost on inverse.
- States: info, success (`--done` icon), warning, error (stays until closed), undo (countdown ring 16 around the icon, `--toast-undo-life` 8s), offline queue.
- Motion: enter translateY(`--shift-toast`) + fade `--dur-toast` `--ease-out`; exit fade `--dur-toast-exit`; hover pauses timer.
- PMIS adaptation: Undo only where the API supports reversing (column/view changes, bulk assign, watcher add, comment delete within the window). Never for approvals, transitions, StepUp actions. Errors from gates show the server reason verbatim.
- Extends: `Toast.tsx` (`useToast`).
- Acceptance: `role=status` (polite) for info/success, `role=alert` for errors; Undo restores the server state and is announced; reduced motion = no transform.

## 19. Empty and loading states
- Anatomy: empty = lucide icon 40 in a 64 rounded square `--card2`, title 16/600 display face, hint 14 `--mute`, up to two actions (primary + ghost); loading = skeleton rows at exact row/card/bar size; inline spinners 12/16.
- Sizes: centered block max 360 wide, 24 gap from icon to title; skeleton bar heights 12 (text) inside row height; shimmer `--dur-skeleton`.
- Variants: no data yet; no results (Clear filters action, existing `NoResults`); Me mode empty ("Nothing assigned to you" + "Turn off My sites" + "Create site"); empty group/column (one-line hint, keeps layout); no permission (`NoPermission`); error with Retry (`ErrorState`); comments loading.
- Motion: skeleton shimmer only; content swaps at 0ms (no fade-in on data).
- Extends: `States.tsx` (`LoadingSkeleton`, `EmptyState`, `NoResults`, `NoPermission`, `ErrorState`), `TableKit.tsx` `Empty`.
- Acceptance: every view type has all variants in a Storybook-like `/design` route; skeleton geometry equals loaded geometry (no layout shift > 0.01 CLS).

## 20. Keyboard shortcuts
- Model: off by default (ClickUp), enabled in personal settings; Ctrl/Cmd+K and Esc always on. `?` opens the shortcut sheet (Dialog 560, two columns, kbd chips 20 high).
- Map:

| Keys | Action | Scope |
| --- | --- | --- |
| Ctrl/Cmd+K, `/` | open search/palette | global (`/` only when shortcuts on) |
| `?` | shortcut sheet | global |
| Ctrl/Cmd+\ | collapse sidebar | global |
| `g` then `h` / `s` / `a` / `i` | go Home (My work) / Sites / Approvals / Inbox | global |
| `l` `t` `b` `c` Shift+`g` | List / Table / Board / Calendar / Gantt view | view pages |
| `j` / `k` | next / previous row (or card) | list, table, inbox |
| Enter / `o` | open focused row in the modal | list, table, board |
| `x` | select focused row | list, table |
| Shift+click, Ctrl/Cmd+A | range / all in view | list, table |
| `e` | edit focused cell (allow-listed only) | table |
| `m` | assign to me (if permitted, non-gated) | focused row |
| `f` | open filter | view pages |
| `[` / `]` | previous / next site in the modal | modal |
| Space, arrows, Esc | keyboard drag on board | board |
| Esc | close menu, panel, modal, clear selection | everywhere |

- Rules: no single-key shortcut fires inside inputs, editable cells or when a modifier other than Shift is held; in RTL, `j/k` and arrow semantics follow visual order; Arabic keyboard layout handled by `KeyboardEvent.code`, not `key`.
- Extends: one `useShortcuts` hook in `Shell.tsx` (no library).
- Acceptance: every shortcut listed in the sheet is covered by a test; disabling shortcuts leaves only Ctrl+K and Esc; `m` never fires on a gated row.

---

## 21. Item count and coverage
24 spec items: 1 App shell, 2 Sidebar, 3 Top bar + Ctrl+K, 4 Location header, 5 Views bar, 6 Toolbar (9 controls), 7 List, 8 Table, 9 Board, 10 Calendar, 11 Gantt, 12 Site modal + activity, 13 Customize, 14 Filter builder, 15 Saved views scope, 16 Bulk bar, 17 Settings shell, 17a People, 17b Roles, 17c Notifications, 17d Security, 18 Toasts + undo, 19 Empty/loading, 20 Keyboard shortcuts.

Not yet seen in any recording (specified from docs, verify live before phase 7): inline edit in action, filter builder internals, row selection + bulk bar, group collapse, toasts with undo, People/Roles/Security pages.

## 22. Open decisions for the owner
- D1 Gate pre-check API: does an endpoint already return, per site, the allowed next milestones and the blocking items? Board drag-over (item 9) needs it. If it does not exist, it is a new read-only endpoint (separate approval) or the board ships with drop-time checks only.
- D2 Skip-ahead: may a site pass several milestones in one action when every gate is met (sequential transitions through the existing API), or is skipping always blocked? The checklist UI works either way; the "Move" button needs the rule.
- D3 Saved view payload: can the existing saved-views API store the unified view object (filters/filter_groups/grouping/sorting/columns/settings/board/calendar/gantt) as JSON without a schema change? If not, it needs a migration (out of the "no DB change" rule).
- D4 Arabic face: IBM Plex Sans Arabic (metrics close to Inter, cleaner tables) or keep Cairo (current, brand familiarity). Also: which preset is the default for the organisation, pmis (teal) or neutral.
- D5 Inline-edit allow-list: which non-gated fields per register may edit in place (proposal: owner, contractor, region, site type, notes, non-baseline planned dates), and whether server-side sort and global search exist for every register (study assumption; if not, phases 2-3 need backend work).
