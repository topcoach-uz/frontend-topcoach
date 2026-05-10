import {
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import styles from './OtpInput.module.scss';

export interface OtpInputProps {
  /** Number of digits (Atmos sends 6). */
  length?: number;
  value: string;
  onChange: (next: string) => void;
  /** Fired when the user types/pastes the full code. */
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * 6-digit OTP input with one box per digit. Behaviors:
 *   - Auto-advance focus on typing.
 *   - Backspace clears current; if empty, jumps to previous box.
 *   - Pasting a 6-digit string fills all boxes at once.
 *   - Calls `onComplete` exactly once when all boxes are filled.
 *
 * Numeric inputMode keeps mobile keyboards on the digit pad. We don't
 * use `<input type="number">` because it allows `e`, `+`, `-`, etc.
 */
export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  autoFocus = false,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [completedFor, setCompletedFor] = useState<string | null>(null);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  // Fire onComplete exactly once per filled-out value (re-firing on
  // re-render of the same value would double-submit).
  useEffect(() => {
    if (
      value.length === length &&
      /^\d+$/.test(value) &&
      completedFor !== value
    ) {
      setCompletedFor(value);
      onComplete?.(value);
    }
    if (value.length < length && completedFor) {
      setCompletedFor(null);
    }
  }, [value, length, completedFor, onComplete]);

  const setDigit = (idx: number, digit: string) => {
    const next = value.split('');
    while (next.length < length) next.push('');
    next[idx] = digit;
    onChange(next.join('').slice(0, length));
  };

  const handleChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      if (!raw) {
        setDigit(idx, '');
        return;
      }
      // Multi-digit (mobile autofill) — distribute across boxes.
      if (raw.length > 1) {
        const merged = (value.slice(0, idx) + raw)
          .replace(/\D/g, '')
          .slice(0, length);
        onChange(merged);
        const lastFilled = Math.min(merged.length, length) - 1;
        refs.current[Math.min(lastFilled + 1, length - 1)]?.focus();
        return;
      }
      setDigit(idx, raw);
      if (idx < length - 1) refs.current[idx + 1]?.focus();
    };

  const handleKeyDown =
    (idx: number) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (value[idx]) {
          setDigit(idx, '');
        } else if (idx > 0) {
          refs.current[idx - 1]?.focus();
          setDigit(idx - 1, '');
        }
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        refs.current[idx - 1]?.focus();
      } else if (e.key === 'ArrowRight' && idx < length - 1) {
        refs.current[idx + 1]?.focus();
      }
    };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div
      className={`${styles.row} ${hasError ? styles.hasError : ''}`}
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          className={styles.box}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[idx] ?? ''}
          onChange={handleChange(idx)}
          onKeyDown={handleKeyDown(idx)}
          disabled={disabled}
          aria-label={`Digit ${idx + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
