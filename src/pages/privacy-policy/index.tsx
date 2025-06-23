import { Flex } from 'antd';
import styles from './privacy-policy.module.scss';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div className="container">
      <div className={styles.privacyPolicyContainer}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last updated: March 18, 2025</p>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
          <Flex gap={20} vertical>
            <div>
              <h3 className={styles.subsectionTitle}>
                1.1 Personal Information
              </h3>
              <ul className={styles.list}>
                <li>
                  Name, email address, phone number (if provided during
                  registration).
                </li>
                <li>
                  University, major, or academic background (if entered by
                  users).
                </li>
              </ul>
            </div>
            <div>
              <h3 className={styles.subsectionTitle}>
                1.2 Authentication Data
              </h3>
              <ul className={styles.list}>
                <li>
                  If you sign in using Google or other third-party providers, we
                  collect necessary authentication details (e.g., email, profile
                  name, avatar image).
                </li>
              </ul>
            </div>
            <div>
              <h3 className={styles.subsectionTitle}>1.3 Usage Data</h3>
              <ul className={styles.list}>
                <li>
                  Pages visited, session length, and interactions with the
                  platform (for analytics and improvements).
                </li>
                <li>IP address, browser type, and device information.</li>
              </ul>
            </div>
          </Flex>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            2. How We Use Your Information
          </h2>
          <ul className={styles.list}>
            <li>To provide authentication and secure login access.</li>
            <li>To connect mentors and students based on interests.</li>
            <li>To improve our platform and personalize recommendations.</li>
            <li>To comply with legal obligations and security measures.</li>
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Sharing of Data</h2>
          <ul className={styles.list}>
            <li>
              We do not sell or share personal data with third parties except in
              the following cases:
            </li>
            <h3 className={styles.subsectionTitle2}>Service Providers:</h3>
            <ul className={styles.list}>
              <li>
                We may use third-party tools (e.g., authentication providers,
                analytics tools, payment processors) to enhance platform
                functionality.
              </li>
            </ul>
            <h3 className={styles.subsectionTitle2}>Legal Requirements:</h3>
            <ul className={styles.list}>
              <li>If required by law or to protect our platform and users.</li>
            </ul>
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Data Security</h2>
          <ul className={styles.list}>
            <li>SSL encryption to protect data transmission.</li>
            <li>
              Secure storage of authentication tokens and hashed passwords.
            </li>
            <li>Access controls to prevent unauthorized data access.</li>
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Managing Your Information</h2>
          <ul className={styles.list}>
            <li>
              You can access and update some of your personal information
              through your Account settings. If you connected your account to a
              third-party service like LinkedIn or Google, you can manage those
              settings within your account.
            </li>
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Data Erasure</h2>
          <ul className={styles.list}>
            <li>
              In certain jurisdictions, you can request that your personal
              information be deleted. If you request data erasure:
            </li>
            <ul className={styles.list}>
              <li>
                We may retain personal data necessary for legal or business
                compliance (e.g., fraud prevention, legal reporting, tax
                records).
              </li>
              <li>
                Information shared with others (e.g., forum posts, reviews) may
                still be visible but will no longer be associated with your
                name.
              </li>
              <li>
                Some copies of data may remain in backups but will be
                inaccessible for normal platform operations.
              </li>
            </ul>
            <li>
              To request data deletion, contact us at{' '}
              <a href="mailto:support@topcoach.uz">support@topcoach.uz.</a>
            </li>
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Security Measures</h2>
          <ul className={styles.list}>
            <li>
              While no system is 100% secure, we continuously implement and
              update administrative, technical, and physical security measures
              to protect user data from unauthorized access, loss, destruction,
              or alteration.
            </li>
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Children's Privacy</h2>
          <ul className={styles.list}>
            <li>
              Our platform is not intended for individuals under the age of 13.
              We do not knowingly collect personal information from children
              under this age. If we become aware that a child has provided us
              with personal data, we will take steps to remove such information.
            </li>
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Online Privacy Policy Only</h2>
          <ul className={styles.list}>
            <li>
              This Privacy Policy applies only to information collected through
              our platform and not to offline interactions or other channels.
            </li>
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            10. Changes to This Privacy Policy
          </h2>
          <ul className={styles.list}>
            <li>
              We reserve the right to update this Privacy Policy in accordance
              with applicable law. Any changes will be posted here with an
              updated "Last Updated" date. If you do not agree with the changes,
              you may cancel your account. Continued use of the platform after
              updates constitutes acceptance of the revised policy.
            </li>
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Consent</h2>
          <ul className={styles.list}>
            <li>
              By using our platform, you consent to this Privacy Policy and
              agree to the{' '}
              <Link to="/terms-and-conditions">terms and conditions.</Link>
            </li>
            <li>
              For questions or concerns, contact us at{' '}
              <a href="mailto:support@topcoach.uz">support@topcoach.uz.</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
