/* ── Counselor Console — Students ─────────────────────────────────────────────
   Everything about the students of an organization, in one place. Three tabs
   cover the three states a student can be in, exactly once each:

     Students    — the working roster (active + invited)
     Invitations — student-role invites still outstanding
     Archived    — students put away, data kept

   This page and Staff replaced three overlapping pages (Students, Staff,
   Invitations) where "where do I go to add someone?" had three plausible
   answers and the invitations list mixed students with counselors. The rule
   now: the audience is the PAGE, the lifecycle stage is the TAB.

   `?tab=` deep-links a tab so the dashboard's "Invite" quick action can land
   directly on Invitations rather than dropping the counselor on the roster and
   making them hunt. */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Archive, MailPlus, Users } from 'lucide-react';

import { useCounselorConsole } from '../CounselorConsoleContext';
import {
  NoOrgPlaceholder,
  PeoplePanel,
  PeopleTabs,
  type PeopleTab,
} from '../_people/peopleChrome';
import { CcPageHead } from '../components/CcPageHead';
import { StudentRosterTab } from '../_people/StudentRosterTab';
import { InvitationsTab } from '../_people/InvitationsTab';

type TabKey = 'roster' | 'invitations' | 'archived';

const TABS: PeopleTab<TabKey>[] = [
  { key: 'roster', label: 'Students', icon: <Users size={15} /> },
  { key: 'invitations', label: 'Invitations', icon: <MailPlus size={15} /> },
  { key: 'archived', label: 'Archived', icon: <Archive size={15} /> },
];

const ID_BASE = 'cc-students';

export default function CounselorConsoleStudentsPage() {
  const { orgId, org, orgs } = useCounselorConsole();
  const [searchParams, setSearchParams] = useSearchParams();

  /* The URL is the source of truth for which tab is showing, so the tab
     survives a reload and can be linked to. An unrecognised value falls back
     to the roster rather than rendering nothing. */
  const activeTab = useMemo<TabKey>(() => {
    const raw = searchParams.get('tab');
    return TABS.some((t) => t.key === raw) ? (raw as TabKey) : 'roster';
  }, [searchParams]);

  const setTab = (key: TabKey) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'roster') next.delete('tab');
    else next.set('tab', key);
    // Replace, not push: flipping tabs should not fill the back button with
    // the counselor's own browsing of one page.
    setSearchParams(next, { replace: true });
  };

  const head = (
    <CcPageHead
      eyebrow="People"
      orgName={org?.name}
      title="Students"
      lead="Every student sponsored by your organization: those currently active, the invitations still outstanding, and everyone you have archived."
    />
  );

  if (!orgId) {
    return (
      <div>
        {head}
        <NoOrgPlaceholder text="Choose an organization from the switcher to manage its students." />
      </div>
    );
  }

  return (
    <div>
      {head}

      <PeopleTabs
        tabs={TABS}
        active={activeTab}
        onChange={setTab}
        idBase={ID_BASE}
        ariaLabel="Student sections"
      />

      {activeTab === 'roster' && (
        <PeoplePanel tabKey="roster" idBase={ID_BASE}>
          <StudentRosterTab
            orgId={orgId}
            org={org}
            orgs={orgs}
            mode="active"
          />
        </PeoplePanel>
      )}

      {activeTab === 'invitations' && (
        <PeoplePanel tabKey="invitations" idBase={ID_BASE}>
          <InvitationsTab orgId={orgId} orgName={org?.name} role="student" />
        </PeoplePanel>
      )}

      {activeTab === 'archived' && (
        <PeoplePanel tabKey="archived" idBase={ID_BASE}>
          <StudentRosterTab
            orgId={orgId}
            org={org}
            orgs={orgs}
            mode="archived"
          />
        </PeoplePanel>
      )}
    </div>
  );
}
