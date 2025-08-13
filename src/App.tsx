import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { DigitTimer } from './DigitTimer';

interface Donation {
  id: number;
  name: string;
  amount: number;
  message: string;
  date: string;
  organizationId: number;
}

interface Organization {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface Donor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  group: string;
}

interface BulkDonationItem {
  donorId: number;
  donorName: string;
  organizationId: number;
  amount: number;
  message: string;
}

interface TimerSettings {
  isActive: boolean;
  isPaused: boolean;
  duration: number; // בדקות
  remainingTime: number; // בשניות
  endTime: Date | null;
}

function App() {
  const generalDonationLogo = "/קעמפ צבעוני עם טקסט קטן (1).png";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'view' | 'admin-main' | 'donations-admin'>('view');
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [showDonationNotification, setShowDonationNotification] = useState(false);
  const [lastDonation, setLastDonation] = useState<Donation | null>(null);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<number | null>(null);
  const [showDonorsList, setShowDonorsList] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [donorInputMode, setDonorInputMode] = useState<'select' | 'type'>('select');
  const [customDonorName, setCustomDonorName] = useState('');
  const [customDonorGroup, setCustomDonorGroup] = useState('');
  const [showTimer, setShowTimer] = useState(true);
  
  // Timer state
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    isActive: false,
    isPaused: false,
    duration: 30, // 30 דקות ברירת מחדל
    remainingTime: 30 * 60, // 30 דקות בשניות
    endTime: null
  });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Timer functions
  const startTimer = useCallback(() => {
    if (timerSettings.isActive && !timerSettings.isPaused) return;
    
    const newEndTime = new Date();
    newEndTime.setMinutes(newEndTime.getMinutes() + timerSettings.duration);
    
    setTimerSettings(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      endTime: newEndTime,
      remainingTime: timerSettings.duration * 60
    }));
  }, [timerSettings.isActive, timerSettings.isPaused, timerSettings.duration]);

  const pauseTimer = useCallback(() => {
    setTimerSettings(prev => ({
      ...prev,
      isPaused: true
    }));
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerSettings(prev => ({
      ...prev,
      isPaused: false
    }));
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setTimerSettings(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      remainingTime: prev.duration * 60,
      endTime: null
    }));
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimerSettings(prev => ({
      ...prev,
      remainingTime: prev.duration * 60
    }));
  }, [stopTimer]);

  const updateTimerDuration = (minutes: number) => {
    setTimerSettings(prev => ({
      ...prev,
      duration: minutes,
      remainingTime: minutes * 60
    }));
  };

  // Load timer settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('timerSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setTimerSettings(prev => ({
        ...prev,
        duration: parsed.duration || 30,
        remainingTime: (parsed.duration || 30) * 60
      }));
    }
    
    const savedShowTimer = localStorage.getItem('showTimer');
    if (savedShowTimer !== null) {
      setShowTimer(JSON.parse(savedShowTimer));
    }
  }, []);

  // Save timer settings to localStorage
  useEffect(() => {
    localStorage.setItem('timerSettings', JSON.stringify({
      duration: timerSettings.duration
    }));
  }, [timerSettings.duration]);

  useEffect(() => {
    localStorage.setItem('showTimer', JSON.stringify(showTimer));
  }, [showTimer]);

  // Keyboard shortcuts for timer
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            startTimer();
            break;
          case '2':
            event.preventDefault();
            if (timerSettings.isPaused) {
              resumeTimer();
            } else {
              pauseTimer();
            }
            break;
          case '3':
            event.preventDefault();
            stopTimer();
            break;
          case '4':
            event.preventDefault();
            resetTimer();
            break;
          case 'h':
            event.preventDefault();
            setShowTimer(!showTimer);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [timerSettings.isPaused, showTimer, startTimer, resumeTimer, stopTimer, resetTimer, pauseTimer]);

  // Timer effect
  useEffect(() => {
    if (timerSettings.isActive && !timerSettings.isPaused && timerSettings.endTime) {
      timerIntervalRef.current = setInterval(() => {
        const now = new Date();
        const timeLeft = Math.max(0, Math.floor((timerSettings.endTime!.getTime() - now.getTime()) / 1000));
        
        if (timeLeft <= 0) {
          stopTimer();
          // התראה קולית וחזותית
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
          audio.play().catch(() => {
            // אם לא ניתן לנגן אודיו, נשתמש בהתראה רגילה
            alert('הזמן נגמר!');
          });
        } else {
          setTimerSettings(prev => ({
            ...prev,
            remainingTime: timeLeft
          }));
        }
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerSettings.isActive, timerSettings.isPaused, timerSettings.endTime, stopTimer]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeWithSeparateDigits = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
      const hoursStr = hours.toString().padStart(2, '0');
      const minutesStr = minutes.toString().padStart(2, '0');
      const secsStr = secs.toString().padStart(2, '0');
    if (hours > 0) {
      return (
        <div className="timer-digits" style={{ direction: 'ltr' }}>
          <span className="digit">{hoursStr[0]}</span>
          <span className="digit">{hoursStr[1]}</span>
          <span className="separator">:</span>
          <span className="digit">{minutesStr[0]}</span>
          <span className="digit">{minutesStr[1]}</span>
          <span className="separator">:</span>
          <span className="digit">{secsStr[0]}</span>
          <span className="digit">{secsStr[1]}</span>
        </div>
      );
    }
    return (
      <div className="timer-digits" style={{ direction: 'ltr' }}>
        <span className="digit">{minutesStr[0]}</span>
        <span className="digit">{minutesStr[1]}</span>
        <span className="separator">:</span>
        <span className="digit">{secsStr[0]}</span>
        <span className="digit">{secsStr[1]}</span>
      </div>
    );
  };
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: ''
  });

  const [bulkDonations, setBulkDonations] = useState<BulkDonationItem[]>([]);

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [organizations, setOrganizations] = useState<Organization[]>([
    { 
      id: 1, 
      name: "חב\"ד לנוער", 
      color: "#c62828",
      icon: "/חבד לנוער.png"
    },
    { 
      id: 2, 
      name: "מערך החירום הארצי", 
      color: "#1976d2",
      icon: "/מערך_החירום_הארצי-removebg-preview.png"
    },
    { 
      id: 3, 
      name: "לב חב\"ד", 
      color: "#fbc02d",
      icon: "/1200px-לב_חב_ד-Bpreview.png"
    }
  ]);

  const [donors, setDonors] = useState<Donor[]>([
    { id: 1, name: "דוד כהן", email: "david@example.com", phone: "050-1234567", group: "קבוצה א" },
    { id: 2, name: "שרה לוי", email: "sarah@example.com", phone: "050-2345678", group: "קבוצה ב" },
    { id: 3, name: "משה גולדברג", email: "moshe@example.com", phone: "050-3456789", group: "קבוצה א" },
    { id: 4, name: "רחל אברהם", email: "rachel@example.com", phone: "050-4567890", group: "קבוצה ג" },
    { id: 5, name: "יוסי כהן", email: "yossi@example.com", phone: "050-5678901", group: "קבוצה ב" },
    { id: 6, name: "מיכל דוד", email: "michal@example.com", phone: "050-6789012", group: "קבוצה א" },
    { id: 7, name: "אברהם יצחק", email: "avraham@example.com", phone: "050-7890123", group: "קבוצה ג" },
    { id: 8, name: "דנה כהן", email: "dana@example.com", phone: "050-8901234", group: "קבוצה ב" },
  ]);

  const [donations, setDonations] = useState<Donation[]>([
    { id: 1, name: "דוד כהן", amount: 500, message: "תרומה למען הצלת חיים", date: "2024-01-15", organizationId: 1 },
    { id: 2, name: "שרה לוי", amount: 200, message: "תמיכה בחינוך", date: "2024-01-14", organizationId: 2 },
    { id: 3, name: "משה גולדברג", amount: 1000, message: "תרומה גדולה למען הסביבה", date: "2024-01-13", organizationId: 3 },
    { id: 4, name: "רחל אברהם", amount: 300, message: "תמיכה בהצלת חיים", date: "2024-01-12", organizationId: 1 },
    { id: 5, name: "יוסי כהן", amount: 150, message: "תרומה לחינוך", date: "2024-01-11", organizationId: 2 },
    { id: 6, name: "מיכל דוד", amount: 250, message: "תמיכה בסביבה", date: "2024-01-10", organizationId: 3 },
    { id: 7, name: "אברהם יצחק", amount: 400, message: "תרומה להצלת חיים", date: "2024-01-09", organizationId: 1 },
    { id: 8, name: "דנה כהן", amount: 180, message: "תמיכה בחינוך", date: "2024-01-08", organizationId: 2 },
  ]);

  const [importedNames, setImportedNames] = useState<{name: string, group: string}[]>([]);
  const [selectedImportedNames, setSelectedImportedNames] = useState<string[]>([]);
  const [showImportNames, setShowImportNames] = useState(false);

  const donationModalRef = useRef<HTMLDivElement>(null);
  const [openMenuDonationId, setOpenMenuDonationId] = useState<number | null>(null);

  useEffect(() => {
    if (showDonationForm && donationModalRef.current) {
      donationModalRef.current.scrollTop = 0;
    }
  }, [showDonationForm]);

  // חישוב סטטיסטיקות
  const getOrganizationStats = (orgId: number) => {
    const orgDonations = donations.filter(d => d.organizationId === orgId);
    const total = orgDonations.reduce((sum, d) => sum + d.amount, 0);
    return { total, count: orgDonations.length };
  };

  const totalRaised = donations.reduce((sum, donation) => sum + donation.amount, 0);

  // מציאת הגוף עם הכי הרבה תרומות (לא כסף)
  const leadingOrganizationByCount = organizations.reduce((leading, org) => {
    const stats = getOrganizationStats(org.id);
    const leadingStats = leading ? getOrganizationStats(leading.id) : { count: 0 };
    return stats.count > leadingStats.count ? org : leading;
  }, null as Organization | null);

  // מציאת הגוף עם הכי הרבה כסף
  const leadingOrganizationByAmount = organizations.reduce((leading, org) => {
    const stats = getOrganizationStats(org.id);
    const leadingStats = leading ? getOrganizationStats(leading.id) : { total: 0 };
    return stats.total > leadingStats.total ? org : leading;
  }, null as Organization | null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === 'admin' && loginData.password === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('שם משתמש או סיסמה שגויים');
    }
  };

  const handleDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount && selectedOrganization) {
      const donorName = donorInputMode === 'select' ? formData.name : customDonorName;
      // const donorGroup = donorInputMode === 'select' ? 
      //   donors.find(d => d.name === formData.name)?.group || '' : 
      //   customDonorGroup;
      
      if (!donorName) {
        alert('אנא בחר תורם או הקלד שם תורם');
        return;
      }

      if (donorInputMode === 'type' && !customDonorGroup) {
        alert('אנא הזן קבוצה לתורם');
        return;
      }

      const newDonation: Donation = {
        id: Date.now(),
        name: donorName,
        amount: parseInt(formData.amount),
        message: formData.message,
        date: new Date().toISOString().split('T')[0],
        organizationId: selectedOrganization
      };
      setDonations([newDonation, ...donations]);
      setLastDonation(newDonation);
      setShowDonationNotification(true);
      setFormData({ name: '', amount: '', message: '' });
      setCustomDonorName('');
      setCustomDonorGroup('');
      setShowDonationForm(false);
      setSelectedOrganization(null);
      setDonorInputMode('select');
      
      // סגירת ההתראה אחרי 5 שניות
      setTimeout(() => {
        setShowDonationNotification(false);
        setLastDonation(null);
      }, 5000);
    }
  };

  const handleBulkDonation = () => {
    if (bulkDonations.length === 0) {
      alert('אנא הוסף תרומות לרשימה');
      return;
    }

    const newDonations: Donation[] = bulkDonations.map(item => ({
      id: Date.now() + Math.random(),
      name: item.donorName,
      amount: item.amount,
      message: item.message,
      date: new Date().toISOString().split('T')[0],
      organizationId: item.organizationId
    }));
    
    setDonations([...newDonations, ...donations]);
    setBulkDonations([]);
    setShowBulkEdit(false);
  };

  const addBulkDonationItem = () => {
    const newItem: BulkDonationItem = {
      donorId: 0,
      donorName: '',
      organizationId: 1,
      amount: 0,
      message: ''
    };
    setBulkDonations([...bulkDonations, newItem]);
  };

  const updateBulkDonationItem = (index: number, field: keyof BulkDonationItem, value: any) => {
    const updated = [...bulkDonations];
    updated[index] = { ...updated[index], [field]: value };
    
    // אם השתנה donorId, עדכן את donorName
    if (field === 'donorId' && value !== 0) {
      const donor = donors.find(d => d.id === value);
      if (donor) {
        updated[index].donorName = donor.name;
      }
    }
    
    setBulkDonations(updated);
  };

  const removeBulkDonationItem = (index: number) => {
    const updated = bulkDonations.filter((_, i) => i !== index);
    setBulkDonations(updated);
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const importedDonations: BulkDonationItem[] = [];

      // דלג על השורה הראשונה (כותרות)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',');
        if (columns.length >= 4) {
          const donorName = columns[0].trim();
          const organizationName = columns[1].trim();
          const amount = parseInt(columns[2].trim()) || 0;
          const message = columns[3].trim();

          const organization = organizations.find(org => 
            org.name.toLowerCase().includes(organizationName.toLowerCase())
          );

          if (donorName && organization && amount > 0) {
            importedDonations.push({
              donorId: 0,
              donorName: donorName,
              organizationId: organization.id,
              amount: amount,
              message: message
            });
          }
        }
      }

      if (importedDonations.length > 0) {
        setBulkDonations(importedDonations);
        setShowExcelImport(false);
        setShowBulkEdit(true);
        alert(`יובאו ${importedDonations.length} תרומות בהצלחה`);
      } else {
        alert('לא נמצאו תרומות תקינות בקובץ');
      }
    };
    reader.readAsText(file);
  };

  // פונקציה לייבוא שמות מקובץ CSV
  const handleImportNames = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const names: {name: string, group: string}[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [name, group] = line.split(',').map(s => s.trim());
        if (name) names.push({ name, group: group || '' });
      }
      setImportedNames(names);
      setShowImportNames(true);
    };
    reader.readAsText(file);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <form onSubmit={handleLogin} className="login-form">
            <h2>התחברות למערכת</h2>
            <div className="form-group">
              <label>שם משתמש</label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>סיסמה</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="login-btn">
              התחבר
            </button>
            <div className="login-info">
              <p>שם משתמש: admin</p>
              <p>סיסמה: 1234</p>
            </div>
          </form>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginTop: 64, marginBottom: 24}}>
            <img src={generalDonationLogo} alt="צרדי-קעמפ" style={{width:'220px', height:'220px', objectFit:'contain', marginBottom:8}} />
            <div style={{fontSize:'2rem', fontWeight:'bold', color:'#8B4513', letterSpacing:'2px'}}>צרדי-קעמפ</div>
          </div>
        </div>
      </div>
    );
  }

  const renderViewScreen = () => (
    <div className="view-screen">
      <main className="view-main">
        {/* לוגו כללי במסך הראשי */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom:32}}>
          <img src={generalDonationLogo} alt="צרדי-קעמפ" style={{width:'220px', height:'220px', objectFit:'contain', marginBottom:8}} />
          <div style={{fontSize:'2rem', fontWeight:'bold', color:'#8B4513', letterSpacing:'2px'}}>צרדי-קעמפ</div>
        </div>
        {/* Timer Display - טיימר אחיד מעל כל הגופים */}
        {showTimer && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2c1810' }}>טיימר התרמה</h2>
                <button 
                  className="timer-hide-btn-main"
                  onClick={() => setShowTimer(false)}
                  title="הסתר טיימר"
                >
                  ✕
                </button>
              </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'ltr' }}>
              <DigitTimer 
                remainingTime={timerSettings.remainingTime} 
                isActive={timerSettings.isActive} 
                isPaused={timerSettings.isPaused} 
              />
                          </div>
            <div className="timer-status-main" style={{ color: '#2c1810', marginTop: 8 }}>
              
            </div>
          </div>
        )}
        {/* Show Timer Button */}
        {!showTimer && (
          <button 
            className="show-timer-btn-main"
            onClick={() => setShowTimer(true)}
            title="הצג טיימר"
          >
            ⏰
          </button>
        )}

        <div className="three-column-layout">
          {organizations.map(org => {
            const stats = getOrganizationStats(org.id);
            const orgDonations = donations.filter(d => d.organizationId === org.id);
            
            return (
              <div key={org.id} className="org-column" 
                style={{ background: `linear-gradient(135deg, #f9f3e3 70%, ${org.color} 100%)` }}
              >
                <div className="org-column-header" style={{ borderColor: org.color }}>
                  <span className="org-icon">
                    <img src={org.icon} alt={org.name} style={{width: '140px', height: '140px', objectFit: 'contain', background: 'transparent'}} />
                  </span>
                  <h2>{org.name}</h2>
                </div>
                
                <div className="org-total">
                  <span className="total-amount">₪{stats.total.toLocaleString()}</span>
                  <span className="total-label">סה"כ תרומות</span>
                </div>

                <div className="org-chart dramatic-chart">
                  {(() => {
                    const maxTotal = Math.max(...organizations.map(o => getOrganizationStats(o.id).total), 1);
                    const percent = Math.round((stats.total / maxTotal) * 100);
                    // חץ SVG מלא
                    const width = 70;
                    const height = 70;
                    const arrowColor = org.color;
                    // גוף החץ (מלבן אלכסוני)
                    const bodyX1 = 12, bodyY1 = 58;
                    const bodyX2 = 22, bodyY2 = 66;
                    const bodyX3 = 58, bodyY3 = 22;
                    const bodyX4 = 48, bodyY4 = 14;
                    // ראש החץ (משולש)
                    const headX = 62, headY = 18;
                    const headLeftX = 54, headLeftY = 10;
                    const headRightX = 66, headRightY = 10;
                    return (
                      <div className="dramatic-graph-wrapper">
                        <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
                          {/* גוף החץ */}
                          <polygon points={`
                            ${bodyX1},${bodyY1} 
                            ${bodyX2},${bodyY2} 
                            ${bodyX3},${bodyY3} 
                            ${bodyX4},${bodyY4}
                          `} fill={arrowColor} />
                          {/* ראש החץ */}
                          <polygon points={`
                            ${headX},${headY} 
                            ${headLeftX},${headLeftY} 
                            ${headRightX},${headRightY}
                          `} fill={arrowColor} />
                        </svg>
                        <div className="dramatic-amount" style={{ color: org.color, marginTop: 2 }}>
                          ₪ {stats.total.toLocaleString()}
                        </div>
                        <div className="dramatic-percent" style={{ color: org.color, marginTop: 2 }}>
                          {percent}% מהגוף המוביל
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="org-donations-list">
                  <h3>התורמים:</h3>
                  {orgDonations.map(donation => {
                    const donor = donors.find(d => d.name === donation.name);
                    return (
                      <div key={donation.id} className="donation-item">
                        <div className="donor-info">
                          <span className="donor-name">{donation.name}</span>
                          <span className="donor-group">{donor?.group || 'לא מוגדר'}</span>
                          <span className="donation-date">{donation.date}</span>
                        </div>
                        <span className="donation-amount">₪{donation.amount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                  {orgDonations.length === 0 && (
                    <p className="no-donations">אין תרומות עדיין</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="donations-stats">
          <div className="stats-container">
            <div className="stat-item">
              <h3>🏆 הגוף עם הכי הרבה תרומות</h3>
              {leadingOrganizationByCount && (
                <div className="stat-content">
                  <span className="org-icon"><img src={leadingOrganizationByCount.icon} alt={leadingOrganizationByCount.name} style={{width: '80px', height: '80px', objectFit: 'contain', background: 'transparent'}} /></span>
                  <span className="org-name">{leadingOrganizationByCount.name}</span>
                  <span className="stat-value">{getOrganizationStats(leadingOrganizationByCount.id).count} תרומות</span>
                </div>
              )}
            </div>
            <div className="stat-item">
              <h3>💰 הגוף עם הכי הרבה כסף</h3>
              {leadingOrganizationByAmount && (
                <div className="stat-content">
                  <span className="org-icon"><img src={leadingOrganizationByAmount.icon} alt={leadingOrganizationByAmount.name} style={{width: '80px', height: '80px', objectFit: 'contain', background: 'transparent'}} /></span>
                  <span className="org-name">{leadingOrganizationByAmount.name}</span>
                  <span className="stat-value">₪{getOrganizationStats(leadingOrganizationByAmount.id).total.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="stat-item">
              <h3>📊 סה"כ כללי</h3>
              <div className="stat-content">
                <span className="stat-value">₪{totalRaised.toLocaleString()}</span>
                <span className="stat-label">סה"כ כסף</span>
                <span className="stat-value">{donations.length}</span>
                <span className="stat-label">סה"כ תרומות</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderAdminMainScreen = () => (
    <div className="admin-main-screen">
      <main className="main">
        <div style={{position:'fixed', top:48, left:18, zIndex:2000, display:'flex', flexDirection:'column', alignItems:'center'}}>
          <img src={generalDonationLogo} alt="logo" style={{width:140, height:140, background:'none'}} />
          <div style={{fontSize:'2rem', fontWeight:'bold', color:'#8B4513', letterSpacing:'2px'}}>צרדי-קעמפ</div>
        </div>
        <div className="container">
          <div className="admin-tools">
            <div className="tool-section">
              <h2>ניהול גופים</h2>
              <div className="orgs-management-grid">
                {organizations.map(org => (
                  <div key={org.id} className="org-edit-card">
                    <div className="org-edit-header">
                      <span className="org-icon"><img src={org.icon} alt={org.name} style={{width: '32px', height: '32px', objectFit: 'contain', background: 'transparent'}} /></span>
                      <input 
                        type="text" 
                        value={org.name}
                        onChange={(e) => {
                          const updated = organizations.map(o => 
                            o.id === org.id ? {...o, name: e.target.value} : o
                          );
                          setOrganizations(updated);
                        }}
                        className="org-name-input"
                      />
                    </div>
                    <div className="org-edit-controls">
                      <div className="color-picker">
                        <label>צבע:</label>
                        <input 
                          type="color" 
                          value={org.color}
                          onChange={(e) => {
                            const updated = organizations.map(o => 
                              o.id === org.id ? {...o, color: e.target.value} : o
                            );
                            setOrganizations(updated);
                          }}
                        />
                      </div>
                      <div className="icon-picker">
                        <label>אייקון:</label>
                        <select 
                          value={org.icon}
                          onChange={(e) => {
                            const updated = organizations.map(o => 
                              o.id === org.id ? {...o, icon: e.target.value} : o
                            );
                            setOrganizations(updated);
                          }}
                        >
                          <option value="🏥">🏥</option>
                          <option value="📚">📚</option>
                          <option value="🌱">🌱</option>
                          <option value="🏠">🏠</option>
                          <option value="🎓">🎓</option>
                          <option value="❤️">❤️</option>
                          <option value="🌟">🌟</option>
                          <option value="🎯">🎯</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tool-section">
              <h2>ניהול תורמים</h2>
              <button 
                className="tool-btn"
                onClick={() => setShowDonorsList(true)}
              >
                📋 ניהול רשימת תורמים
              </button>
              <button 
                className="tool-btn"
                onClick={() => setShowBulkEdit(true)}
              >
                ⚡ תרומות מרוכזות
              </button>
              <button 
                className="tool-btn"
                onClick={() => setShowExcelImport(true)}
              >
                📊 ייבוא מקובץ Excel
              </button>
            </div>

            <div className="tool-section">
              <h2>הגדרות טיימר</h2>
              <div className="timer-settings">
                <div className="timer-duration">
                  <label>משך זמן (דקות):</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="480"
                    value={timerSettings.duration}
                    onChange={(e) => updateTimerDuration(parseInt(e.target.value) || 30)}
                    className="timer-duration-input"
                  />
                </div>
                
                <div className="timer-controls">
                  <button 
                    className={`timer-btn ${timerSettings.isActive && !timerSettings.isPaused ? 'active' : ''}`}
                    onClick={startTimer}
                    disabled={timerSettings.isActive && !timerSettings.isPaused}
                  >
                    ▶️ התחל
                  </button>
                  <button 
                    className={`timer-btn ${timerSettings.isPaused ? 'active' : ''}`}
                    onClick={timerSettings.isPaused ? resumeTimer : pauseTimer}
                    disabled={!timerSettings.isActive}
                  >
                    {timerSettings.isPaused ? '▶️ המשך' : '⏸️ השהייה'}
                  </button>
                  <button 
                    className="timer-btn stop"
                    onClick={stopTimer}
                    disabled={!timerSettings.isActive}
                  >
                    ⏹️ עצור
                  </button>
                  <button 
                    className="timer-btn reset"
                    onClick={resetTimer}
                  >
                    🔄 איפוס
                  </button>
                </div>
                
                <div className="timer-info">
                  <div className="timer-current">
                    <span>זמן נוכחי: {formatTimeWithSeparateDigits(timerSettings.remainingTime)}</span>
                  </div>
                  <div className="timer-status-info">
                    <span>סטטוס: {
                      timerSettings.isActive ? 
                        (timerSettings.isPaused ? 'מושהה' : 'פעיל') : 
                        'עצור'
                    }</span>
                  </div>
                  <div className="timer-shortcuts">
                    <span>קיצורי מקלדת: Ctrl+1 (התחל), Ctrl+2 (השהייה/המשך), Ctrl+3 (עצור), Ctrl+4 (איפוס), Ctrl+H (הצג/הסתר)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="system-stats">
              <h2>סטטיסטיקות מערכת</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>סה"כ תרומות</h3>
                  <span className="stat-number">{donations.length}</span>
                </div>
                <div className="stat-card">
                  <h3>סה"כ כסף</h3>
                  <span className="stat-number">₪{totalRaised.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                  <h3>מספר תורמים</h3>
                  <span className="stat-number">{donors.length}</span>
                </div>
                <div className="stat-card">
                  <h3>מספר גופים</h3>
                  <span className="stat-number">{organizations.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderDonationsAdminScreen = () => (
    <div className="donations-admin-screen">
      <main className="main">
        <div style={{position:'fixed', top:48, left:18, zIndex:2000, display:'flex', flexDirection:'column', alignItems:'center'}}>
          <img src={generalDonationLogo} alt="logo" style={{width:140, height:140, background:'none'}} />
          <div style={{fontSize:'2rem', fontWeight:'bold', color:'#8B4513', letterSpacing:'2px'}}>צרדי-קעמפ</div>
        </div>
        <div className="container">
          <div className="admin-content">
            <div className="add-donation-section">
              <h2>הוספת תרומה חדשה</h2>
              <button 
                className="add-donation-btn"
                onClick={() => setShowDonationForm(true)}
              >
                ➕ הוסף תרומה חדשה
              </button>
            </div>

            <div className="all-donations-section">
              <h2>כל התרומות</h2>
              <div className="donations-table" style={{ width: '98%', maxWidth: '1600px', margin: '0 auto', direction: 'rtl' }}>
                <div className="table-header">
                  <span>שם התורם</span>
                  <span>סכום</span>
                  <span>שם הקבוצה</span>
                  <span>למי תרם</span>
                  <span>תאריך התרומה</span>
                  <span>הודעה</span>
                  <span></span>
                </div>
                {donations.map(donation => {
                  const org = organizations.find((o: Organization) => o.id === donation.organizationId);
                  const donor = donors.find((d: Donor) => d.name === donation.name);
                  return (
                    <div key={donation.id} className="table-row" style={{position:'relative', minHeight: '56px'}}>
                      <span className="donor-name">{donation.name}</span>
                      <span className="donation-amount">₪{donation.amount.toLocaleString()}</span>
                      <span className="donor-group">{donor?.group || 'לא מוגדר'}</span>
                      <span className="donation-org">
                        {org && <span className="org-icon" style={{ color: org.color }}><img src={org.icon} alt={org.name} style={{width: '64px', height: '64px', objectFit: 'contain', background: 'transparent'}} /></span>}
                        {org?.name}
                      </span>
                      <span className="donation-date">{donation.date}</span>
                      <span className="donation-message">{donation.message || ''}</span>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 48, height: '100%', position: 'relative' }}>
                        <button
                          className="menu-toggle"
                          onClick={() => setOpenMenuDonationId(openMenuDonationId === donation.id ? null : donation.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, margin: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="אפשרויות"
                        >
                          <span style={{ display: 'inline-block', width: 24, height: 24 }}>
                            <span style={{ display: 'block', width: '100%', height: 4, background: '#bfa13a', borderRadius: 2, margin: '3px 0' }}></span>
                            <span style={{ display: 'block', width: '100%', height: 4, background: '#bfa13a', borderRadius: 2, margin: '3px 0' }}></span>
                            <span style={{ display: 'block', width: '100%', height: 4, background: '#bfa13a', borderRadius: 2, margin: '3px 0' }}></span>
                          </span>
                        </button>
                        {openMenuDonationId === donation.id && (
                          <button
                            style={{
                              marginRight: 8,
                              background: '#fff',
                              border: '1px solid #bfa13a',
                              color: '#8B4513',
                              fontWeight: 700,
                              borderRadius: 8,
                              padding: '4px 16px',
                              cursor: 'pointer',
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}
                            onClick={() => {
                              setOpenMenuDonationId(null);
                              if (window.confirm('האם אתה בטוח שברצונך לבטל תרומה זו?')) {
                                if (window.confirm('בטוח? פעולה זו אינה הפיכה!')) {
                                  setDonations(donations.filter(d => d.id !== donation.id));
                                }
                              }
                            }}
                          >
                            ביטול
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="App">
      {/* פס עליון ניווט */}
      <nav className="topbar-nav">
        <button className="menu-toggle" onClick={() => setIsNavCollapsed(!isNavCollapsed)}>
          ☰
        </button>
        {isNavCollapsed && (
          <div className="nav-menu">
            <button className={`nav-btn ${currentScreen === 'view' ? 'active' : ''}`} onClick={() => setCurrentScreen('view')}>
              👁️ צפייה
            </button>
            <button className={`nav-btn ${currentScreen === 'admin-main' ? 'active' : ''}`} onClick={() => setCurrentScreen('admin-main')}>
              🏢 ניהול ראשי
            </button>
            <button className={`nav-btn ${currentScreen === 'donations-admin' ? 'active' : ''}`} onClick={() => setCurrentScreen('donations-admin')}>
              💰 ניהול תרומות
            </button>
          </div>
        )}
      </nav>
      {currentScreen === 'view' && renderViewScreen()}
      {currentScreen === 'admin-main' && renderAdminMainScreen()}
      {currentScreen === 'donations-admin' && renderDonationsAdminScreen()}

      {/* Donation Modal */}
      {showDonationForm && (
        <div className="modal-overlay" onClick={() => setShowDonationForm(false)}>
          <div className="modal" ref={donationModalRef} onClick={e => e.stopPropagation()}>
            <h2>הוספת תרומה חדשה</h2>
            <form onSubmit={handleDonation}>
              <div className="form-group">
                <label>בחר גוף</label>
                <div className="organization-buttons">
                  {organizations.map(org => (
                    <button
                      key={org.id}
                      type="button"
                      className={`org-btn ${selectedOrganization === org.id ? 'selected' : ''}`}
                      style={{ 
                        borderColor: org.color,
                        backgroundColor: selectedOrganization === org.id ? org.color : 'transparent',
                        color: selectedOrganization === org.id ? 'white' : org.color
                      }}
                      onClick={() => setSelectedOrganization(org.id)}
                    >
                      <span className="org-icon"><img src={org.icon} alt={org.name} style={{width: '64px', height: '64px', objectFit: 'contain', background: 'transparent'}} /></span>
                      <span className="org-name">{org.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>בחירת תורם</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div>
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="donorMode" 
                        value="select"
                        checked={donorInputMode === 'select'}
                        onChange={() => setDonorInputMode('select')}
                      />
                      בחר מרשימה
                    </label>
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="donorMode" 
                        value="type"
                        checked={donorInputMode === 'type'}
                        onChange={() => setDonorInputMode('type')}
                      />
                      הקלד שם
                    </label>
                  </div>
                  <button type="button" className="tool-btn" style={{padding: '8px 18px', fontSize: '0.95rem'}} onClick={() => document.getElementById('import-names-input')?.click()}>
                    📥 ייבוא שמות מקובץ
                  </button>
                  <input id="import-names-input" type="file" accept=".csv" style={{display:'none'}} onChange={handleImportNames} />
                </div>
                {donorInputMode === 'select' ? (
                  <select
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  >
                    <option value="">בחר תורם...</option>
                    {donors.map(donor => (
                      <option key={donor.id} value={donor.name}>
                        {donor.name} - {donor.group}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="custom-donor-inputs">
                    <input
                      type="text"
                      value={customDonorName}
                      onChange={(e) => setCustomDonorName(e.target.value)}
                      placeholder="הקלד שם התורם"
                      required
                    />
                    <input
                      type="text"
                      value={customDonorGroup}
                      onChange={(e) => setCustomDonorGroup(e.target.value)}
                      placeholder="הקלד קבוצה"
                      required
                    />
                  </div>
                )}
              </div>
              {/* בחירה מרובה של שמות מיובאים */}
              {showImportNames && importedNames.length > 0 && (
                <div className="form-group">
                  <label>בחר שמות לייבוא</label>
                  <div style={{maxHeight: 180, overflowY: 'auto', background: '#faf8f5', borderRadius: 10, padding: 10, border: '1px solid #e8dcc0'}}>
                    {importedNames.map((item, idx) => (
                      <label key={idx} style={{display:'block', marginBottom: 6}}>
                        <input
                          type="checkbox"
                          checked={selectedImportedNames.includes(item.name)}
                          onChange={e => {
                            if (e.target.checked) setSelectedImportedNames([...selectedImportedNames, item.name]);
                            else setSelectedImportedNames(selectedImportedNames.filter(n => n !== item.name));
                          }}
                        />
                        <span style={{marginRight: 8}}>{item.name}{item.group ? ` (${item.group})` : ''}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" className="tool-btn" style={{marginTop: 10}} onClick={() => {
                    // הוספת כל השמות הנבחרים לרשימת התורמים אם לא קיימים
                    const newDonors = importedNames.filter(n => selectedImportedNames.includes(n.name) && !donors.some(d => d.name === n.name));
                    if (newDonors.length > 0) setDonors([...donors, ...newDonors.map(n => ({id: Date.now() + Math.random(), name: n.name, group: n.group, email: '', phone: ''}))]);
                    setShowImportNames(false);
                    setImportedNames([]);
                    setSelectedImportedNames([]);
                  }}>
                    הוסף נבחרים לרשימת תורמים
                  </button>
                  <button type="button" style={{marginRight: 10}} onClick={() => {setShowImportNames(false); setImportedNames([]); setSelectedImportedNames([]);}}>
                    ביטול
                  </button>
                </div>
              )}
              <div className="form-group">
                <label>סכום התרומה (₪)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>הודעה (אופציונלי)</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowDonationForm(false)}>
                  ביטול
                </button>
                <button type="submit" className="submit-btn" disabled={!selectedOrganization}>
                  הוסף תרומה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donors List Modal */}
      {showDonorsList && (
        <div className="modal-overlay" onClick={() => setShowDonorsList(false)}>
          <div className="modal large-modal" onClick={e => e.stopPropagation()}>
            <h2>ניהול רשימת תורמים</h2>
            <div className="donors-table">
              <div className="table-header">
                <span>שם</span>
                <span>אימייל</span>
                <span>טלפון</span>
                <span>קבוצה</span>
                <span>פעולות</span>
              </div>
              {donors.map(donor => (
                <div key={donor.id} className="table-row">
                  <input 
                    type="text" 
                    value={donor.name}
                    onChange={(e) => {
                      const updated = donors.map(d => 
                        d.id === donor.id ? {...d, name: e.target.value} : d
                      );
                      setDonors(updated);
                    }}
                  />
                  <input 
                    type="email" 
                    value={donor.email || ''}
                    onChange={(e) => {
                      const updated = donors.map(d => 
                        d.id === donor.id ? {...d, email: e.target.value} : d
                      );
                      setDonors(updated);
                    }}
                  />
                  <input 
                    type="tel" 
                    value={donor.phone || ''}
                    onChange={(e) => {
                      const updated = donors.map(d => 
                        d.id === donor.id ? {...d, phone: e.target.value} : d
                      );
                      setDonors(updated);
                    }}
                  />
                  <input 
                    type="text" 
                    value={donor.group}
                    onChange={(e) => {
                      const updated = donors.map(d => 
                        d.id === donor.id ? {...d, group: e.target.value} : d
                      );
                      setDonors(updated);
                    }}
                  />
                  <button 
                    className="delete-btn"
                    onClick={() => {
                      const updated = donors.filter(d => d.id !== donor.id);
                      setDonors(updated);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button 
                className="add-donor-btn"
                onClick={() => {
                  const newDonor: Donor = {
                    id: Date.now(),
                    name: '',
                    email: '',
                    phone: '',
                    group: ''
                  };
                  setDonors([...donors, newDonor]);
                }}
              >
                ➕ הוסף תורם חדש
              </button>
              <button onClick={() => setShowDonorsList(false)}>
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="modal-overlay" onClick={() => setShowBulkEdit(false)}>
          <div className="modal large-modal" onClick={e => e.stopPropagation()}>
            <h2>תרומות מרוכזות</h2>
            <div className="bulk-edit-form">
              <div className="bulk-donations-list">
                {bulkDonations.map((item, index) => (
                  <div key={index} className="bulk-donation-item">
                    <div className="bulk-item-header">
                      <h4>תרומה #{index + 1}</h4>
                      <button 
                        className="remove-item-btn"
                        onClick={() => removeBulkDonationItem(index)}
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="bulk-item-fields">
                      <div className="form-group">
                        <label>תורם</label>
                        <div className="donor-input-mode">
                          <label className="radio-label">
                            <input 
                              type="radio" 
                              name={`donorMode${index}`}
                              value="select"
                              checked={item.donorId !== 0}
                              onChange={() => updateBulkDonationItem(index, 'donorId', 0)}
                            />
                            בחר מרשימה
                          </label>
                          <label className="radio-label">
                            <input 
                              type="radio" 
                              name={`donorMode${index}`}
                              value="type"
                              checked={item.donorId === 0}
                              onChange={() => updateBulkDonationItem(index, 'donorId', 0)}
                            />
                            הקלד שם
                          </label>
                        </div>
                        
                        {item.donorId !== 0 ? (
                          <select
                            value={item.donorId}
                            onChange={(e) => updateBulkDonationItem(index, 'donorId', parseInt(e.target.value))}
                          >
                            <option value={0}>בחר תורם...</option>
                            {donors.map(donor => (
                              <option key={donor.id} value={donor.id}>
                                {donor.name} - {donor.group}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={item.donorName}
                            onChange={(e) => updateBulkDonationItem(index, 'donorName', e.target.value)}
                            placeholder="הקלד שם התורם"
                          />
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label>גוף</label>
                        <div className="organization-buttons">
                          {organizations.map(org => (
                            <button
                              key={org.id}
                              type="button"
                              className={`org-btn ${item.organizationId === org.id ? 'selected' : ''}`}
                              style={{ 
                                borderColor: org.color,
                                backgroundColor: item.organizationId === org.id ? org.color : 'transparent',
                                color: item.organizationId === org.id ? 'white' : org.color
                              }}
                              onClick={() => updateBulkDonationItem(index, 'organizationId', org.id)}
                            >
                              <span className="org-icon"><img src={org.icon} alt={org.name} style={{width: '64px', height: '64px', objectFit: 'contain', background: 'transparent'}} /></span>
                              <span className="org-name">{org.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>סכום (₪)</label>
                        <input
                          type="number"
                          min="1"
                          value={item.amount}
                          onChange={(e) => updateBulkDonationItem(index, 'amount', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>הודעה (אופציונלי)</label>
                        <input
                          type="text"
                          value={item.message}
                          onChange={(e) => updateBulkDonationItem(index, 'message', e.target.value)}
                          placeholder="הודעה לתרומה"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bulk-actions">
                <button 
                  type="button"
                  className="add-item-btn"
                  onClick={addBulkDonationItem}
                >
                  ➕ הוסף תרומה
                </button>
                <button 
                  type="button"
                  className="submit-bulk-btn"
                  onClick={handleBulkDonation}
                  disabled={bulkDonations.length === 0}
                >
                  💾 שמור כל התרומות
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showExcelImport && (
        <div className="modal-overlay" onClick={() => setShowExcelImport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>ייבוא מקובץ Excel</h2>
            <div className="excel-import-form">
              <div className="form-group">
                <label>בחר קובץ CSV</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleExcelImport}
                />
              </div>
              <div className="excel-instructions">
                <h4>הוראות לקובץ CSV:</h4>
                <p>הקובץ צריך להכיל את העמודות הבאות:</p>
                <ul>
                  <li>עמודה 1: שם התורם</li>
                  <li>עמודה 2: שם הגוף</li>
                  <li>עמודה 3: סכום התרומה</li>
                  <li>עמודה 4: הודעה (אופציונלי)</li>
                </ul>
                <p><strong>דוגמה:</strong></p>
                <pre>דוד כהן,קרן הצלת חיים,500,תרומה למען הצלת חיים
שרה לוי,עמותת החינוך,200,תמיכה בחינוך</pre>
              </div>
              <div className="form-actions">
                <button onClick={() => setShowExcelImport(false)}>
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donation Notification */}
      {showDonationNotification && lastDonation && (
        <div className="donation-toast toast-fixed">
          <div className="toast-content" style={{gap: 20, alignItems: 'center'}}>
            <img src={generalDonationLogo} alt="logo" style={{height:40, marginLeft:12}} />
            <span className="toast-donor-name" style={{fontSize: '1.1em', fontWeight: 700, color: '#fff', letterSpacing: 0.5}}>
              {lastDonation.name}
            </span>
            <span className="toast-donor-group">
              {(() => {
                const donor = donors.find(d => d.name === lastDonation.name);
                return donor?.group || 'לא מוגדר';
              })()}
            </span>
            <span className="toast-amount">₪{lastDonation.amount.toLocaleString()}</span>
            <span className="toast-org">
              {(() => {
                const org = organizations.find(o => o.id === lastDonation.organizationId);
                return org ? org.name : '';
              })()}
            </span>
          </div>
          {lastDonation && (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginTop: 12}}>
              <img src={organizations.find(o => o.id === lastDonation.organizationId)?.icon} alt={organizations.find(o => o.id === lastDonation.organizationId)?.name} style={{height:48, width:48, objectFit:'contain', marginBottom:4}} />
              <div style={{fontSize:'1.1rem', color:'#8B4513', fontWeight:'bold'}}>{organizations.find(o => o.id === lastDonation.organizationId)?.name}</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; כל הזכויות שמורות למרכזים מוישי מרכוס גן ישראל המקורי המרכזי תשפ''ה</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
