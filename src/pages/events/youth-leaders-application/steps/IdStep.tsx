import React from 'react';
import { DatePicker, Form, Input, Radio, Upload, type UploadFile } from 'antd';
import type { IdInfo } from '../types';
import SectionBar from '../components/SectionBar';
import styles from '../YouthLeadersApplication.module.scss';
import { useUploadImagePreview } from '../useUploadImagePreview';
import { MAX_UPLOAD_MB, beforeUploadRejectOverSize } from '../uploadLimits';
import dayjs from 'dayjs';

type Props = {
  value: IdInfo;
  onChange: (v: IdInfo) => void;
  passportScanFileRef: React.MutableRefObject<File | null>;
};

export default function IdStep({ value, onChange, passportScanFileRef }: Props) {
  const set = (patch: Partial<IdInfo>) => onChange({ ...value, ...patch });
  const passportPreviewUrl = useUploadImagePreview(value.passportScanFileName, passportScanFileRef);
  const scanList: UploadFile[] = value.passportScanFileName
    ? [
        {
          uid: 'scan',
          name: value.passportScanFileName,
          status: 'done',
          ...(passportPreviewUrl ? { thumbUrl: passportPreviewUrl } : {}),
        },
      ]
    : [];

  return (
    <>
      <SectionBar>ID Information</SectionBar>
      <div className={styles.formBlock}>
        <Form layout="vertical" style={{ maxWidth: 720, margin: '0 auto' }}>
          <Form.Item label="Passport Number" required>
            <Input
              placeholder="Please enter your passport number"
              value={value.passportNumber}
              onChange={(e) => set({ passportNumber: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Passport Expiration Date" required>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Please choose"
              value={value.passportExpiry ? dayjs(value.passportExpiry) : null}
              onChange={(d) => set({ passportExpiry: d ? d.format('YYYY-MM-DD') : '' })}
            />
          </Form.Item>
          <Form.Item label="Scanned copy of your passport bio page" required>
            <div className={styles.uploadRow}>
              <Upload
                className={styles.uploadBox}
                listType="picture-card"
                maxCount={1}
                fileList={scanList}
                beforeUpload={beforeUploadRejectOverSize}
                onChange={({ fileList: fl }) => {
                  const f = fl[0]?.originFileObj;
                  passportScanFileRef.current = f ?? null;
                  set({ passportScanFileName: f?.name ?? '' });
                }}
                onRemove={() => {
                  passportScanFileRef.current = null;
                  set({ passportScanFileName: '' });
                }}
              >
                {scanList.length === 0 ? <div>+ Click to upload</div> : null}
              </Upload>
              <div className={styles.uploadHint}>JPG format, max {MAX_UPLOAD_MB} MB.</div>
            </div>
          </Form.Item>
          <Form.Item
            label="Do you need to apply for the Chinese Visa?"
            required
            extra="Please identify the embassy or consulate if applicable."
          >
            <Radio.Group
              value={value.needsVisa || undefined}
              onChange={(e) => set({ needsVisa: e.target.value })}
            >
              <Radio value="yes">Yes</Radio>
              <Radio value="no">No</Radio>
            </Radio.Group>
          </Form.Item>
          {value.needsVisa === 'yes' && (
            <Form.Item label="Place for Chinese Visa Application" required>
              <Input
                placeholder="e.g. Chinese Embassy in Uzbekistan"
                value={value.visaApplicationPlace}
                onChange={(e) => set({ visaApplicationPlace: e.target.value })}
              />
            </Form.Item>
          )}
          <Form.Item
            label="Name of Your Program"
            extra="If you are a youth leader from an Excellence Actions program, please identify your program."
          >
            <Input.TextArea
              rows={4}
              placeholder="Please enter"
              value={value.programName}
              onChange={(e) => set({ programName: e.target.value })}
            />
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
