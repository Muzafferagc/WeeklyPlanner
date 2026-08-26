import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

export default function CopyWeekModal({ isOpen, sourceWeek, weeks, onClose, onCopyWeek }) {
  if (!isOpen || !sourceWeek) return null;

  const targetWeeks = weeks.filter(w => w.id !== sourceWeek.id);
  const [selectedTargetId, setSelectedTargetId] = useState(targetWeeks[0]?.id || '');
  const [createNewTarget, setCreateNewTarget] = useState(false);

  const handleCopy = () => {
    onCopyWeek(sourceWeek.id, createNewTarget ? 'new' : selectedTargetId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content copy-week-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div className="modal-title flex-title">
            <Copy size={22} className="text-primary" />
            <div>
              <h3>Haftayı Kopyala</h3>
              <p className="subtext"><b>{sourceWeek.name}</b> planını kopyalayın</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="copy-option-group">
            <label className="radio-label">
              <input
                type="radio"
                name="targetType"
                checked={createNewTarget}
                onChange={() => setCreateNewTarget(true)}
              />
              <span>Gelecek Yeni Bir Hafta Oluştur ve Kopyala</span>
            </label>

            {targetWeeks.length > 0 && (
              <label className="radio-label">
                <input
                  type="radio"
                  name="targetType"
                  checked={!createNewTarget}
                  onChange={() => setCreateNewTarget(false)}
                />
                <span>Mevcut Haftalardan Birinin Üzerine Yaz:</span>
              </label>
            )}

            {!createNewTarget && targetWeeks.length > 0 && (
              <select
                value={selectedTargetId}
                onChange={e => setSelectedTargetId(e.target.value)}
                className="modal-select-input"
                style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', borderRadius: '8px', fontSize: '1.1rem' }}
              >
                {targetWeeks.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>İptal</button>
          <button className="btn-primary flex-btn" onClick={handleCopy}>
            <Check size={16} /> Haftayı Kopyala
          </button>
        </div>
      </div>
    </div>
  );
}
