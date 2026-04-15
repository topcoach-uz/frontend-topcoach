import React from 'react';
import { Button, Card, Input, Modal, Steps, Tag, message } from 'antd';
import { BookOpen, Compass, MessageCircle, Network, RefreshCw, Bot, Search, ShoppingCart, Trophy, User } from 'lucide-react';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import styles from './communityHubMock.module.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import { RewardPointsBadge } from './RewardPointsBadge';

const MOCK_COINS = 1340;

const MOCK_REWARD_ITEMS = [
  { id: 'r1', kind: 'coffee', title: 'Coffee Chat', desc: '20-min TopCoach coaching call', cost: 800, status: 'Redeemable' },
  { id: 'r2', kind: 'pack', title: 'Premium Study Pack', desc: 'SAT & admissions practice bundle', cost: 1200, status: 'Redeemable' },
  { id: 'r3', kind: 'merch', title: 'TopCoach Merch', desc: 'T-shirt + sticker pack', cost: 600, status: 'Redeemable' },
  { id: 'r4', kind: 'essay', title: 'Full Essay Review', desc: '1 essay review with rubric', cost: 900, status: 'Redeemable' },
  { id: 'r5', kind: 'mentorship', title: '30-Min Mentorship', desc: 'Short 1:1 mentor session', cost: 1300, status: 'Redeemable' },
];

