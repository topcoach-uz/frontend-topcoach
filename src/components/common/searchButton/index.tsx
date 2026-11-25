import React from 'react';
import { Search } from 'lucide-react';
import './searchButton.scss';

interface SearchButtonProps {
  /** Diameter in px. Pick it a few px smaller than the field's height. */
  size?: number;
  /** "submit" inside a <form role="search">; "button" for live-filter fields. */
  type?: 'button' | 'submit';
  label?: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * The platform search button: a red circle with a white magnifier that sits
 * inside the right end of a search field. Without an onClick it focuses the
 * field it sits in (live-filter searches have nothing to submit).
 */
const SearchButton: React.FC<SearchButtonProps> = ({
  size = 32,
  type = 'button',
  label = 'Search',
  className,
  onClick,
}) => (
  <button
    type={type}
    className={`tc-search-btn${className ? ` ${className}` : ''}`}
    style={{ '--tc-search-btn-size': `${size}px` } as React.CSSProperties}
    aria-label={label}
    onClick={(event) => {
      if (onClick) {
        onClick(event);
        return;
      }
      if (type === 'submit') return;
      const root = event.currentTarget.closest('[data-search-root], .ant-input-affix-wrapper, form');
      root?.querySelector<HTMLInputElement>('input')?.focus();
    }}
  >
    <Search size={Math.round(size * 0.5)} strokeWidth={2.5} aria-hidden />
  </button>
);

export default SearchButton;
