import { Button, message } from 'antd';
import { Filter, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BillingHistoryEntryDto } from '../../types';
import { formatTableDate, formatUsdInline, formatUzs } from '../format';
import styles from './BillingHistory.module.scss';

export interface BillingHistoryProps {
  /** Receipts to render — only successful charges (no-refund policy). */
  entries: BillingHistoryEntryDto[];
  /** When true, the table is suppressed and an empty hint is shown. */
  hideRows?: boolean;
}

/**
 * Receipts table — driven by the parent's RTK Query data (or fixtures
 * in `?state=mock`). Per spec we have NO refunds, so REFUNDED status
 * never appears here. Row clicks just toast the mocked PDF download
 * until Phase 3 wires the real download endpoint.
 */
export default function BillingHistory({ entries, hideRows = false }: BillingHistoryProps) {
  const { t } = useTranslation();
  const rows = hideRows ? [] : entries;

  const handleRowClick = (invoiceNumber: string | null) => {
    message.info(
      t('settings.subscription.toast.pdf', 'Mocked: PDF download ({{invoice}})', {
        invoice: invoiceNumber ?? '—',
      }),
    );
  };

  return (
    <div className={styles.wrapper}>
      {rows.length === 0 ? (
        <div className={styles.empty}>
          {t(
            'settings.subscription.noBillingHistory',
            'No invoices yet. Receipts appear here after your first charge.',
          )}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('settings.subscription.col.date', 'Date')}</th>
                <th>{t('settings.subscription.col.description', 'Description')}</th>
                <th>{t('settings.subscription.col.amount', 'Amount')}</th>
                <th>{t('settings.subscription.col.status', 'Status')}</th>
                <th>{t('settings.subscription.col.invoice', 'Invoice')}</th>
                <th aria-label={t('settings.subscription.col.pdf', 'PDF')} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} onClick={() => handleRowClick(row.invoiceNumber)}>
                  <td>{formatTableDate(row.date.slice(0, 10))}</td>
                  <td>{row.description}</td>
                  <td>
                    {row.amountUsd != null && (
                      <div className={styles.amountUsd}>{formatUsdInline(row.amountUsd)}</div>
                    )}
                    <div className={styles.amountUzs}>≈ {formatUzs(row.amountUzs)} UZS</div>
                  </td>
                  <td>
                    <span className={`${styles.statusPill} ${styles.statusPaid}`}>
                      {t('settings.subscription.status.paid', 'Paid')}
                    </span>
                  </td>
                  <td>{row.invoiceNumber ?? '—'}</td>
                  <td>
                    <a
                      className={styles.invoiceLink}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRowClick(row.invoiceNumber);
                      }}
                    >
                      {t('settings.subscription.downloadPdf', 'PDF')}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Header-row buttons (Filter / Export CSV) live alongside the section
 * title in the page entry. Exported here so the page can render them
 * inside the section header without duplicating handlers.
 */
export function BillingHistoryHeaderActions() {
  const { t } = useTranslation();
  return (
    <div className={styles.headerActions}>
      <Button
        className={styles.btnGhost}
        size="small"
        icon={<Filter size={14} />}
        onClick={() =>
          message.info(t('settings.subscription.toast.filter', 'Mocked: filter receipts'))
        }
      >
        {t('settings.subscription.filter', 'Filter')}
      </Button>
      <Button
        className={styles.btnGhost}
        size="small"
        icon={<Download size={14} />}
        onClick={() =>
          message.info(t('settings.subscription.toast.exportCsv', 'Mocked: CSV exported'))
        }
      >
        {t('settings.subscription.exportCsv', 'Export CSV')}
      </Button>
    </div>
  );
}
