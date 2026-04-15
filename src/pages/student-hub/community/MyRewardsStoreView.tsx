import React from 'react';
import { Button, Card, Input, Modal, Steps, Tag, message } from 'antd';
import { RefreshCw, Bot, ShoppingCart, User, Boxes, Coffee, GraduationCap, PenLine, Shirt, type LucideIcon } from 'lucide-react';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { RewardPointsBadge } from './RewardPointsBadge';
import styles from './communityHubMock.module.scss';

type RewardItem = {
  id: string;
  kind: 'coffee' | 'pack' | 'merch' | 'essay' | 'mentorship';
  title: string;
  desc: string;
  cost: number;
  status: 'Redeemable';
};

const MOCK_COINS = 1340;

const MOCK_REWARD_ITEMS: RewardItem[] = [
  { id: 'r1', kind: 'coffee', title: 'Coffee Chat', desc: '20-min TopCoach coaching call', cost: 800, status: 'Redeemable' },
  { id: 'r2', kind: 'pack', title: 'Premium Study Pack', desc: 'SAT & admissions practice bundle', cost: 1200, status: 'Redeemable' },
  { id: 'r3', kind: 'merch', title: 'TopCoach Merch', desc: 'T-shirt + sticker pack', cost: 600, status: 'Redeemable' },
  { id: 'r4', kind: 'essay', title: 'Full Essay Review', desc: '1 essay review with rubric', cost: 900, status: 'Redeemable' },
  { id: 'r5', kind: 'mentorship', title: '30-Min Mentorship', desc: 'Short 1:1 mentor session', cost: 1300, status: 'Redeemable' },
];

const REWARD_KIND_VISUAL: Record<
  RewardItem['kind'],
  { wrapClass: string; Icon: LucideIcon; label: string }
> = {
  coffee: { wrapClass: styles.rewardKindCoffee, Icon: Coffee, label: 'Coffee chat' },
  pack: { wrapClass: styles.rewardKindPack, Icon: Boxes, label: 'Study bundle' },
  merch: { wrapClass: styles.rewardKindMerch, Icon: Shirt, label: 'Merch' },
  essay: { wrapClass: styles.rewardKindEssay, Icon: PenLine, label: 'Essay review' },
  mentorship: { wrapClass: styles.rewardKindMentorship, Icon: GraduationCap, label: 'Mentorship' },
};

