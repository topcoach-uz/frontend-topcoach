import { useEffect, useState } from "react";
import { Alert, Button, Modal, Select, Space, message } from "antd";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { paymentRedirectWithTimeout } from "src/app/services/paymentRedirect";
import { PAYMENT_MERCHANT_RETURN_ORIGIN } from "src/constants/paymentMerchantReturn";
import type { PlanDto, SubscriptionDto } from "../../types";
import styles from "../../subscription.module.scss";

type Props = {
  plans: PlanDto[];
  subscription: SubscriptionDto | null;
  onRefresh: () => unknown;
};

export default function ClickCommunityCheckout({
  plans,
  subscription,
  onRefresh,
}: Props) {
  const { t } = useTranslation();
  const [planId, setPlanId] = useState<string>();
  const [opening, setOpening] = useState(false);
  const [returned] = useState(
    () =>
      new URLSearchParams(window.location.search).get("clickCheckout") ===
      "returned",
  );
  const paid =
    subscription?.autoRenew === false && subscription.status === "active";
  const available = plans.filter(
    (plan) => plan.name === "community" && plan.priceUzs > 0,
  );
  const selected = available.find((plan) => plan.id === planId) ?? available[0];

  useEffect(() => {
    if (!returned || paid) return;
    // A browser return is not proof of payment. Wait for the verified webhook.
    let tries = 0;
    const timer = window.setInterval(() => {
      void onRefresh();
      if (++tries >= 10) window.clearInterval(timer);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [returned, paid, onRefresh]);

  const purchase = async () => {
    if (!selected || opening) return;
    setOpening(true);
    try {
      const returnUrl = `${PAYMENT_MERCHANT_RETURN_ORIGIN}/student-hub?section=account&target=settings&tab=subscription&clickCheckout=returned`;
      const result = await paymentRedirectWithTimeout("click", {
        planId: selected.id,
        returnUrl,
      });
      const destination = new URL(result.url ?? result.redirectUrl ?? "");
      if (
        destination.origin !== "https://my.click.uz" ||
        destination.pathname !== "/services/pay"
      ) {
        throw new Error("Invalid Click payment link");
      }
      const open = () => window.location.assign(destination.toString());
      // An existing prepared order retains its original server price.
      if (
        result.amountUzs !== undefined &&
        result.amountUzs !== Math.round(selected.priceUzs)
      ) {
        Modal.confirm({
          title: t(
            "settings.subscription.click.confirmPrice",
            "Confirm payment amount",
          ),
          content: t(
            "settings.subscription.click.pendingPrice",
            "Click will charge {{amount}} UZS for this purchase. Continue?",
            { amount: result.amountUzs.toLocaleString() },
          ),
          okText: t(
            "settings.subscription.click.continue",
            "Continue to Click",
          ),
          onOk: open,
          onCancel: () => setOpening(false),
        });
      } else open();
    } catch (error: unknown) {
      const detail = isAxiosError<{ message?: string | string[] }>(error)
        ? error.response?.data?.message
        : undefined;
      message.error(
        (Array.isArray(detail) ? detail.join(" · ") : detail) ??
          t(
            "settings.subscription.click.failed",
            "Could not open Click checkout. Please try again.",
          ),
      );
      setOpening(false);
    }
  };

  if (subscription && subscription.autoRenew !== false) return null;
  if (!available.length) return null;

  return (
    <section
      className={styles.compactSection}
      aria-label={t("settings.subscription.click.title", "Pay with Click")}
    >
      <h2 className={styles.subSectionTitle}>
        {t("settings.subscription.click.title", "Pay with Click")}
      </h2>
      <p className={styles.compactHint}>
        {t(
          "settings.subscription.click.description",
          "Pay for one Community period on Click’s page. Access starts after payment. No automatic renewal or free trial.",
        )}
      </p>
      {paid ? (
        <Alert
          type="success"
          showIcon
          message={t(
            "settings.subscription.click.active",
            "Your Community access is paid through {{date}}.",
            {
              date: subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                : "",
            },
          )}
        />
      ) : (
        <>
          <Space wrap>
            <Select
              aria-label={t(
                "settings.subscription.click.period",
                "Community access period",
              )}
              value={selected?.id}
              onChange={setPlanId}
              disabled={opening}
              options={available.map((plan) => ({
                value: plan.id,
                label: `${plan.billingPeriodDays} ${t("settings.subscription.click.days", "days")} · ${Math.round(plan.priceUzs).toLocaleString()} UZS`,
              }))}
            />
            <Button
              type="primary"
              onClick={purchase}
              loading={opening}
              disabled={!selected}
            >
              {t("settings.subscription.click.continue", "Continue to Click")}
            </Button>
          </Space>
          {returned && (
            <Alert
              type="info"
              showIcon
              message={t(
                "settings.subscription.click.checking",
                "Checking payment confirmation. Access activates after Click confirms payment.",
              )}
              action={
                <Button onClick={() => void onRefresh()}>
                  {t("settings.subscription.click.refresh", "Refresh status")}
                </Button>
              }
            />
          )}
        </>
      )}
    </section>
  );
}
