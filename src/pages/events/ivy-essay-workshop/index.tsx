import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import IvyEssayWorkshopCard from '../_components/IvyEssayWorkshopCard';
import { isIvyEssayWorkshopLive } from '../_components/ivyEssayWorkshop';
import styles from '../events.module.scss';

/**
 * Standalone page for "How to Craft an Ivy League-Worthy Personal Essay"
 * with Kenza (Princeton). The grid card on /events links here once the
 * session has run, mirroring how the other featured events open a page
 * of their own. The card is handed `archive` only once the session has
 * passed, so a direct visit before August 26 still reads as an
 * invitation with the join CTA rather than as a record.
 */
export default function IvyEssayWorkshopPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Ivy League-Worthy Personal Essay Workshop - Top Coach';
    window.scrollTo(0, 0);
  }, []);

  return (
    <main>
      <section className={styles.shell}>
        <div className={styles.container}>
          <button
            type="button"
            onClick={() => navigate('/events')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              background: 'none',
              padding: 0,
              marginBottom: 20,
              cursor: 'pointer',
              color: '#6b6258',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> All workshops
          </button>
          <IvyEssayWorkshopCard archive={!isIvyEssayWorkshopLive()} />
        </div>
      </section>
    </main>
  );
}
