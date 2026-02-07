import { Button, message, Modal, Skeleton, Select } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useState, useMemo } from 'react';
import { useGetAvailableSlotsQuery, useGetMentorAvailabilityQuery } from 'src/app/services/availability';
import { TIMEZONE_OPTIONS, getBrowserTimezone, formatTimezoneLabel } from 'src/constants/timezones';

dayjs.extend(utc);
dayjs.extend(timezone);
import { useBookBySlotMutation } from 'src/app/services/sessions';
import { CustomCard } from 'src/components/cards';
import { CustomButton, CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import RequestSessionModal from '../RequestSessionModal';
import styles from './calendarBooking.module.scss';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  mentorId: string;
  mentorName?: string;
  timezone?: string;
  mentorLevel?: string;
  onPaymentRequired?: (params: { mentorId: string; sessionId: string; start: string; end: string; type: string }) => void;
}

export default function CalendarBookingWidget({
  mentorId,
  mentorName = 'Mentor',
  timezone: propTimezone,
  mentorLevel,
  onPaymentRequired,
}: Props) {
  const colors = useColors();
  const { t } = useTranslation();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const [selectedDate, setSelectedDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [displayMonth, setDisplayMonth] = useState(() => dayjs());
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [menteeTimezone, setMenteeTimezone] = useState<string>(() => getBrowserTimezone());

  const menteeTimezoneOptions = useMemo(() => {
    const browserTz = getBrowserTimezone();
    const inList = TIMEZONE_OPTIONS.some((o) => o.value === browserTz);
    if (inList) return TIMEZONE_OPTIONS;
    return [
      { label: `${t('mentors.yourLocation', 'Your location')} (${formatTimezoneLabel(browserTz)})`, value: browserTz },
      ...TIMEZONE_OPTIONS,
    ];
  }, [t]);

  // Fetch mentor's availability configuration
  const { data: availabilityData, isLoading: availLoading } = useGetMentorAvailabilityQuery(mentorId, {
    skip: !mentorId,
  });

  const hasAvailabilityConfig = (availabilityData?.slots?.length ?? 0) > 0;
  const timezone = propTimezone || availabilityData?.timezone || 'Asia/Tashkent';

  // Fetch slots for displayed month ± 1 month for smooth navigation
  const from = displayMonth.clone().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
  const to = displayMonth.clone().add(2, 'month').endOf('month').format('YYYY-MM-DD');

  // Round to 2 min to allow cache reuse while still fixing server clock skew for past-slot filtering
  const clientNow = useMemo(
    () => new Date(Math.floor(Date.now() / 120_000) * 120_000).toISOString(),
    [displayMonth],
  );
  const { data: slots, isLoading: slotsLoading } = useGetAvailableSlotsQuery(
    { mentorId, from, to, timezone, clientNow },
    { skip: !mentorId || !hasAvailabilityConfig }
  );
  const [bookSlot, { isLoading: booking }] = useBookBySlotMutation();
  const [bookingSlotStart, setBookingSlotStart] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ start: string; end: string; type: string } | null>(null);

  const isLoading = availLoading || slotsLoading;

  const slotsForDate = (slots || []).filter(
    (s) => dayjs.utc(s.start).tz(menteeTimezone).format('YYYY-MM-DD') === selectedDate
  );

  // Build calendar grid: 6 rows x 7 cols (Calendly-style)
  const calendarGrid = useMemo(() => {
    const start = displayMonth.clone().startOf('month');
    const end = displayMonth.clone().endOf('month');
    const startDayOfWeek = start.day();
    const daysInMonth = end.date();
    const prevMonth = displayMonth.clone().subtract(1, 'month');
    const prevMonthDays = prevMonth.daysInMonth();
    const nextMonth = displayMonth.clone().add(1, 'month');

    const cells: { date: dayjs.Dayjs; isCurrentMonth: boolean }[] = [];

    // Leading days from previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({
        date: prevMonth.date(prevMonthDays - startDayOfWeek + i + 1),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: start.date(d), isCurrentMonth: true });
    }

    // Trailing days to fill 5 rows (35 cells) - avoids extra row
    const totalCells = 35;
    let d = 1;
    while (cells.length < totalCells) {
      cells.push({ date: nextMonth.date(d), isCurrentMonth: false });
      d++;
    }

    // Chunk into 5 rows of 7
    const rows: { date: dayjs.Dayjs; isCurrentMonth: boolean }[][] = [];
    for (let r = 0; r < 5; r++) {
      rows.push(cells.slice(r * 7, (r + 1) * 7));
    }
    return rows;
  }, [displayMonth]);

  const datesWithSlots = useMemo(() => {
    const set = new Set<string>();
    (slots || []).forEach((s) => set.add(dayjs.utc(s.start).tz(menteeTimezone).format('YYYY-MM-DD')));
    return set;
  }, [slots, menteeTimezone]);

  const handleConfirmClick = (slot: { start: string; end: string; type: string }) => {
    if (!isAuthenticated) {
      message.warning('Please sign in to book a session');
      return;
    }
    setPendingSlot(slot);
    setConfirmModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!pendingSlot) return;
    setBookingSlotStart(pendingSlot.start);
    setConfirmModalOpen(false);
    const slot = pendingSlot;
    setPendingSlot(null);

    try {
      const result = await bookSlot({
        mentorId,
        start: slot.start,
        type: slot.type,
      }).unwrap();

      if ((result as any)?.paymentRequired) {
        const sessionId = (result as any)?.sessionId;
        if (sessionId && onPaymentRequired) {
          onPaymentRequired({
            mentorId,
            sessionId,
            start: slot.start,
            end: slot.end,
            type: slot.type,
          });
        } else {
          message.info(t('mentors.redirectToPayment', 'Please complete payment to book'));
        }
      } else {
        message.success(t('mentors.bookingSuccess', 'Session booked successfully!'));
      }
    } catch (err: any) {
      message.error(err?.data?.message || 'Failed to book');
    } finally {
      setBookingSlotStart(null);
    }
  };

  const handleRequestSession = () => {
    if (!isAuthenticated) {
      message.warning('Please sign in to request a session');
      const currentUrl = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentUrl);
      window.location.href = '/auth/signin';
      return;
    }
    setRequestModalOpen(true);
  };

  const goPrevMonth = () => setDisplayMonth((m) => m.clone().subtract(1, 'month'));
  const goNextMonth = () => setDisplayMonth((m) => m.clone().add(1, 'month'));

  return (
    <CustomCard shadowed={false} bordered borderRadius={16} className={styles.bookingCard}>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle5}
        fontWeight={themeFontWeight.fontWeightSemibold}
        color={colors.colorTextBase}
        mb={4}
      >
        {t('mentors.bookSession', 'Book a Session')}
      </CustomText>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle8}
        lineHeight={1.4}
        color={colors.colorTextSecondary}
        mb={16}
      >
        {hasAvailabilityConfig
          ? t('mentors.selectSlot', 'Select a date and time')
          : t('mentors.bookingText', 'Book sessions from the options based on your needs')
        }
      </CustomText>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : hasAvailabilityConfig ? (
        <div className={styles.calendlyLayout}>
          {/* Left: Month calendar */}
          <div className={styles.calendarPanel}>
            <div className={styles.calendarHeader}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={goPrevMonth}
                aria-label="Previous month"
              >
                ‹
              </button>
              <span className={styles.monthLabel}>
                {displayMonth.format('MMMM YYYY')}
              </span>
              <button
                type="button"
                className={styles.navBtn}
                onClick={goNextMonth}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
            <div className={styles.dayNamesRow}>
              {DAY_NAMES.map((d) => (
                <div key={d} className={styles.dayNameCell}>{d}</div>
              ))}
            </div>
            <div className={styles.calendarGrid}>
              {calendarGrid.map((row, ri) =>
                row.map(({ date, isCurrentMonth }, ci) => {
                  const dateStr = date.format('YYYY-MM-DD');
                  const hasSlots = datesWithSlots.has(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const isPast = date.isBefore(dayjs(), 'day');
                  const isClickable = isCurrentMonth && !isPast;

                  return (
                    <button
                      key={`${ri}-${ci}`}
                      type="button"
                      className={`${styles.calendarCell} ${!isCurrentMonth ? styles.otherMonth : ''} ${hasSlots && isCurrentMonth ? styles.hasSlots : ''} ${isClickable ? styles.clickable : ''} ${isSelected ? styles.selected : ''} ${isPast ? styles.past : ''}`}
                      disabled={!isClickable}
                      onClick={() => isClickable && setSelectedDate(dateStr)}
                    >
                      {date.date()}
                    </button>
                  );
                })
              )}
            </div>
            <div className={styles.timezoneSection}>
              <label className={styles.timezoneSectionLabel}>
                {t('mentors.showTimesIn', 'Show times in')}:
              </label>
              <Select
                value={menteeTimezone}
                onChange={setMenteeTimezone}
                options={menteeTimezoneOptions}
                className={styles.timezoneSelect}
                size="small"
              />
            </div>
            <div className={styles.timezoneHint}>
              {t('mentors.mentorTimezoneNote', 'Mentor is in')} {formatTimezoneLabel(timezone)}
            </div>
          </div>

          {/* Right: Time slots */}
          <div className={styles.slotsPanel}>
            <div className={styles.slotsPanelHeader}>
              {dayjs(selectedDate).format('dddd, MMMM D')}
            </div>
            <div className={styles.slotsList}>
              {slotsForDate.length > 0 ? (
                slotsForDate.map((slot) => (
                  <div key={slot.start} className={styles.slotRow}>
                    <button
                      type="button"
                      className={styles.slotTimeBtn}
                      onClick={() => handleConfirmClick(slot)}
                      disabled={booking && bookingSlotStart === slot.start}
                    >
                      {dayjs.utc(slot.start).tz(menteeTimezone).format('h:mm')} – {dayjs.utc(slot.end).tz(menteeTimezone).format('h:mm A')}
                    </button>
                    <Button
                      type="primary"
                      size="small"
                      loading={booking && bookingSlotStart === slot.start}
                      className={styles.confirmBtn}
                      onClick={() => handleConfirmClick(slot)}
                    >
                      Confirm
                    </Button>
                  </div>
                ))
              ) : (
                <div className={styles.noSlotsMessage}>
                  <div className={styles.noSlotsText}>
                    {t('mentors.noSlotsRequestCustom', 'No slots on this date. Request a custom session?')}
                  </div>
                  <CustomButton
                    type="primary"
                    height={40}
                    width="100%"
                    className={styles.noSlotsRequestBtn}
                    style={{
                      borderRadius: 8,
                      backgroundColor: '#8b0000',
                      borderColor: '#8b0000',
                      color: 'white',
                    }}
                    onClick={handleRequestSession}
                  >
                    {t('mentors.requestSession.button', 'Request Session')}
                  </CustomButton>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="40" height="36" rx="4" stroke={colors.colorTextSecondary} strokeWidth="2" fill="none"/>
              <line x1="4" y1="18" x2="44" y2="18" stroke={colors.colorTextSecondary} strokeWidth="2"/>
              <line x1="16" y1="4" x2="16" y2="12" stroke={colors.colorTextSecondary} strokeWidth="2" strokeLinecap="round"/>
              <line x1="32" y1="4" x2="32" y2="12" stroke={colors.colorTextSecondary} strokeWidth="2" strokeLinecap="round"/>
              <circle cx="24" cy="30" r="6" stroke={colors.colorTextSecondary} strokeWidth="2" fill="none"/>
              <line x1="24" y1="28" x2="24" y2="30.5" stroke={colors.colorTextSecondary} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="24" y1="30.5" x2="26" y2="31.5" stroke={colors.colorTextSecondary} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <CustomText
            fontSize={15}
            fontWeight={500}
            color={colors.colorText}
            style={{ textAlign: 'center', marginBottom: '8px' }}
          >
            {t('mentors.noAvailabilityTitle', 'No open time slots right now')}
          </CustomText>
          <CustomText
            fontSize={13}
            color={colors.colorTextSecondary}
            style={{ textAlign: 'center', lineHeight: 1.5 }}
          >
            {t('mentors.noAvailabilityDesc', "This mentor hasn't published their availability yet.")}
          </CustomText>
        </div>
      )}

      {/* Request Session section - when slots exist for selected date; when no slots, it's inside the no-slots box; when no availability at all, still show below empty state */}
      {(!hasAvailabilityConfig || slotsForDate.length > 0) && (
        <div className={styles.requestSection}>
          <CustomText
            fontSize={13}
            color={colors.colorTextSecondary}
            style={{ marginBottom: '12px', display: 'block' }}
          >
            {t('mentors.requestSession.helpText', "Can't find a suitable time? Request a custom session based on your availability.")}
          </CustomText>
          <CustomButton
            type="primary"
            height={40}
            width="100%"
            style={{
              borderRadius: 8,
              backgroundColor: '#8b0000',
              borderColor: '#8b0000',
              color: 'white',
            }}
            onClick={handleRequestSession}
          >
            {t('mentors.requestSession.button', 'Request Session')}
          </CustomButton>
        </div>
      )}

      <RequestSessionModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        mentorName={mentorName}
        mentorId={mentorId}
      />

      <Modal
        title={t('mentors.confirmBookingTitle', 'Confirm Booking')}
        open={confirmModalOpen}
        onOk={handleConfirmBooking}
        onCancel={() => { setConfirmModalOpen(false); setPendingSlot(null); }}
        okText={mentorLevel?.toLowerCase() === 'probono'
          ? t('mentors.confirm', 'Confirm')
          : t('mentors.confirmAndPay', 'Confirm & Proceed to Payment')}
        cancelText={t('shared.modalCancel', 'Cancel')}
        okButtonProps={{ style: { backgroundColor: '#8b0000', borderColor: '#8b0000' } }}
      >
        {pendingSlot && (
          <div style={{ padding: '8px 0' }}>
            <p style={{ marginBottom: 12 }}>
              <strong>{t('mentors.mentor', 'Mentor')}:</strong> {mentorName}
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong>{t('mentors.sessionType', 'Session')}:</strong>{' '}
              {pendingSlot.type === 'individual60m' ? '60 min' : '30 min'} mentor session
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>{t('mentors.dateTime', 'Date & Time')}:</strong>{' '}
              {dayjs.utc(pendingSlot.start).tz(menteeTimezone).format('ddd, MMM D, YYYY')} • {dayjs.utc(pendingSlot.start).tz(menteeTimezone).format('h:mm')} – {dayjs.utc(pendingSlot.end).tz(menteeTimezone).format('h:mm A')}
            </p>
          </div>
        )}
      </Modal>
    </CustomCard>
  );
}
