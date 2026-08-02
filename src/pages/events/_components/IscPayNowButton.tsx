import React from 'react';
import { Button } from 'antd';
import { CreditCard } from 'lucide-react';
import { useGetIscApplicationMeQuery } from 'src/app/services/iscAdmissionsApi';
import { useTypedSelector } from 'src/app/store';
import { ISC_2026_ENABLED } from 'src/lib/iscAccess';

/**
 * ISC 2026 "Pay now" button. Renders only when the current user's ISC
 * application carries a participation-fee payment link (i.e. they were
 * invoiced). Dead simple by design: no live payment-status check — after the
 * deadline the links are cleared and this disappears on its own.
 *
 * Shared by the events ISC card and the student dashboard card.
 */
export default function IscPayNowButton({
  block,
}: {
  block?: boolean;
}) {
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const { data } = useGetIscApplicationMeQuery(undefined, {
    skip: !isAuthenticated || !ISC_2026_ENABLED,
  });

  const link = data?.application?.paymentLink;
  if (!link) return null;

  return (
    <Button
      type="primary"
      size="large"
      block={block}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      icon={<CreditCard size={16} />}
    >
      Pay participation fee
    </Button>
  );
}
