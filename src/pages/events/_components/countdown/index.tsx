import { useEffect, useState } from 'react';
import styles from './countdown.module.scss';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountDown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearTimeout(timer);
  });

  const formatTime = (time: number) => (time < 10 ? `0${time}` : time);

  return (
    <div className={styles.countdown}>
      {formatTime(timeLeft.days || 0)}:{formatTime(timeLeft.hours || 0)}:
      {formatTime(timeLeft.minutes || 0)}:{formatTime(timeLeft.seconds || 0)}
    </div>
  );
}

const calculateTimeLeft = (targetDate: Date): TimeLeft => {
  const difference = +new Date(targetDate) - +new Date();
  let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
};
