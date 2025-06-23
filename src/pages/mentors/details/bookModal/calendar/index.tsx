import type { CalendarProps } from 'antd';
import { Calendar, theme } from 'antd';
import { DefaultOptionType } from 'antd/es/select';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import React from 'react';
import CustomSelect from 'src/components/common/select';
import { useScreenSize } from 'src/hooks/useScreenSize';
dayjs.extend(utc);

const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>['mode']) => {
  console.log(value.format('YYYY-MM-DD'), mode);
};

interface Props {
  date?: Dayjs | null;
  handleDateChange: (value: Dayjs) => void;
  timezoneOptions: DefaultOptionType[];
  setSelectedTimezone: React.Dispatch<React.SetStateAction<number>>;
  selectedTimezone: number;
  disabledDate?: (current: any) => boolean;
}

const BookingCalendar: React.FC<Props> = ({
  date,
  handleDateChange,
  selectedTimezone,
  setSelectedTimezone,
  timezoneOptions,
  disabledDate,
}) => {
  const { token } = theme.useToken();
  const { screenSize } = useScreenSize();

  const wrapperStyle: React.CSSProperties = {
    width: screenSize > 460 ? 300 : 240,
    borderRadius: token.borderRadiusLG,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  };

  const handleChange = (value: Dayjs) => {
    handleDateChange(value);
  };

  return (
    <div style={wrapperStyle}>
      <CustomSelect
        options={timezoneOptions}
        value={selectedTimezone}
        onChange={setSelectedTimezone}
        style={{ width: '100%', minWidth: 200 }}
        allowClear
      />
      <Calendar
        // @ts-ignore
        value={date}
        fullscreen={false}
        onPanelChange={onPanelChange}
        onChange={handleChange}
        disabledDate={disabledDate}
      />
    </div>
  );
};

export default BookingCalendar;
