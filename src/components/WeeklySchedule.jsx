import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Clock, ChevronLeft, ChevronRight, ChevronDown, Calendar, Check, PlusCircle, CheckSquare } from 'lucide-react';
import { getScheduleForWeek, saveScheduleForWeek, generateId } from '../utils/storage';
import SlotDetailModal from './SlotDetailModal';
import QuickTimePickerModal from './QuickTimePickerModal';
import DialogModal from './DialogModal';
import confetti from 'canvas-confetti';

const WeeklySchedule = ({ weekId, weeks = [], onSelectWeek, onCreateNewWeek, onDeleteWeek, onMultiDeleteWeeks, onScheduleChange, refreshTrigger }) => {
  const [schedule, setSchedule] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [isWeekListModalOpen, setIsWeekListModalOpen] = useState(false);
  const [selectedWeeksModal, setSelectedWeeksModal] = useState([]);

  // Quick time picker state for Red Region (07:00)
  const [quickTimeTarget, setQuickTimeTarget] = useState(null);

  const [draggedSlot, setDraggedSlot] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, payload: null });
  const [isSelectMode, setIsSelectMode] = useState(false);

  const sortedWeeksModal = useMemo(() => {
    return [...weeks].sort((a, b) => {
      const dateA = new Date(a.startDate || a.createdAt || 0);
      const dateB = new Date(b.startDate || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [weeks]);

  const isLongPressFiredRef = React.useRef(false);
  const slotTouchTimerRef = React.useRef(null);

  const startSlotLongPress = (day, slot) => {
    isLongPressFiredRef.current = false;
    slotTouchTimerRef.current = setTimeout(() => {
      isLongPressFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(40);
      setIsSelectMode(true);
      setSelectedSlots(prev => {
        const exists = prev.find(s => s.id === slot.id);
        if (exists) {
          const next = prev.filter(s => s.id !== slot.id);
          if (next.length === 0) setIsSelectMode(false);
          return next;
        } else {
          return [...prev, { day, id: slot.id }];
        }
      });
    }, 400);
  };

  const cancelSlotLongPress = () => {
    if (slotTouchTimerRef.current) {
      clearTimeout(slotTouchTimerRef.current);
      slotTouchTimerRef.current = null;
    }
  };

  const getCurrentTodayName = () => {
    const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    return dayNames[new Date().getDay()] || "Pazartesi";
  };

  const [activeMobileDay, setActiveMobileDay] = useState(getCurrentTodayName);

  useEffect(() => {
    loadSchedule();
    setActiveMobileDay(getCurrentTodayName());
  }, [weekId, refreshTrigger]);

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
    setIsSelectMode(false);
    
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
    setIsSelectMode(false);
  };

  const handleSlotClick = (e, day, slot) => {
    if (isLongPressFiredRef.current) {
      isLongPressFiredRef.current = false;
      return;
    }
    if (isSelectMode || selectedSlots.length > 0 || (e && (e.ctrlKey || e.metaKey || e.shiftKey))) {
      if (!isSelectMode) setIsSelectMode(true);
      const exists = selectedSlots.find(s => s.id === slot.id);
      if (exists) {
        const next = selectedSlots.filter(s => s.id !== slot.id);
        setSelectedSlots(next);
        if (next.length === 0) setIsSelectMode(false);
      } else {
        setSelectedSlots(prev => [...prev, { day, id: slot.id }]);
      }
    } else {
      setEditingSlot(slot);
      setEditingDay(day);
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

  const WEEK_DAYS_ORDER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const days = schedule ? WEEK_DAYS_ORDER.filter(d => schedule[d] !== undefined) : [];

  const currentWeekIndex = weeks.findIndex(w => w.id === weekId);
  const currentWeekObj = weeks[currentWeekIndex] || weeks[0];
  const hasPrevWeek = currentWeekIndex > 0;
  const hasNextWeek = currentWeekIndex >= 0 && currentWeekIndex < weeks.length - 1;

  const handleGoPrevWeek = () => {
    if (hasPrevWeek && onSelectWeek) {
      onSelectWeek(weeks[currentWeekIndex - 1].id);
    }
  };

  const handleGoNextWeek = () => {
    if (hasNextWeek && onSelectWeek) {
      onSelectWeek(weeks[currentWeekIndex + 1].id);
    }
  };

  return (
    <div className="schedule-container-wrapper">
      {/* Sleek Week Navigator Bar for Past / Future Weeks */}
      {weeks.length > 0 && (
        <div className="week-nav-bar no-print">
          <button 
            type="button" 
            className="week-nav-arrow-btn"
            onClick={handleGoPrevWeek}
            disabled={!hasPrevWeek}
            title="Önceki Haftanın Planı"
          >
            <ChevronLeft size={18} />
            <span className="nav-btn-text">Önceki Hafta</span>
          </button>

          <div className="current-week-selector-pill" onClick={() => setIsWeekListModalOpen(true)} title="Tüm Haftaları Gör ve Seç">
            <Calendar size={18} className="week-calendar-icon" />
            <div className="week-pill-text-wrapper">
              <span className="week-pill-title">{currentWeekObj?.name || 'Mevcut Hafta'}</span>
              <span className="week-pill-sub">{weeks.length > 1 ? `Hafta Geçmişi (${weeks.length}) ▾` : 'Hafta Seç ▾'}</span>
            </div>
          </div>

          <button 
            type="button" 
            className="week-nav-arrow-btn"
            onClick={handleGoNextWeek}
            disabled={!hasNextWeek}
            title="Sonraki Haftanın Planı"
          >
            <span className="nav-btn-text">Sonraki Hafta</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

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
            {Array.isArray(schedule[day]) && schedule[day].length > 0 && (
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
          
          {(Array.isArray(schedule[day]) ? schedule[day] : []).map((slot) => {
            const isSelected = selectedSlots.find(s => s.id === slot.id);
            return (
            <div 
              key={slot.id} 
              className={`time-slot color-${slot.color || 'gray'} ${isSelected ? 'selected' : ''} ${slot.completed ? 'completed-slot' : ''}`} 
              onClick={(e) => handleSlotClick(e, day, slot)}
              onTouchStart={() => startSlotLongPress(day, slot)}
              onTouchEnd={cancelSlotLongPress}
              onTouchMove={cancelSlotLongPress}
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
              
              {/* YELLOW AREA (Uyanış): Opens SlotDetailModal cleanly on click without bringing up virtual keyboard */}
              <div 
                className="activity-input yellow-region-activity"
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    handleSlotClick(e, day, slot);
                    e.stopPropagation();
                  } else {
                    e.stopPropagation();
                    handleSlotClick(e, day, slot);
                  }
                }}
                title="Etkinlik ayrıntılarını ve ismini düzenle"
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
          onOpenTimePicker={() => {
            const slot = editingSlot;
            const day = editingDay;
            setEditingSlot(null);
            setEditingDay(null);
            setQuickTimeTarget({ slot, day });
          }}
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
          <div className="multi-action-top-row">
            <span className="selection-count">{selectedSlots.length} seçildi</span>
            <div className="multi-action-top-btns">
              <button type="button" className="btn-secondary danger-btn" onClick={requestMultiDelete}>
                <Trash2 size={16} /> Sil
              </button>
              <button type="button" className="btn-secondary cancel-btn" onClick={() => { setSelectedSlots([]); setIsSelectMode(false); }}>
                İptal
              </button>
            </div>
          </div>

          <div className="multi-action-bottom-row">
            <div className="multi-color-picker">
              {['gray', 'red', 'blue', 'green', 'yellow', 'purple', 'violet', 'orange', 'pink', 'teal', 'lime', 'brown'].map(color => (
                <div 
                  key={color}
                  className={`color-option color-${color}`}
                  onClick={() => handleMultiColorChange(color)}
                  title="Rengi Değiştir"
                />
              ))}
            </div>

            <div className="multi-action-check-btns">
              <button type="button" className="btn-primary" onClick={() => handleMultiComplete(true)}>Tik At</button>
              <button type="button" className="btn-secondary" onClick={() => handleMultiComplete(false)}>Tiki Kaldır</button>
            </div>
          </div>
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

      {/* PAST & FUTURE WEEKS SELECTION MODAL */}
      {isWeekListModalOpen && (
        <div className="modal-overlay no-print" onClick={() => setIsWeekListModalOpen(false)}>
          <div className="week-list-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} style={{ color: 'var(--primary-color, #2563eb)' }} />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Hafta Geçmişi & Planlar</h3>
              </div>
              <button className="close-btn" onClick={() => setIsWeekListModalOpen(false)}>×</button>
            </div>
            
            <p className="modal-sub-desc">Geçmiş veya gelecek haftaların programlarına hızlıca geçiş yapın:</p>

            <div className="week-modal-list">
              {sortedWeeksModal.map((w, index) => {
                const isActive = w.id === weekId;
                const isMultiSelected = selectedWeeksModal.includes(w.id);
                return (
                  <div 
                    key={w.id} 
                    className={`week-list-item-card ${isActive ? 'active-week-item' : ''} ${isMultiSelected ? 'multi-selected-item' : ''}`}
                    style={{
                      border: isMultiSelected ? '2px solid #ef4444' : undefined,
                      background: isMultiSelected ? 'rgba(239, 68, 68, 0.08)' : undefined
                    }}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey || selectedWeeksModal.length > 0) {
                        if (isMultiSelected) {
                          setSelectedWeeksModal(selectedWeeksModal.filter(id => id !== w.id));
                        } else {
                          setSelectedWeeksModal([...selectedWeeksModal, w.id]);
                        }
                      } else {
                        if (onSelectWeek) onSelectWeek(w.id);
                        setIsWeekListModalOpen(false);
                      }
                    }}
                  >
                    <div className="week-item-left">
                      <div className={`week-item-icon-circle ${isActive ? 'active' : ''}`} style={{ background: isMultiSelected ? '#ef4444' : undefined, color: isMultiSelected ? '#ffffff' : undefined }}>
                        {isMultiSelected ? <CheckSquare size={16} /> : (isActive ? <Check size={16} /> : <Calendar size={16} />)}
                      </div>
                      <div>
                        <div className="week-item-title">
                          {w.name} {isActive && <span className="active-badge">Aktif</span>}
                        </div>
                        <div className="week-item-date">{w.startDate ? new Date(w.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : `Hafta #${index + 1}`}</div>
                      </div>
                    </div>
                    <div className="week-item-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button type="button" className="select-week-btn">
                        {isMultiSelected ? 'Seçildi ✓' : (isActive ? 'Açık' : 'Plana Git →')}
                      </button>

                      {weeks.length > 1 && onDeleteWeek && (
                        <button 
                          type="button" 
                          className="delete-week-icon-btn"
                          title="Bu Haftayı Sil"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`"${w.name}" haftasını silmek istediğinize emin misiniz?`)) {
                              onDeleteWeek(w.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedWeeksModal.length > 0 && (
              <div className="bulk-delete-banner" style={{ marginTop: '0.75rem', padding: '0.65rem', background: 'rgba(239, 68, 68, 0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444' }}>
                  {selectedWeeksModal.length} Hafta Seçildi
                </span>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={async () => {
                    if (window.confirm(`Seçili ${selectedWeeksModal.length} haftayı silmek istediğinize emin misiniz?`)) {
                      if (onMultiDeleteWeeks) {
                        await onMultiDeleteWeeks(selectedWeeksModal);
                      } else if (onDeleteWeek) {
                        for (const id of selectedWeeksModal) {
                          await onDeleteWeek(id);
                        }
                      }
                      setSelectedWeeksModal([]);
                    }
                  }}
                >
                  <Trash2 size={16} /> Seçili Haftaları Sil
                </button>
              </div>
            )}

            <div className="week-modal-footer" style={{ marginTop: '0.75rem' }}>
              {onCreateNewWeek && (
                <button 
                  type="button" 
                  className="btn-primary full-width-btn" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                  onClick={() => {
                    onCreateNewWeek();
                    setIsWeekListModalOpen(false);
                    setSelectedWeeksModal([]);
                  }}
                >
                  <PlusCircle size={18} /> Yeni Hafta Oluştur
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default WeeklySchedule;
