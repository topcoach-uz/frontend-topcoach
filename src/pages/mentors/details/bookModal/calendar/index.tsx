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
  // This allows month/year navigation
};

interface Props {
  date?: Dayjs | null;
  handleDateChange: (value: Dayjs) => void;
  timezoneOptions: DefaultOptionType[];
  setSelectedTimezone: React.Dispatch<React.SetStateAction<number>>;
  selectedTimezone: number;
  disabledDate?: (current: any) => boolean;
  onPanelChange?: (value: Dayjs, mode: CalendarProps<Dayjs>['mode']) => void;
}

const BookingCalendar: React.FC<Props> = ({
  date,
  handleDateChange,
  selectedTimezone,
  setSelectedTimezone,
  timezoneOptions,
  disabledDate,
  onPanelChange: customOnPanelChange,
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
        onPanelChange={customOnPanelChange || onPanelChange}
        onChange={handleChange}
        disabledDate={disabledDate}
        mode="month"
        headerRender={({ value, type, onChange, onTypeChange }) => {
          // Handle null value case
          if (!value) {
            return (
              <div style={{ padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={dayjs().year()}
                    onChange={(e) => {
                      const newValue = dayjs().year(Number(e.target.value));
                      onChange(newValue);
                    }}
                    style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '4px 8px' }}
                  >
                    {Array.from({ length: 20 }, (_, i) => {
                      const year = dayjs().year() - 10 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                  <select
                    value={dayjs().month()}
                    onChange={(e) => {
                      const newValue = dayjs().month(Number(e.target.value));
                      onChange(newValue);
                    }}
                    style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '4px 8px' }}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthName = dayjs().month(i).format('MMM');
                      return (
                        <option key={i} value={i}>
                          {monthName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            );
          }

          const current = value.clone();
          const localeData = value.localeData();
          const months = [];
          for (let i = 0; i < 12; i++) {
            current.month(i);
            months.push(localeData.monthsShort(current));
          }

          const month = value.month();
          const year = value.year();
          const options = [];
          for (let i = year - 10; i < year + 10; i += 1) {
            options.push(
              <option key={i} value={i}>
                {i}
              </option>
            );
          }

          return (
            <div style={{ padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <select
                  value={year}
                  onChange={(e) => {
                    const newValue = value.clone().year(Number(e.target.value));
                    onChange(newValue);
                  }}
                  style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '4px 8px' }}
                >
                  {options}
                </select>
                <select
                  value={month}
                  onChange={(e) => {
                    const newValue = value.clone().month(Number(e.target.value));
                    onChange(newValue);
                  }}
                  style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '4px 8px' }}
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};

export default BookingCalendar;