function rewardMockSvgDataUri(kind: string, label: string) {
  const palette: Record<string, { bg: string; fg: string; accent: string }> = {
    coffee: { bg: '#b91c1c', fg: '#ffffff', accent: '#fde68a' },
    pack: { bg: '#3b82f6', fg: '#ffffff', accent: '#93c5fd' },
    merch: { bg: '#8b0000', fg: '#ffffff', accent: '#fda4af' },
    essay: { bg: '#111827', fg: '#ffffff', accent: '#a7f3d0' },
    mentorship: { bg: '#6d28d9', fg: '#ffffff', accent: '#ddd6fe' },
  };

  const p = palette[kind] ?? palette.pack;

  const iconPath = (() => {
    if (kind === 'coffee') {
      return `
        <g transform="translate(0,2)">
          <path d="M55 65c0 18-10 30-24 30s-24-12-24-30c0-10 4-18 11-23 3-2 7-3 13-3s10 1 13 3c7 5 11 13 11 23z" fill="${p.accent}" opacity="0.95"/>
          <path d="M27 28h36c5 0 9 4 9 9v14c0 12-10 22-22 22H40c-12 0-22-10-22-22V37c0-5 4-9 9-9z" fill="${p.fg}" opacity="0.95"/>
          <path d="M63 30c10-4 18 4 16 14l-2 12c-2 10-8 13-14 12" fill="none" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/>
        </g>
      `;
    }
    if (kind === 'merch') {
      return `
        <g>
          <path d="M32 28l10-10h16l10 10 16 8-10 18-6-4v44H26V50l-6 4-10-18 22-8z" fill="${p.fg}" opacity="0.95"/>
          <path d="M48 44l-10 8v24h20V52l-10-8z" fill="${p.accent}" opacity="0.9"/>
        </g>
      `;
    }
    if (kind === 'essay') {
      return `
        <g>
          <path d="M34 20h38v80H34z" fill="${p.fg}" opacity="0.95"/>
          <path d="M48 40h20" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/>
          <path d="M44 56h24" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/>
          <path d="M46 72h22" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/>
          <path d="M34 20l14 14h24" fill="none" stroke="${p.accent}" stroke-width="6" stroke-linejoin="round"/>
        </g>
      `;
    }
    if (kind === 'mentorship') {
      return `
        <g>
          <circle cx="52" cy="42" r="18" fill="${p.fg}" opacity="0.95"/>
          <path d="M22 100c4-24 18-38 30-38s26 14 30 38" fill="${p.accent}" opacity="0.9"/>
          <path d="M85 24l10 10-10 10" fill="none" stroke="${p.fg}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      `;
    }
    return `
      <g>
        <rect x="26" y="24" width="52" height="74" rx="10" fill="${p.fg}" opacity="0.95"/>
        <path d="M36 40h32" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/>
        <path d="M36 56h28" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/>
        <path d="M36 72h24" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/>
      </g>
    `;
  })();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="88" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.bg}" stop-opacity="1"/>
          <stop offset="1" stop-color="${p.bg}" stop-opacity="0.7"/>
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="88" height="88" rx="18" fill="url(#g)"/>
      ${iconPath}
      <text x="50" y="97" text-anchor="middle" font-size="10" font-family="Arial" fill="${p.accent}" font-weight="800">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function LeftNavMock() {
  const navigate = useNavigate();
  const location = useLocation();
  const sectionParam = new URLSearchParams(location.search).get('section');

  return (
    <div className={styles.leftNav}>
      <div className={styles.leftNavHeader}>YOUR JOURNEY</div>
      <button type="button" className={styles.navItem} onClick={() => navigate('/student-hub/dashboard')}>
        <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
          <UnifiedIcon name="dashboard" size="sm" color="#fff" />
        </span>
        <span className={styles.navLabel}>Dashboard</span>
      </button>
      <div className={styles.sideCardGroup}>
        <div className={styles.sideCardGroupTitle}>
          <span className={styles.sideCardGroupTitleIcon} style={{ backgroundColor: '#8b0000' }}>
            <RefreshCw size={16} color="#fff" />
          </span>
          Others
        </div>
        <div className={styles.sideCardMiniGrid}>
          <button
            type="button"
            className={`${styles.miniNavCard} ${location.pathname === '/student-hub/full-support' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/student-hub/full-support')}
          >
            <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
              <UnifiedIcon name="full-support" size="sm" color="#fff" />
            </span>
            <span className={styles.navLabel}>Full Support</span>
          </button>
          <button
            type="button"
            className={`${styles.miniNavCard} ${location.pathname === '/student-hub/applications' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/student-hub/applications')}
          >
            <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
              <UnifiedIcon name="applications" size="sm" color="#fff" />
            </span>
            <span className={styles.navLabel}>College Lists</span>
          </button>
          <button
            type="button"
            className={`${styles.miniNavCard} ${location.pathname === '/student-hub/psychometric-assessment' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/student-hub/psychometric-assessment')}
          >
            <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
              <UnifiedIcon name="activity" size="sm" color="#fff" />
            </span>
            <span className={styles.navLabel}>Major Match</span>
          </button>
          <button
            type="button"
            className={`${styles.miniNavCard} ${location.pathname === '/student-hub/opportunities' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/student-hub/opportunities')}
          >
            <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
              <UnifiedIcon name="opportunities" size="sm" color="#fff" />
            </span>
            <span className={styles.navLabel}>Opportunities</span>
          </button>
          <button
            type="button"
            className={`${styles.miniNavCard} ${location.pathname === '/student-hub/essays' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/student-hub/essays')}
          >
            <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
              <UnifiedIcon name="essays" size="sm" color="#fff" />
            </span>
            <span className={styles.navLabel}>Essays</span>
          </button>
          <button
            type="button"
            className={`${styles.miniNavCard} ${location.pathname === '/student-hub/documents' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/student-hub/documents')}
          >
            <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
              <UnifiedIcon name="documents" size="sm" color="#fff" />
            </span>
            <span className={styles.navLabel}>Documents</span>
          </button>
          <button
            type="button"
            className={`${styles.miniNavCard} ${location.pathname === '/student-hub/profile' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/student-hub/profile')}
          >
            <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
              <UnifiedIcon name="profile" size="sm" color="#fff" />
            </span>
            <span className={styles.navLabel}>My Profile</span>
          </button>
        </div>
      </div>

      <div className={styles.leftNavHeader}>COMMUNITY</div>
      <button type="button" className={styles.navItem} onClick={() => navigate('/student-hub')}>
        <span className={styles.navIconCircle} style={{ backgroundColor: '#b91c1c' }}>
          <Compass size={16} color="#fff" />
        </span>
        <span className={styles.navLabel}>Feed</span>
      </button>

      <div className={styles.sideCardGroup}>
        <div className={styles.sideCardGroupTitle}>
          <span className={styles.sideCardGroupTitleIcon} style={{ backgroundColor: '#b91c1c' }}>
            <Network size={16} color="#fff" />
          </span>
          More
        </div>
        <div className={styles.sideCardMiniGrid}>
          <button
            type="button"
            className={`${styles.miniNavCard} ${sectionParam === 'buddies' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/student-hub?section=buddies')}
          >
            <span className={styles.navIconCircle} style={{ backgroundColor: '#b91c1c' }}>
              <User size={16} color="#fff" />
            </span>
            <span className={styles.navLabel}>Find Buddies</span>
          </button>
          <button
            type="button"
            className={`${styles.miniNavCard} ${location.pathname === '/mentors' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/mentors')}
          >
            <span className={styles.navIconCircle} style={{ backgroundColor: '#b91c1c' }}>
              <UnifiedIcon name="mentors" size="sm" color="#fff" />
            </span>
            <span className={styles.navLabel}>Mentors</span>
          </button>
          <button
            type="button"
            className={`${styles.miniNavCard} ${sectionParam === 'messages' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/student-hub?section=messages')}
          >
            <span className={styles.navIconCircle} style={{ backgroundColor: '#b91c1c' }}>
              <MessageCircle size={16} color="#fff" />
            </span>
            <span className={styles.navLabel}>Messages</span>
          </button>
        </div>
      </div>

      <div className={styles.leftNavHeader}>LEARNING</div>
      <button type="button" className={styles.navItem} onClick={() => navigate('/student-hub?section=learning&tab=sat')}>
        <span className={styles.navIconCircle} style={{ backgroundColor: '#3b82f6' }}>
          <BookOpen size={16} color="#fff" />
        </span>
        <span className={styles.navLabel}>Learning</span>
      </button>

      <div className={styles.leftNavHeader}>ACCOUNT</div>
      <button type="button" className={styles.navItem} onClick={() => navigate('/student-hub/rewards')}>
        <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
          <RefreshCw size={16} color="#fff" />
        </span>
        <span className={styles.navLabel}>Account</span>
      </button>
      <div className={styles.accountSubItems}>
        <button type="button" className={styles.navCardItem} onClick={() => navigate('/student-hub/rewards')}>
          <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
            <Trophy size={16} color="#fff" />
          </span>
          <span className={styles.navLabel}>My Rewards</span>
        </button>
        <button type="button" className={styles.navCardItem} onClick={() => navigate('/student-hub/profile?tab=settings')}>
          <span className={styles.navIconCircle} style={{ backgroundColor: '#8b0000' }}>
            <UnifiedIcon name="settings" size="sm" color="#fff" />
          </span>
          <span className={styles.navLabel}>Settings</span>
        </button>
      </div>
    </div>
  );
}

export default function MyRewardsMockPage() {
  type RewardItem = (typeof MOCK_REWARD_ITEMS)[number];

  const [coins, setCoins] = React.useState(MOCK_COINS);
  const [redeemModalOpen, setRedeemModalOpen] = React.useState(false);
  const [redeemStep, setRedeemStep] = React.useState(0);
  const [redeemProcessing, setRedeemProcessing] = React.useState(false);
  const [selectedReward, setSelectedReward] = React.useState<RewardItem | null>(null);

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

    if (redeemStep === 0) {
      setRedeemStep(1);
      return;
    }

    if (redeemStep === 1) {
      setRedeemStep(2);
      return;
    }

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

  return (
    <div className={styles.hub}>
      <div className={styles.leftCol}>
        <LeftNavMock />
      </div>

      <div className={styles.centerCol}>
        <div className={styles.centerTopBar}>
          <div className={styles.centerTitle}>My Rewards</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input prefix={<Search size={16} />} placeholder="Search rewards" style={{ width: 280 }} />
          </div>
        </div>

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
                Earn points by completing verified learning actions.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div className={styles.sectionSubHeader} style={{ marginBottom: 12 }}>
              Rewards Store
            </div>

            <div className={styles.trendingGrid} style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {MOCK_REWARD_ITEMS.map((r) => {
                const canAfford = coins >= r.cost;
                return (
                  <Card key={r.id} className={styles.groupCard} bordered={false} style={{ border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                      <div className={styles.rewardImgWrap}>
                        <img
                          src={rewardMockSvgDataUri(r.kind, r.kind === 'coffee' ? 'COFFEE' : r.kind === 'merch' ? 'MERCH' : r.kind === 'essay' ? 'ESSAY' : r.kind === 'mentorship' ? 'MENTOR' : 'PACK')}
                          alt={r.title}
                          className={styles.rewardImg}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 900, color: '#0f172a' }}>{r.title}</div>
                          <div style={{ color: '#64748b', fontWeight: 700, fontSize: 12, marginTop: 4 }}>{r.desc}</div>
                        </div>
                        <RewardPointsBadge cost={r.cost} canAfford={canAfford} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 14 }}>
                      <div style={{ color: '#64748b', fontWeight: 800, fontSize: 12 }}>{r.status}</div>
                      <Button
                        type="primary"
                        disabled={!canAfford}
                        onClick={() => openRedeemModal(r)}
                      >
                        Redeem
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.rightCol}>
        <div className={styles.rightSticky}>
          <Card className={styles.rightCard} title="Connect">
            <div style={{ color: '#64748b', fontWeight: 700, fontSize: 13 }}>Connect with mentors and buddies.</div>
          </Card>

          <Card className={styles.rightCard} title="Trending">
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color="magenta">#SATMath2026</Tag>
                <span style={{ color: '#64748b', fontWeight: 800, fontSize: 12 }}>64 posts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color="magenta">#MedSchoolEssay</Tag>
                <span style={{ color: '#64748b', fontWeight: 800, fontSize: 12 }}>847 posts</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

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
          items={[
            { title: 'Review' },
            { title: 'Confirm' },
            { title: 'Redeeming' },
            { title: 'Done' },
          ]}
        />

        <div style={{ marginTop: 16 }}>
          {!selectedReward ? (
            <div>Loading...</div>
          ) : redeemStep === 0 ? (
            <div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div className={styles.rewardImgWrap} style={{ width: 132, height: 80, margin: 0 }}>
                  <img
                    src={rewardMockSvgDataUri(selectedReward.kind, 'ITEM')}
                    alt={selectedReward.title}
                    className={styles.rewardImg}
                  />
                </div>
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
                <Tag style={{ fontWeight: 800, margin: 0 }}>Balance: {coins.toLocaleString()} pts</Tag>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={closeRedeemModal}>Cancel</Button>
          <div style={{ display: 'flex', gap: 10 }}>
            {redeemStep > 0 && redeemStep < 3 && (
              <Button
                onClick={() => setRedeemStep((s) => Math.max(0, s - 1))}
                disabled={redeemProcessing}
              >
                Back
              </Button>
            )}
            <Button type="primary" onClick={goNext} disabled={redeemProcessing}>
              {redeemStep === 3 ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

