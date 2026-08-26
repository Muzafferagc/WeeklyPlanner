import React, { useState } from 'react';
import { Plus, CalendarDays, Trash2, Edit3, Download, Settings } from 'lucide-react';
import DialogModal from './DialogModal';

const Sidebar = ({ weeks, currentWeekId, onSelectWeek, onCreateWeek, onDeleteWeek, onRenameWeek, onMultiDeleteWeeks, onMultiExportWeeks, onOpenDefaultPlanModal }) => {
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [dialog, setDialog] = useState({ isOpen: false, type: null, payload: null });

  const handleCreate = (e) => {
    e.preventDefault();
    onCreateWeek();
  };

  const handleWeekClick = (e, id) => {
    if (e.ctrlKey || e.metaKey) {
      if (selectedWeeks.includes(id)) {
        setSelectedWeeks(selectedWeeks.filter(wId => wId !== id));
      } else {
        setSelectedWeeks([...selectedWeeks, id]);
      }
    } else {
      if (selectedWeeks.length > 0) {
        setSelectedWeeks([]);
      } else {
        onSelectWeek(id);
      }
    }
  };

  const handleConfirmAction = (inputValue) => {
    if (dialog.type === 'rename') {
      if (inputValue && inputValue.trim()) {
        onRenameWeek(dialog.payload.id, inputValue.trim());
      }
    } else if (dialog.type === 'singleDelete') {
      onDeleteWeek(dialog.payload.id);
    } else if (dialog.type === 'multiDelete') {
      onMultiDeleteWeeks(selectedWeeks);
      setSelectedWeeks([]);
    }
    setDialog({ isOpen: false });
  };

  const getDialogProps = () => {
    if (dialog.type === 'rename') {
      return {
        title: "Yeniden Adlandır",
        message: "Yeni hafta ismini girin:",
        type: "prompt",
        defaultValue: dialog.payload.name,
        confirmText: "Kaydet"
      };
    } else if (dialog.type === 'singleDelete') {
      return {
        title: "Haftayı Sil",
        message: `'${dialog.payload.name}' silinecek. Emin misiniz?`,
        confirmText: "Evet, Sil"
      };
    } else if (dialog.type === 'multiDelete') {
      return {
        title: "Haftaları Sil",
        message: `${selectedWeeks.length} hafta silinecek. Emin misiniz?`,
        confirmText: "Evet, Sil"
      };
    }
    return {};
  };

  return (
    <div className="sidebar no-print">
      <div className="sidebar-header">
        <CalendarDays className="text-primary" size={24} />
        <h2>Haftalar</h2>
      </div>
      
      <div className="weeks-list">
        {weeks.map((week) => {
          const isSelected = selectedWeeks.includes(week.id);
          return (
          <div 
            key={week.id} 
            className={`week-item ${week.id === currentWeekId && selectedWeeks.length === 0 ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={(e) => handleWeekClick(e, week.id)}
          >
            <span className="week-name">{week.name}</span>
            <div className="week-actions">
              <button 
                className="week-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setDialog({ isOpen: true, type: 'rename', payload: { id: week.id, name: week.name }});
                }}
                title="Yeniden Adlandır"
              >
                <Edit3 size={14} />
              </button>
              {weeks.length > 1 && (
                <button 
                  className="week-action-btn delete-btn-sidebar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialog({ isOpen: true, type: 'singleDelete', payload: { id: week.id, name: week.name }});
                  }}
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        )})}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
        <button className="new-week-btn no-print" onClick={handleCreate}>
          <Plus size={18} />
          Yeni Hafta Ekle
        </button>

        <button 
          className="btn-secondary default-plan-trigger-btn"
          onClick={onOpenDefaultPlanModal}
          title="Varsayılan haftalık plan şablonunu (%90 ekran) düzenleyin"
        >
          <Settings size={16} /> Varsayılan Planı Düzenle
        </button>
      </div>

      {selectedWeeks.length > 0 && (
        <div style={{ padding: '1rem', background: 'var(--input-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>{selectedWeeks.length} Hafta Seçildi</span>
          <button className="btn-secondary" onClick={() => { onMultiExportWeeks(selectedWeeks); setSelectedWeeks([]); }} style={{ width: '100%', justifyContent: 'center' }}>
            <Download size={14} /> Yedekle
          </button>
          <button className="btn-secondary" onClick={() => setDialog({ isOpen: true, type: 'multiDelete' })} style={{ width: '100%', justifyContent: 'center', color: '#ef4444' }}>
            <Trash2 size={14} /> Sil
          </button>
        </div>
      )}

      <DialogModal 
        isOpen={dialog.isOpen}
        {...getDialogProps()}
        onConfirm={handleConfirmAction}
        onCancel={() => setDialog({ isOpen: false })}
      />
    </div>
  );
};

export default Sidebar;
