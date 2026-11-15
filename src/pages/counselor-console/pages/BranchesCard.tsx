/* ── Counselor Console — Settings › Branches ──────────────────────────────────
   Owner-only. This is where a second branch ("filial") gets created, so the card
   renders even for an org that has only its default branch. */
import { useState } from 'react';
import { Button, Form, Input, Modal, message } from 'antd';
import { Plus } from 'lucide-react';

import { useCounselorConsole } from '../CounselorConsoleContext';
import { CcPill } from '../components/CcPill';
import {
  useCreateOrgBranchMutation,
  useUpdateOrgBranchMutation,
  type OrgBranch,
} from 'src/app/services/counselorConsoleApi';
import { apiErrorMessage } from '../_people/peopleChrome';

interface BranchFormValues {
  name: string;
  address?: string;
}

export function BranchesCard({ orgId }: { orgId: string }) {
  const { branches } = useCounselorConsole();
  const [createBranch, { isLoading: creating }] = useCreateOrgBranchMutation();
  const [updateBranch, { isLoading: updating }] = useUpdateOrgBranchMutation();
  const [form] = Form.useForm<BranchFormValues>();
  // `null` = closed, `'new'` = adding, otherwise the branch being edited.
  const [editing, setEditing] = useState<OrgBranch | 'new' | null>(null);

  const openModal = (b: OrgBranch | 'new') => {
    setEditing(b);
    form.setFieldsValue(
      b === 'new' ? { name: '', address: '' } : { name: b.name, address: b.address ?? '' },
    );
  };

  const save = async () => {
    let values: BranchFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const name = values.name.trim();
    const address = (values.address ?? '').trim();
    try {
      if (editing === 'new') {
        await createBranch({ orgId, name, address: address || undefined }).unwrap();
        message.success(`Branch "${name}" created`);
      } else if (editing) {
        await updateBranch({ orgId, branchId: editing.id, name, address }).unwrap();
        message.success('Branch updated');
      }
      setEditing(null);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Could not save the branch. Please try again.'));
    }
  };

  const setStatus = (b: OrgBranch, status: 'active' | 'archived') => {
    const apply = async () => {
      try {
        await updateBranch({ orgId, branchId: b.id, status }).unwrap();
        message.success(status === 'archived' ? `"${b.name}" archived` : `"${b.name}" restored`);
      } catch (err) {
        // 409 (students remain / default branch) carries a readable reason.
        message.error(apiErrorMessage(err, 'Could not change this branch. Please try again.'));
      }
    };
    if (status === 'archived') {
      Modal.confirm({
        title: `Archive ${b.name}?`,
        content:
          'Archived branches disappear from the switcher and invite forms. A branch that still has students cannot be archived - move them first.',
        okText: 'Archive',
        okButtonProps: { danger: true },
        onOk: apply,
      });
    } else {
      void apply();
    }
  };

  return (
    <div className="cc-settings-card cc-branches-card">
      <div className="cc-settings-section">
        <div className="cc-branches-head">
          <div className="cc-settings-section-title" style={{ marginBottom: 0 }}>
            Branches
          </div>
          <Button className="cc-settings-ghost" onClick={() => openModal('new')}>
            <Plus size={14} /> Add branch
          </Button>
        </div>
        <p className="cc-branches-help">
          Split one organization into branches. Counselors see only the branches
          assigned to them; owners can view everything or filter by branch.
        </p>
        <ul className="cc-branches-list">
          {branches.map((b) => (
            <li key={b.id} className="cc-branches-row">
              <div className="cc-branches-main">
                <div className="cc-branches-name">
                  {b.name}
                  {b.isDefault && <CcPill variant="accent">Default</CcPill>}
                  {b.status === 'archived' && <CcPill variant="neutral">Archived</CcPill>}
                </div>
                <div className="cc-branches-meta">
                  {b.address ? `${b.address} · ` : ''}
                  {b.studentCount} student{b.studentCount === 1 ? '' : 's'} ·{' '}
                  {b.counselorCount} counselor{b.counselorCount === 1 ? '' : 's'}
                </div>
              </div>
              <div className="cc-branches-actions">
                <Button size="small" onClick={() => openModal(b)}>
                  Edit
                </Button>
                {b.status === 'archived' ? (
                  <Button size="small" onClick={() => setStatus(b, 'active')}>
                    Restore
                  </Button>
                ) : (
                  !b.isDefault && (
                    <Button size="small" danger onClick={() => setStatus(b, 'archived')}>
                      Archive
                    </Button>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        title={editing === 'new' ? 'Add branch' : 'Edit branch'}
        open={editing !== null}
        okText="Save"
        confirmLoading={creating || updating}
        onOk={save}
        onCancel={() => setEditing(null)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="name"
            label="Branch name"
            rules={[{ required: true, whitespace: true, message: 'A name is required' }]}
          >
            <Input placeholder="North campus" autoComplete="off" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Street, city" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default BranchesCard;
