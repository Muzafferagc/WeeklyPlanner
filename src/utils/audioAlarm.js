let alarmIntervalId = null;
let sharedAudioCtx = null;

const getSharedAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
      sharedAudioCtx = new AudioCtxClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

// Global iOS touch unlock listener
if (typeof window !== 'undefined') {
  const unlock = () => {
    getSharedAudioContext();
  };
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('click', unlock, { passive: true });
}

export const startAlarmChimeLoop = () => {
  stopAlarmChime();

  const playBeepSeq = () => {
    try {
      const ctx = getSharedAudioContext();
      if (!ctx) return;

      const freqs = [880, 1760, 880, 1760];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.5, ctx.currentTime + idx * 0.1);
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
  getSharedAudioContext();
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
