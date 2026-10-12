import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export type InfoTipProps = {
  /** Tip content. HTML is allowed, matching the legacy `.info-box` markup. */
  tipHtml: string;
  /** Accessible label for the trigger button. */
  label?: string;
};

/**
 * Info button + tooltip.
 *
 * Behaviour mirrors the legacy `.algo-popup`:
 *   • shows transiently while hovering the trigger,
 *   • stays open (pinned) after a click,
 *   • dismisses on outside click, scroll, or Escape.
 *
 * The tooltip is rendered into `document.body` with fixed positioning so it
 * escapes the modal's `overflow: hidden`, just like the algo popup does. Using
 * a portal keeps React in control of the node instead of moving it around by hand.
 */
export default function InfoTip({ tipHtml, label = 'More info' }: InfoTipProps): ReactNode {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const boxRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [placed, setPlaced] = useState(false);
  const tipId = useId();

  const position = useCallback(() => {
    const btn = btnRef.current;
    const box = boxRef.current;
    if (!btn || !box) return;

    const rect = btn.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    // Prefer above the button, right-aligned; flip/clamp to stay in the viewport.
    let top = rect.top - boxRect.height - 8;
    let left = rect.right - boxRect.width;

    if (top < 10) top = rect.bottom + 8;
    if (left < 10) left = 10;
    if (left + boxRect.width > window.innerWidth - 10) left = window.innerWidth - boxRect.width - 10;
    if (top + boxRect.height > window.innerHeight - 10) top = window.innerHeight - boxRect.height - 10;
    if (top < 10) top = 10;

    box.style.top = `${top}px`;
    box.style.left = `${left}px`;
  }, []);

  // Position before paint so the tooltip never flashes at its default location.
  useLayoutEffect(() => {
    if (!open) {
      setPlaced(false);
      return;
    }
    position();
    setPlaced(true);
  }, [open, position]);

  // Keep an open tooltip anchored when the viewport is resized.
  useEffect(() => {
    if (!open) return;
    const onResize = () => position();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, position]);

  // Any scroll dismisses the tooltip (matches the algo popup).
  useEffect(() => {
    if (!open) return;
    const dismiss = () => {
      setOpen(false);
      setPinned(false);
    };
    window.addEventListener('scroll', dismiss, true);
    return () => window.removeEventListener('scroll', dismiss, true);
  }, [open]);

  // Clicking outside a pinned tooltip dismisses it.
  useEffect(() => {
    if (!open || !pinned) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (boxRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      setOpen(false);
      setPinned(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open, pinned]);

  // Escape dismisses the tooltip without closing the surrounding modal.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      setPinned(false);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  const onButtonClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pinned) {
      setOpen(false);
      setPinned(false);
    } else {
      setPinned(true);
      setOpen(true);
    }
  };

  return (
    <span
      className="info-wrapper"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!pinned) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        className="settings-info-btn"
        aria-label={label}
        aria-describedby={open ? tipId : undefined}
        onClick={onButtonClick}
      >
        <img src="res/info.svg" alt="" />
      </button>
      {open
        ? createPortal(
            <span
              ref={boxRef}
              id={tipId}
              role="tooltip"
              className="info-box show"
              style={{ visibility: placed ? 'visible' : 'hidden', pointerEvents: 'auto' }}
              dangerouslySetInnerHTML={{ __html: tipHtml }}
            />,
            document.body,
          )
        : null}
    </span>
  );
}
