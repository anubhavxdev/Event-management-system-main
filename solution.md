**Feature:** Manual Check-In (fallback for QR) — Issue #92

**Summary**
- **Goal:** Add a "Manual Check-In" section to the organizer's event participants view so organizers can search attendees by name or email and mark them checked-in when QR scanning fails.
- **Scope:** Frontend change in `Frontendd/src/pages/dashboard/OrganizerDashboard.jsx` (UI + state + API calls). Minimal backend dependency: POST `/api/registrations/:id/checkin` (already present).

**UI / UX**
- **Section:** Add a collapsible "Manual Check-In" panel when viewing an event's participants.
- **Search bar:** Text input — filters attendees by name or email, case-insensitive, realtime (debounced ~150ms).
- **Row:** Shows attendee `name`, `email`, `registration status`, and `check-in status` badge.
- **Action:** "Check In" button shown only for not-yet-checked-in attendees. Already checked-in show green ✓ badge and no button.
- **Filter toggle:** Three options — `All`, `Checked In`, `Pending` (Not Yet Checked In).
- **Live count:** Display `X / Y checked in` (updates live).
- **Toast:** On success show `"[Name] checked in at [HH:MM:SS]"` using existing toast utility (or a tiny new helper). Error toast on failure.

**Frontend Implementation (high level)**
- **Where:** Edit `Frontendd/src/pages/dashboard/OrganizerDashboard.jsx` to include a new `ManualCheckin` subcomponent or inline block.
- **Data source:** Use the same participants array already loaded for the event (avoid extra round-trips). If participants are paginated on the dashboard, request full participants list or implement server-side search endpoint.
- **Search:** Filter client-side by comparing `.toLowerCase()` on `name` and `email`. Use `useMemo` for filtered results; apply debounce for the input.
- **Filter toggle:** Store `filterMode` state (`all|checked|pending`) and apply after search filter.
- **Check-in action:** Call POST `/api/registrations/:id/checkin` (replace `:id` with registration id). Use `fetch` or existing `api` helper. Implement optimistic UI update:
  - Disable the button and show spinner.
  - Immediately set attendee `.checkedIn = true` and update count.
  - Roll back if API returns error and show error toast.
- **Immediate UI update:** Update local React state (no page reload) so the row becomes checked-in instantly.

**Ownership / Authorization**
- **Client check:** Use current organizer id from auth context and event `owner` field; disable/hide check-in controls if not owner.
- **Server check:** Ensure server endpoint rejects check-in if the requesting user is not organizer of the event (backend already enforces ownership — verify; if not, add check). The UI must still guard and show a tooltip explaining access if disabled.

**Acceptance Criteria Mapping**
- **Search filters participants by name or email:** Client-side `filter` with `toLowerCase()`; debounced realtime typing.
- **'Check In' button marks attendee via POST `/api/registrations/:id/checkin`:** Implemented with optimistic update and error handling.
- **Checked-in status updates immediately in UI:** Achieved by updating component state on success/optimistically.
- **Filter toggle works:** `All / Checked In / Pending` implemented via `filterMode`.
- **Shows live check-in count:** Compute `checkedCount` from state and show `${checkedCount} / ${total} checked in`.
- **Organizer ownership check enforced:** Client gating + rely on server authorization.

**Edge cases & notes**
- **Duplicate check-ins:** Disable button once clicked; server should idempotently return success if already checked in.
- **Concurrent updates:** If using Socket.IO (existing feature), show live updates when other check-ins occur; subscribe to socket events to update participant state.
- **Large attendee lists:** If participants are extremely large, use server-side search and paging instead of client-side filtering.

**API Example (fetch)**

- Request:
  - `POST /api/registrations/:id/checkin` — body optional
- Frontend snippet:

```
async function handleCheckin(reg) {
  setLoadingId(reg._id);
  // optimistic update
  setParticipants(prev => prev.map(p => p._id === reg._id ? {...p, checkedIn: true, checkinTime: new Date().toISOString()} : p));
  try {
    const res = await fetch(`/api/registrations/${reg._id}/checkin`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed');
    showToast(`${reg.name} checked in at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    // rollback
    setParticipants(prev => prev.map(p => p._id === reg._id ? {...p, checkedIn: false} : p));
    showErrorToast('Check-in failed');
  } finally {
    setLoadingId(null);
  }
}
```

**Testing**
- **Unit:** test `ManualCheckin` filtering and action handlers.
- **Integration:** mock the POST endpoint and verify optimistic updates and rollback.
- **Manual QA:** simulate non-owner user to verify UI gating.

**Implementation plan (suggested PR scope)**
- Create `ManualCheckin` small component inside `OrganizerDashboard.jsx`.
- Wire up search, filter toggle, and list UI.
- Integrate `handleCheckin` with API and toast utility.
- Add basic CSS / Tailwind classes matching the dashboard.
- Add tests for filtering and check-in flow.

**Files to edit**
- Primary: `Frontendd/src/pages/dashboard/OrganizerDashboard.jsx`
- Small additions: optional `Frontendd/src/components/ManualCheckin.jsx` and tests in `Frontendd/src/__tests__/`

If you'd like, I can: implement the `ManualCheckin` component and open a branch/PR. Which contributor should I assign this implementation to (from issue comments)?
