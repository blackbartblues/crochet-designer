import { useEffect, type RefObject } from 'react';

/**
 * Calls `onOutside` when a pointerdown happens outside the referenced element.
 * Pass `enabled = false` to disable temporarily without unmounting.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const target = e.target;
      if (target instanceof Node && el.contains(target)) return;
      onOutside();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [ref, onOutside, enabled]);
}
