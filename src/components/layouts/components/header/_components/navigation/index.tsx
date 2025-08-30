import styles from './navigation.module.scss';
import useNavigation from './useNavigation';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  direction?: 'vertical' | 'horizontal';
}

export default function Navigation({ direction = 'horizontal' }: Props) {
  const { navLinks, isActive } = useNavigation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleDropdownToggle = (text: string) => {
    setOpenDropdown(openDropdown === text ? null : text);
  };

  const handleDropdownClose = () => {
    if (!isHovering) {
      setOpenDropdown(null);
    }
  };

  const handleDropdownOpen = (text: string) => {
    setOpenDropdown(text);
  };

  const handleMouseEnter = (text: string) => {
    setIsHovering(true);
    setOpenDropdown(text);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setOpenDropdown(null);
  };

  return (
    <nav className={styles.nav}>
      <ul
        className={`${styles.ul} ${direction === 'vertical' ? styles.vertical : ''}`}
      >
        {navLinks.map((link, i) => (
          <li key={i} className={styles.navItem}>
            {link.children ? (
              <div 
                className={styles.dropdownContainer}
                onMouseEnter={() => handleMouseEnter(link.text)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`${styles.link} ${styles.dropdownTrigger}`}
                  onClick={() => handleDropdownToggle(link.text)}
                >
                  {link.text}
                  <svg className={styles.dropdownArrow} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {openDropdown === link.text && (
                  <div 
                    className={styles.dropdown}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    {link.children.map((child, j) => (
                      <Link
                        key={j}
                        className={`${styles.dropdownLink} ${isActive(child.path) ? styles.dropdownLink_active : ''}`}
                        to={child.path}
                      >
                        {child.text}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                className={`${styles.link} ${link.path && isActive(link.path) ? styles.link_active : ''}`}
                to={link.path || '/'}
              >
                {link.text}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
