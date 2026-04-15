import React, { type MutableRefObject } from 'react';
import { Button } from 'antd';
import { THEMATIC_CLUSTER_OPTIONS, type YouthLeadersDraft } from './types';
import { useUploadImagePreview } from './useUploadImagePreview';
import styles from './YouthLeadersApplication.module.scss';

const empty = '—';

function ReviewImageCell({ fileName, previewUrl }: { fileName: string; previewUrl: string | null }) {
  if (!fileName) return empty;
  if (previewUrl) {
    return (
      <div className={styles.reviewFilePreview}>
        <img src={previewUrl} alt="" className={styles.reviewImageThumb} />
        <span className={styles.reviewFileCaption}>{fileName}</span>
      </div>
    );
  }
  return fileName;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <div className={styles.reviewCellLabel}>{label}</div>
      <div className={styles.reviewCellValue}>{value}</div>
    </>
  );
}

type Props = {
  draft: YouthLeadersDraft;
  onBack: () => void;
  onSubmit: () => void;
  idPhotoFileRef: MutableRefObject<File | null>;
  portraitPhotoFileRef: MutableRefObject<File | null>;
  passportScanFileRef: MutableRefObject<File | null>;
};

export default function ReviewStep({
  draft,
  onBack,
  onSubmit,
  idPhotoFileRef,
  portraitPhotoFileRef,
  passportScanFileRef,
}: Props) {
  const p = draft.personal;
  const id = draft.idInfo;
  const c = draft.contact;
  const a = draft.arrival;
  const thematicLabel =
    THEMATIC_CLUSTER_OPTIONS.find((o) => o.id === draft.thematicClusterId)?.label ?? empty;

  const idPhotoPreview = useUploadImagePreview(p.idPhotoFileName, idPhotoFileRef);
  const portraitPreview = useUploadImagePreview(p.portraitPhotoFileName, portraitPhotoFileRef);
  const passportPreview = useUploadImagePreview(id.passportScanFileName, passportScanFileRef);

  return (
    <div>
      <h1 className={styles.pageTitle} style={{ marginBottom: 24 }}>
        My registration information
      </h1>

      <div className={styles.reviewSectionTitle}>Personal Information</div>
      <div className={styles.reviewGrid}>
        <Row label="Family Name" value={p.familyName || empty} />
        <Row label="Middle Name" value={p.middleName || empty} />
        <Row label="Given Name" value={p.givenName || empty} />
        <Row label="Email" value={p.email || empty} />
        <Row label="Phone number" value={p.mobile || empty} />
        <Row label="Date of Birth" value={p.dateOfBirth || empty} />
        <Row label="Nationality" value={p.nationality || empty} />
        <Row label="Dietary Habit" value={p.dietary || empty} />
        <Row label="Organization" value={p.organization || empty} />
        <Row label="Position" value={p.position || empty} />
        <Row label="ID Photo" value={<ReviewImageCell fileName={p.idPhotoFileName} previewUrl={idPhotoPreview} />} />
        <Row
          label="Portrait Photo"
          value={<ReviewImageCell fileName={p.portraitPhotoFileName} previewUrl={portraitPreview} />}
        />
      </div>

      <div className={styles.reviewSectionTitle}>ID Information</div>
      <div className={styles.reviewGrid}>
        <Row label="Passport Number" value={id.passportNumber || empty} />
        <Row label="Passport Expiration Date" value={id.passportExpiry || empty} />
        <Row
          label="Passport scan"
          value={<ReviewImageCell fileName={id.passportScanFileName} previewUrl={passportPreview} />}
        />
        <Row label="Chinese Visa needed" value={id.needsVisa || empty} />
        <Row label="Visa application place" value={id.visaApplicationPlace || empty} />
        <Row label="Program name" value={id.programName || empty} />
      </div>

      <div className={styles.reviewSectionTitle}>Thematic Clusters</div>
      <div className={styles.reviewGrid}>
        <Row label="Thematic Clusters" value={thematicLabel} />
      </div>

      <div className={styles.reviewSectionTitle}>Contact &amp; Others</div>
      <div className={styles.reviewGrid}>
        <Row label="Address" value={c.address || empty} />
        <Row label="WhatsApp" value={c.whatsapp || empty} />
        <Row label="X (Twitter)" value={c.twitter || empty} />
        <Row label="Instagram" value={c.instagram || empty} />
        <Row label="WeChat" value={c.wechat || empty} />
        <Row label="Short Bio" value={c.shortBio || empty} />
        <Row label="Resume" value={c.resumeFileName || empty} />
        <Row label="Topic to share" value={c.wydfTopic || empty} />
      </div>

      <div className={styles.reviewSectionTitle}>Arrival and Departure</div>
      <div className={styles.reviewGrid}>
        <Row label="Arrival airport" value={a.arrivalAirport || empty} />
        <Row label="Arrival date" value={a.arrivalDate || empty} />
        <Row label="Arrival time" value={a.arrivalTime || empty} />
        <Row label="Arrival flight" value={a.arrivalFlight || empty} />
        <Row label="Departure airport" value={a.departureAirport || empty} />
        <Row label="Departure date" value={a.departureDate || empty} />
        <Row label="Departure time" value={a.departureTime || empty} />
        <Row label="Departure flight" value={a.departureFlight || empty} />
      </div>

      <div className={styles.footerActions}>
        <Button className={styles.btnOutline} size="large" onClick={onBack}>
          Previous page
        </Button>
        <Button type="primary" className={styles.btnPrimary} size="large" onClick={onSubmit}>
          Submit
        </Button>
      </div>
    </div>
  );
}
