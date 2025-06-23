import styles from './terms-and-conditions.module.scss';

export default function TermsOfUsePage() {
  return (
    <div className="container">
      <div className={styles.termsOfUseContainer}>
        <h1 className={styles.title}>Terms and Conditions</h1>
        <p className={styles.lastUpdated}>Last updated: March 18, 2025</p>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Welcome to TopCoach.uz!</h2>
          <p>
            These terms and conditions outline the rules and regulations for the
            use of TopCoach.uz’s platform, located at https://www.topcoach.uz/.
          </p>
          <p>
            By accessing this website, we assume you accept these terms and
            conditions. Do not continue to use TopCoach.uz if you do not agree
            to take all of the terms and conditions stated on this page.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>License</h2>
          <p>
            Unless otherwise stated, TopCoach.uz and/or its licensors own the
            intellectual property rights for all material on the platform. All
            intellectual property rights are reserved.
          </p>
          <p>
            You may access this platform for personal use subject to the
            restrictions set in these terms and conditions. You must not:
          </p>
          <ul className={styles.list}>
            <li>Republish material from TopCoach.uz</li>
            <li>Sell, rent, or sub-license material from TopCoach.uz</li>
            <li>Reproduce, duplicate or copy material from TopCoach.uz</li>
            <li>Redistribute content from TopCoach.uz</li>
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>User-Generated Content</h2>
          <p>
            Users of TopCoach.uz may post and share comments, feedback, or other
            materials on the platform. By doing so, you grant TopCoach.uz a
            non-exclusive license to use, reproduce, and display your content
            for educational and promotional purposes.
          </p>
          <p>
            You are responsible for ensuring that your content does not violate
            any intellectual property rights, and you warrant that you have the
            necessary consent to share the content.
          </p>
          <p>
            TopCoach.uz reserves the right to remove content that is deemed
            inappropriate or violates these terms.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Linking to Our Content</h2>
          <p>
            You may link to TopCoach.uz’s home page and content, provided that:
          </p>
          <ul className={styles.list}>
            <li>The link is not misleading or deceptive;</li>
            <li>
              The link does not falsely imply sponsorship or endorsement by
              TopCoach.uz;
            </li>
            <li>
              The link fits within the context of the linking party’s site.
            </li>
          </ul>
          <p>
            Please contact us at{' '}
            <a href="mailto:support@topcoach.uz">support@topcoach.uz.</a> for
            approval if you wish to use TopCoach.uz content in any other way.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>iFrames</h2>
          <p>
            You may not create frames around our web pages without prior
            approval. We reserve the right to approve or deny any framing
            requests that alter the visual appearance of our platform.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Content Liability</h2>
          <p>
            TopCoach.uz is not responsible for any content displayed on
            third-party websites. By linking to our platform, you agree to
            protect and defend us from any claims that arise from your website's
            content.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Privacy</h2>
          <p>
            Please read our Privacy Policy to understand how we collect, store,
            and manage your data.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Reservation of Rights</h2>
          <p>
            We reserve the right to request the removal of links to our platform
            at any time. You agree to remove such links upon our request.
          </p>
          <p>
            We also reserve the right to modify these terms at any time. By
            continuing to use our platform, you agree to be bound by the updated
            terms.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Removal of Links</h2>
          <p>
            If you find any offensive or inappropriate links on our platform,
            please contact us, and we will review the request for removal.
          </p>
          <p>
            We do not guarantee that all links will be removed upon request, but
            we will review them as per our policies.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Disclaimer</h2>
          <p>
            To the maximum extent permitted by applicable law, we exclude all
            warranties and representations related to our platform and the use
            of the website.
          </p>
          <p>
            We are not liable for any loss or damage, including but not limited
            to indirect or consequential losses, that arise from using the
            platform.
          </p>
        </section>
      </div>
    </div>
  );
}
