// @ts-nocheck
import { findNodeHandle, UIManager } from 'react-native';
import type { ScrollView, View } from 'react-native';
import type React from 'react';

/** Native node for ScrollView scrollable content (for measureLayout). */
export function getScrollContentNode(scrollRef: React.RefObject<ScrollView | null>): number | null {
  const sc = scrollRef.current as unknown as { getInnerViewRef?: () => unknown } | null;
  if (!sc) return null;
  const inner = sc.getInnerViewRef?.();
  if (inner != null) return findNodeHandle(inner as never);
  return findNodeHandle(sc as never);
}

/** Scroll so `childRef` is near the top of the scroll content, with Y fallback if measure fails. */
export function scrollToChildInScrollView(
  scrollRef: React.RefObject<ScrollView | null>,
  childRef: React.RefObject<View | null>,
  options: { offset?: number; fallbackY?: number },
): void {
  const offset = options.offset ?? 8;
  const fallbackY = options.fallbackY ?? 0;
  const rel = getScrollContentNode(scrollRef);
  const target = findNodeHandle(childRef.current);
  if (rel != null && target != null) {
    UIManager.measureLayout(
      target,
      rel,
      () => {
        scrollRef.current?.scrollTo({ y: Math.max(0, fallbackY - offset), animated: true });
      },
      (_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - offset), animated: true });
      },
    );
    return;
  }
  scrollRef.current?.scrollTo({ y: Math.max(0, fallbackY - offset), animated: true });
}
