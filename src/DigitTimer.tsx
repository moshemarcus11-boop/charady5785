import React, { useEffect, useRef, useState } from 'react';

interface DigitTimerProps {
  remainingTime: number; // בשניות
  showCentiseconds?: boolean;
  isActive?: boolean;
  isPaused?: boolean;
}

export const DigitTimer: React.FC<DigitTimerProps> = ({ remainingTime, showCentiseconds = true, isActive = true, isPaused = false }) => {
  // מחשבים ספרות
  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = Math.floor(remainingTime % 60);
  // מאיות (centiseconds): שתי ספרות מימין לשניות
  const [centiseconds, setCentiseconds] = useState('00');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!showCentiseconds || !isActive || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      // נחשב מאיות מתוך הזמן האמיתי
      const now = Date.now();
      const cs = Math.floor((now % 1000) / 10).toString().padStart(2, '0');
      setCentiseconds(cs);
    }, 10);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showCentiseconds, isActive, isPaused]);

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  // הסר את כל הסטייטים והאפקטים של flip/אנימציה
  // בנה את מערך הספרות להצגה ללא מחלקות flipping וללא לוגיקה של prevDigits/flips/sepFlips
  let idx = 0;
  const digits: React.ReactNode[] = [];
  if (hours > 0) {
    digits.push(
      <div className="time-digit-main" key="h10">{hoursStr[0]}</div>
    ); idx++;
    digits.push(
      <div className="time-digit-main" key="h1">{hoursStr[1]}</div>
    ); idx++;
    digits.push(
      <span className="time-separator-main" key="sep-hm">:</span>
    );
  }
  digits.push(
    <div className="time-digit-main" key="m10">{minutesStr[0]}</div>
  ); idx++;
  digits.push(
    <div className="time-digit-main" key="m1">{minutesStr[1]}</div>
  ); idx++;
  digits.push(
    <span className="time-separator-main" key="sep-ms">:</span>
  );
  digits.push(
    <div className="time-digit-main" key="s10">{secondsStr[0]}</div>
  ); idx++;
  digits.push(
    <div className="time-digit-main" key="s1">{secondsStr[1]}</div>
  ); idx++;
  if (showCentiseconds) {
    digits.push(
      <span
        className="time-separator-main vertical-separator"
        key="sep-cs"
      >
        <span className="dot">:</span>
      </span>
    );
    digits.push(
      <div className="time-digit-main centi-digit" key="cs10">{centiseconds[0]}</div>
    ); idx++;
    digits.push(
      <div className="time-digit-main centi-digit" key="cs1">{centiseconds[1]}</div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'ltr' }}>
      {digits}
    </div>
  );
}; 