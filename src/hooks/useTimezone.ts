import { useState, useEffect } from 'react';

// Available GMT timezones
const timezones = [
  { label: 'GMT-12 (Baker Island)', value: -12 },
  { label: 'GMT-11 (American Samoa)', value: -11 },
  { label: 'GMT-10 (Hawaii)', value: -10 },
  { label: 'GMT-9 (Alaska)', value: -9 },
  { label: 'GMT-8 (Los Angeles)', value: -8 },
  { label: 'GMT-7 (Denver)', value: -7 },
  { label: 'GMT-6 (Mexico City)', value: -6 },
  { label: 'GMT-5 (New York)', value: -5 },
  { label: 'GMT-4 (Santiago)', value: -4 },
  { label: 'GMT-3 (Buenos Aires)', value: -3 },
  { label: 'GMT-2 (South Georgia)', value: -2 },
  { label: 'GMT-1 (Cape Verde)', value: -1 },
  { label: 'GMT+0 (London)', value: 0 },
  { label: 'GMT+1 (Paris)', value: 1 },
  { label: 'GMT+2 (Cairo)', value: 2 },
  { label: 'GMT+3 (Moscow)', value: 3 },
  { label: 'GMT+4 (Dubai)', value: 4 },
  { label: 'GMT+5 (Tashkent)', value: 5 },
  { label: 'GMT+6 (Dhaka)', value: 6 },
  { label: 'GMT+7 (Bangkok)', value: 7 },
  { label: 'GMT+8 (Singapore)', value: 8 },
  { label: 'GMT+9 (Tokyo)', value: 9 },
  { label: 'GMT+10 (Sydney)', value: 10 },
  { label: 'GMT+11 (Solomon Islands)', value: 11 },
  { label: 'GMT+12 (Auckland)', value: 12 },
  { label: 'GMT+13 (Tonga)', value: 13 },
  { label: 'GMT+14 (Kiritimati)', value: 14 },
];

// Function to get the user's timezone offset in GMT format
const getUserTimezoneOffset = (): number => {
  return -new Date().getTimezoneOffset() / 60; // Convert minutes to hours
};

const useTimezone = () => {
  const [selectedTimezone, setSelectedTimezone] = useState<number>(0);

  useEffect(() => {
    const userOffset = getUserTimezoneOffset();
    setSelectedTimezone(userOffset);
  }, []);

  return {
    selectedTimezone,
    setSelectedTimezone,
    timezones,
  };
};

export default useTimezone;
