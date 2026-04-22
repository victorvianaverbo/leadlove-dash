import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkSupabaseEnv } from "./lib/env-guard";

// Abort boot with friendly error screen if Supabase env vars missing from bundle
if (!checkSupabaseEnv()) {
  throw new Error("Supabase env missing — friendly error rendered");
}

// Global recovery for stale chunks after a new deploy.
// If a dynamic import fails (404 on old hashed chunk), reload once
// to fetch the fresh index.html with valid chunk references.
const CHUNK_ERR_RE =
  /Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError|Importing a module script failed/i;
const RELOAD_FLAG = "chunk-retry:global";

function tryRecover(message: string) {
  if (!CHUNK_ERR_RE.test(message)) return;
  if (sessionStorage.getItem(RELOAD_FLAG)) return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  window.location.reload();
}

window.addEventListener("error", (e) => {
  tryRecover(String(e?.message || ""));
});

window.addEventListener("unhandledrejection", (e) => {
  const reason: any = e?.reason;
  tryRecover(String(reason?.message || reason || ""));
});

// Clear the flag once the app boots successfully so future deploys can recover too.
window.addEventListener("load", () => {
  setTimeout(() => sessionStorage.removeItem(RELOAD_FLAG), 5000);
});

createRoot(document.getElementById("root")!).render(<App />);
