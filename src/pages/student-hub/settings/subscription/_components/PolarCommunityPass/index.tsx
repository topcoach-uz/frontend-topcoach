import { Button, message } from "antd";
import { useTranslation } from "react-i18next";
import {
  useCreatePolarCheckoutMutation,
  useGetPolarProductsQuery,
} from "src/app/services/polar";
import { useGetUserPreferencesQuery } from "src/app/services/student-hub/dashboardApi";
import styles from "../../subscription.module.scss";

export default function PolarCommunityPass() {
  const { t } = useTranslation();
  const {
    data: products,
    error,
    isLoading,
    refetch,
  } = useGetPolarProductsQuery();
  const { data: rawPreferences } = useGetUserPreferencesQuery(undefined, {
    pollingInterval: 15_000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [checkout, { isLoading: opening }] = useCreatePolarCheckoutMutation();
  const preferences = (rawPreferences as any)?.data ?? rawPreferences;
  const expiresAt =
    preferences?.applicationSettings?.polarCommunityAccess?.production;

  const purchase = async (productId: string) => {
    try {
      const result = await checkout({ productId }).unwrap();
      window.location.assign(result.url);
    } catch {
      message.error(
        t(
          "settings.subscription.pass.failed",
          "We could not open checkout. Please try again.",
        ),
      );
    }
  };

  if (isLoading) return null;
  // Optional alternative checkout: a quiet note, not a page-level warning.
  if (error)
    return (
      <p className={styles.quietNote} role="status">
        {t(
          "settings.subscription.pass.unavailable",
          "One-time Community access is currently unavailable.",
        )}{" "}
        <Button type="link" size="small" onClick={() => refetch()}>
          {t("settings.subscription.pass.retry", "Try again")}
        </Button>
      </p>
    );
  if (!products?.length) return null;

  return (
    <section
      className={styles.compactSection}
      aria-label={t(
        "settings.subscription.pass.title",
        "One month of Community",
      )}
    >
      <h2 className={styles.subSectionTitle}>
        {t("settings.subscription.pass.title", "One month of Community")}
      </h2>
      <p className={styles.compactHint}>
        {t(
          "settings.subscription.pass.description",
          "Full Community access, including Admissions learning content. One-time payment. No automatic renewal.",
        )}
      </p>
      {expiresAt && Date.parse(expiresAt) > Date.now() && (
        <p className={styles.compactHint}>
          {t(
            "settings.subscription.pass.active",
            "Your Community pass is active through {{date}}.",
            { date: new Date(expiresAt).toLocaleDateString() },
          )}
        </p>
      )}
      {products.map((product) => (
        <div key={product.productId}>
          <Button
            type="primary"
            loading={opening}
            onClick={() => purchase(product.productId)}
          >
            {t("settings.subscription.pass.buy", "Buy one month · {{price}}", {
              price: new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: product.currency,
              }).format(product.amountMinor / 100),
            })}
          </Button>
        </div>
      ))}
    </section>
  );
}
