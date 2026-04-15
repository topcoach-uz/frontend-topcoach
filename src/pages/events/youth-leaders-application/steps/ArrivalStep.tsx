import React from 'react';
import { DatePicker, Form, Input, TimePicker } from 'antd';
import type { ArrivalDeparture } from '../types';
import SectionBar from '../components/SectionBar';
import styles from '../YouthLeadersApplication.module.scss';
import dayjs from 'dayjs';

type Props = { value: ArrivalDeparture; onChange: (v: ArrivalDeparture) => void };

export default function ArrivalStep({ value, onChange }: Props) {
  const set = (patch: Partial<ArrivalDeparture>) => onChange({ ...value, ...patch });

  return (
    <>
      <SectionBar>Arrival and Departure Information</SectionBar>
      <div className={styles.formBlock}>
        <div className={styles.twoColArrival}>
          <div>
            <div className={styles.twoColArrivalTitle}>Arrival</div>
            <Form layout="vertical" requiredMark>
              <Form.Item
                label="Arrival Airport and Terminal"
                required
                extra="Tentative itinerary is fine; you may update later. Pick-up may be arranged."
              >
                <Input
                  placeholder="Please enter"
                  value={value.arrivalAirport}
                  onChange={(e) => set({ arrivalAirport: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="Date of Arrival (Beijing Time)" required>
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="Please choose"
                  value={value.arrivalDate ? dayjs(value.arrivalDate) : null}
                  onChange={(d) => set({ arrivalDate: d ? d.format('YYYY-MM-DD') : '' })}
                />
              </Form.Item>
              <Form.Item label="Expected Time of Arrival (Beijing Time)" required>
                <TimePicker
                  style={{ width: '100%' }}
                  format="HH:mm"
                  placeholder="Please choose"
                  needConfirm={false}
                  value={value.arrivalTime ? dayjs(value.arrivalTime, 'HH:mm') : null}
                  onChange={(t) => set({ arrivalTime: t ? t.format('HH:mm') : '' })}
                />
              </Form.Item>
              <Form.Item label="Flight No. of Arrival">
                <Input
                  placeholder="Please enter"
                  value={value.arrivalFlight}
                  onChange={(e) => set({ arrivalFlight: e.target.value })}
                />
              </Form.Item>
            </Form>
          </div>
          <div>
            <div className={styles.twoColArrivalTitle}>Departure</div>
            <Form layout="vertical" requiredMark>
              <Form.Item label="Departure Airport and Terminal">
                <Input
                  placeholder="Please enter"
                  value={value.departureAirport}
                  onChange={(e) => set({ departureAirport: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="Date of Departure (Beijing Time)">
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="Please choose"
                  value={value.departureDate ? dayjs(value.departureDate) : null}
                  onChange={(d) => set({ departureDate: d ? d.format('YYYY-MM-DD') : '' })}
                />
              </Form.Item>
              <Form.Item label="Expected Time of Departure (Beijing Time)">
                <TimePicker
                  style={{ width: '100%' }}
                  format="HH:mm"
                  placeholder="Please choose"
                  needConfirm={false}
                  value={value.departureTime ? dayjs(value.departureTime, 'HH:mm') : null}
                  onChange={(t) => set({ departureTime: t ? t.format('HH:mm') : '' })}
                />
              </Form.Item>
              <Form.Item label="Flight No. of Departure">
                <Input
                  placeholder="Please enter"
                  value={value.departureFlight}
                  onChange={(e) => set({ departureFlight: e.target.value })}
                />
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
