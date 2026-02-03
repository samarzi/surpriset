import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeBackOptions {
  enabled?: boolean;
  threshold?: number; // Minimum distance to trigger navigation
  velocityThreshold?: number; // Minimum velocity to trigger navigation (px/ms)
  edgeWidth?: number; // Area from the left edge to start the swipe
}

export function useSwipeBack(options: SwipeBackOptions = {}) {
  const {
    enabled = true,
    threshold = 100, // Increased threshold for slow swipes
    velocityThreshold = 0.5, // 0.5 px/ms
    edgeWidth = 40, // Increased edge width for easier grabbing
  } = options;

  const navigate = useNavigate();
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0); // 0 to 1

  const refState = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    active: false,
    pointerId: -1,
  });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;

    // Only accept left click or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Check if starting from edge
    if (e.clientX > edgeWidth) return;

    refState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      active: true,
      pointerId: e.pointerId,
    };
  }, [enabled, edgeWidth]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!refState.current.active || e.pointerId !== refState.current.pointerId) return;

    const deltaX = e.clientX - refState.current.startX;
    const deltaY = e.clientY - refState.current.startY;

    // If we moved more vertically than horizontally initially, cancel the swipe back
    // to allow scrolling. But since we start at the edge, we usually want to prioritize back.
    // Let's only cancel if we haven't locked into swiping yet.
    if (!isSwiping) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        refState.current.active = false;
        return;
      }
      if (deltaX > 10) {
        setIsSwiping(true);
        if (navigator.vibrate) navigator.vibrate(10); // Haptic feedback on start
      }
    }

    if (isSwiping) {
      if (e.cancelable) e.preventDefault(); // Prevent scrolling
      e.stopPropagation();

      const progress = Math.min(Math.max(deltaX / window.innerWidth, 0), 1);
      setSwipeProgress(progress);
    }
  }, [isSwiping]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!refState.current.active || e.pointerId !== refState.current.pointerId) return;

    const deltaX = e.clientX - refState.current.startX;
    const deltaTime = Date.now() - refState.current.startTime;
    const velocity = deltaX / deltaTime;

    // Success if:
    // 1. Swiped fast enough (velocity > threshold) AND moved in right direction
    // 2. Swiped far enough (deltaX > threshold)
    const isVelocitySwipe = velocity > velocityThreshold && deltaX > 20;
    const isDistanceSwipe = deltaX > threshold;

    if (isSwiping && (isVelocitySwipe || isDistanceSwipe)) {
      if (navigator.vibrate) navigator.vibrate(20); // Success haptic
      navigate(-1);
    }

    // Reset
    setIsSwiping(false);
    setSwipeProgress(0);
    refState.current.active = false;
  }, [isSwiping, navigate, threshold, velocityThreshold]);

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    if (e.pointerId === refState.current.pointerId) {
      setIsSwiping(false);
      setSwipeProgress(0);
      refState.current.active = false;
    }
  }, []);

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onPointerLeave: onPointerCancel,
    },
    isSwiping,
    swipeProgress,
  };
}
