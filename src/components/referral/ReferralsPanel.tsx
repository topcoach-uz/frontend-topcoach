import { Card, Button, Table, Tag, Typography, message, Skeleton } from 'antd';
import { Copy, Gift, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useGetMyReferralCodeQuery,
  useGetReferralBonusBalanceQuery,
  useGetReferralHistoryQuery,
  type ReferralHistoryItem,
} from 'src/app/services/referralApi';
import { REFERRAL_DEFAULT_PERCENT } from 'src/constants/referral';

import styles from './ReferralsPanel.module.scss';

const { Text, Paragraph } = Typography;

const usd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value ?? 0);

/** Shown next to each history row so "why haven't I been paid" is answerable. */
const STATUS_TONE: Record<string, { color: string; key: string; fallback: string }> = {
  confirmed: { color: 'green', key: 'settings.referrals.status.confirmed', fallback: 'Confirmed' },
  pending: { color: 'gold', key: 'settings.referrals.status.pending', fallback: 'Pending' },
  paid: { color: 'blue', key: 'settings.referrals.status.paid', fallback: 'Paid out' },
  reversed: { color: 'default', key: 'settings.referrals.status.reversed', fallback: 'Refunded' },
};

/**
 * The user-facing referral panel: their code, what they have earned, and who
 * used it.
 *
 * Shared deliberately. Mentors get referral codes exactly like students do, but
 * they never see the student hub settings page, so rendering this in one place
 * and mounting it in both consoles is what stops mentors having a code they
 * cannot find.
 */
export default function ReferralsPanel() {
  const { t } = useTranslation();

  const { data: codeData, isLoading: codeLoading } = useGetMyReferralCodeQuery();
  const { data: balance, isLoading: balanceLoading } =
    useGetReferralBonusBalanceQuery();
  const { data: history = [], isLoading: historyLoading } =
    useGetReferralHistoryQuery();

  const code = codeData?.code ?? '';
  const shareUrl = code ? `https://topcoach.uz/?ref=${code}` : '';
  const shareText = t(
    'settings.referrals.shareText',
    `Get ${REFERRAL_DEFAULT_PERCENT}% off at TopCoach with my referral code: ${code}`,
    { percent: REFERRAL_DEFAULT_PERCENT, code },
  );

  const copy = async (value: string, confirmation: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(confirmation);
    } catch {
      message.error(
        t('settings.referrals.copyFailed', "Couldn't copy. Select it and copy manually."),
      );
    }
  };

  const columns = [
    {
      title: t('settings.referrals.col.who', 'Who'),
      dataIndex: 'refereeName',
      key: 'refereeName',
    },
    {
      title: t('settings.referrals.col.what', 'What'),
      dataIndex: 'productType',
      key: 'productType',
      render: (value: string | null) =>
        value
          ? t(`settings.referrals.product.${value}`, value)
          : t('settings.referrals.product.unknown', 'Purchase'),
    },
    {
      title: t('settings.referrals.col.spend', 'Their spend'),
      dataIndex: 'theirSpendUsd',
      key: 'theirSpendUsd',
      align: 'right' as const,
      render: (value: number) => usd(value),
    },
    {
      title: t('settings.referrals.col.earned', 'You earned'),
      dataIndex: 'youEarnedUsd',
      key: 'youEarnedUsd',
      align: 'right' as const,
      render: (value: number) => <strong>{usd(value)}</strong>,
    },
    {
      title: t('settings.referrals.col.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => {
        const tone = STATUS_TONE[value] ?? STATUS_TONE.pending;
        return <Tag color={tone.color}>{t(tone.key, tone.fallback)}</Tag>;
      },
    },
  ];

  return (
    <>
      <Card
        className={styles.card}
        title={
          <>
            <Gift size={18} style={{ marginRight: 8, verticalAlign: '-3px' }} />
            {t('settings.referrals.codeTitle', 'Your referral code')}
          </>
        }
      >
        {codeLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className={styles.codeRow}>
              <code className={styles.code}>{code}</code>
              <Button
                icon={<Copy size={15} />}
                onClick={() =>
                  copy(code, t('settings.referrals.codeCopied', 'Code copied.'))
                }
              >
                {t('settings.referrals.copyCode', 'Copy code')}
              </Button>
              <Button
                icon={<Send size={15} />}
                onClick={() =>
                  copy(
                    `${shareText} ${shareUrl}`,
                    t('settings.referrals.linkCopied', 'Share message copied.'),
                  )
                }
              >
                {t('settings.referrals.copyLink', 'Copy share link')}
              </Button>
            </div>
            <Paragraph type="secondary" className={styles.explainer}>
              {t(
                'settings.referrals.explainer',
                `Friends get ${REFERRAL_DEFAULT_PERCENT}% off any TopCoach purchase, and you earn ${REFERRAL_DEFAULT_PERCENT}% back on everything they buy.`,
                { percent: REFERRAL_DEFAULT_PERCENT },
              )}
            </Paragraph>
          </>
        )}
      </Card>

      <Card
        className={styles.card}
        title={t('settings.referrals.balanceTitle', 'Bonus earned')}
      >
        {balanceLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <>
            <div className={styles.balance}>{usd(balance?.balanceUsd ?? 0)}</div>
            <Text type="secondary">
              {t('settings.referrals.lifetime', 'Lifetime earned')}:{' '}
              {usd(balance?.lifetimeEarnedUsd ?? 0)}
            </Text>
            {/* Deliberately no date. Spending and withdrawal are designed for
                but not built, and promising a timeline we have not committed
                to is worse than saying nothing. */}
            <Paragraph type="secondary" className={styles.explainer}>
              {t(
                'settings.referrals.redeemNote',
                'Your balance keeps accruing. Spending and withdrawal are coming.',
              )}
            </Paragraph>
          </>
        )}
      </Card>

      <Card
        className={styles.card}
        title={t('settings.referrals.historyTitle', 'Who used your code')}
      >
        <Table<ReferralHistoryItem>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={history}
          loading={historyLoading}
          pagination={false}
          locale={{
            // Most people will see this on day one, so the empty state has to
            // do the explaining rather than just saying "no data".
            emptyText: (
              <div className={styles.empty}>
                <Text strong>
                  {t('settings.referrals.emptyTitle', 'No referrals yet')}
                </Text>
                <Paragraph type="secondary">
                  {t(
                    'settings.referrals.emptyBody',
                    'Share your code above. When someone uses it, their purchase shows up here with what you earned.',
                  )}
                </Paragraph>
              </div>
            ),
          }}
        />
      </Card>
    </>
  );
}
