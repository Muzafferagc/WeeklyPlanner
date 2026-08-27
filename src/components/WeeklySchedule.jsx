import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { getScheduleForWeek, saveScheduleForWeek, generateId } from '../utils/storage';
import SlotDetailModal from './SlotDetailModal';
import QuickTimePickerModal from './QuickTimePickerModal';
import DialogModal from './DialogModal';
import confetti from 'canvas-confetti';

const WeeklySchedule = ({ weekId, onScheduleChange }) => {
  const [schedule, setSchedule] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editingDay, setEditingDay] = useState(null);

  // Quick time picker state for Red Region (07:00)
  const [quickTimeTarget, setQuickTimeTarget] = useState(null);

  const [draggedSlot, setDraggedSlot] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, payload: null });

  const [activeMobileDay, setActiveMobileDay] = useState(() => {
    const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    const todayName = dayNames[new Date().getDay()];
    return (todayName && todayName !== "Pazar") ? todayName : "Pazartesi";
  });

  useEffect(() => {
    loadSchedule();
  }, [weekId]);

  const loadSchedule = async () => {
    const data = await getScheduleForWeek(weekId);
    setSchedule(data);
  };

  const handleSaveSchedule = async (newSchedule) => {
    setSchedule(newSchedule);
    await saveScheduleForWeek(weekId, newSchedule);
    if (onScheduleChange) onScheduleChange(newSchedule);
  };

  const handleQuickSaveTime = async (day, slotId, newTime) => {
    const trimmed = newTime ? newTime.trim() : "";
    if (!trimmed) return;
    const newSchedule = {
      ...schedule,
      [day]: schedule[day].map(item => item.id === slotId ? { ...item, time: trimmed } : item)
    };
    await handleSaveSchedule(newSchedule);
  };

  const handleEditActivity = async (day, id, newActivity) => {
    const trimmed = newActivity ? newActivity.trim() : "";
    if (!trimmed) return;
    const newSchedule = {
      ...schedule,
      [day]: schedule[day].map(item => item.id === id ? { ...item, activity: trimmed } : item)
    };
    await handleSaveSchedule(newSchedule);
  };

  const requestDelete = (day, id) => {
    setConfirmDialog({
      isOpen: true,
      type: 'singleDelete',
      payload: { day, id }
    });
  };

  const requestMultiDelete = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'multiDelete'
    });
  };

  const handleConfirmSingleDelete = async () => {
    const { day, id } = confirmDialog.payload;
    const newSchedule = {
      ...schedule,
      [day]: schedule[day].filter(item => item.id !== id)
    };
    await handleSaveSchedule(newSchedule);
    setConfirmDialog({ isOpen: false });
  };

  const handleConfirmMultiDelete = async () => {
    let newSchedule = { ...schedule };
    selectedSlots.forEach(({day, id}) => {
      newSchedule[day] = newSchedule[day].filter(item => item.id !== id);
    });
    await handleSaveSchedule(newSchedule);
    setSelectedSlots([]);
    setConfirmDialog({ isOpen: false });
  };

  const handleAdd = async (day) => {
    const newItem = { id: generateId(), time: "09:00", activity: "Yeni Etkinlik", notes: "", checklist: [], links: [], images: [], completed: false };
    const newSchedule = {
      ...schedule,
      [day]: [...schedule[day], newItem]
    };
    await handleSaveSchedule(newSchedule);
  };

  const toggleSlotCompletion = async (day, id) => {
    let justCompleted = false;
    const newSchedule = {
      ...schedule,
      [day]: schedule[day].map(item => {
        if (item.id === id) {
          if (!item.completed) justCompleted = true;
          return { ...item, completed: !item.completed };
        }
        return item;
      })
    };
    await handleSaveSchedule(newSchedule);
    
    if (justCompleted) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#2b2b2b', '#5c5c5c', '#d94a38']
      });
    }
  };

  const handleMultiComplete = async (isComplete = true) => {
    let newSchedule = { ...schedule };
    selectedSlots.forEach(({day, id}) => {
      newSchedule[day] = newSchedule[day].map(item => item.id === id ? { ...item, completed: isComplete } : item);
    });
    await handleSaveSchedule(newSchedule);
    setSelectedSlots([]);
    
    if (isComplete) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.7 },
        colors: ['#2b2b2b', '#5c5c5c', '#d94a38']
      });
    }
  };

  const handleMultiColorChange = async (color) => {
    let newSchedule = { ...schedule };
    selectedSlots.forEach(({day, id}) => {
      newSchedule[day] = newSchedule[day].map(item => item.id === id ? { ...item, color } : item);
    });
    await handleSaveSchedule(newSchedule);
    setSelectedSlots([]);
  };

  const handleSlotClick = (e, day, slot) => {
    if (e.ctrlKey || e.metaKey) {
      const exists = selectedSlots.find(s => s.id === slot.id);
      if (exists) {
        setSelectedSlots(selectedSlots.filter(s => s.id !== slot.id));
      } else {
        setSelectedSlots([...selectedSlots, { day, id: slot.id }]);
      }
    } else {
      if (selectedSlots.length > 0) {
        setSelectedSlots([]);
      } else {
        setEditingSlot(slot);
        setEditingDay(day);
      }
    }
  };

  const handleModalSave = async (updatedSlot) => {
    const newSchedule = {
      ...schedule,
      [editingDay]: schedule[editingDay].map(item => item.id === updatedSlot.id ? updatedSlot : item)
    };
    await handleSaveSchedule(newSchedule);
  };

  const handleDragStart = (e, day, slot) => {
    setDraggedSlot({ day, slot });
    setTimeout(() => e.target.classList.add('dragging'), 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedSlot(null);
    setDragOverDay(null);
  };

  const handleDragOver = (e, day) => {
    e.preventDefault();
    if (draggedSlot && draggedSlot.day !== day) {
      setDragOverDay(day);
    }
  };

  const handleDrop = async (e, targetDay) => {
    e.preventDefault();
    setDragOverDay(null);
    
    if (!draggedSlot || draggedSlot.day === targetDay) {
      return;
    }

    const { day: sourceDay, slot } = draggedSlot;
    const newSourceList = schedule[sourceDay].filter(item => item.id !== slot.id);
    const newTargetList = [...schedule[targetDay], slot];

    const newSchedule = {
      ...schedule,
      [sourceDay]: newSourceList,
      [targetDay]: newTargetList
    };

    await handleSaveSchedule(newSchedule);
  };

  if (!schedule) return <div className="loading-screen">Hafta Yükleniyor...</div>;

  const days = Object.keys(schedule);

  return (
    <div className="schedule-container-wrapper">
      {/* MOBILE iOS DAY SEGMENTED CAROUSEL */}
      <div className="mobile-schedule-day-tabs no-print">
        {days.map(day => (
          <button
            key={day}
            type="button"
            className={`mobile-day-tab-pill ${activeMobileDay === day ? 'active' : ''}`}
            onClick={() => setActiveMobileDay(day)}
          >
            <span>{day}</span>
            {schedule[day] && schedule[day].length > 0 && (
              <span className="mobile-day-count">{schedule[day].length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="schedule-grid">
        {days.map(day => (
          <div 
            key={day} 
            className={`day-column ${activeMobileDay === day ? 'mobile-active-day' : ''} ${dragOverDay === day ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, day)}
            onDrop={(e) => handleDrop(e, day)}
          >
          <div className="day-title">{day}</div>
          
          {schedule[day].map((slot) => {
            const isSelected = selectedSlots.find(s => s.id === slot.id);
            return (
            <div 
              key={slot.id} 
              className={`time-slot color-${slot.color || 'gray'} ${isSelected ? 'selected' : ''} ${slot.completed ? 'completed-slot' : ''}`} 
              onClick={(e) => handleSlotClick(e, day, slot)}
              draggable
              onDragStart={(e) => handleDragStart(e, day, slot)}
              onDragEnd={handleDragEnd}
            >
              {/* ORANGE & PURPLE AREAS: Actions (Checkbox & Trash Icon) */}
              <div className="slot-actions no-print">
                <input 
                  type="checkbox" 
                  className="slot-completion-check"
                  checked={!!slot.completed}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      handleSlotClick(e, day, slot);
                    } else {
                      e.stopPropagation();
                    }
                  }}
                  onChange={() => toggleSlotCompletion(day, slot.id)}
                  title="Tamamlandı"
                />
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      handleSlotClick(e, day, slot);
                    } else {
                      e.stopPropagation();
                      requestDelete(day, slot.id);
                    }
                  }}
                  title="Etkinliği Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {/* RED AREA (07:00): If Ctrl is pressed, automatically multi-select instead of opening time picker */}
              <div 
                className="time-input red-region-time"
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    handleSlotClick(e, day, slot);
                    e.stopPropagation();
                  } else {
                    e.stopPropagation();
                    setQuickTimeTarget({ slot, day });
                  }
                }}
                title="Saat ve süreyi düzenle (Ctrl ile çoklu seç)"
              >
                <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                {slot.time}
              </div>
              
              {/* YELLOW AREA (Uyanış): If Ctrl is pressed, automatically multi-select instead of text editing */}
              <div 
                className="activity-input yellow-region-activity"
                contentEditable
                suppressContentEditableWarning
                onMouseDown={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault(); // Prevent text focus when holding Ctrl
                  }
                }}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    handleSlotClick(e, day, slot);
                    e.stopPropagation();
                  } else {
                    e.stopPropagation();
                  }
                }}
                onBlur={(e) => handleEditActivity(day, slot.id, e.target.textContent)}
                title="İsmi düzenle (Ctrl ile çoklu seç)"
              >
                {slot.activity}
              </div>
              
              {/* BLUE AREA INDICATORS & BACKGROUND */}
              <div className="slot-indicators no-print">
                {slot.notes && <span className="indicator">• Not</span>}
                {slot.checklist?.length > 0 && <span className="indicator">• Görev ({slot.checklist.filter(c=>c.completed).length}/{slot.checklist.length})</span>}
                {slot.images?.length > 0 && <span className="indicator">• Görsel</span>}
              </div>
            </div>
          )})}
          
          <button 
            className="add-btn no-print" 
            onClick={() => handleAdd(day)}
          >
            <Plus size={16} /> Ekle
          </button>
        </div>
      ))}
      
      {/* FULL DETAIL MODAL (BLUE AREA) */}
      {editingSlot && (
        <SlotDetailModal 
          slot={editingSlot}
          onClose={() => { setEditingSlot(null); setEditingDay(null); }}
          onSave={handleModalSave}
        />
      )}

      {/* QUICK TIME PICKER MODAL (RED AREA) */}
      {quickTimeTarget && (
        <QuickTimePickerModal
          slot={quickTimeTarget.slot}
          day={quickTimeTarget.day}
          onClose={() => setQuickTimeTarget(null)}
          onSaveTime={handleQuickSaveTime}
        />
      )}

      {selectedSlots.length > 0 && (
        <div className="multi-action-bar no-print">
          <span className="selection-count">{selectedSlots.length} etkinlik seçildi</span>
          <div className="multi-color-picker" style={{ display: 'flex', gap: '0.25rem', borderRight: '2px solid var(--border-color)', paddingRight: '1rem', marginRight: '0.5rem' }}>
            {['gray', 'red', 'blue', 'green', 'yellow', 'purple', 'violet', 'orange', 'pink', 'teal', 'lime', 'brown']
          .map(color => (
              <div 
                key={color}
                className={`color-option color-${color}`}
                style={{ width: '24px', height: '24px' }}
                onClick={() => handleMultiColorChange(color)}
                title="Rengi Değiştir"
              />
            ))}
          </div>
          <button className="btn-primary" onClick={() => handleMultiComplete(true)}>Tik At</button>
          <button className="btn-secondary" onClick={() => handleMultiComplete(false)}>Tiki Kaldır</button>
          <button className="btn-secondary" style={{color: 'var(--primary)', borderColor: 'var(--primary)'}} onClick={requestMultiDelete}>Sil</button>
          <button className="btn-secondary" onClick={() => setSelectedSlots([])}>İptal</button>
        </div>
      )}

      <DialogModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'singleDelete' ? "Etkinliği Sil" : "Toplu Silme İşlemi"}
        message={confirmDialog.type === 'singleDelete' 
          ? "Bu etkinliği silmek istediğinize emin misiniz? Bu işlem geri alınamaz." 
          : `${selectedSlots.length} etkinliği silmek istediğinize emin misiniz?`}
        confirmText="Evet, Sil"
        onConfirm={confirmDialog.type === 'singleDelete' ? handleConfirmSingleDelete : handleConfirmMultiDelete}
        onCancel={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
    </div>
  );
};

export default WeeklySchedule;
