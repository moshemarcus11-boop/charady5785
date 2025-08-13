import React, { useEffect, useState, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push } from 'firebase/database';

// הגדרות Firebase
// Replace with your project's firebaseConfig
const firebaseConfig = {
  apiKey: "AIzaSyCGLHrQwDKqI1_JfGbhHAQppjzOuIubCyc",
  authDomain: "thermacamp.firebaseapp.com",
  databaseURL: "https://thermacamp-default-rtdb.firebaseio.com",
  projectId: "thermacamp",
  storageBucket: "thermacamp.firebasestorage.app",
  messagingSenderId: "1063995028212",
  appId: "1:1063995028212:web:4af53569e0b78c114c64a1",
  measurementId: "G-LBJXMV2CW6"
};

// אתחול Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ממשק (Interface) לרכיב הטיימר
interface DigitTimerProps {
  showCentiseconds?: boolean;
}

// רכיב הטיימר
const DigitTimer: React.FC<DigitTimerProps> = ({ showCentiseconds = true }) => {
  const [remainingTime, setRemainingTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [centiseconds, setCentiseconds] = useState('00');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // האזנה לשינויים ב-Firebase
  useEffect(() => {
    const timerRef = ref(database, 'timer');
    const unsubscribe = onValue(timerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setRemainingTime(data.remainingTime);
        setIsActive(data.isActive);
        setIsPaused(data.isPaused);
      }
    });
    return () => unsubscribe();
  }, []);

  // עדכון מאיות (centiseconds)
  useEffect(() => {
    if (!showCentiseconds || !isActive || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const cs = Math.floor((now % 1000) / 10).toString().padStart(2, '0');
      setCentiseconds(cs);
    }, 10);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showCentiseconds, isActive, isPaused]);

  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = Math.floor(remainingTime % 60);

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  const digits: React.ReactNode[] = [];
  if (hours > 0) {
    digits.push(<div className="time-digit-main" key="h10">{hoursStr[0]}</div>);
    digits.push(<div className="time-digit-main" key="h1">{hoursStr[1]}</div>);
    digits.push(<span className="time-separator-main" key="sep-hm">:</span>);
  }
  digits.push(<div className="time-digit-main" key="m10">{minutesStr[0]}</div>);
  digits.push(<div className="time-digit-main" key="m1">{minutesStr[1]}</div>);
  digits.push(<span className="time-separator-main" key="sep-ms">:</span>);
  digits.push(<div className="time-digit-main" key="s10">{secondsStr[0]}</div>);
  digits.push(<div className="time-digit-main" key="s1">{secondsStr[1]}</div>);
  if (showCentiseconds) {
    digits.push(<span className="time-separator-main vertical-separator" key="sep-cs"><span className="dot">:</span></span>);
    digits.push(<div className="time-digit-main centi-digit" key="cs10">{centiseconds[0]}</div>);
    digits.push(<div className="time-digit-main centi-digit" key="cs1">{centiseconds[1]}</div>);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'ltr' }}>
      {digits}
    </div>
  );
};

// ממשק (Interface) לתרומה
interface Contribution {
  id: string;
  userName: string;
  amount: number;
  timestamp: number;
}

// רכיב רשימת התרומות
const ContributionsList = () => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);

  useEffect(() => {
    const contributionsRef = ref(database, 'contributions');
    const unsubscribe = onValue(contributionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const contributionsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setContributions(contributionsArray);
        
        const total = contributionsArray.reduce((sum, contribution) => sum + contribution.amount, 0);
        setTotalContributions(total);
      } else {
        setContributions([]);
        setTotalContributions(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddContribution = () => {
    const contributionsRef = ref(database, 'contributions');
    const newContribution = {
      userName: `משתמש ${Math.floor(Math.random() * 100)}`,
      amount: Math.floor(Math.random() * 200) + 10,
      timestamp: Date.now(),
    };
    push(contributionsRef, newContribution);
  };

  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg space-y-4 m-4 text-center">
      <h2 className="text-2xl font-bold text-gray-900">רשימת תרומות</h2>
      <p className="text-sm text-gray-500">
        סך התרומות: <span className="font-semibold text-lg text-green-600">{totalContributions} ש"ח</span>
      </p>
      
      <button
        onClick={handleAddContribution}
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
      >
        הוסף תרומה
      </button>

      <ul className="divide-y divide-gray-200">
        {contributions.length > 0 ? (
          contributions.map((contribution) => (
            <li key={contribution.id} className="py-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">{contribution.userName}</span>
                <span className="text-lg font-bold text-gray-700">{contribution.amount} ש"ח</span>
              </div>
            </li>
          ))
        ) : (
          <li className="text-gray-500">עדיין אין תרומות.</li>
        )}
      </ul>
    </div>
  );
};

// רכיב האפליקציה הראשי
const App = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">טיימר</h1>
        <DigitTimer showCentiseconds={true} />
      </div>
      <ContributionsList />
    </div>
  );
};

export default App;
