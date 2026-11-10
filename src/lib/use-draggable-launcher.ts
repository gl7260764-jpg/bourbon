"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lets the chat launcher be picked up and carried somewhere else.
 *
 * The bubble sits bottom-right, which on some pages is exactly where the thing
 * someone is reading sits too. Rather than guess a better corner, the bubble
 * moves: drag it anywhere, and it stays there on this device.
 *
 * Three details carry most of the weight:
 *
 *  - A drag and a tap start identically, so a gesture only becomes a drag once
 *    it passes DRAG_THRESHOLD. Below that it is a tap and the chat opens. The
 *    click that follows a real drag has to be swallowed, which is what
 *    `consumeDrag` is for — without it, carrying the bubble also opens it.
 *  - Pointer capture, so the bubble keeps following a finger or cursor that
 *    leaves it mid-drag. One set of handlers covers mouse, touch and pen.
 *  - It snaps back to whichever side it was let go nearest. Free placement
 *    sounds kinder but leaves a gold circle stranded over a paragraph; the
 *    vertical position is kept exactly as dropped, which is the part people
 *    actually want to change.
 */

export const LAUNCHER_SIZE = 64;

const STORAGE_KEY = "bourbon-chat-launcher-pos";
const MARGIN = 20;
/** Below this, the gesture is a tap. Roughly a fingertip's natural wobble. */
const DRAG_THRESHOLD = 4;

export type LauncherPoint = { x: number; y: number };
export type LauncherSide = "left" | "right";

function limits() {
  return {
    maxX: Math.max(MARGIN, window.innerWidth - LAUNCHER_SIZE - MARGIN),
    maxY: Math.max(MARGIN, window.innerHeight - LAUNCHER_SIZE - MARGIN),
  };
}

function clamp(point: LauncherPoint): LauncherPoint {
  const { maxX, maxY } = limits();
  return {
    x: Math.min(Math.max(point.x, MARGIN), maxX),
    y: Math.min(Math.max(point.y, MARGIN), maxY),
  };
}

function snapToSide(point: LauncherPoint): LauncherPoint {
  const { maxX } = limits();
  const pastHalfway = point.x + LAUNCHER_SIZE / 2 < window.innerWidth / 2;
  return { x: pastHalfway ? MARGIN : maxX, y: point.y };
}

export function useDraggableLauncher() {
  const [position, setPosition] = useState<LauncherPoint | null>(null);
  const [dragging, setDragging] = useState(false);

  const originRef = useRef<{
    pointerX: number;
    pointerY: number;
    left: number;
    top: number;
  } | null>(null);
  const movedRef = useRef(false);

  /* Read the stored spot on a timer rather than inline: localStorage does not
     exist while this renders on the server, and a direct setState in an effect
     is the pattern the lint rules reject. Same dodge the dashboard signal uses
     a few lines up in ChatWidget. */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const stored: unknown = JSON.parse(raw);
        if (
          typeof stored === "object" &&
          stored !== null &&
          typeof (stored as LauncherPoint).x === "number" &&
          typeof (stored as LauncherPoint).y === "number"
        ) {
          // Clamped and re-snapped on read: the window it was stored from may
          // have been a different size, or a different device entirely. A spot
          // saved against the edge of a narrow window is mid-screen on a wide
          // one, so the side is recomputed rather than trusted.
          setPosition(snapToSide(clamp(stored as LauncherPoint)));
        }
      } catch {
        // Private mode, blocked storage, or corrupt JSON. Default corner.
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  /* A bubble parked against the right edge of a wide window would hang off a
     narrow one, so re-clamp and re-snap whenever the viewport changes. */
  useEffect(() => {
    const onResize = () => {
      setPosition((current) =>
        current ? snapToSide(clamp(current)) : current,
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    // Measure where it actually is, which covers the first drag out of the
    // default corner, where there is no stored position to read.
    const rect = el.getBoundingClientRect();
    originRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      left: rect.left,
      top: rect.top,
    };
    movedRef.current = false;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const origin = originRef.current;
    if (!origin) return;
    const dx = e.clientX - origin.pointerX;
    const dy = e.clientY - origin.pointerY;
    if (!movedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    movedRef.current = true;
    setDragging(true);
    setPosition(clamp({ x: origin.left + dx, y: origin.top + dy }));
  }, []);

  const endDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (el.hasPointerCapture(e.pointerId))
      el.releasePointerCapture(e.pointerId);
    originRef.current = null;
    setDragging(false);
    // movedRef stays set until consumeDrag reads it — the click lands after this.
    if (!movedRef.current) return;
    setPosition((current) => {
      if (!current) return current;
      const settled = snapToSide(current);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settled));
      } catch {
        // Not remembering where it was put is survivable.
      }
      return settled;
    });
  }, []);

  /** True when the gesture just ended was a drag, so the click it produced
   *  should be ignored. Reading it clears it. */
  const consumeDrag = useCallback(() => {
    const dragged = movedRef.current;
    movedRef.current = false;
    return dragged;
  }, []);

  const side: LauncherSide =
    position && position.x + LAUNCHER_SIZE / 2 < window.innerWidth / 2
      ? "left"
      : "right";

  return {
    position,
    side,
    dragging,
    consumeDrag,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
