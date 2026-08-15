import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PersonalStatementWorkshopCard from '../_components/PersonalStatementWorkshopCard';
import styles from '../events.module.scss';

/**
 * Standalone page for the Personal Statement Workshop replay (Nazira
 * Davroni). The grid card on /events links here, mirroring how the
 * other featured events open a page of their own.
 */
export default function PersonalStatementWorkshopPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Personal Statement Workshop - Top Coach';
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
          <PersonalStatementWorkshopCard />
        </div>
      </section>
    </main>
  );
}
