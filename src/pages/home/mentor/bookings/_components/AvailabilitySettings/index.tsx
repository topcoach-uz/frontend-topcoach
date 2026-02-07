import { Button, Form, message, Select, TimePicker } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import {
  useGetMentorAvailabilityQuery,
  useSetMyAvailabilityMutation,
} from 'src/app/services/availability';
import { SessionTypeEnum } from 'src/app/api/Api';
import { TIMEZONE_OPTIONS } from 'src/constants/timezones';
import styles from './availability.module.scss';

const DAYS = [
  { value: 1, label: 'Mon', letter: 'M' },
  { value: 2, label: 'Tue', letter: 'T' },
  { value: 3, label: 'Wed', letter: 'W' },
  { value: 4, label: 'Thu', letter: 'Th' },
  { value: 5, label: 'Fri', letter: 'F' },
  { value: 6, label: 'Sat', letter: 'S' },
  { value: 0, label: 'Sun', letter: 'S' },
];

export default function AvailabilitySettings() {
  const { t } = useTranslation();
  const getMe = useTypedSelector((state) => state.auth.profile);
  const mentorId = getMe?.id;
  const [form] = Form.useForm();
  const [, forceUpdate] = useState(0);

  const { data, isLoading } = useGetMentorAvailabilityQuery(mentorId!, {
    skip: !mentorId,
  });
  const [setAvailability, { isLoading: saving }] = useSetMyAvailabilityMutation();

  useEffect(() => {
    if (data?.slots?.length) {
      const defaultSlots = DAYS.map((d) => {
        const existing = data.slots.find((s) => s.dayOfWeek === d.value);
        return {
          dayOfWeek: d.value,
          startTime: existing
            ? dayjs(`2000-01-01 ${existing.startTime}`)
            : dayjs('2000-01-01 09:00'),
          endTime: existing
            ? dayjs(`2000-01-01 ${existing.endTime}`)
            : dayjs('2000-01-01 17:00'),
          sessionDuration:
            existing?.sessionDuration ?? SessionTypeEnum.Individual30M,
          bufferMinutes: existing?.bufferMinutes ?? 15,
          enabled: !!existing,
        };
      });
      form.setFieldsValue({ timezone: data.timezone || 'Asia/Tashkent', slots: defaultSlots });
    } else if (!isLoading) {
      // New upgrade: start with all days unavailable (zero availability)
      form.setFieldsValue({
        timezone: 'Asia/Tashkent',
        slots: DAYS.map((d) => ({
          dayOfWeek: d.value,
          startTime: dayjs('2000-01-01 09:00'),
          endTime: dayjs('2000-01-01 17:00'),
          sessionDuration: SessionTypeEnum.Individual30M,
          bufferMinutes: 15,
          enabled: false,
        })),
      });
    }
  }, [data, isLoading, form]);

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      const slotsArray = (values.slots ?? []) as Array<{
        dayOfWeek: number;
        startTime: dayjs.Dayjs;
        endTime: dayjs.Dayjs;
        sessionDuration: string;
        bufferMinutes: number;
        enabled: boolean;
      }>;
      const slots = slotsArray
        .filter((s) => s?.enabled)
        .map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime.format('HH:mm'),
          endTime: s.endTime.format('HH:mm'),
          sessionDuration: s.sessionDuration,
          bufferMinutes: s.bufferMinutes ?? 15,
          isActive: true,
        }));

      await setAvailability({ timezone: values.timezone, slots }).unwrap();
      message.success(t('availability.saved'));
    } catch (err: any) {
      message.error(err?.data?.message || t('availability.saveFailed'));
    }
  };

  const enableDay = (idx: number) => {
    const slots = [...(form.getFieldValue('slots') || [])];
    const current = slots[idx] || {};
    slots[idx] = {
      ...current,
      dayOfWeek: current.dayOfWeek ?? DAYS[idx].value,
      enabled: true,
      startTime: current.startTime ?? dayjs('2000-01-01 09:00'),
      endTime: current.endTime ?? dayjs('2000-01-01 17:00'),
      sessionDuration: current.sessionDuration ?? SessionTypeEnum.Individual30M,
      bufferMinutes: current.bufferMinutes ?? 15,
    };
    form.setFieldsValue({ slots });
    forceUpdate((n) => n + 1);
  };

  const disableDay = (idx: number) => {
    const slots = [...(form.getFieldValue('slots') || [])];
    slots[idx] = { ...slots[idx], enabled: false };
    form.setFieldsValue({ slots });
    forceUpdate((n) => n + 1);
  };

  const copyToOtherDays = (sourceIdx: number) => {
    const slots = [...(form.getFieldValue('slots') || [])];
    const source = slots[sourceIdx];
    if (!source?.enabled) return;
    const newSlots = slots.map((s: any, i: number) =>
      i === sourceIdx ? s : { ...s, enabled: true, startTime: source.startTime, endTime: source.endTime, sessionDuration: source.sessionDuration }
    );
    form.setFieldsValue({ slots: newSlots });
    forceUpdate((n) => n + 1);
    message.success(t('availability.copiedToAllDays'));
  };

  if (!mentorId) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}>🕐</span>
          {t('availability.weeklyHours')}
        </h3>
        <p className={styles.subtitle}>
          {t('availability.subtitle')}
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          timezone: 'Asia/Tashkent',
          slots: DAYS.map((d) => ({
            dayOfWeek: d.value,
            startTime: dayjs('2000-01-01 09:00'),
            endTime: dayjs('2000-01-01 17:00'),
            sessionDuration: SessionTypeEnum.Individual30M,
            bufferMinutes: 15,
            enabled: false,
          })),
        }}
      >
        <Form.Item noStyle shouldUpdate>
          {() => (
        <div className={styles.daysList}>
          {DAYS.map((day, idx) => {
                const slot = form.getFieldValue(['slots', idx]) || {};
                const enabled = !!slot.enabled;
                const startTime = slot.startTime;
                const endTime = slot.endTime;
                const sessionDuration = slot.sessionDuration;

                return (
                  <div key={day.value} className={styles.dayRow}>
                    <div className={styles.dayLetter}>{day.letter}</div>
                    <div className={styles.dayContent}>
                      {enabled ? (
                        <>
                          <Form.Item
                            name={['slots', idx, 'startTime']}
                            noStyle
                            rules={[{ required: true }]}
                          >
                            <TimePicker
                              format="h:mm a"
                              use12Hours
                              className={styles.timePicker}
                              allowClear={false}
                            />
                          </Form.Item>
                          <span className={styles.dash}>–</span>
                          <Form.Item
                            name={['slots', idx, 'endTime']}
                            noStyle
                            rules={[{ required: true }]}
                          >
                            <TimePicker
                              format="h:mm a"
                              use12Hours
                              className={styles.timePicker}
                              allowClear={false}
                            />
                          </Form.Item>
                          <Form.Item
                            name={['slots', idx, 'sessionDuration']}
                            noStyle
                          >
                            <Select
                              options={[
                                { label: '30 min', value: SessionTypeEnum.Individual30M },
                                { label: '60 min', value: SessionTypeEnum.Individual60M },
                              ]}
                              className={styles.durationSelect}
                            />
                          </Form.Item>
                          <div className={styles.dayActions}>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              onClick={() => disableDay(idx)}
                              title={t('availability.remove')}
                            >
                              ✕
                            </button>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              onClick={() => copyToOtherDays(idx)}
                              title={t('availability.copyToAllDays')}
                            >
                              ⊞
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className={styles.unavailable}>{t('availability.unavailable')}</span>
                          <button
                            type="button"
                            className={styles.addBtn}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              enableDay(idx);
                            }}
                            title={t('availability.addAvailability')}
                          >
                            +
                          </button>
                        </>
                      )}
                    </div>
                    <Form.Item name={['slots', idx, 'dayOfWeek']} hidden>
                      <input type="hidden" />
                    </Form.Item>
                    <Form.Item name={['slots', idx, 'enabled']} hidden>
                      <input type="hidden" />
                    </Form.Item>
                    <Form.Item name={['slots', idx, 'bufferMinutes']} hidden>
                      <input type="hidden" />
                    </Form.Item>
                  </div>
                );
          })}
        </div>
          )}
        </Form.Item>

        <div className={styles.timezoneRow}>
          <label className={styles.timezoneLabel}>
            {t('mentors.availabilityTimezoneLabel')}
          </label>
          <Form.Item name="timezone" rules={[{ required: true }]} noStyle>
            <Select
              placeholder={t('availability.selectTimezone')}
              options={TIMEZONE_OPTIONS}
              className={styles.timezoneSelect}
            />
          </Form.Item>
        </div>

        <Button
          type="primary"
          loading={saving}
          onClick={onSave}
          className={styles.saveBtn}
        >
          {t('availability.saveAvailability')}
        </Button>
      </Form>
    </div>
  );
}
