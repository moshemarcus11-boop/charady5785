import React from 'react';
import './DigitTimer.css';

interface DigitTimerProps {
  timeString: string;
}

const DigitTimer: React.FC<DigitTimerProps> = ({ timeString }) => {
  return (
    <div className="digit-timer-container">
      {timeString.split('').map((digit, _idx) => (
        <div key={_idx} className="digit-container">
          <div className="digit">{digit}</div>
        </div>
      ))}
    </div>
  );
};

export default DigitTimer;
