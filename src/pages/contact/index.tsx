import { Flex } from 'antd';
import ContactDetails from './_components/details';
import MailForm from './_components/mail';
import LocationDetails from './_components/map';
import styles from './contact.module.scss';

export default function ContactPage() {
  return (
    <main className={styles.contact}>
      <div className={'container ' + styles.container}>
        <Flex gap={60} className={styles.contactWrapper}>
          <div>
            <ContactDetails />
            <LocationDetails />
          </div>
          <MailForm />
        </Flex>
      </div>
    </main>
  );
}
