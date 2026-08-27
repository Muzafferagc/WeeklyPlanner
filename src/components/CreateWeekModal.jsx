import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, PlusCircle, X } from 'lucide-react';

const CreateWeekModal = ({ isOpen, onClose, onCreateWeek }) => {
  const [customDate, setCustomDate] = useState('');

  if (!isOpen) return null;

  const handleCreate = (mode, dateVal = null) => {
    onCreateWeek(mode, dateVal);
    onClose();
  };

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div className="create-week-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={22} style={{ color: 'var(--primary-color, #2563eb)' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Yeni Hafta Ekle</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <p className="modal-sub-desc">Hangi tarih aralığında bir hafta planı oluşturmak istiyorsunuz?</p>

        <div className="create-week-options">
          {/* Option 1: Future Week (+7 Days) */}
          <div 
            className="create-week-mode-card"
            onClick={() => handleCreate('next')}
          >
            <div className="mode-icon-circle blue">
              <ChevronRight size={20} />
            </div>
            <div className="mode-text">
              <div className="mode-title">1. Gelecek Hafta Ekle (+7 Gün İleri)</div>
              <div className="mode-desc">Kayıtlı en son haftanızın sonrasına 7 günlük yeni hafta ekler.</div>
            </div>
          </div>

          {/* Option 2: Past Week (-7 Days) */}
          <div 
            className="create-week-mode-card"
            onClick={() => handleCreate('prev')}
          >
            <div className="mode-icon-circle purple">
              <ChevronLeft size={20} />
            </div>
            <div className="mode-text">
              <div className="mode-title">2. Geçmiş Hafta Ekle (-7 Gün Geri)</div>
              <div className="mode-desc">Kayıtlı en eski haftanızın öncesine 7 günlük geçmiş hafta ekler.</div>
            </div>
          </div>

          {/* Option 3: Custom Specific Date */}
          <div className="create-week-mode-card custom-mode">
            <div className="mode-icon-circle green">
              <Calendar size={20} />
            </div>
            <div className="mode-text" style={{ width: '100%' }}>
              <div className="mode-title">3. Özel Hafta Başlangıcı Seç</div>
              <div className="mode-desc">Takvimden istediğiniz herhangi bir tarihi belirleyin:</div>
              <div className="custom-date-picker-row" style={{ marginTop: '0.55rem', display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="date" 
                  className="form-control"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem 0.65rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
                <button 
                  type="button" 
                  className="btn-primary"
                  disabled={!customDate}
                  style={{ padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 700 }}
                  onClick={() => {
                    if (customDate) handleCreate('custom', customDate);
                  }}
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWeekModal;
