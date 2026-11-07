import { useState } from 'react';
import { Modal, Tag } from 'antd';
import { CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { recordedWorkshops } from './recordedWorkshops';
import styles from '../events.module.scss';

export default function RecordedWorkshopGridCards() {
  const colors = useColors();
  const [selected, setSelected] = useState<(typeof recordedWorkshops)[number] | null>(null);
  const [failed, setFailed] = useState(false);
  return <>
    {recordedWorkshops.map(workshop => <div key={workshop.id} className={styles.card}
      role="button" tabIndex={0} aria-label={`Watch ${workshop.title}`}
      onClick={() => { setFailed(false); setSelected(workshop); }}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setFailed(false); setSelected(workshop); } }}>
      <div className={styles.img_mask}>
        <img src={workshop.poster} alt={`${workshop.title} with ${workshop.speaker}`}
          className={styles.event_image} loading="lazy" style={{ objectPosition: 'center 15%' }} />
        <Tag className={styles.upcoming_badge}>Recording</Tag>
      </div>
      <div className={styles.card_description}>
        <CustomText color={colors.colorTextSecondary} lineHeight={1.4}>Workshop replay · Watch anytime</CustomText>
        <CustomText color={colors.colorTextBase} fontSize={themeFontSize.fontSizeTitle5}
          fontWeight={themeFontWeight.fontWeightSemibold} className={styles.event_name} as="p">{workshop.title}</CustomText>
      </div>
    </div>)}
    <Modal open={!!selected} onCancel={() => setSelected(null)} footer={null} width={960}
      title={selected?.title} destroyOnClose>
      {selected && <>
        <p>{selected.speaker}</p>
        <video key={selected.id} controls autoPlay playsInline preload="metadata"
          aria-label={`${selected.title} recording`} onError={() => setFailed(true)}
          style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
          <source src={selected.video} type="video/mp4" />
          Your browser does not support video playback.
        </video>
        {failed && <p role="alert">The recording could not load. Please try again or <a href={selected.video} target="_blank" rel="noopener noreferrer">open the recording directly</a>.</p>}
      </>}
    </Modal>
  </>;
}
