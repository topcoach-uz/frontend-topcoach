import React from 'react';
import { Col, DatePicker, Form, Input, Radio, Row, Select, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { PersonalInfo } from '../types';
import { COUNTRY_NATIONALITY_OPTIONS } from '../countryNationalityOptions';
import { useUploadImagePreview } from '../useUploadImagePreview';
import { MAX_UPLOAD_MB, beforeUploadRejectOverSize } from '../uploadLimits';
import SectionBar from '../components/SectionBar';
import styles from '../YouthLeadersApplication.module.scss';
import dayjs from 'dayjs';

type Props = {
  value: PersonalInfo;
  onChange: (v: PersonalInfo) => void;
  idPhotoFileRef: React.MutableRefObject<File | null>;
  portraitPhotoFileRef: React.MutableRefObject<File | null>;
};

export default function PersonalStep({ value, onChange, idPhotoFileRef, portraitPhotoFileRef }: Props) {
  const set = (patch: Partial<PersonalInfo>) => onChange({ ...value, ...patch });

  const idPhotoPreviewUrl = useUploadImagePreview(value.idPhotoFileName, idPhotoFileRef);
  const portraitPreviewUrl = useUploadImagePreview(value.portraitPhotoFileName, portraitPhotoFileRef);

  const idPhotoList: UploadFile[] = value.idPhotoFileName
    ? [
        {
          uid: 'id',
          name: value.idPhotoFileName,
          status: 'done',
          ...(idPhotoPreviewUrl ? { thumbUrl: idPhotoPreviewUrl } : {}),
        },
      ]
    : [];
  const portraitList: UploadFile[] = value.portraitPhotoFileName
    ? [
        {
          uid: 'port',
          name: value.portraitPhotoFileName,
          status: 'done',
          ...(portraitPreviewUrl ? { thumbUrl: portraitPreviewUrl } : {}),
        },
      ]
    : [];

  return (
    <>
      <SectionBar>Personal Information</SectionBar>
      <div className={styles.formBlock}>
        <Form layout="vertical" requiredMark style={{ maxWidth: 720, margin: '0 auto' }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Family Name" required>
                <Input
                  placeholder="As shown on passport."
                  value={value.familyName}
                  onChange={(e) => set({ familyName: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Middle Name">
                <Input
                  placeholder="As shown on passport."
                  value={value.middleName}
                  onChange={(e) => set({ middleName: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Given Name" required>
                <Input
                  placeholder="As shown on passport."
                  value={value.givenName}
                  onChange={(e) => set({ givenName: e.target.value })}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label={
              <span>
                Email{' '}
                <span className={styles.subtle} style={{ display: 'block', marginTop: 4 }}>
                  Your email account will be used as the login account.
                </span>
              </span>
            }
            required
          >
            <Input
              type="email"
              placeholder="Please enter email."
              value={value.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Phone number"
            required
          >
            <Input
              placeholder="e.g. +998 94 676 9641"
              value={value.mobile}
              onChange={(e) => set({ mobile: e.target.value })}
              inputMode="tel"
              autoComplete="tel"
            />
          </Form.Item>
          <Form.Item label="Date of Birth" required>
            <DatePicker
              style={{ width: '100%' }}
              value={value.dateOfBirth ? dayjs(value.dateOfBirth) : null}
              onChange={(d) => set({ dateOfBirth: d ? d.format('YYYY-MM-DD') : '' })}
            />
          </Form.Item>
          <Form.Item label="Nationality" required>
            <Select
              showSearch
              placeholder="Please choose"
              options={COUNTRY_NATIONALITY_OPTIONS}
              value={value.nationality || undefined}
              onChange={(v) => set({ nationality: v })}
            />
          </Form.Item>
          <Form.Item label="Dietary Habit" required>
            <Radio.Group
              value={value.dietary || undefined}
              onChange={(e) => set({ dietary: e.target.value })}
            >
              <Radio value="none">None</Radio>
              <Radio value="halal">Halal</Radio>
              <Radio value="vegetarian">Vegetarian</Radio>
              <Radio value="other">Other</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="ID Photo" required>
            <div className={styles.uploadRow}>
              <Upload
                className={styles.uploadBox}
                listType="picture-card"
                maxCount={1}
                fileList={idPhotoList}
                beforeUpload={() => false}
                onChange={({ fileList: fl }) => {
                  const f = fl[0]?.originFileObj;
                  idPhotoFileRef.current = f ?? null;
                  set({ idPhotoFileName: f?.name ?? '' });
                }}
                onRemove={() => {
                  idPhotoFileRef.current = null;
                  set({ idPhotoFileName: '' });
                }}
              >
                {idPhotoList.length === 0 ? <div>+ Click to upload</div> : null}
              </Upload>
              <div className={styles.uploadHint}>
                Please upload recent bareheaded color photo. White background, head ~2/3 of frame. JPG, max{' '}
                {MAX_UPLOAD_MB} MB, recommended 600×800 px.
              </div>
            </div>
          </Form.Item>
          <Form.Item label="Portrait Photo">
            <div className={styles.uploadRow}>
              <Upload
                className={styles.uploadBox}
                listType="picture-card"
                maxCount={1}
                fileList={portraitList}
                beforeUpload={beforeUploadRejectOverSize}
                onChange={({ fileList: fl }) => {
                  const f = fl[0]?.originFileObj;
                  portraitPhotoFileRef.current = f ?? null;
                  set({ portraitPhotoFileName: f?.name ?? '' });
                }}
                onRemove={() => {
                  portraitPhotoFileRef.current = null;
                  set({ portraitPhotoFileName: '' });
                }}
              >
                {portraitList.length === 0 ? <div>+ Click to upload</div> : null}
              </Upload>
              <div className={styles.uploadHint}>
                Optional — for forum publication and promotion. Max {MAX_UPLOAD_MB} MB.
              </div>
            </div>
          </Form.Item>

          <Form.Item label="Organization" required>
            <Input
              placeholder="Please enter your organization name"
              value={value.organization}
              onChange={(e) => set({ organization: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Position" required>
            <Input
              placeholder="Please enter your title/position"
              value={value.position}
              onChange={(e) => set({ position: e.target.value })}
            />
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
