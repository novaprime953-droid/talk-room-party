# Sunset Blaze Overhaul — Phased Plan

Full-overhaul pass across profile, home, store/wallet, admin — plus 4 net-new feature systems. Ship in 5 phases so each turn stays reviewable.

## Design direction (locked, applied every phase)

- **Palette (HSL tokens in `index.css`)**
  - `--background` deep plum `260 40% 6%`
  - `--card` `260 30% 10%`
  - `--primary` sunset orange `18 100% 60%` (#ff6b35)
  - `--secondary` amber `35 93% 54%` (#f7931e)
  - `--accent` magenta `330 78% 58%` (#e84393)
  - `--vip` violet `252 76% 66%` (#6c5ce7)
  - `--gradient-sunset` `linear-gradient(135deg, #ff6b35, #e84393, #6c5ce7)`
  - `--gradient-ember` `linear-gradient(135deg, #ff6b35, #f7931e)`
  - `--glow-primary` `0 0 40px hsl(18 100% 60% / .45)`
- **Type**: keep display font; body switches to Figtree (via `@fontsource/figtree`) for readability.
- **Motion**: Framer-Motion micro-interactions — 200 ms scale on tap, shimmer on VIP surfaces, floating ember particles behind hero areas.
- **Backgrounds**: animated radial-gradient orb layer (`SunsetOrbs` component) reused on Profile, Home hero, Wallet, Auth.
- **Icon set**: Lucide, 1.75 stroke, gradient-filled where headline.

## Phase 1 — Design system + shared shell *(this turn if approved)*

1. Rewrite `index.css` tokens + add `.gradient-sunset`, `.gradient-ember`, `.glow-ring`, `.glass-card`, `.shimmer` utilities.
2. Extend `tailwind.config.ts` with new colors, shadows, keyframes (`float`, `shimmer`, `ember`, `orb-drift`).
3. New shared components:
   - `SunsetOrbs.tsx` (animated background)
   - `SectionHeader.tsx` (icon + gradient title + action)
   - `StatCard.tsx`, `IconTile.tsx`, `GlassPanel.tsx`
   - `PageHero.tsx` (curved gradient header with avatar/stats slot)
4. Install `@fontsource/figtree`, wire in `main.tsx` + tailwind.
5. Refresh `BottomNav` (glass blur, gradient active pill), `SplashPage`, `AuthPage`, `EmptyState`.

## Phase 2 — Profile & Public Profile polish

- `ProfilePage`: curved gradient hero, framed avatar, ID chip w/ copy, level+VIP dual ring, wallet quick-tiles, honor row (medals/frames/titles/gifts) using `IconTile`.
- `PublicProfilePage`: cover image with parallax, follow/message CTAs (wired to Phase 3/4), gift-wall grid, mutual-follow badge.
- `SettingsPage`: grouped `GlassPanel` cards, section icons, theme + language + privacy toggles polished.
- New `FollowButton` component (state-aware, optimistic).

## Phase 3 — Follow / Followers / Friends

- DB: table already exists (`followers`). Add RPCs `toggle_follow`, `get_follow_counts`, view `mutual_follows`. GRANTs + RLS.
- Hook `useFollow.tsx` (counts, list, toggle, mutuals).
- UI: `FollowersPage` (tabs: Followers | Following | Friends/mutual | Suggested), suggested-users algorithm (top level, not followed, active last 7d), integrated into `PublicProfilePage` and new "People" tab on Explore.

## Phase 4 — Direct Messages (1:1)

- DB migration: `dm_threads`, `dm_messages` with RLS (participants only), Realtime enabled.
- RPC `send_dm(p_receiver_id, p_content, p_media_url)` handles thread upsert + unread counter + block check.
- Storage bucket `dm-media` (private, participant-scoped policy).
- Pages: `MessagesPage` (inbox list, unread badges, search), `MessageThreadPage` (bubbles, typing dots via Realtime presence, gift/emoji quick-send, block/report).
- Bottom-nav badge for unread total; entry point from `PublicProfilePage`.

## Phase 5 — Search + Notifications + Store/Wallet/Admin polish

- **Global Search page** `/search` — tabs Users | Rooms | Posts | Tags, recent history in `localStorage`, top-level results with framed avatars & room previews.
- **Notifications revamp**: grouped by day, category filter chips (Gifts, System, Social, Level), mark-all-read, swipe-to-dismiss, Realtime toast dock.
- **Store / My Bag / Wallet**: sticky category chips, preview modal with animated frame demo, coin-pack cards with best-value ribbon, transaction timeline w/ icons + filters.
- **Admin/Owner polish**: dashboard KPI grid with sparkline, refreshed tables using `GlassPanel` + `EmptyState`, quick-action FAB.

## Technical notes

- All colors via CSS tokens — no hex/`text-white` in components.
- Every new table follows: `CREATE TABLE → GRANT → RLS → POLICY` in one migration.
- DM + follow + notifications use Supabase Realtime channels inside `useEffect` with proper cleanup.
- Framer Motion animations gated behind `prefers-reduced-motion`.
- Numeric ID stays the primary display identifier everywhere.
- No changes to auth, roles, economy RPCs, or existing schemas unless a phase explicitly calls it out.

## What I need from you

1. **Approve the plan** (all 5 phases in order).
2. Confirm I should **start Phase 1 immediately** after approval, then pause for review before Phase 2.
3. Any must-have addition I missed (e.g., voice notes in DMs, story-style posts, block-list page)?
