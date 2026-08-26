import React, { useState } from 'react';
import { X, Calendar, Check } from 'lucide-react';
import { getMonday, formatWeekString } from '../utils/storage';

export default function ChangeWeekDateModal({ isOpen, currentWeek, onClose, onChangeDate }) {
  if (!isOpen || !currentWeek) return null;

  const initialDate = currentWeek.startDate 
    ? new Date(currentWeek.startDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(initialDate);

  const previewMonday = getMonday(new Date(selectedDate));
  const previewFormattedName = formatWeekString(previewMonday);

  const handleSave = () => {
    onChangeDate(currentWeek.id, selectedDate);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div className="modal-title flex-title">
            <Calendar size={22} className="text-primary" />
            <div>
              <h3>Hafta Tarihini Değiştir</h3>
              <p className="subtext"><b>{currentWeek.name}</b></p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 700, fontSize: '1.1rem' }}>
              Takvimden Bir Gün Seçin:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)',
                fontSize: '1.2rem',
                fontFamily: 'inherit',
                fontWeight: 700,
                background: 'var(--bg-color)',
                color: 'var(--text-main)'
              }}
            />
          </div>

          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', border: '1px dashed var(--border-color)' }}>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hesaplanan Hafta Aralığı:</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.2rem' }}>
              {previewFormattedName}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>İptal</button>
          <button className="btn-primary flex-btn" onClick={handleSave}>
            <Check size={16} /> Tarihi Güncelle
          </button>
        </div>
      </div>
    </div>
  );
}
