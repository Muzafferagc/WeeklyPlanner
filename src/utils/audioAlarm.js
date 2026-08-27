// Web Audio API Real Phone Alarm Ringtone Loop (100% Offline & iOS Compatible)
let alarmIntervalId = null;

export const startAlarmChimeLoop = () => {
  stopAlarmChime(); // Clear existing loop if any

  const playBeepSeq = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Double Beep digital alarm sound (880Hz A5 + 1760Hz A6)
      const freqs = [880, 1760, 880, 1760];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square'; // Digital alarm tone
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.4, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.09);
      });
    } catch (e) {}
  };

  playBeepSeq();
  alarmIntervalId = setInterval(playBeepSeq, 1200);
};

export const stopAlarmChime = () => {
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
};

export const requestNotificationPermissionOnce = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (localStorage.getItem('notificationPermissionRequested') === 'true') return;
  
  if (Notification.permission === 'default') {
    localStorage.setItem('notificationPermissionRequested', 'true');
    Notification.requestPermission().catch(() => {});
  }
};

export const triggerSystemNotification = (title, body) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
        tag: 'weekly-planner-alarm'
      });
    } catch (e) {}
  }
};
