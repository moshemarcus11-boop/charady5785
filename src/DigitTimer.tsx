import React from 'react';
import './DigitTimer.css';

interface DigitTimerProps {
  remainingTime: number;
  isActive: boolean;
  isPaused: boolean;
}

const DigitTimer: React.FC<DigitTimerProps> = ({ remainingTime, isActive, isPaused }) => {
  return (
    <div className="digit-timer-container">
      {remainingTime.toString().split('').map((digit, _idx) => (
        <div key={_idx} className="digit-container">
          <div className="digit">{digit}</div>
        </div>
      ))}
    </div>
  );
};

export default DigitTimer;
