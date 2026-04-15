import React from 'react';
import { Form, Radio } from 'antd';
import { THEMATIC_CLUSTER_OPTIONS, type ThematicClusterId } from '../types';
import SectionBar from '../components/SectionBar';
import styles from '../YouthLeadersApplication.module.scss';

type Props = {
  value: ThematicClusterId | '';
  onChange: (v: ThematicClusterId | '') => void;
};

export default function ThematicStep({ value, onChange }: Props) {
  return (
    <>
      <SectionBar>Thematic Clusters</SectionBar>
      <div className={styles.formBlock}>
        <p className={styles.subtle} style={{ marginTop: 0 }}>
          You are welcome to choose one of the four thematic forums. If you are designated to a specific forum, please
          choose accordingly.
        </p>
        <Form layout="vertical" style={{ maxWidth: 720, margin: '0 auto' }}>
          <Form.Item label="Thematic Clusters" required>
            <Radio.Group value={value || undefined} onChange={(e) => onChange(e.target.value)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {THEMATIC_CLUSTER_OPTIONS.map((opt) => (
                  <Radio key={opt.id} value={opt.id} style={{ alignItems: 'flex-start', lineHeight: 1.45 }}>
                    {opt.label}
                  </Radio>
                ))}
              </div>
            </Radio.Group>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
