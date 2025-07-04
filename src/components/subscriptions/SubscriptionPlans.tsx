import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import PaymentModal from './PaymentModal';
import CancelConfirmationDialog from './CancelConfirmationDialog';
import { message, Progress, Modal } from 'antd';
import { useGetSubscriptionPlansQuery, useGetSubscriptionUsageQuery, useGetCurrentSubscriptionQuery, useCancelSubscriptionMutation, useDowngradeSubscriptionMutation } from 'src/app/services/api';
import styles from './SubscriptionPlans.module.scss';
import { CheckOutlined, StarFilled } from '@ant-design/icons';
import { FaRocket } from 'react-icons/fa';
import { GiLaurelsTrophy } from 'react-icons/gi';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: Record<string, any>;
}

interface Subscription {
  id: string;
  plan: Plan;
  startDate: string;
  endDate: string;
  status: string;
  autoRenew: boolean;
  paymentId: string;
}

type FeatureUsage = { feature: string; used: number; limit: number };

const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const profile = useTypedSelector((state) => state.auth.profile);
  
  // Use RTK Query to fetch current subscription
  const { data: current, isLoading: currentLoading, error: currentError } = useGetCurrentSubscriptionQuery(undefined, { skip: !isAuthenticated });

  const { data: plansData, isLoading, error } = useGetSubscriptionPlansQuery();
  const { data: usageData, isLoading: usageLoading } = useGetSubscriptionUsageQuery(undefined, { skip: !isAuthenticated });
  
  const currentPlanId = current?.plan?.id || 'aa63df56-4b93-470b-b861-98628dd186a1'; // Free as fallback
  console.log('DEBUG currentPlanId used for matching:', currentPlanId);

  // Curated display data for each plan
  const curatedPlans = [
    {
      key: 'free',
      id: 'aa63df56-4b93-470b-b861-98628dd186a1',
      name: 'Free',
      price: '$0/month',
      priceValue: 0,
      description: 'Full access to TopCoach and 1 AI match to discover your path.',
      features: [
        'Full access to the platform',
        'University & major research tools',
        'Browse mentor profiles',
        'Access to public workshops',
        'Event registration access',
        '1 AI-powered major match',
      ],
      button: 'Join for Free',
      // buttonClass: styles.freeBtn,
    },
    {
      key: 'standard',
      id: 'f3cca6c0-91e4-4e85-b2d1-005c5bf642b2',
      name: 'Standard',
      price: '$17.99/month',
      priceValue: 17.99,
      description: 'Mentorship with pro guidance and advanced AI tools.',
      features: [
        'Everything in Free',
        '1× 30-minute junior coach session',
        '1× 30-minute pro bono session',
        '10 AI-powered major match searches',
        'Priority access to all workshops',
        'Session reminders & smart booking',
      ],
      button: 'Upgrade to Standard',
      buttonClass: '',
      badge: <div className={styles.popularBadge}><StarFilled /> Most Popular</div>,
    },
    {
      key: 'premium',
      id: 'e5143c4d-7f4d-4fbe-aa92-69b2f2647b43',
      name: 'Premium',
      price: '$59/month',
      priceValue: 59,
      description: 'All-access mentorship with senior guidance and max AI tools.',
      features: [
        'Everything in Standard',
        '1× 30-minute senior coach session',
        '1× 60-minute junior coach session',
        '1× 30-minute junior coach session',
        '1× 30-minute pro bono session',
        '20 AI-powered major match searches',
      ],
      button: 'Go Premium',
      buttonClass: styles.premiumBtn,
    },
  ];
  
  const [showPayment, setShowPayment] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [showDowngradeLoading, setShowDowngradeLoading] = useState(false);
  const [targetPlan, setTargetPlan] = useState<any>(null);

  const [cancelSubscription, { isLoading: cancelLoading }] = useCancelSubscriptionMutation();
  const [downgradeSubscription, { isLoading: isDowngrading }] = useDowngradeSubscriptionMutation();

  const handlePlanClick = (plan: any) => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }
    // If user is on paid plan and clicks Free, show downgrade modal
    if ((currentPlanId === curatedPlans[1].id || currentPlanId === curatedPlans[2].id) && plan.key === 'free') {
      setShowDowngradeModal(true);
      return;
    }
    // Find the real plan from backend data
    const apiPlan = plansData?.find((p) => p.name.toLowerCase() === plan.name.toLowerCase());
    if (!apiPlan || !apiPlan.id) {
      message.error('Plan not found or missing ID. Please try again.');
      return;
    }
    navigate(`/payment?planId=${apiPlan.id}&amount=${apiPlan.price}&type=subscription`);
  };

  const handleUpgrade = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handleCancel = () => {
    setShowCancel(true);
  };

  const submitPayment = async (paymentInfo: { cardToken: string; smsCode: string; method: string }) => {
    if (!selectedPlan) return;
    setActionLoading(true);
    try {
      const res = await fetch('api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          ...paymentInfo,
        }),
      });
      if (!res.ok) throw new Error('Payment failed');
      message.success('Subscription successful!');
      setShowPayment(false);
      setSelectedPlan(null);
    } catch (err: any) {
      message.error(err.message || 'Payment failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCancel = async () => {
    setActionLoading(true);
    try {
      await cancelSubscription().unwrap();
      message.success('You have been downgraded to the Free plan.');
      setShowCancel(false);
    } catch (err: any) {
      message.error(err.message || 'Cancel failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDowngrade = async () => {
    setShowDowngradeLoading(true);
    try {
      await cancelSubscription().unwrap();
      message.success('You have been downgraded to the Free plan.');
      setShowDowngradeModal(false);
    } catch (err: any) {
      message.error(err.message || 'Failed to downgrade.');
    } finally {
      setShowDowngradeLoading(false);
    }
  };

  const handleDowngradeToPlan = async (plan: any) => {
    setTargetPlan(plan);
    setShowDowngradeModal(true);
  };

  const handleConfirmDowngradeToPlan = async () => {
    if (!targetPlan) return;
    setShowDowngradeLoading(true);
    try {
      await downgradeSubscription({ planId: targetPlan.id }).unwrap();
      message.success(`You have been downgraded to the ${targetPlan.name} plan.`);
      setShowDowngradeModal(false);
      setTargetPlan(null);
    } catch (err: any) {
      message.error(err.message || 'Failed to downgrade.');
    } finally {
      setShowDowngradeLoading(false);
    }
  };

  // Debug logs to help diagnose current plan issue
  console.log('DEBUG current subscription:', current);
  console.log('DEBUG curatedPlans:', curatedPlans.map(p => ({ key: p.key, id: p.id })));

  if (isLoading) return <div>Loading subscription plans...</div>;
  if (error) return <div>Failed to load plans.</div>;

  return (
    <section style={{ margin: '60px 0 40px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#222', marginBottom: 8 }}>Choose Your Plan</h1>
        <div style={{ color: '#888', fontSize: '1.2rem', fontWeight: 400 }}>
          Unlock your potential with the right mentorship plan for your admission journey.
        </div>
      </div>
      
      {/* Show "You are on the Free plan" message for logged-in users on Free */}
      {/* {isAuthenticated && currentPlanId === 'aa63df56-4b93-470b-b861-98628dd186a1' && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 24, 
          padding: '16px', 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f', 
          borderRadius: '8px',
          color: '#52c41a'
        }}>
          <strong>You are on the Free plan</strong> - All new users start with the Free plan. Upgrade anytime to unlock premium features!
        </div>
      )} */}
      
      <div className={styles.plansContainer}>
        {curatedPlans.map((plan, idx) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const showCurrentBadge = isAuthenticated && isCurrentPlan;
          const isFreePlan = plan.key === 'free';
          
          // Find usage for this plan's features if current
          const usageArr: FeatureUsage[] = (isCurrentPlan && usageData && usageData.usage) ? usageData.usage as FeatureUsage[] : [];
          const usageMap: Record<string, FeatureUsage> = {};
          for (const usage of usageArr) {
            usageMap[usage.feature] = usage;
          }
          
          return (
            <div
              key={plan.key}
              className={[
                styles.planCard,
                isCurrentPlan && isAuthenticated ? styles.current : '',
                isFreePlan ? styles.free : '',
              ].join(' ')}
            >
              {plan.badge}
              {showCurrentBadge && (
                <div className={styles.currentPlanBadge}>
                  Current Plan
                </div>
              )}
              <div className={[styles.planName, isFreePlan ? styles.free : ''].join(' ')}>{plan.name}</div>
              <div className={styles.price}>{plan.price}</div>
              <div className={styles.description}>{plan.description}</div>
              <ul className={styles.features}>
                {plan.features.map((feature, i) => {
                  // Try to match feature to usage (by feature name or index)
                  let usageInfo = null;
                  if (isCurrentPlan && usageData && usageData.usage) {
                    // Try to match by index (assuming order matches backend features)
                    usageInfo = usageData.usage[i];
                  }
                  return (
                    <li className={styles.featureItem} key={i}>
                      <span className={styles.bulletCircle}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="8" cy="8" r="8" fill="#27ae60" />
                          <path d="M5 8.5L7 10.5L11 6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span className={styles.featureText}>{feature}</span>
                    </li>
                  );
                })}
              </ul>
              {/* Action button and warning always at the bottom */}
              <div className={styles.cardActions}>
                {isCurrentPlan && usageArr.some((u) => u.used >= u.limit && u.limit > 0) && (
                  <div className={styles.planWarning}>
                    You have reached your plan's limit for some features. Upgrade to unlock more!
                  </div>
                )}
                {isFreePlan ? (
                  !isAuthenticated ? (
                    <button
                      className={[styles.actionBtn, plan.buttonClass].join(' ')}
                      onClick={() => navigate('/auth/signin')}
                    >
                      Join for Free
                    </button>
                  ) : currentPlanId === plan.id ? (
                    <button
                      className={[styles.actionBtn, plan.buttonClass, styles.currentBtn].join(' ')}
                      disabled
                    >
                      Current Plan
                    </button>
              ) : (
                <button
                      className={[styles.actionBtn, plan.buttonClass].join(' ')}
                      onClick={() => setShowDowngradeModal(true)}
                    >
                      Switch to Free
                    </button>
                  )
                ) :
                  <button
                    className={[
                      styles.actionBtn,
                      plan.buttonClass,
                      isCurrentPlan ? styles.currentBtn : '',
                    ].join(' ')}
                    disabled={isCurrentPlan}
                    onClick={() => {
                      if (isCurrentPlan) return;
                      // Handle downgrades between paid plans
                      if (isAuthenticated && currentPlanId !== 'aa63df56-4b93-470b-b861-98628dd186a1') {
                        // User is on a paid plan and clicking another plan
                        const currentPlan = curatedPlans.find(p => p.id === currentPlanId);
                        if (currentPlan && plan.priceValue < currentPlan.priceValue) {
                          // Downgrade
                          handleDowngradeToPlan(plan);
                          return;
                        }
                      }
                      // Default upgrade flow
                      handlePlanClick(plan);
                    }}
                >
                    {isCurrentPlan ? 'Current Plan' : 
                     isAuthenticated && currentPlanId !== 'aa63df56-4b93-470b-b861-98628dd186a1' && 
                     (() => {
                       const currentPlan = curatedPlans.find(p => p.id === currentPlanId);
                       return currentPlan && plan.priceValue < currentPlan.priceValue;
                     })() ? 
                     `Switch to ${plan.name}` : plan.button}
                </button>
                }
              </div>
              {/* Usage info for current plan */}
              {/* {isCurrentPlan && (
                <div style={{ width: '100%' }}>
                  {usageArr.map((u, idx) => (
                    // Only show usage info for features that are in the visible features list, have a limit > 0, and used > 0
                    plan.features.some(f => (typeof f === 'string' ? u.feature.toLowerCase().includes(f.toLowerCase().split(' ')[0]) : false)) && u.limit > 0 && u.used > 0 ? (
                      <div className={styles.usageInfo} key={u.feature}>
                        {u.used} of {u.limit} used
                        {u.used >= u.limit && (
                          <span style={{ color: '#b02a37', marginLeft: 8 }}>
                            (Upgrade to increase)
                          </span>
                        )}
                      </div>
                    ) : null
                  ))}
                </div>
              )} */}
            </div>
          );
        })}
      </div>
      <PaymentModal
        visible={showPayment}
        onCancel={() => { setShowPayment(false); setSelectedPlan(null); }}
        onSubmit={submitPayment}
        plan={selectedPlan || { name: '', price: 0 }}
      />
      <CancelConfirmationDialog
        visible={showCancel}
        onCancel={() => setShowCancel(false)}
        onConfirm={confirmCancel}
        loading={actionLoading}
      />
      <Modal
        open={showDowngradeModal}
        onCancel={() => { setShowDowngradeModal(false); setTargetPlan(null); }}
        onOk={targetPlan ? handleConfirmDowngradeToPlan : handleConfirmDowngrade}
        confirmLoading={showDowngradeLoading || isDowngrading}
        okText={targetPlan ? `Yes, switch to ${targetPlan.name}` : "Yes, downgrade to Free"}
        cancelText="Cancel"
        title={targetPlan ? `Switch to ${targetPlan.name} Plan?` : "Downgrade to Free Plan?"}
      >
        <p>
          {targetPlan 
            ? `Are you sure you want to switch from your current plan to ${targetPlan.name}? You will lose access to some premium features.`
            : "Are you sure you want to downgrade to the Free plan? You will lose access to premium features."
          }
        </p>
      </Modal>
    </section>
  );
};

export default SubscriptionPlans; 