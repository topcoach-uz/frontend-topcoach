import styles from './navigation.module.scss';
import useNavigation from './useNavigation';

interface Props {
  direction?: 'vertical' | 'horizontal';
}

export default function Navigation({ direction = 'horizontal' }: Props) {
  const { navLinks, isActive } = useNavigation();

  return (
    <nav className={styles.nav}>
      <ul
        className={`${styles.ul} ${direction === 'vertical' ? styles.vertical : ''}`}
      >
        {navLinks.map((link, i) => (
          <li key={i}>
            <a
              className={`${styles.link} ${isActive(link.path) ? styles.link_active : ''}`}
              href={link.path}
            >
              {link.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
