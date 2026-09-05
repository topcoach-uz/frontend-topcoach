import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CheveningWorkshopCard from '../_components/CheveningWorkshopCard';
import styles from '../_components/CheveningWorkshop.module.scss';
import {
  isCheveningWorkshopLive,
  CHEVENING_WORKSHOP_TITLE,
} from '../_components/cheveningWorkshop';

export default function CheveningWorkshopPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${CHEVENING_WORKSHOP_TITLE} - Top Coach`;
    window.scrollTo(0, 0);
  }, []);

  return (
    <main>
      <section className={styles.shell}>
        <div className={styles.container}>
          <button
            type="button"
            onClick={() => navigate('/events')}
            className={styles.back}
          >
            <ArrowLeft size={16} /> All workshops
          </button>
          <CheveningWorkshopCard archive={!isCheveningWorkshopLive()} />
          <div className={styles.content}>
          <article className={styles.curriculum}>
            <span className={styles.label}>The conversation</span>
            <h2>A stronger application starts with understanding.</h2>
            <p>
              The Chevening Scholarship offers exceptional opportunities for future leaders, but a
              strong application calls for more than good academic results. Shirinkhon will explain
              what makes an application compelling and how to avoid the mistakes that hold applicants back.
            </p>
            <ol className={styles.topics}>
              {[
                'How to build a strong Chevening application',
                'What makes an application stand out',
                'Key things applicants should pay attention to',
                'Common mistakes to avoid during the application process',
                'Tips for approaching your Chevening journey strategically',
              ].map((topic, index) => <li key={topic}><span>0{index + 1}</span>{topic}</li>)}
            </ol>
          </article>
          <aside>
            <section className={styles.education}>
              <span className={styles.label}>Behind the expertise</span>
              <h2>Speaker’s education</h2>
              <div className={styles.degree}><span>2017 · United States</span><h3>BA in English / Professional Writing</h3><p>Minor in Biology<br />Kutztown University of Pennsylvania</p></div>
              <div className={styles.degree}><span>2026 · Uzbekistan</span><h3>MA in PR Management</h3><p>Journalism and Mass Communications University</p></div>
            </section>
            <details className={styles.dialIn}>
              <summary>Joining by phone?</summary>
              <p>Dial (US) <a href="tel:+13157951459">+1 315-795-1459</a><br />PIN: <strong>324 004 561#</strong></p>
              <a href="https://t.meet/szw-yubg-cvf" target="_blank" rel="noopener noreferrer">More dial-in numbers ↗</a>
            </details>
          </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
