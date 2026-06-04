## Goal
Harden room seat management with backend enforcement, moderator-visible event logs, realtime occupancy, takeover requests, and tighter join/leave UX.

## 1. Database (single migration)

**`seat_events` table** — moderator audit log
- `room_id`, `user_id`, `action` (`join_attempt`, `join_success`, `leave`, `kicked`, `takeover_requested`, `takeover_accepted`, `takeover_denied`)
- `seat_index`, `target_user_id` (nullable), `success` bool, `failure_reason` text, `metadata` jsonb
- RLS: insert by anyone for own actions; SELECT restricted to room host + admins/moderators
- Realtime enabled

**`seat_takeover_requests` table**
- `room_id`, `seat_index`, `requester_id`, `current_owner_id`, `status` (`pending`/`accepted`/`denied`/`expired`), `expires_at` (now()+60s)
- RLS: requester + current_owner + host can SELECT/UPDATE; requester can INSERT
- Realtime enabled

**RPC `claim_seat(p_room_id, p_seat_index)`** — SECURITY DEFINER, atomic
- Lock `room_participants` for room
- Validate: user is participant, seat in `[0, max_seats-1]`, seat not occupied, user not already on another seat
- On failure → insert `seat_events` row with `success=false` + `failure_reason` (`already_seated`, `seat_taken`, `not_in_room`, `invalid_index`) and return `jsonb {success:false, error_code, message, current_seat_index?}`
- On success → set `seat_index`, log `join_success`, return `{success:true, seat_index}`

**RPC `leave_seat(p_room_id)`** — atomic, logs `leave` event, returns `{success:true}`

**RPC `request_seat_takeover(p_room_id, p_seat_index)`**
- Validates seat occupied by another user, no pending request, inserts row, logs `takeover_requested`

**RPC `respond_seat_takeover(p_request_id, p_accept)`**
- Owner-only; if accept → atomic swap (clear owner seat, set requester seat), log `takeover_accepted`; else `takeover_denied`

## 2. Frontend `RoomPage.tsx`

- Replace direct `room_participants.update` with `supabase.rpc('claim_seat', …)` / `leave_seat` / takeover RPCs
- Add `isSeatActionPending` state → disables seat taps and shows spinner overlay on the targeted seat
- Toast structured errors from RPC (`error_code` → message)
- **Leave confirm dialog** (shadcn `AlertDialog`): tap own seat → confirm → call `leave_seat` with loading state
- **Takeover flow**: when seat occupied by another user, tap shows `AlertDialog` with "Request takeover" → calls `request_seat_takeover`
- **Incoming takeover modal**: realtime subscribe to `seat_takeover_requests` where `current_owner_id = me AND status='pending'` → modal with Accept/Deny (60s countdown)
- **Occupancy pill**: header shows `{occupiedSeats}/{maxSeats} seats` computed from participants, updates via existing realtime subscription

## 3. `VoiceSeat.tsx`
- New props: `isPending`, `canRequestTakeover`
- Spinner overlay when `isPending`
- "Request seat" label on occupied seats when `canRequestTakeover`

## 4. Out of scope
- No moderator log viewer UI this turn (data is captured; viewer can come next)
- No changes to mic/hand-raise flows

## Technical notes
- All RPCs run with `SET search_path = public`, use `FOR UPDATE` row locks on `room_participants` to prevent races
- `claim_seat` failure rows in `seat_events` are still inserted (separate statement, not rolled back) so moderators see denied attempts
- Takeover requests auto-expire via `expires_at` check in RPCs (no cron needed initially)