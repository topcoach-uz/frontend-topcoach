/* ── Counselor Console — existing-user picker ─────────────────────────────────
   "Add an existing user" appears in both People pages (as a student on the
   Students page, as a counselor on the Staff page). The control was duplicated
   byte-for-byte: the same 250ms debounce, the same min-2-character gate, the
   same two-line `optionRender`, the same three-way `notFoundContent` ladder.

   It lives here once. The debounce and the query gate are INTERNAL — a caller
   supplies the org, says whether the picker is currently on screen, and reads
   the selected id.

   PRIVACY. The endpoint searches every TopCoach user, so what comes back is
   masked server-side: "Sherali O." and "sh•••3@gmail.com". Partial-email search
   is not supported either — an email query has to be the whole address. Render
   the values as they arrive; do not try to reconstruct or re-label them. */
import { useEffect, useMemo, useState } from 'react';
import { Select } from 'antd';
import { Search } from 'lucide-react';

import { useSearchOrgUsersQuery } from 'src/app/services/counselorConsoleApi';

/** Below this the endpoint would match half the user table — don't ask. */
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

export function UserSearchSelect({
  orgId,
  value,
  onChange,
  /**
   * False while the containing modal is closed. The search query is skipped
   * entirely then, so a closed modal never holds a live subscription.
   */
  active = true,
  placeholder = 'Search by name, or paste a full email…',
  className = 'cc-invite-user-select',
}: {
  orgId: string | null | undefined;
  value: string | undefined;
  onChange: (userId: string | undefined, label?: string) => void;
  active?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useSearchOrgUsersQuery(
    { orgId: orgId ?? '', q: debounced },
    { skip: !orgId || !active || debounced.length < MIN_QUERY_LENGTH },
  );

  const options = useMemo(
    () =>
      (data ?? []).map((u) => ({ value: u.id, label: u.name, email: u.email })),
    [data],
  );

  return (
    <Select
      className={className}
      showSearch
      value={value}
      placeholder={placeholder}
      filterOption={false}
      onSearch={setQuery}
      onChange={(v) =>
        onChange(v, options.find((o) => o.value === v)?.label)
      }
      notFoundContent={
        isFetching
          ? 'Searching…'
          : debounced.length < MIN_QUERY_LENGTH
            ? `Type at least ${MIN_QUERY_LENGTH} characters`
            : /* An '@' in the query means the server ran an exact-email lookup,
                 so "no match" usually means a typo or a partial address. */
              debounced.includes('@')
              ? 'No user with that exact email'
              : 'No matching users'
      }
      loading={isFetching}
      options={options}
      /* Two lines per option: the name a counselor is looking for, and the
         email that disambiguates two people with the same name. */
      optionRender={(opt) => (
        <div className="cc-invite-user-opt">
          <span className="cc-invite-user-opt-name">{opt.data.label}</span>
          <span className="cc-invite-user-opt-email">
            {(opt.data as { email?: string }).email}
          </span>
        </div>
      )}
      suffixIcon={<Search size={15} />}
      style={{ width: '100%' }}
    />
  );
}

export default UserSearchSelect;
