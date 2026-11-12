import {
  useRef,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";

export interface PaperDragMotion {
  progress: number;
  released: boolean;
  commit: boolean;
}
export type PaperDragRef = RefObject<PaperDragMotion | null>;
type Pointer = {
  id: number;
  x: number;
  y: number;
  span: number;
  time: number;
  direction: -1 | 1;
  started: boolean;
  instant: boolean;
};

/** Pointer capture keeps the paper attached to the hand outside the book too.
 * Vertical movement remains native scrolling until a horizontal drag begins. */
export function usePaperDrag({
  enabled,
  onStart,
  onInstantTurn,
  onInteract,
}: {
  enabled: boolean;
  onStart: (direction: -1 | 1) => boolean;
  onInstantTurn: (direction: number) => void;
  onInteract: () => void;
}) {
  const motion = useRef<PaperDragMotion | null>(null);
  const pointer = useRef<Pointer | null>(null);
  const suppressClick = useRef(false);
  const progressAt = (event: ReactPointerEvent<HTMLElement>, p: Pointer) =>
    Math.max(0, Math.min(1, ((p.x - event.clientX) * p.direction) / p.span));
  const release = (
    event: ReactPointerEvent<HTMLElement>,
    cancelled = false,
  ) => {
    const p = pointer.current;
    if (!p || event.pointerId !== p.id) return;
    pointer.current = null;
    if (p.started) {
      const progress = cancelled
        ? (motion.current?.progress ?? 0)
        : progressAt(event, p);
      const distance = (p.x - event.clientX) * p.direction;
      const commit =
        !cancelled &&
        (progress >= 0.32 ||
          (distance > 65 && performance.now() - p.time < 350));
      if (motion.current)
        Object.assign(motion.current, { progress, released: true, commit });
      if (p.instant && commit) onInstantTurn(p.direction);
      suppressClick.current = true;
    }
    if (event.currentTarget.hasPointerCapture(p.id))
      event.currentTarget.releasePointerCapture(p.id);
  };
  return {
    motion,
    pointerActive: () => pointer.current !== null,
    handlers: {
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        if (
          !enabled ||
          pointer.current ||
          (event.pointerType === "mouse" && event.button !== 0)
        )
          return;
        if (
          (event.target as HTMLElement).closest(
            "a,input,select,textarea,button:not(.page-corner)",
          )
        )
          return;
        onInteract();
        suppressClick.current = false;
        pointer.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          span:
            event.currentTarget.clientWidth *
            (window.matchMedia("(max-width:600px)").matches ? 0.85 : 0.5),
          time: performance.now(),
          direction: 1,
          started: false,
          instant: false,
        };
      },
      onPointerMove(event: ReactPointerEvent<HTMLElement>) {
        const p = pointer.current;
        if (!p || p.id !== event.pointerId) return;
        const dx = p.x - event.clientX,
          dy = p.y - event.clientY;
        if (!p.started) {
          if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
            pointer.current = null;
            return;
          }
          if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
          p.direction = dx > 0 ? 1 : -1;
          p.instant = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          motion.current = { progress: 0, released: false, commit: false };
          if (!p.instant && !onStart(p.direction)) {
            pointer.current = null;
            motion.current = null;
            return;
          }
          p.started = true;
          event.currentTarget.setPointerCapture(p.id);
        }
        if (motion.current) motion.current.progress = progressAt(event, p);
        event.preventDefault();
      },
      onPointerUp(event: ReactPointerEvent<HTMLElement>) {
        release(event);
      },
      onPointerCancel(event: ReactPointerEvent<HTMLElement>) {
        release(event, true);
      },
      onLostPointerCapture(event: ReactPointerEvent<HTMLElement>) {
        // Touch starts with implicit capture on the text/image. Its loss while
        // transferring capture to the book is not a cancelled drag.
        if (event.target === event.currentTarget) release(event, true);
      },
      onClickCapture(event: ReactMouseEvent<HTMLElement>) {
        if (suppressClick.current && event.detail > 0) {
          event.preventDefault();
          event.stopPropagation();
        }
        suppressClick.current = false;
      },
    },
  };
}