function RewardKindIcon({ kind, className }: { kind: RewardItem['kind']; className?: string }) {
  const { wrapClass, Icon, label } = REWARD_KIND_VISUAL[kind];
  return (
    <div
      className={`${styles.rewardImgWrap} ${wrapClass}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={label}
    >
      <span className={styles.rewardKindIcon}>
        <Icon aria-hidden />
      </span>
    </div>
  );
}

export default function MyRewardsStoreView() {
  const [coins, setCoins] = React.useState(MOCK_COINS);
  const [redeemModalOpen, setRedeemModalOpen] = React.useState(false);
  const [redeemStep, setRedeemStep] = React.useState(0);
  const [redeemProcessing, setRedeemProcessing] = React.useState(false);
  const [selectedReward, setSelectedReward] = React.useState<RewardItem | null>(null);
  const [search, setSearch] = React.useState('');

  const closeRedeemModal = () => {
    setRedeemModalOpen(false);
    setRedeemStep(0);
    setRedeemProcessing(false);
    setSelectedReward(null);
  };

  const openRedeemModal = (r: RewardItem) => {
    if (coins < r.cost) {
      message.info('Not enough points.');
      return;
    }
    setSelectedReward(r);
    setRedeemStep(0);
    setRedeemProcessing(false);
    setRedeemModalOpen(true);
  };

  const goNext = () => {
    if (!selectedReward) return;

    if (redeemStep === 0) return setRedeemStep(1);
    if (redeemStep === 1) return setRedeemStep(2);

    if (redeemStep === 2) {
      setRedeemProcessing(true);
      setTimeout(() => {
        setCoins((c) => Math.max(0, c - selectedReward.cost));
        setRedeemProcessing(false);
        setRedeemStep(3);
      }, 900);
      return;
    }

    closeRedeemModal();
  };

  const filteredRewards = MOCK_REWARD_ITEMS.filter((r) =>
    search ? r.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <>
      <Card className={styles.sectionCard} bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Available points
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#8b0000', marginTop: 4 }}>
              {coins.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 800, color: '#b45309' }}>pts</span>
            </div>
            <div style={{ color: '#64748b', fontWeight: 700, fontSize: 13, marginTop: 6 }}>
              Redeem rewards with a step-by-step flow.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rewards"
              style={{ width: 280 }}
            />
            <Button type="primary" icon={<ShoppingCart size={16} />} onClick={() => message.info('Pick a reward to redeem.')}>
              Redeem
            </Button>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className={styles.sectionSubHeader} style={{ marginBottom: 12 }}>
            Rewards Store
          </div>

          <div className={styles.trendingGrid} style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {filteredRewards.map((r) => {
              const canAfford = coins >= r.cost;
              return (
                <Card
                  key={r.id}
                  className={styles.rewardCard}
                  bordered={false}
                >
                  <div className={styles.rewardCardInner}>
                    <RewardKindIcon kind={r.kind} />

                    <div className={styles.rewardHeader}>
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.rewardTitle}>{r.title}</div>
                        <div className={styles.rewardDesc}>{r.desc}</div>
                      </div>

                      <Tag color={canAfford ? 'crimson' : 'default'} className={styles.rewardCostPill}>
                        {r.cost}
                      </Tag>
                    </div>

                    <div className={styles.rewardFooter}>
                      <div className={styles.rewardStatus}>{r.status}</div>
                      <Button type="primary" className={styles.rewardRedeemBtn} disabled={!canAfford} onClick={() => openRedeemModal(r)}>
                        Redeem
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Card>

      <Modal
        open={redeemModalOpen}
        onCancel={closeRedeemModal}
        footer={null}
        width={640}
        title="Redeem Rewards"
      >
        <Steps
          size="small"
          current={redeemStep}
          items={[{ title: 'Review' }, { title: 'Confirm' }, { title: 'Redeeming' }, { title: 'Done' }]}
        />

        <div style={{ marginTop: 16 }}>
          {!selectedReward ? (
            <div>Loading...</div>
          ) : redeemStep === 0 ? (
            <div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <RewardKindIcon kind={selectedReward.kind} className={styles.rewardModalThumb} />
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: '#0f172a' }}>{selectedReward.title}</div>
                  <div style={{ color: '#64748b', fontWeight: 700, marginTop: 4 }}>{selectedReward.desc}</div>
                  <div style={{ marginTop: 10 }}>
                    <RewardPointsBadge cost={selectedReward.cost} canAfford />
                  </div>
                </div>
              </div>
              <div style={{ color: '#64748b', marginTop: 14, fontWeight: 650 }}>
                Step 1: We will reserve your redemption and verify coin balance.
              </div>
            </div>
          ) : redeemStep === 1 ? (
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>Step 2: Confirm redemption</div>
              <div style={{ color: '#64748b', fontWeight: 700, marginTop: 8 }}>
                Confirm redemption for <span style={{ color: '#8b0000', fontWeight: 900 }}>{selectedReward.title}</span>.
              </div>
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #f0f0f0', borderRadius: 12, padding: 12 }}>
                  Delivery/booking method: <b>TopCoach notification</b>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #f0f0f0', borderRadius: 12, padding: 12 }}>
                  Estimated processing: <b>~1 minute</b>
                </div>
              </div>
            </div>
          ) : redeemStep === 2 ? (
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>Step 3: Redeeming...</div>
              <div style={{ color: '#64748b', fontWeight: 700, marginTop: 8 }}>
                Deducting points and creating your redemption record.
              </div>
              <div style={{ marginTop: 16, border: '1px solid #f0f0f0', background: '#f8fafc', borderRadius: 12, padding: 14 }}>
                Status: <b>{redeemProcessing ? 'Processing' : 'Almost there'}</b>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 1000, fontSize: 18, color: '#0f172a' }}>Success!</div>
              <div style={{ color: '#64748b', fontWeight: 700, marginTop: 8 }}>
                You redeemed <b style={{ color: '#8b0000' }}>{selectedReward.title}</b>. Check your notifications to continue.
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Cost:</span>
                <RewardPointsBadge cost={selectedReward.cost} canAfford />
                <Tag style={{ fontWeight: 800, margin: 0 }}>
                  Balance: {coins.toLocaleString()} pts
                </Tag>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <Button onClick={closeRedeemModal}>Cancel</Button>
          <div style={{ display: 'flex', gap: 10 }}>
            {redeemStep > 0 && redeemStep < 3 && (
              <Button onClick={() => setRedeemStep((s) => Math.max(0, s - 1))} disabled={redeemProcessing}>
                Back
              </Button>
            )}
            <Button type="primary" onClick={goNext} disabled={redeemProcessing}>
              {redeemStep === 3 ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

