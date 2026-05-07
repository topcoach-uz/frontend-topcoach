/**
 * Editorial-style modal primitives used inside the SAT runner. Replaces
 * AntD's default Modal/confirm so the test surface stays cream/serif
 * matching the rest of the SAT prep UI.
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './runner-modal.scss';

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
  size?: 'sm' | 'md' | 'lg';
}

export const RunnerModal: React.FC<RunnerModalProps> = ({
  open, onClose, title, eyebrow, children, footer, size = 'md',
}) => {
  // Esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="rm-overlay" onClick={onClose} role="presentation">
      <div
        className={`rm-card rm-card--${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rm-title"
      >
        <header className="rm-header">
          <div className="rm-header-text">
            {eyebrow && <div className="rm-eyebrow">{eyebrow}</div>}
            <h2 id="rm-title" className="rm-title">{title}</h2>
          </div>
          <button className="rm-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <div className="rm-body">{children}</div>
        {footer && <footer className="rm-footer">{footer}</footer>}
      </div>
    </div>
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
  open, onCancel, onConfirm, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive = false, glyph,
}) => {
  return (
    <RunnerModal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button className="rm-btn rm-btn--ghost" onClick={onCancel}>{cancelLabel}</button>
          <button
            className={`rm-btn ${destructive ? 'rm-btn--danger' : 'rm-btn--primary'}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="rm-confirm">
        <div className={`rm-confirm-glyph ${destructive ? 'rm-confirm-glyph--danger' : ''}`}>
          {glyph ?? '!'}
        </div>
        <div className="rm-confirm-text">{description}</div>
      </div>
    </RunnerModal>
  );
};
