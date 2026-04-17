
User reports app not loading. Let me check recent state.

Looking at history: last edit was `useMetricsCache.ts` type fix + tsconfig changes. No console logs, no auth logs, no edge logs reported. User on /dashboard route per client_state.

Likely causes:
1. Build error from recent tsconfig/type changes
2. Cache issue
3. Edge function failure

Best move: check dev-server logs and recent files quickly to diagnose, then fix.
