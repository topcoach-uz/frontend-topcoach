import React, { useEffect, useState } from "react";
import { useFillViewport } from "src/hooks/useFillViewport";
import { CalendarCheck, FileText, GraduationCap, Users } from "lucide-react";
import "./fullSupportGate.scss";

const INCLUDES = [
  { Icon: Users, title: "A dedicated mentor team", desc: "Applications, essays, research and activities mentors." },
  { Icon: CalendarCheck, title: "1:1 lessons on a schedule", desc: "Regular sessions with notes you can revisit." },
  { Icon: FileText, title: "Tasks with feedback", desc: "Assignments and revisions tracked in one place." },
  { Icon: GraduationCap, title: "Community and SAT Prep", desc: "Included learning alongside your mentorship." },
];
import {
  useCreateFullSupportCheckoutMutation,
  useGetFullSupportPaymentQuery,
} from "src/app/services/fullSupportCheckoutApi";
export function FullSupportPaymentGate({
  salesEmail = "support@topcoach.uz",
  programUrl = "https://topcoachuni.com/programs",
}: {
  salesEmail?: string;
  programUrl?: string;
}) {
  const returned =
    new URLSearchParams(window.location.search).get("fullSupportPayment") ===
    "returned";
  const { data, isLoading, isError, isFetching, refetch } =
    useGetFullSupportPaymentQuery(undefined, {
      pollingInterval: returned ? 3000 : 10000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    });
  const [createCheckout, { isLoading: creating }] =
    useCreateFullSupportCheckoutMutation();
  const [error, setError] = useState("");
  const state = data?.data;
  const offer = state?.offer;
  useEffect(() => {
    if (state?.enrolled) window.location.reload();
  }, [state?.enrolled]);
  const contact = `mailto:${salesEmail}?${new URLSearchParams({ subject: "Full Support sales", body: `Hello, I would like to discuss Full Support.\nMy account email: ${state?.accountEmail || ""}` })}`;
  const pay = async () => {
    if (!offer) return;
    setError("");
    try {
      const result = await createCheckout({ offerId: offer.id }).unwrap();
      const url = new URL(result.data.url);
      if (
        url.origin !== "https://my.click.uz" ||
        url.pathname !== "/services/pay"
      )
        throw Error("Invalid checkout");
      window.location.assign(url.toString());
    } catch (e) {
      const message = (e as { data?: { message?: unknown } })?.data?.message;
      setError(
        typeof message === "string"
          ? message
          : "Could not open CLICK. Refresh your payment details and try again.",
      );
      void refetch();
    }
  };
  const ready = offer?.status === "authorized" && !state?.enrolled;
  const cardRef = useFillViewport<HTMLElement>([state, isLoading, isError, error]);
  return (
    <div className="fseditorial fseditorial--gated applicant-full-support-page">
      <section
        ref={cardRef}
        className="fseditorial__access-lock fsgate applicant-panel"
        aria-labelledby="full-support-lock-title"
      >
        <div className="fseditorial__access-content">
          <p className="fseditorial__eyebrow">Full Support · Mentorship</p>
          <h2
            id="full-support-lock-title"
            className="fseditorial__access-title"
          >
            {isLoading
              ? "Loading payment options…"
              : ready
                ? "Your Full Support payment is ready."
                : "Start with a conversation with sales."}
          </h2>
          {isLoading ? (
            <p role="status" className="fseditorial__access-copy">
              Checking your account…
            </p>
          ) : isError ? (
            <div role="alert">
              <p className="fseditorial__access-copy">
                We couldn’t load your payment options.
              </p>
              <button
                type="button"
                className="fseditorial__btn fseditorial__btn--primary"
                onClick={() => void refetch()}
              >
                Try again
              </button>
            </div>
          ) : ready ? (
            <>
              <p className="fseditorial__access-copy">
                Sales has enabled payment for your account at the agreed price.
              </p>
              <div
                style={{
                  margin: "20px 0",
                  padding: "18px 20px",
                  border: "1px solid var(--applicant-border, #e5e1dc)",
                  borderRadius: 12,
                  textAlign: "left",
                }}
              >
                <p style={{ fontSize: 12, marginBottom: 6, opacity: 0.7 }}>
                  FULL SUPPORT · ONE-TIME PAYMENT
                </p>
                <p style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>
                  {new Intl.NumberFormat("en-US").format(offer.amountUzs)}{" "}
                  <span style={{ fontSize: 16, fontWeight: 500 }}>UZS</span>
                </p>
              </div>
              {returned && (
                <p
                  role="status"
                  className="fseditorial__access-note"
                  style={{ marginBottom: 16 }}
                >
                  Waiting for payment confirmation from CLICK. If you cancelled,
                  you can try again.
                </p>
              )}
              <div className="fseditorial__access-actions">
                <button
                  type="button"
                  className="fseditorial__btn fseditorial__btn--primary"
                  disabled={creating || isFetching}
                  onClick={() => void pay()}
                >
                  {creating ? "Opening CLICK…" : "Pay with CLICK"}
                </button>
                {returned && (
                  <button
                    type="button"
                    className="fseditorial__btn fseditorial__btn--ghost"
                    disabled={isFetching}
                    onClick={() => void refetch()}
                  >
                    Check payment status
                  </button>
                )}
              </div>
              <p className="fseditorial__access-note">
                Full Support unlocks after CLICK confirms your payment.
                Returning to this page alone does not confirm payment.
              </p>
            </>
          ) : (
            <>
              <p className="fseditorial__access-copy">
                Contact sales using the email registered on your account. The
                team will discuss your plan and enable payment at an agreed
                price.
              </p>
              {state?.accountEmail && (
                <p
                  className="fseditorial__access-note"
                  style={{ margin: "12px 0" }}
                >
                  Your account: <strong>{state.accountEmail}</strong>
                </p>
              )}
              {offer?.status === "paid" && (
                <p className="fseditorial__access-note">
                  A previous payment was received. Contact sales about your
                  current access.
                </p>
              )}
              <div className="fseditorial__access-actions">
                <a
                  href={contact}
                  className="fseditorial__btn fseditorial__btn--primary"
                >
                  Contact sales
                </a>
                <a
                  href={programUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="fseditorial__btn fseditorial__btn--ghost"
                >
                  View Full Support
                </a>
              </div>
            </>
          )}
          {error && (
            <p
              role="alert"
              style={{ color: "#b42332", marginTop: 16, fontSize: 14 }}
            >
              {error}
            </p>
          )}
          {ready && (
            <p className="fseditorial__access-note">
              <a href={contact}>
                Questions about your agreed price? Contact sales.
              </a>
            </p>
          )}
        </div>
        {/* What the program includes, so the page explains itself instead
            of leaning on a blurred mock of content the student cannot see. */}
        <aside className="fsgate__includes" aria-label="What Full Support includes">
          <p className="fsgate__includes-title">What’s included</p>
          <ul>
            {INCLUDES.map(({ Icon, title, desc }) => (
              <li key={title}>
                <span className="fsgate__includes-icon" aria-hidden>
                  <Icon size={17} strokeWidth={1.9} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}
