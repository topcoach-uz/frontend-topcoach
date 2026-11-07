import { Button, Form, message, Select, Skeleton, TimePicker } from 'antd';
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
import { useConnectGoogleCalendar } from '../../../_components/useConnectGoogleCalendar';

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

type BlockItem = {
  id: string;
  dayOfWeek: number;
  startTime: dayjs.Dayjs;
  endTime: dayjs.Dayjs;
  sessionDuration: string;
  bufferMinutes: number;
};

export default function AvailabilitySettings() {
  const { t } = useTranslation();
  const getMe = useTypedSelector((state) => state.auth.profile);
  const mentorId = getMe?.id;
  const { connectCalendar, isConnecting } = useConnectGoogleCalendar();
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

    const apiSlots = Array.isArray(data.slots) ? data.slots : [];

    // Derive last saved time from DB (slots have updatedAt)
    const lastUpdated = apiSlots.reduce<Date | null>((max, s) => {
      const u = (s as { updatedAt?: string })?.updatedAt;
      if (!u) return max;
      const d = new Date(u);
      return !max || d > max ? d : max;
    }, null);
    if (lastUpdated) setLastSavedAt(lastUpdated);
    const blocks: BlockItem[] = apiSlots.map((s, i) => {
      const startT = s.startTime ? dayjs(`2000-01-01 ${s.startTime}`) : dayjs('2000-01-01 09:00');
      const endT = s.endTime ? dayjs(`2000-01-01 ${s.endTime}`) : dayjs('2000-01-01 13:00');
      return {
        id: `block-${s.dayOfWeek}-${i}-${s.id ?? Date.now()}`,
        dayOfWeek: s.dayOfWeek,
        startTime: startT.isValid() ? startT : dayjs('2000-01-01 09:00'),
        endTime: endT.isValid() ? endT : dayjs('2000-01-01 13:00'),
        sessionDuration: s.sessionDuration ?? SessionTypeEnum.Individual30M,
        bufferMinutes: 0,
      };
    });

    form.setFieldsValue({
      timezone: blocks.length > 0 ? (data.timezone || 'Asia/Tashkent') : undefined,
      blocks: blocks.length > 0 ? blocks : [],
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
      const blocksArray = (values.blocks ?? []) as BlockItem[];

      const slots = blocksArray
        .filter((s) => s && s.dayOfWeek != null)
        .map((s) => {
          const start = dayjs.isDayjs(s.startTime) ? s.startTime : dayjs(s.startTime, 'HH:mm');
          const end = dayjs.isDayjs(s.endTime) ? s.endTime : dayjs(s.endTime, 'HH:mm');
          const duration = s.sessionDuration === SessionTypeEnum.Individual60M
            ? SessionTypeEnum.Individual60M
            : SessionTypeEnum.Individual30M;
          return {
            dayOfWeek: Number(s.dayOfWeek),
            startTime: start.isValid() ? start.format('HH:mm') : '09:00',
            endTime: end.isValid() ? end.format('HH:mm') : '13:00',
            sessionDuration: duration,
            bufferMinutes: 0,
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

      const invalidCount = blocksArray.length - slots.length;
      if (invalidCount > 0) {
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

  const addBlock = (dayOfWeek: number) => {
    const blocks = [...(form.getFieldValue('blocks') || [])] as BlockItem[];
    const dayBlocks = blocks.filter((b) => b?.dayOfWeek === dayOfWeek);
    let startTime: dayjs.Dayjs;
    let endTime: dayjs.Dayjs;
    if (dayBlocks.length === 0) {
      startTime = dayjs('2000-01-01 09:00');
      endTime = dayjs('2000-01-01 13:00');
    } else {
      const lastBlock = dayBlocks[dayBlocks.length - 1];
      const lastEnd = dayjs.isDayjs(lastBlock.endTime) ? lastBlock.endTime : dayjs(`2000-01-01 ${lastBlock.endTime}`);
      startTime = lastEnd.add(30, 'minute');
      endTime = startTime.add(3, 'hour');
    }
    blocks.push({
      id: `block-${dayOfWeek}-${Date.now()}`,
      dayOfWeek,
      startTime,
      endTime,
      sessionDuration: SessionTypeEnum.Individual30M,
      bufferMinutes: 0,
    });
    form.setFieldsValue({ blocks });
    forceUpdate((n) => n + 1);
  };

  const removeBlock = (blockIdx: number) => {
    const blocks = [...(form.getFieldValue('blocks') || [])];
    blocks.splice(blockIdx, 1);
    form.setFieldsValue({ blocks });
    forceUpdate((n) => n + 1);
  };

  const cascadeNextBlocks = (blockIdx: number, newEndTime: dayjs.Dayjs) => {
    const blocks = [...(form.getFieldValue('blocks') || [])] as BlockItem[];
    const changedBlock = blocks[blockIdx];
    if (!changedBlock) return;
    blocks[blockIdx] = { ...changedBlock, endTime: newEndTime };
    const dayOfWeek = changedBlock.dayOfWeek;
    const dayBlocksWithIdx = blocks
      .map((b, i) => ({ block: b, index: i }))
      .filter((x) => x.block?.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.index - b.index);
    const pos = dayBlocksWithIdx.findIndex((x) => x.index === blockIdx);
    if (pos < 0 || pos >= dayBlocksWithIdx.length - 1) return;
    const next = dayBlocksWithIdx[pos + 1];
    const nextBlock = blocks[next.index] as BlockItem;
    const nextStart = dayjs.isDayjs(nextBlock.startTime) ? nextBlock.startTime : dayjs(`2000-01-01 ${nextBlock.startTime}`);
    const nextEnd = dayjs.isDayjs(nextBlock.endTime) ? nextBlock.endTime : dayjs(`2000-01-01 ${nextBlock.endTime}`);
    const durationMin = nextEnd.diff(nextStart, 'minute');
    blocks[next.index] = {
      ...nextBlock,
      startTime: newEndTime,
      endTime: newEndTime.add(durationMin, 'minute'),
    };
    form.setFieldsValue({ blocks });
    cascadeNextBlocks(next.index, blocks[next.index].endTime);
    forceUpdate((n) => n + 1);
  };

  if (!mentorId) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {t('availability.weeklyHours')}
        </h3>
        <p className={styles.subtitle}>
          {t('availability.subtitle')}
        </p>
      </div>

      <Button
        onClick={() => connectCalendar()}
        loading={isConnecting}
        style={{ marginBottom: 16 }}
      >
        {getMe?.hasGoogleCredentials
          ? t('homeMentor.reconnectGoogleCalendarTitle', 'Reconnect Google Calendar')
          : t('homeMentor.connectGoogleCalendar', 'Connect Google Calendar')}
      </Button>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          timezone: undefined,
          blocks: [],
        }}
      >
        <Form.Item noStyle shouldUpdate>
          {() => {
            // Don't flash "Unavailable" on every weekday while the saved
            // availability is still loading — hold skeleton rows until then.
            if (isLoading) {
              return (
                <div className={styles.daysList} aria-hidden>
                  {DAYS.map((day) => (
                    <div key={day.value} className={styles.daySection}>
                      <div className={styles.dayRow}>
                        <div className={styles.dayLetter}>{day.letter}</div>
                        <div className={styles.dayContent}>
                          <Skeleton.Input
                            active
                            size="small"
                            style={{ width: 220, minWidth: 0 }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }
            const blocks = form.getFieldValue('blocks') || [];
            return (
              <div className={styles.daysList}>
                {DAYS.map((day) => {
                  const dayBlocks = blocks
                    .map((b: BlockItem, i: number) => ({ block: b, index: i }))
                    .filter((x: { block: BlockItem }) => x.block?.dayOfWeek === day.value);
                  return (
                    <div key={day.value} className={styles.daySection}>
                      <div className={styles.dayRow}>
                        <div className={styles.dayLetter}>{day.letter}</div>
                        <div className={styles.dayContent}>
                          {dayBlocks.length === 0 ? (
                            <>
                              <span className={styles.unavailable}>{t('availability.unavailable')}</span>
                              <button
                                type="button"
                                className={styles.addBtn}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addBlock(day.value);
                                }}
                                title={t('availability.addAvailability')}
                              >
                                +
                              </button>
                            </>
                          ) : (
                            <>
                              {dayBlocks.map(({ block, index }: { block: BlockItem; index: number }) => (
                                <div key={block.id ?? index} className={styles.blockRow}>
                                  <Form.Item name={['blocks', index, 'dayOfWeek']} hidden initialValue={day.value}>
                                    <input type="hidden" />
                                  </Form.Item>
                                  <Form.Item name={['blocks', index, 'bufferMinutes']} hidden initialValue={0}>
                                    <input type="hidden" />
                                  </Form.Item>
                                  <Form.Item
                                    name={['blocks', index, 'startTime']}
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
                                    name={['blocks', index, 'endTime']}
                                    noStyle
                                    rules={[{ required: true }]}
                                  >
                                    <TimePicker
                                      format="h:mm a"
                                      use12Hours
                                      className={styles.timePicker}
                                      allowClear={false}
                                      onChange={(val) => val && cascadeNextBlocks(index, val)}
                                    />
                                  </Form.Item>
                                  <Form.Item name={['blocks', index, 'sessionDuration']} noStyle>
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
                                      onClick={() => removeBlock(index)}
                                      title={t('availability.remove')}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                className={styles.addBlockBtn}
                                onClick={() => addBlock(day.value)}
                                title={t('availability.addBlock', 'Add another time block')}
                              >
                                + {t('availability.addBlock', 'Add block')}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }}
        </Form.Item>

        <div className={styles.timezoneRow}>
          <label className={styles.timezoneLabel}>
            {t('mentors.availabilityTimezoneLabel')}
          </label>
          <Form.Item
            name="timezone"
            rules={[{ required: true, message: t('availability.timezoneRequired', 'Please select your timezone before saving availability') }]}
            noStyle
          >
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
