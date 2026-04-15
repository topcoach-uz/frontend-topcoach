import React from 'react';
import { Button, Form, Input, Upload, type UploadFile } from 'antd';
import { MAX_UPLOAD_MB, beforeUploadRejectOverSize } from '../uploadLimits';
import type { ContactInfo } from '../types';
import SectionBar from '../components/SectionBar';
import styles from '../YouthLeadersApplication.module.scss';

type Props = {
  value: ContactInfo;
  onChange: (v: ContactInfo) => void;
  resumeFileRef: React.MutableRefObject<File | null>;
};

export default function ContactStep({ value, onChange, resumeFileRef }: Props) {
  const set = (patch: Partial<ContactInfo>) => onChange({ ...value, ...patch });
  const resumeList: UploadFile[] = value.resumeFileName
    ? [{ uid: 'cv', name: value.resumeFileName, status: 'done' }]
    : [];

  return (
    <>
      <SectionBar>Contact Information</SectionBar>
      <div className={styles.formBlock}>
        <Form layout="vertical" style={{ maxWidth: 720, margin: '0 auto' }}>
          <Form.Item
            label="Address"
            extra="Please enter your mailing address. We may send forum materials or documents when necessary."
          >
            <Input
              placeholder="Please enter"
              value={value.address}
              onChange={(e) => set({ address: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="WhatsApp" extra="Please provide your WhatsApp number for communication.">
            <Input
              placeholder="Please enter"
              value={value.whatsapp}
              onChange={(e) => set({ whatsapp: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="X (formerly Twitter)">
            <Input
              placeholder="We encourage you to share information about the forum."
              value={value.twitter}
              onChange={(e) => set({ twitter: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Instagram">
            <Input
              placeholder="Please provide your IG account if you want."
              value={value.instagram}
              onChange={(e) => set({ instagram: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="WeChat">
            <Input
              placeholder="Please provide your WeChat account if you want."
              value={value.wechat}
              onChange={(e) => set({ wechat: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Short Bio" required extra="Please briefly introduce yourself (up to 1500 characters).">
            <Input.TextArea
              rows={6}
              maxLength={1500}
              showCount
              placeholder="Please enter."
              value={value.shortBio}
              onChange={(e) => set({ shortBio: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Resume" required extra={`PDF / Word, max ${MAX_UPLOAD_MB} MB`}>
            <Upload
              fileList={resumeList}
              beforeUpload={beforeUploadRejectOverSize}
              onChange={({ fileList: fl }) => {
                const f = fl[0]?.originFileObj;
                resumeFileRef.current = f ?? null;
                set({ resumeFileName: f?.name ?? '' });
              }}
              onRemove={() => {
                resumeFileRef.current = null;
                set({ resumeFileName: '' });
              }}
            >
              <Button className={styles.btnOutline}>+ Click to upload</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            label="The topic and content you want to share during the forum"
            extra="Up to 1500 characters."
          >
            <Input.TextArea
              rows={5}
              maxLength={1500}
              showCount
              placeholder="Please enter."
              value={value.wydfTopic}
              onChange={(e) => set({ wydfTopic: e.target.value })}
            />
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
