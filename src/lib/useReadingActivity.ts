import { useEffect } from "react";
import { api } from "./api";
import { eventId } from "./outbox";
import { useProgress } from "./context";
export function useReadingActivity(storyId: string, completed: boolean) {
  const { user, selectedChildId } = useProgress();
  useEffect(() => {
    if (!user || !selectedChildId || completed) return;
    const childId = selectedChildId,
      streamId = eventId();
    let lastInteraction = Date.now(),
      running = false,
      disposed = false;
    let sending = Promise.resolve();
    const send = (phase: "start" | "pulse" | "stop", keepalive = false) => {
      sending = sending
        .then(() =>
          api.activity(childId, { streamId, storyId, phase }, keepalive),
        )
        .then(() => {})
        .catch(() => {});
    };
    const tick = () => {
      const active =
        document.visibilityState === "visible" &&
        Date.now() - lastInteraction < 90000;
      if (active) {
        send(running ? "pulse" : "start");
        running = true;
      } else if (running) {
        send("stop", true);
        running = false;
      }
    };
    const interact = () => {
      lastInteraction = Date.now();
      if (!running && !disposed) tick();
    };
    const visibility = () => {
      if (document.visibilityState === "visible") lastInteraction = Date.now();
      tick();
    };
    tick();
    const timer = window.setInterval(tick, 15000);
    for (const name of ["pointerdown", "keydown", "touchstart", "wheel"])
      window.addEventListener(name, interact, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true;
      clearInterval(timer);
      for (const name of ["pointerdown", "keydown", "touchstart", "wheel"])
        window.removeEventListener(name, interact);
      document.removeEventListener("visibilitychange", visibility);
      if (running) send("stop", true);
    };
  }, [user, selectedChildId, storyId, completed]);
}
