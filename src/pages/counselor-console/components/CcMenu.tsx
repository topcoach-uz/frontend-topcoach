import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Editorial popover menu for the counselor console — replaces AntD's Dropdown/
 * Menu so row-action and export menus match the console's magazine aesthetic
 * (cream surface, hairline dividers, maroon hover, serif-adjacent type).
 *
 * The panel is portalled to <body> and positioned with fixed coords off the
 * trigger's rect, so it is never clipped by an ancestor's `overflow: hidden`
 * (e.g. the roster table shell). Closes on outside-click, Escape, or scroll.
 */
export type CcMenuItem =
  | { type: 'divider' }
  | {
      key: string;
      label: ReactNode;
      icon?: ReactNode;
      danger?: boolean;
      disabled?: boolean;
      onClick?: () => void;
    };

export function CcMenu({
  items,
  children,
  align = 'right',
  ariaLabel,
  disabled,
  triggerClassName,
}: {
  items: CcMenuItem[];
  children: ReactNode;
  align?: 'left' | 'right';
  ariaLabel?: string;
  disabled?: boolean;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    setCoords({
      top: r.bottom + 6,
      left: align === 'right' ? r.right : r.left,
    });
  }, [align]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!open) place();
    setOpen((o) => !o);
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        triggerRef.current?.contains(t) ||
        panelRef.current?.contains(t)
      )
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`cc-menu-trigger ${triggerClassName ?? ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggle}
      >
        {children}
      </button>
      {open && coords
        ? createPortal(
            <div
              ref={panelRef}
              className={`cc-portal cc-menu-pop cc-menu-pop--${align}`}
              role="menu"
              style={{ top: coords.top, left: coords.left }}
              onClick={(e) => e.stopPropagation()}
            >
              {items.map((it, i) =>
                'type' in it ? (
                  <div
                    key={`d-${i}`}
                    className="cc-menu-divider"
                    role="separator"
                  />
                ) : (
                  <button
                    key={it.key}
                    type="button"
                    role="menuitem"
                    disabled={it.disabled}
                    className={`cc-menu-item ${
                      it.danger ? 'cc-menu-item--danger' : ''
                    }`}
                    onClick={() => {
                      if (it.disabled) return;
                      setOpen(false);
                      it.onClick?.();
                    }}
                  >
                    {it.icon ? (
                      <span className="cc-menu-item-ico">{it.icon}</span>
                    ) : null}
                    <span className="cc-menu-item-label">{it.label}</span>
                  </button>
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
