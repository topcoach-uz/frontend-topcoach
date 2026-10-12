/**
 * Shared SAT dialogs with TopCoach styling, contained focus, and
 * interruptible entry/exit motion that respects reduced-motion settings.
 */

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./runner-modal.scss";

interface RunnerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Small uppercase eyebrow above the serif title. Optional. */
  eyebrow?: string;
  children: React.ReactNode;
  /** Optional footer slot — usually a row of buttons. */
  footer?: React.ReactNode;
  /** 480 (default) | 560 | 640 px — three preset widths */
  size?: "sm" | "md" | "lg";
}

export const RunnerModal: React.FC<RunnerModalProps> = ({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  size = "md",
}) => {
  const [present, setPresent] = useState(open);
  const card = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();

  // Keep the surface mounted while closing; reversals start at its live value.
  useEffect(() => {
    if (open && !present) {
      setPresent(true);
      return;
    }
    const element = card.current;
    if (!present || !element) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!element.animate) {
      if (!open) setPresent(false);
      return;
    }
    const current = getComputedStyle(element);
    const from = { opacity: current.opacity, transform: current.transform };
    const entering =
      open && current.opacity === "1" && current.transform === "none";
    const animation = element.animate(
      [
        entering
          ? { opacity: 0, transform: reduced ? "none" : "translateY(8px)" }
          : from,
        {
          opacity: open ? 1 : 0,
          transform: reduced || open ? "none" : "translateY(8px)",
        },
      ],
      {
        duration: reduced ? 100 : 180,
        easing: "cubic-bezier(.2,.8,.2,1)",
        fill: "both",
      },
    );
    animation.finished
      .then(() => {
        if (!open) setPresent(false);
      })
      .catch(() => {});
    return () => {
      // Preserve the presentation value before replacing an interrupted animation.
      const style = getComputedStyle(element);
      element.style.opacity = style.opacity;
      element.style.transform = style.transform;
      animation.cancel();
    };
  }, [open, present]);

  useEffect(() => {
    if (!present || !card.current) return;
    const trigger = document.activeElement as HTMLElement | null;
    const overlay = card.current.parentElement!;
    const siblings = Array.from(document.body.children).filter(
      (el) => el !== overlay,
    ) as HTMLElement[];
    const previous = siblings.map((el) => ({ el, inert: el.inert }));
    previous.forEach(({ el }) => {
      el.inert = true;
    });
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        card.current!.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]',
        ),
      ).filter((el) => el.getClientRects().length > 0);
    (
      card.current.querySelector<HTMLElement>("[autofocus]") ??
      focusable()[0] ??
      card.current
    ).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) {
        e.preventDefault();
        card.current?.focus();
        return;
      }
      if (
        !card.current?.contains(document.activeElement) ||
        (e.shiftKey && document.activeElement === first)
      ) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous.forEach(({ el, inert }) => {
        el.inert = inert;
      });
      document.body.style.overflow = oldOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [present]);

  if (!present) return null;
  return createPortal(
    <div className="rm-overlay" onClick={onClose} role="presentation">
      <div
        ref={card}
        tabIndex={-1}
        className={`rm-card rm-card--${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="rm-header">
          <div className="rm-header-text">
            {eyebrow && <div className="rm-eyebrow">{eyebrow}</div>}
            <h2 id={titleId} className="rm-title">
              {title}
            </h2>
          </div>
          <button className="rm-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="rm-body">{children}</div>
        {footer && <footer className="rm-footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
};

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Adds a red palette to the confirm button for destructive actions. */
  destructive?: boolean;
  /** Glyph at top-left. Defaults to a warning bullet. */
  glyph?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  glyph,
}) => {
  return (
    <RunnerModal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button className="rm-btn rm-btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`rm-btn ${destructive ? "rm-btn--danger" : "rm-btn--primary"}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="rm-confirm">
        <div
          className={`rm-confirm-glyph ${destructive ? "rm-confirm-glyph--danger" : ""}`}
        >
          {glyph ?? "!"}
        </div>
        <div className="rm-confirm-text">{description}</div>
      </div>
    </RunnerModal>
  );
};
