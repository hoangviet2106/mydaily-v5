import { useEffect, useRef } from "react";

export default function Modal({ open, title, children, onClose, footer }) {
  const panelRef = useRef(null);

  // ESC to close + lock body scroll + focus panel
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);

    // focus after paint
    const t = setTimeout(() => {
      panelRef.current?.focus?.();
    }, 0);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="mdModal" role="dialog" aria-modal="true" onMouseDown={onBackdrop}>
      <div
        className="mdModal__panel"
        ref={panelRef}
        tabIndex={-1}
        aria-label={typeof title === "string" ? title : "Dialog"}
      >
        <div className="mdModal__head">
          <div className="mdModal__title">
            <span className="mdModal__spark" aria-hidden="true" />
            {title}
          </div>
          <button type="button" className="mdModal__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="mdModal__body">{children}</div>
        {footer ? <div className="mdModal__foot">{footer}</div> : null}
      </div>
    </div>
  );
}
