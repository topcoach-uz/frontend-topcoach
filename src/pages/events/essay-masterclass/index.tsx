import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EssayMasterclassCard from '../_components/EssayMasterclassCard';
import styles from '../events.module.scss';

/**
 * Standalone page for the essay masterclass with Shakhnoza Salimjonova
 * (August 16, 2026). The past-events grid card on /events links here,
 * mirroring how the other featured events open a page of their own.
 * Renders the featured card in archive mode: no reserve CTA, reads as a
 * record of the session.
 */
export default function EssayMasterclassPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'How to Write the Essay That Gets In - Top Coach';
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
          <EssayMasterclassCard archive />
        </div>
      </section>
    </main>
  );
}
