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

const MIN_SAVE_LOADING_MS = 600;

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
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Sync form from API data (avoid overwriting during active save)
  useEffect(() => {
    if (isLoading || showSaveLoading) return;
    if (!data) return;

    const slots = Array.isArray(data.slots) ? data.slots : [];
    const defaultSlots = DAYS.map((d) => {
      const existing = slots.find((s) => s?.dayOfWeek === d.value);
      return {
        dayOfWeek: d.value,
        startTime: existing?.startTime
          ? (() => {
              const t = dayjs(`2000-01-01 ${existing.startTime}`);
              return t.isValid() ? t : dayjs('2000-01-01 09:00');
            })()
          : dayjs('2000-01-01 09:00'),
        endTime: existing?.endTime
          ? (() => {
              const t = dayjs(`2000-01-01 ${existing.endTime}`);
              return t.isValid() ? t : dayjs('2000-01-01 17:00');
            })()
          : dayjs('2000-01-01 17:00'),
        sessionDuration:
          existing?.sessionDuration ?? SessionTypeEnum.Individual30M,
        bufferMinutes: existing?.bufferMinutes ?? 15,
        enabled: !!existing,
      };
    });

    form.setFieldsValue({
      timezone: data.timezone || 'Asia/Tashkent',
      slots: defaultSlots,
    });
  }, [data, isLoading, form, showSaveLoading]);

  // Minimum loading duration for balanced UX
  useEffect(() => {
    if (!saving) return;
    setShowSaveLoading(true);
  }, [saving]);

  useEffect(() => {
    if (!saving && showSaveLoading) {
      const t = setTimeout(() => setShowSaveLoading(false), MIN_SAVE_LOADING_MS);
      return () => clearTimeout(t);
    }
  }, [saving, showSaveLoading]);

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
        .filter((s) => s && s.enabled)
        .map((s) => {
          const start = dayjs.isDayjs(s.startTime) ? s.startTime : dayjs(s.startTime, 'HH:mm');
          const end = dayjs.isDayjs(s.endTime) ? s.endTime : dayjs(s.endTime, 'HH:mm');
          const duration = s.sessionDuration === SessionTypeEnum.Individual60M
            ? SessionTypeEnum.Individual60M
            : SessionTypeEnum.Individual30M;
          return {
            dayOfWeek: Number(s.dayOfWeek),
            startTime: start.isValid() ? start.format('HH:mm') : '09:00',
            endTime: end.isValid() ? end.format('HH:mm') : '17:00',
            sessionDuration: duration,
            bufferMinutes: Number(s.bufferMinutes ?? 15),
            isActive: true,
          };
        })
        .filter((s) => {
          const startM = dayjs(`2000-01-01 ${s.startTime}`, 'YYYY-MM-DD HH:mm');
          const endM = dayjs(`2000-01-01 ${s.endTime}`, 'YYYY-MM-DD HH:mm');
          if (!startM.isValid() || !endM.isValid()) return false;
          if (!endM.isAfter(startM)) return false;
          return true;
        });

      const invalidSlots = slotsArray.filter((s) => s?.enabled).length - slots.length;
      if (invalidSlots > 0) {
        message.warning(t('availability.invalidTimeRange', 'Some slots had invalid times (end must be after start) and were skipped.'));
      }

      await setAvailability({ timezone: values.timezone || 'Asia/Tashkent', slots }).unwrap();
      setLastSavedAt(new Date());
      message.success(t('availability.saved'));
    } catch (err: any) {
      const status = err?.status;
      const msg =
        err?.data?.message ??
        (Array.isArray(err?.data?.message) ? err.data.message.join(', ') : null) ??
        err?.error ??
        err?.message;
      const displayMsg = msg || t('availability.saveFailed');
      console.error('[Availability] Save failed:', { status, err, message: msg });
      if (status === 404) {
        message.error(t('availability.saveFailed404', 'Save failed: endpoint not found. Please check your connection and try again.'));
      } else if (status === 403 || status === 401) {
        message.error(msg || t('availability.saveFailedAuth', 'Please log in again to save availability.'));
      } else {
        message.error(displayMsg);
      }
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
      i === sourceIdx ? s : {
        ...s,
        enabled: true,
        startTime: source.startTime,
        endTime: source.endTime,
        sessionDuration: source.sessionDuration,
        bufferMinutes: source.bufferMinutes ?? 15,
      }
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

        <div className={styles.saveRow}>
          <Button
            type="primary"
            loading={showSaveLoading || saving}
            onClick={onSave}
            disabled={showSaveLoading || saving}
            className={styles.saveBtn}
          >
            {t('availability.saveAvailability')}
          </Button>
          {lastSavedAt && (
            <span className={styles.lastSaved}>
              {t('availability.lastSaved', 'Last saved')}: {dayjs(lastSavedAt).format('MMM D, h:mm A')}
            </span>
          )}
        </div>
      </Form>
    </div>
  );
}
