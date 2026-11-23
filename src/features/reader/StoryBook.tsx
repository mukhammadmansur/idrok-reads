import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Story, StoryPage } from "../../content/types";
import styles from "./StoryBook.module.css";

export interface StoryBookHandle {
  turn: (direction: -1 | 1) => void;
}

interface SheetState {
  direction: -1 | 1;
  target: number;
  mode: "auto" | "drag";
}

type Side = "left" | "right";

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function transform(direction: -1 | 1, progress: number) {
  return `rotateY(${(direction === 1 ? -180 : 180) * progress}deg)`;
}

function useMobileBook() {
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 719px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 719px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return mobile;
}

function Artwork({ page, storyId }: { page: StoryPage; storyId: string }) {
  return (
    <figure className={styles.artwork}>
      <div className={styles.scene} data-scene={storyId}>
        <span className={styles.sceneHalo} aria-hidden="true" />
        <img
          className={styles.sceneImage}
          src={page.image}
          alt={page.alt}
          draggable={false}
          decoding="async"
        />
        <span className={styles.sceneLight} aria-hidden="true" />
        <span className={styles.motes} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
      <svg className={styles.imprint} viewBox="0 0 100 38" aria-hidden="true">
        <path d="M12 25h18m40 0h18M32 17q10-3 18 5 8-8 18-5v13q-10-3-18 3-8-6-18-3ZM50 22V9m0 6q-10 0-10-9 10 0 10 9m0-4q9 0 9-8-9 0-9 8" />
        <path d="m22 10 2-4 2 4 4 2-4 2-2 4-2-4-4-2Zm51-6 2-3 2 3 3 2-3 2-2 3-2-3-3-2Z" />
      </svg>
    </figure>
  );
}

function Prose({
  story,
  page,
  index,
}: {
  story: Story;
  page: StoryPage;
  index: number;
}) {
  return (
    <>
      <article className={styles.prose}>
        <div className={styles.narration}>
          <span className={styles.kicker}>
            {index === 0 ? "Hikoya boshlanadi" : `${index + 1}-sahifa`}
          </span>
          {index === 0 && <h2 className={styles.opening}>Bir bor ekan...</h2>}
          <p className={index === 0 ? styles.dropCap : undefined}>
            {page.text}
          </p>
        </div>
      </article>
      <span className={styles.folio} aria-hidden="true">
        {index + 1}
      </span>
      <span className={styles.bookTitle} aria-hidden="true">
        {story.title}
      </span>
    </>
  );
}

function SpreadFace({
  story,
  index,
  side,
}: {
  story: Story;
  index: number;
  side: Side;
}) {
  const page = story.pages[index];
  const art = (index % 2 === 0) === (side === "left");
  return (
    <div className={`${styles.faceContent} ${styles[side]}`}>
      <span className={styles.pageTrim} aria-hidden="true" />
      {art ? (
        <Artwork page={page} storyId={story.id} />
      ) : (
        <Prose story={story} page={page} index={index} />
      )}
    </div>
  );
}

function MobilePage({ story, index }: { story: Story; index: number }) {
  const page = story.pages[index];
  return (
    <div className={`${styles.faceContent} ${styles.mobilePage}`}>
      <span className={styles.pageTrim} aria-hidden="true" />
      <Artwork page={page} storyId={story.id} />
      <Prose story={story} page={page} index={index} />
    </div>
  );
}

export const StoryBook = forwardRef<
  StoryBookHandle,
  {
    story: Story;
    initialPage: number;
    textSize: number;
    onSettled: (page: number) => void;
    onTurningChange?: (turning: boolean) => void;
  }
