const STORAGE_KEY = "festalytics_pending_action";

export function savePendingAction(action, payload = {}) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ action, payload, savedAt: Date.now() })
    );
  } catch (err) {
    console.warn("[pendingActions] save failed:", err);
  }
}

export function loadPendingAction() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingAction() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
