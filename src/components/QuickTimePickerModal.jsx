import React, { useState } from 'react';
import { X, Clock, Check } from 'lucide-react';

const DURATIONS = [
  { label: '15 Dk', min: 15 },
  { label: '30 Dk', min: 30 },
  { label: '45 Dk', min: 45 },
  { label: '1 Saat', min: 60 },
  { label: '1.5 Saat', min: 90 },
  { label: '2 Saat', min: 120 },
  { label: '3 Saat', min: 180 }
];

const parseInitialStartTime = (timeStr) => {
  if (!timeStr) return '07:00';
  const match = timeStr.match(/\b\d{1,2}:\d{2}\b/);
  if (match) {
    const [h, m] = match[0].split(':');
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return '07:00';
};

const parseInitialEndTime = (timeStr) => {
  if (!timeStr || (!timeStr.includes('-') && !timeStr.includes('/'))) return '';
  const parts = timeStr.split(/[-/]/);
  if (parts.length > 1) {
    const match = parts[1].match(/\b\d{1,2}:\d{2}\b/);
    if (match) {
      const [h, m] = match[0].split(':');
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  return '';
};

const parseInitialMode = (timeStr) => {
  if (!timeStr) return 'single';
  if (timeStr.includes('/')) return 'flexible_or';
  if (timeStr.includes('-')) return 'block';
  if (timeStr === 'Gün Boyu') return 'allday';
  if (timeStr === 'Serbest') return 'flexible';
  if (timeStr === 'Rutin' || timeStr === 'Her Gün') return 'routine';
  return 'single';
};

export const validateTimeText = (text) => {
  if (!text) return '07:00';
  let trimmed = text.trim().replace(/\./g, ':');
  if (!trimmed) return '07:00';
  if (['Gün Boyu', 'Serbest', 'Rutin', 'Her Gün'].includes(trimmed)) return trimmed;

  // Single HH:MM format (e.g. 18:03)
  const singleRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
  if (singleRegex.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Check valid time format: HH:MM - HH:MM, HH:MM / HH:MM
  const timeBlockRegex = /^([01]?\d|2[0-3]):[0-5]\d(\s*[-/]\s*([01]?\d|2[0-3]):[0-5]\d)?$/;
  if (timeBlockRegex.test(trimmed)) {
    return trimmed;
  }

  // If 4 digits like 1803, format to 18:03
  if (/^\d{4}$/.test(trimmed)) {
    const h = trimmed.slice(0,2);
    const m = trimmed.slice(2,4);
    if (Number(h) < 24 && Number(m) < 60) {
      return `${h}:${m}`;
    }
  }

  // If single 2-digit hour like 08, format to 08:00
  if (/^\d{1,2}$/.test(trimmed)) {
    const h = Number(trimmed);
    if (h >= 0 && h < 24) {
      return `${String(h).padStart(2, '0')}:00`;
    }
  }

  return null;
};

export default function QuickTimePickerModal({ slot, day, onClose, onSaveTime }) {
  if (!slot) return null;

  const [timeMode, setTimeMode] = useState(() => parseInitialMode(slot.time));
  const [startTime, setStartTime] = useState(() => parseInitialStartTime(slot.time));
  const [endTime, setEndTime] = useState(() => parseInitialEndTime(slot.time));
  const [durationMin, setDurationMin] = useState(30);
  const [separator, setSeparator] = useState(() => slot.time?.includes('/') ? '/' : '-');
  const [customTimeText, setCustomTimeText] = useState(slot.time || '');
  const [errorMsg, setErrorMsg] = useState('');

  const calcEndTime = (start, duration) => {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return start;
    const total = h * 60 + m + Number(duration);
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const handleApplyPreset = (mode, start, dur, customEnd, chosenSep = separator) => {
    setTimeMode(mode);
    setErrorMsg('');
    if (mode === 'single') {
      const activeStart = start || startTime || '07:00';
      setCustomTimeText(activeStart);
    } else if (mode === 'block' || mode === 'flexible_or') {
      const activeSep = mode === 'flexible_or' ? '/' : chosenSep;
      const activeStart = start || startTime || '07:00';
      if (customEnd) {
        setEndTime(customEnd);
        setCustomTimeText(`${activeStart} ${activeSep} ${customEnd}`);
      } else {
        const activeDur = dur !== undefined ? dur : (mode === 'flexible_or' ? 10 : durationMin);
        const computedEnd = calcEndTime(activeStart, activeDur);
        setEndTime(computedEnd);
        setCustomTimeText(`${activeStart} ${activeSep} ${computedEnd}`);
      }
    } else if (mode === 'allday') {
      setCustomTimeText('Gün Boyu');
    } else if (mode === 'flexible') {
      setCustomTimeText('Serbest');
    } else if (mode === 'routine') {
      setCustomTimeText('Her Gün');
    }
  };

  const handleSave = () => {
    const validated = validateTimeText(customTimeText);
    if (!validated) {
      setErrorMsg("Geçersiz saat formatı! Örn: '18:03', '07:00', '08:30 - 09:15'");
      return;
    }
    onSaveTime(day, slot.id, validated);
    onClose();
  };

  return (
    <div className="quick-time-overlay" onClick={onClose}>
      <div className="quick-time-content" onClick={e => e.stopPropagation()}>
        <div className="quick-time-header">
          <div className="quick-time-title">
            <Clock size={22} className="text-primary" />
            <div>
              <h3>Saat ve Süre Ayarla</h3>
              <p className="quick-sub">{slot.activity} ({day})</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="quick-time-body">
          {/* MODE SELECTOR */}
          <div className="time-mode-mini">
            <button
              type="button"
              className={`mini-mode-btn ${timeMode === 'single' ? 'active' : ''}`}
              onClick={() => handleApplyPreset('single', startTime)}
            >
              Tek Saat (Örn: 18:03)
            </button>
            <button
              type="button"
              className={`mini-mode-btn ${timeMode === 'block' ? 'active' : ''}`}
              onClick={() => handleApplyPreset('block', startTime, durationMin, null, '-')}
            >
              Saat Aralıklı (-)
            </button>
            <button
              type="button"
              className={`mini-mode-btn ${timeMode === 'flexible_or' ? 'active' : ''}`}
              onClick={() => handleApplyPreset('flexible_or', startTime, 10, null, '/')}
            >
              Veya / Esnek ( / )
            </button>
            <button
              type="button"
              className={`mini-mode-btn ${timeMode === 'allday' ? 'active' : ''}`}
              onClick={() => handleApplyPreset('allday')}
            >
              Gün Boyu
            </button>
            <button
              type="button"
              className={`mini-mode-btn ${timeMode === 'flexible' ? 'active' : ''}`}
              onClick={() => handleApplyPreset('flexible')}
            >
              Serbest
            </button>
            <button
              type="button"
              className={`mini-mode-btn ${timeMode === 'routine' ? 'active' : ''}`}
              onClick={() => handleApplyPreset('routine')}
            >
              Rutin
            </button>
          </div>

          {timeMode === 'single' && (
            <div className="quick-time-controls">
              <div className="time-picker-row" style={{ justifyContent: 'center' }}>
                <div className="field-group" style={{ maxWidth: '240px' }}>
                  <label>Saat Seçin (Örn: 18:03):</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => {
                      setStartTime(e.target.value);
                      handleApplyPreset('single', e.target.value);
                    }}
                    className="mini-time-input"
                    style={{ fontSize: '1.4rem', textAlign: 'center' }}
                  />
                </div>
              </div>
            </div>
          )}

          {(timeMode === 'block' || timeMode === 'flexible_or') && (
            <div className="quick-time-controls">
              {/* Separator Toggle */}
              <div className="separator-toggle-bar">
                <span className="sep-label">Ayrıştırıcı Sembol:</span>
                <button
                  type="button"
                  className={`sep-btn ${separator === '-' ? 'active' : ''}`}
                  onClick={() => {
                    setSeparator('-');
                    handleApplyPreset(timeMode, startTime, durationMin, endTime, '-');
                  }}
                >
                  - (Aralık)
                </button>
                <button
                  type="button"
                  className={`sep-btn ${separator === '/' ? 'active' : ''}`}
                  onClick={() => {
                    setSeparator('/');
                    handleApplyPreset(timeMode, startTime, durationMin, endTime, '/');
                  }}
                >
                  / (Veya / Arası)
                </button>
              </div>

              <div className="time-picker-row">
                <div className="field-group">
                  <label>İlk Saat:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => {
                      setStartTime(e.target.value);
                      handleApplyPreset(timeMode, e.target.value, durationMin, endTime);
                    }}
                    className="mini-time-input"
                  />
                </div>

                <div className="field-group">
                  <label>İkinci Saat:</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => {
                      setEndTime(e.target.value);
                      handleApplyPreset(timeMode, startTime, durationMin, e.target.value);
                    }}
                    className="mini-time-input"
                  />
                </div>
              </div>

              <div className="duration-row">
                <span className="duration-label">Süre Çipleri:</span>
                <div className="duration-mini-chips">
                  {DURATIONS.map(d => (
                    <button
                      key={d.min}
                      type="button"
                      className={`mini-chip ${durationMin === d.min ? 'active' : ''}`}
                      onClick={() => {
                        setDurationMin(d.min);
                        handleApplyPreset(timeMode, startTime, d.min);
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <div className="custom-duration-box">
                  <label>Özel Dakika:</label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    placeholder="25"
                    value={durationMin}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setDurationMin(val);
                      handleApplyPreset(timeMode, startTime, val);
                    }}
                    className="custom-duration-input"
                  />
                  <span>dk</span>
                </div>
              </div>
            </div>
          )}

          <div className="quick-preview-box">
            <label>Seçilen Saat Metni:</label>
            <input
              type="text"
              value={customTimeText}
              onChange={e => {
                setCustomTimeText(e.target.value);
                setErrorMsg('');
              }}
              className="slot-time-text-input"
              placeholder="Örn: 07:00 / 07:10 veya 08:30 - 09:15"
            />
            {errorMsg && <p className="time-error-msg">{errorMsg}</p>}
          </div>
        </div>

        <div className="quick-time-footer">
          <button className="btn-secondary" onClick={onClose}>İptal</button>
          <button className="btn-primary flex-btn" onClick={handleSave}>
            <Check size={16} /> Saati Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
