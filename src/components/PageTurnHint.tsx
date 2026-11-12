import { useEffect, useState } from "react";
import { Hand } from "lucide-react";
const HINT_KEY = "iqro.classic-drag-hint.v1";
let shownInThisSession = false;
function wasShown() {
  if (shownInThisSession) return true;
  try {
    return localStorage.getItem(HINT_KEY) === "seen";
  } catch {
    return false;
  }
}
/** One unobtrusive demonstration per browser, never a modal or required step. */
export default function PageTurnHint() {
  const [visible, setVisible] = useState(() => !wasShown());
  useEffect(() => {
    if (!visible) return;
    shownInThisSession = true;
    try {
      localStorage.setItem(HINT_KEY, "seen");
    } catch {
      /* In-memory fallback when storage is blocked. */
    }
    const timer = window.setTimeout(() => setVisible(false), 3800);
    return () => window.clearTimeout(timer);
  }, [visible]);
  if (!visible) return null;
  return (
    <div className="page-drag-hint" role="status">
      <span className="hint-trail" aria-hidden="true" />
      <span className="hint-hand" aria-hidden="true">
        <span className="hint-touch" />
        <Hand size={36} strokeWidth={1.6} />
      </span>
      <span className="hint-caption">Varaqni ushlab suring</span>
    </div>
  );
}
