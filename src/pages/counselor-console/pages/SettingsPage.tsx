import { useEffect } from 'react';
import { Button, Form, Input, Skeleton, message } from 'antd';
import { Building2, Lock, RotateCcw, Save } from 'lucide-react';

import { useCounselorConsole } from '../CounselorConsoleContext';
import { useGetOrgContextQuery } from 'src/app/services/counselorConsoleApi';
import {
  useUpdateOrgMutation,
  type OrgSettings,
  type UpdateOrgBody,
} from 'src/app/services/orgAdminApi';
import './SettingsPage.scss';

interface SettingsFormValues {
  name?: string;
  slug?: string;
  description?: string;
  contactEmail?: string;
  website?: string;
  address?: string;
  logoUrl?: string;
}

function toFormValues(org: OrgSettings | undefined): SettingsFormValues {
  return {
    name: org?.name ?? '',
    slug: org?.slug ?? '',
    description: org?.description ?? '',
    contactEmail: org?.contactEmail ?? '',
    website: org?.website ?? '',
    address: org?.address ?? '',
    logoUrl: org?.logoUrl ?? '',
  };
}

/** Trim + drop empty strings so the PATCH only carries real values. */
function toBody(values: SettingsFormValues): UpdateOrgBody {
  const body: UpdateOrgBody = {};
  const assign = (key: keyof UpdateOrgBody, raw?: string) => {
    const v = (raw ?? '').trim();
    body[key] = v;
  };
  assign('name', values.name);
  assign('slug', values.slug);
  assign('description', values.description);
  assign('contactEmail', values.contactEmail);
  assign('website', values.website);
  assign('address', values.address);
  assign('logoUrl', values.logoUrl);
  return body;
}

export default function CounselorConsoleSettingsPage() {
  const { orgId, org, role } = useCounselorConsole();
  const [form] = Form.useForm<SettingsFormValues>();

  const { data, isLoading, isError, refetch } = useGetOrgContextQuery(
    orgId as string,
    { skip: !orgId || role !== 'owner' },
  );
  const orgSettings = data as OrgSettings | undefined;

  const [updateOrg, { isLoading: saving }] = useUpdateOrgMutation();

  // Prefill (and reset) the form whenever the loaded org changes.
  useEffect(() => {
    if (orgSettings) form.setFieldsValue(toFormValues(orgSettings));
  }, [orgSettings, form]);

  const header = (
    <div className="cc-page-head--ruled">
      <div className="cc-page-eyebrow">
        <span className="cc-page-eyebrow-accent">Administration</span>
        {org ? <span>· {org.name}</span> : null}
      </div>
      <h1 className="cc-page-title">Settings</h1>
      <p className="cc-page-lead">
        Manage how {org?.name ?? 'your organization'} appears to students and
        staff — its name, public details and contact information.
      </p>
    </div>
  );

  // ── No organization selected ──
  if (!orgId) {
    return (
      <div className="cc-settings">
        {header}
        <div className="cc-placeholder">
          <Building2 size={22} color="#7b1f2f" />
          <div className="cc-placeholder-title">Select an organization</div>
          <div className="cc-placeholder-text">
            Choose an organization from the switcher to edit its settings.
          </div>
        </div>
      </div>
    );
  }

  // ── Owner-only gate ──
  if (role !== 'owner') {
    return (
      <div className="cc-settings">
        {header}
        <div className="cc-placeholder">
          <Lock size={22} color="#7b1f2f" />
          <div className="cc-placeholder-title">Owners only</div>
          <div className="cc-placeholder-text">
            Organization settings can only be edited by an owner. Contact an owner
            of {org?.name ?? 'this organization'} to request a change.
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!orgId) return;
    let values: SettingsFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return; // inline validation errors
    }
    try {
      await updateOrg({ orgId, ...toBody(values) }).unwrap();
      message.success('Organization settings saved');
    } catch (err: any) {
      const statusCode = err?.status ?? err?.originalStatus;
      if (statusCode === 409) {
        form.setFields([
          {
            name: 'slug',
            errors: ['That URL slug is already taken. Try another.'],
          },
        ]);
        message.error('That URL slug is already taken by another organization.');
        return;
      }
      const reason =
        err?.data?.message ||
        (Array.isArray(err?.data?.message) ? err.data.message[0] : null) ||
        'Could not save settings. Please try again.';
      message.error(String(reason));
    }
  };

  const handleReset = () => {
    if (orgSettings) form.setFieldsValue(toFormValues(orgSettings));
  };

  return (
    <div className="cc-settings">
      {header}

      <div className="cc-settings-card">
        {isLoading ? (
          <Skeleton active title paragraph={{ rows: 8 }} />
        ) : isError ? (
          <div className="cc-settings-error">
            <div className="cc-settings-error-title">Couldn’t load settings</div>
            <div>Something went wrong fetching this organization.</div>
            <Button className="cc-settings-ghost" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={toFormValues(orgSettings)}
          >
            <div className="cc-settings-section">
              <div className="cc-settings-section-title">Identity</div>
              <div className="cc-settings-grid">
                <Form.Item
                  name="name"
                  label="Organization name"
                  rules={[{ required: true, message: 'A name is required' }]}
                >
                  <Input placeholder="Northgate College Counseling" />
                </Form.Item>
                <Form.Item
                  name="slug"
                  label="URL slug"
                  tooltip="Used in public links, e.g. /join/your-slug"
                  rules={[
                    {
                      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message: 'Lowercase letters, numbers and hyphens only',
                    },
                  ]}
                >
                  <Input placeholder="northgate-counseling" />
                </Form.Item>
              </div>
              <Form.Item name="description" label="Description">
                <Input.TextArea
                  rows={3}
                  maxLength={500}
                  showCount
                  placeholder="A short description of your organization."
                />
              </Form.Item>
              <Form.Item
                name="logoUrl"
                label="Logo URL"
                rules={[{ type: 'url', message: 'Enter a valid URL', warningOnly: false }]}
              >
                <Input placeholder="https://…/logo.png" />
              </Form.Item>
            </div>

            <div className="cc-settings-divider" />

            <div className="cc-settings-section">
              <div className="cc-settings-section-title">Contact</div>
              <div className="cc-settings-grid">
                <Form.Item
                  name="contactEmail"
                  label="Contact email"
                  rules={[{ type: 'email', message: 'Enter a valid email' }]}
                >
                  <Input placeholder="admissions@northgate.edu" />
                </Form.Item>
                <Form.Item
                  name="website"
                  label="Website"
                  rules={[{ type: 'url', message: 'Enter a valid URL' }]}
                >
                  <Input placeholder="https://northgate.edu" />
                </Form.Item>
              </div>
              <Form.Item name="address" label="Address">
                <Input.TextArea rows={2} placeholder="Street, city, region, postal code" />
              </Form.Item>
            </div>

            <div className="cc-settings-actions">
              <Button
                className="cc-settings-ghost"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw size={14} /> Reset
              </Button>
              <Button
                className="cc-settings-primary"
                type="primary"
                onClick={handleSave}
                loading={saving}
              >
                <Save size={15} /> Save changes
              </Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
}
