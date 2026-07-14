import { useEffect, useState } from 'react';

/** Initials fallback for a display name (1–2 letters, uppercase). */
function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Editorial roster avatar — shows the student's profile image when present,
 * falling back to tinted initials. Handles broken/blocked image URLs by
 * reverting to initials.
 */
export function CcAvatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  // Reset the error state if the URL changes (row recycling in a virtualized
  // or paginated list).
  useEffect(() => {
    setBroken(false);
  }, [src]);

  const showImg = !!src && !broken;

  return (
    <span
      className={`cc-avatar ${className ?? ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {showImg ? (
        <img
          className="cc-avatar-img"
          src={src as string}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="cc-avatar-initials">{initialsFor(name)}</span>
      )}
    </span>
  );
}
