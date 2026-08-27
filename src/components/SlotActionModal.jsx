import React, { useState } from 'react';
import { X, ArrowUp, ArrowDown, Copy, MoveRight, Trash2, Edit3, CheckCircle2 } from 'lucide-react';

const WEEK_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const SlotActionModal = ({ 
  day, 
  slot, 
  totalSlotsInDay, 
  slotIndex, 
  onClose, 
  onMoveUp, 
  onMoveDown, 
  onMoveToDay, 
  onCopyToDay, 
  onEdit, 
  onDelete 
}) => {
  const [selectedTargetDay, setSelectedTargetDay] = useState(day);
  const [targetAction, setTargetAction] = useState(null); // 'move' or 'copy'

  const handleExecuteDayAction = () => {
    if (!selectedTargetDay) return;
    if (targetAction === 'move') {
      onMoveToDay(day, slot.id, selectedTargetDay);
    } else if (targetAction === 'copy') {
      onCopyToDay(day, slot.id, selectedTargetDay);
    }
    onClose();
  };

  return (
    <div className="modal-overlay mobile-high-overlay no-print" onClick={onClose}>
      <div className="modal-content slot-action-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="slot-action-header-info">
            <h3 className="modal-handwriting-title">Etkinlik Seçenekleri</h3>
            <span className="slot-action-subtitle">{slot.activity || 'Etkinlik'} ({day} - {slot.time})</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="slot-action-body">
          {/* REORDER UP / DOWN */}
          <div className="slot-action-section-title">GÜN İÇİ SIRALAMA</div>
          <div className="slot-action-grid">
            <button 
              type="button" 
              className="slot-action-btn"
              onClick={() => { onMoveUp(day, slot.id); onClose(); }}
              disabled={slotIndex === 0}
            >
              <ArrowUp size={18} />
              <span>Yukarı Taşı</span>
            </button>

            <button 
              type="button" 
              className="slot-action-btn"
              onClick={() => { onMoveDown(day, slot.id); onClose(); }}
              disabled={slotIndex === totalSlotsInDay - 1}
            >
              <ArrowDown size={18} />
              <span>Aşağı Taşı</span>
            </button>
          </div>

          {/* MOVE / COPY TO DAY */}
          <div className="slot-action-section-title" style={{ marginTop: '1rem' }}>GÜNLER ARASI TAŞIMA / KOPYALAMA</div>
          <div className="slot-action-grid">
            <button 
              type="button" 
              className={`slot-action-btn ${targetAction === 'move' ? 'active-action' : ''}`}
              onClick={() => setTargetAction(targetAction === 'move' ? null : 'move')}
            >
              <MoveRight size={18} />
              <span>Başka Güne Taşı</span>
            </button>

            <button 
              type="button" 
              className={`slot-action-btn ${targetAction === 'copy' ? 'active-action' : ''}`}
              onClick={() => setTargetAction(targetAction === 'copy' ? null : 'copy')}
            >
              <Copy size={18} />
              <span>Başka Güne Kopyala</span>
            </button>
          </div>

          {targetAction && (
            <div className="day-picker-select-wrapper">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                Hedef Gün Seçin:
              </label>
              <select 
                value={selectedTargetDay} 
                onChange={(e) => setSelectedTargetDay(e.target.value)}
                className="modal-select-field"
                style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontWeight: 700 }}
              >
                {WEEK_DAYS.map(d => (
                  <option key={d} value={d}>{d} {d === day ? '(Mevcut Gün)' : ''}</option>
                ))}
              </select>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleExecuteDayAction}
                style={{ marginTop: '0.65rem', width: '100%', padding: '0.65rem', borderRadius: '12px', fontWeight: 800 }}
              >
                <CheckCircle2 size={16} /> {targetAction === 'move' ? 'Seçili Güne Taşı' : 'Seçili Güne Kopyala'}
              </button>
            </div>
          )}

          {/* EDIT & DELETE */}
          <div className="slot-action-section-title" style={{ marginTop: '1rem' }}>DÜZENLEME & SİLME</div>
          <div className="slot-action-grid">
            <button 
              type="button" 
              className="slot-action-btn"
              onClick={() => { onEdit(); onClose(); }}
            >
              <Edit3 size={18} />
              <span>Detay Düzenle</span>
            </button>

            <button 
              type="button" 
              className="slot-action-btn danger-action"
              onClick={() => { onDelete(); onClose(); }}
            >
              <Trash2 size={18} />
              <span>Etkinliği Sil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotActionModal;
