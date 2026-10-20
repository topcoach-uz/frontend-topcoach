import { useTranslation } from 'react-i18next';
import type { BillingHistoryEntryDto } from '../../types';
import { formatTableDate, formatUzs } from '../format';
import styles from './BillingHistory.module.scss';

export interface BillingHistoryProps {
  entries: BillingHistoryEntryDto[];
  hideRows?: boolean;
}
export default function BillingHistory({
  entries,
  hideRows = false,
}: BillingHistoryProps) {
  const { t } = useTranslation();
  const rows = hideRows ? [] : entries;
  const labels = {
    date: t('settings.subscription.col.date', 'Date'),
    description: t('settings.subscription.col.description', 'Description'),
    amount: t('settings.subscription.col.amount', 'Amount'),
    status: t('settings.subscription.col.status', 'Status'),
    invoice: t('accountNav.transaction', 'Transaction'),
  };
  const paid = (
    <span className={`${styles.statusPill} ${styles.statusPaid}`}>
      {t('settings.subscription.status.paid', 'Paid')}
    </span>
  );
  if (!rows.length)
    return (
      <p className={styles.empty}>
        {t(
          'settings.subscription.noBillingHistory',
          'No invoices yet. Receipts appear here after your first charge.',
        )}
      </p>
    );
  return (
    <div className={styles.wrapper}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>
            {t('accountNav.payments', 'Confirmed payments')}
          </caption>
          <thead>
            <tr>
              {Object.entries(labels).map(([key, label]) => (
                <th key={key} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatTableDate(row.date.slice(0, 10))}</td>
                <td>{row.description}</td>
                <td className={styles.amount}>
                  {formatUzs(row.amountUzs)} UZS
                </td>
                <td>{paid}</td>
                <td className={styles.reference}>{row.invoiceNumber ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul
        className={styles.mobileList}
        aria-label={t('accountNav.payments', 'Confirmed payments')}
      >
        {rows.map((row) => (
          <li key={row.id} className={styles.paymentCard}>
            <div className={styles.cardHeading}>
              <strong>{row.description}</strong>
              {paid}
            </div>
            <p className={styles.cardAmount}>{formatUzs(row.amountUzs)} UZS</p>
            <dl className={styles.details}>
              <div>
                <dt>{labels.date}</dt>
                <dd>{formatTableDate(row.date.slice(0, 10))}</dd>
              </div>
              <div>
                <dt>{labels.invoice}</dt>
                <dd>{row.invoiceNumber ?? '—'}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
