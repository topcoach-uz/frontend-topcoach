import { useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, message } from 'antd';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useDeleteScholarshipApplicationMutation, useGetScholarshipApplicationsQuery, useUpdateScholarshipApplicationMutation } from 'src/app/services/student-hub/applicationTrackingApi';
import type { ScholarshipApplication } from 'src/app/services/student-hub/types';
import { ApplicantPage, Breadcrumb, CollegeListTabs, QueryState, displayDate } from './ApplicantPage';

const statuses = ['researching', 'eligible', 'applying', 'submitted', 'under_review', 'awarded', 'rejected', 'expired'] as const;
const label = (value: string) => value.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());

export default function ScholarshipManagement() {
  const navigate = useNavigate();
  const query = useGetScholarshipApplicationsQuery({ page: 1, limit: 100 }, { pollingInterval: 10000 });
  const [editing, setEditing] = useState<ScholarshipApplication>();
  const [form] = Form.useForm();
  const [update, updateState] = useUpdateScholarshipApplicationMutation();
  const [remove] = useDeleteScholarshipApplicationMutation();
  const edit = (scholarship: ScholarshipApplication) => {
    setEditing(scholarship);
    form.setFieldsValue({ ...scholarship, amount: scholarship.amount == null ? undefined : Number(scholarship.amount), applicationDeadline: scholarship.applicationDeadline ? dayjs(scholarship.applicationDeadline) : null });
  };
  const save = async (values: any) => {
    if (!editing) return;
    try {
      await update({ id: editing.id, data: {
        scholarshipName: values.scholarshipName.trim(), organization: values.organization.trim(),
        amount: values.amount ?? null, currency: values.currency.toUpperCase(), status: values.status,
        applicationDeadline: values.applicationDeadline?.format('YYYY-MM-DD') ?? null,
        notes: values.notes ?? '',
      } }).unwrap();
      setEditing(undefined); message.success('Scholarship updated.');
    } catch { message.error('Could not save this scholarship. Your changes remain here.'); }
  };
  return <ApplicantPage title="Your scholarships" subtitle="Manage funding applications, decisions and deadlines." actions={<Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/student-hub/applications/scholarships/new')}>Add scholarship</Button>}>
    <Breadcrumb><Link to="/student-hub/applications">College List</Link><span>/</span>Scholarships</Breadcrumb>
    <CollegeListTabs current="scholarships" />
    <QueryState loading={query.isLoading} error={query.isError} retry={query.refetch}>
      {!query.data?.data.length ? <p>No scholarships saved yet.</p> : query.data.data.map(scholarship => <section key={scholarship.id} className="applicant-panel" aria-label={scholarship.scholarshipName}>
        <h2>{scholarship.scholarshipName || 'Scholarship'}</h2>
        <p>{scholarship.organization} · {label(scholarship.status)}</p>
        <p>Deadline: {displayDate(scholarship.applicationDeadline)}</p>
        {scholarship.amount != null && <p>Amount: {scholarship.amount} {scholarship.currency ?? 'USD'}</p>}
        {scholarship.notes && <p>{scholarship.notes}</p>}
        <div className="applicant-actions"><Button onClick={() => edit(scholarship)}>Edit scholarship</Button><Button danger onClick={() => Modal.confirm({
          title: 'Delete this scholarship?', content: `Remove ${scholarship.scholarshipName || 'this scholarship'} and its deadline from your tracker?`, okText: 'Delete scholarship', okButtonProps: { danger: true },
          onOk: async () => { try { await remove(scholarship.id).unwrap(); message.success('Scholarship deleted.'); } catch { message.error('Could not delete this scholarship.'); throw new Error('Delete failed'); } },
        })}>Delete</Button></div>
      </section>)}
    </QueryState>
    <Modal title="Edit scholarship" open={!!editing} footer={null} onCancel={() => setEditing(undefined)} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item name="scholarshipName" label="Scholarship name" rules={[{ required: true, whitespace: true, max: 255 }]}><Input maxLength={255} /></Form.Item>
        <Form.Item name="organization" label="Organization" rules={[{ required: true, whitespace: true, max: 255 }]}><Input maxLength={255} /></Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={statuses.map(value => ({ value, label: label(value) }))} /></Form.Item>
        <Form.Item name="applicationDeadline" label="Application deadline"><DatePicker style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="amount" label="Amount"><InputNumber min={0} max={9999999999.99} precision={2} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="currency" label="Currency" rules={[{ required: true, pattern: /^[A-Za-z]{3}$/, message: 'Enter a three-letter currency code.' }]}><Input maxLength={3} /></Form.Item>
        <Form.Item name="notes" label="Notes"><Input.TextArea maxLength={10000} rows={3} /></Form.Item>
        <div className="applicant-actions applicant-actions--end"><Button onClick={() => setEditing(undefined)}>Cancel</Button><Button type="primary" htmlType="submit" loading={updateState.isLoading}>Save scholarship</Button></div>
      </Form>
    </Modal>
  </ApplicantPage>;
}