>(function StoryBook(
  { story, initialPage, textSize, onSettled, onTurningChange },
  ref,
) {
  const mobile = useMobileBook();
  const [page, setPage] = useState(initialPage);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const pageRef = useRef(initialPage);
  const sheetState = useRef<SheetState | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const turningRef = useRef(false);
  const progress = useRef(0);
  const animationEnd = useRef<((event: TransitionEvent) => void) | null>(null);
  const settleTimer = useRef(0);
  const frame = useRef(0);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    started: boolean;
    lastX: number;
    lastTime: number;
    speed: number;
  } | null>(null);
  const onSettledRef = useRef(onSettled);
  const onTurningRef = useRef(onTurningChange);

  useEffect(() => {
    onSettledRef.current = onSettled;
    onTurningRef.current = onTurningChange;
  }, [onSettled, onTurningChange]);

  const markTurning = useCallback((value: boolean) => {
    turningRef.current = value;
    onTurningRef.current?.(value);
  }, []);

  const clearAnimation = useCallback(() => {
    cancelAnimationFrame(frame.current);
    window.clearTimeout(settleTimer.current);
    const element = sheetRef.current;
    if (element && animationEnd.current)
      element.removeEventListener("transitionend", animationEnd.current);
    animationEnd.current = null;
  }, []);

  const finish = useCallback(
    (commit: boolean) => {
      clearAnimation();
      const state = sheetState.current;
      if (!state) return;
      sheetState.current = null;
      setSheet(null);
      markTurning(false);
      if (commit) {
        pageRef.current = state.target;
        setPage(state.target);
        onSettledRef.current(state.target);
      }
    },
    [clearAnimation, markTurning],
  );

  const animate = useCallback(
    (commit: boolean) => {
      const state = sheetState.current;
      const element = sheetRef.current;
      if (!state || !element || reducedMotion()) {
        finish(commit);
        return;
      }
      clearAnimation();
      const target = commit ? 1 : 0;
      const duration = Math.max(260, 520 * Math.abs(target - progress.current));
      void element.offsetWidth;
      element.style.transitionDuration = `${duration}ms`;
      element.style.transform = transform(state.direction, target);
      element.classList.add(styles.animating);
      progress.current = target;
      const listener = (event: TransitionEvent) => {
        if (event.propertyName === "transform") finish(commit);
      };
      animationEnd.current = listener;
      element.addEventListener("transitionend", listener);
      settleTimer.current = window.setTimeout(
        () => finish(commit),
        duration + 160,
      );
    },
    [clearAnimation, finish],
  );

  const begin = useCallback(
    (direction: -1 | 1, mode: SheetState["mode"]) => {
      if (turningRef.current) return false;
      const target = pageRef.current + direction;
      if (target < 0 || target >= story.pages.length) return false;
      if (reducedMotion() && mode === "auto") {
        pageRef.current = target;
        setPage(target);
        onSettledRef.current(target);
        return true;
      }
      const next = { direction, target, mode };
      sheetState.current = next;
      progress.current = 0;
      setSheet(next);
      markTurning(true);
      return true;
    },
    [markTurning, story.pages.length],
  );

  const turn = useCallback(
    (direction: -1 | 1) => {
      begin(direction, "auto");
    },
    [begin],
  );

  useImperativeHandle(ref, () => ({ turn }), [turn]);

  useLayoutEffect(() => {
    if (!sheet || sheet.mode !== "auto") return;
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => animate(true));
    });
    return () => cancelAnimationFrame(frame.current);
  }, [animate, sheet]);

  useLayoutEffect(() => {
    if (!sheet || sheet.mode !== "drag") return;
    const element = sheetRef.current;
    if (!element) return;
    element.style.transitionDuration = "0ms";
    element.style.transform = transform(sheet.direction, progress.current);
  }, [sheet]);

  useEffect(() => {
    if (!sheetState.current) return;
    finish(false);
  }, [mobile, finish]);

  useEffect(
    () => () => {
      clearAnimation();
      sheetState.current = null;
    },
    [clearAnimation],
  );

  const width = () => {
    const element = bookRef.current;
    return Math.max(1, (element?.clientWidth ?? 1) / (mobile ? 1 : 2));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      turningRef.current ||
      (event.pointerType === "mouse" && event.button !== 0) ||
      (event.target as HTMLElement).closest("button,a,input")
    )
      return;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      started: false,
      lastX: event.clientX,
      lastTime: performance.now(),
      speed: 0,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (!current.started) {
      const dx = current.x - event.clientX;
      const dy = current.y - event.clientY;
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
      const direction: -1 | 1 = dx > 0 ? 1 : -1;
      if (!begin(direction, "drag")) {
        drag.current = null;
        return;
      }
      current.started = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const state = sheetState.current;
    const element = sheetRef.current;
    if (!state || !element) return;
    progress.current = Math.max(
      0,
      Math.min(1, ((current.x - event.clientX) * state.direction) / width()),
    );
    element.style.transitionDuration = "0ms";
    element.classList.remove(styles.animating);
    element.style.transform = transform(state.direction, progress.current);
    const time = performance.now();
    if (time > current.lastTime)
      current.speed =
        (current.lastX - event.clientX) / (time - current.lastTime);
    current.lastX = event.clientX;
    current.lastTime = time;
    event.preventDefault();
  };

  const release = (
    event: ReactPointerEvent<HTMLDivElement>,
    cancelled = false,
  ) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    if (!current.started) return;
    if (event.currentTarget.hasPointerCapture(current.id))
      event.currentTarget.releasePointerCapture(current.id);
    const commit =
      !cancelled &&
      (progress.current >= 0.32 ||
        (current.speed > 0.45 && progress.current > 0.04));
    animate(commit);
  };

  const baseLeft =
    sheet && (mobile || sheet.direction === -1) ? sheet.target : page;
  const baseRight =
    sheet && (mobile || sheet.direction === 1) ? sheet.target : page;
  const mobileBase = sheet ? sheet.target : page;
  const last = page === story.pages.length - 1;

  return (
    <div className={styles.wrap} ref={bookRef} aria-hidden="true">
      <div className={styles.shell}>
        <div
          className={styles.book}
          data-size={textSize}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => release(event)}
          onPointerCancel={(event) => release(event, true)}
        >
          {mobile ? (
            <MobilePage story={story} index={mobileBase} />
          ) : (
            <>
              <SpreadFace story={story} index={baseLeft} side="left" />
              <SpreadFace story={story} index={baseRight} side="right" />
            </>
          )}
          <span className={styles.spine} aria-hidden="true" />
          {sheet && (
            <div
              ref={sheetRef}
              className={`${styles.sheet} ${
                sheet.direction === 1 ? styles.next : styles.prev
              } ${sheet.mode === "drag" ? styles.dragging : ""}`}
            >
              <div className={`${styles.sheetFace} ${styles.front}`}>
                {mobile ? (
                  <MobilePage story={story} index={page} />
                ) : (
                  <SpreadFace
                    story={story}
                    index={page}
                    side={sheet.direction === 1 ? "right" : "left"}
                  />
                )}
              </div>
              <div className={`${styles.sheetFace} ${styles.back}`}>
                {mobile ? (
                  <MobilePage story={story} index={sheet.target} />
                ) : (
                  <SpreadFace
                    story={story}
                    index={sheet.target}
                    side={sheet.direction === 1 ? "left" : "right"}
                  />
                )}
              </div>
            </div>
          )}
          {page > 0 && (
            <button
              type="button"
              className={styles.turnPrev}
              aria-label="Oldingi sahifa"
              tabIndex={-1}
              onClick={() => turn(-1)}
            />
          )}
          {!last && (
            <button
              type="button"
              className={styles.turnNext}
              aria-label="Keyingi sahifa"
              tabIndex={-1}
              onClick={() => turn(1)}
            />
          )}
        </div>
      </div>
      <span className={styles.hint} aria-hidden="true">
        {last
          ? "Hikoya tugadi"
          : page === 0
            ? "Varaqni chapga suring"
            : "Varaqni chapga yoki o‘ngga suring"}
      </span>
    </div>
  );
});
