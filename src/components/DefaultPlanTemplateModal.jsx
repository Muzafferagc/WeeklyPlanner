import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RotateCcw, Save, Sparkles, Clock, Play, CheckSquare } from 'lucide-react';
import { getDefaultScheduleTemplate, saveDefaultScheduleTemplate, resetDefaultScheduleTemplateToFactory, generateId } from '../utils/storage';
import QuickTimePickerModal from './QuickTimePickerModal';

export default function DefaultPlanTemplateModal({ isOpen, onClose, onApplyToCurrentWeek }) {
  const [template, setTemplate] = useState(null);
  const [quickTimeTarget, setQuickTimeTarget] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadTemplate();
      setSelectedSlots([]);
    }
  }, [isOpen]);

  const loadTemplate = async () => {
    const data = await getDefaultScheduleTemplate();
    setTemplate(data);
  };

  if (!isOpen || !template) return null;

  const daysOrder = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const days = Object.keys(template).sort((a, b) => {
    const idxA = daysOrder.indexOf(a);
    const idxB = daysOrder.indexOf(b);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  const handleSlotClick = (e, day, slot) => {
    if (selectedSlots.length > 0 || e.ctrlKey || e.metaKey || e.shiftKey) {
      const exists = selectedSlots.find(s => s.id === slot.id);
      if (exists) {
        setSelectedSlots(prev => prev.filter(s => s.id !== slot.id));
      } else {
        setSelectedSlots(prev => [...prev, { day, id: slot.id }]);
      }
    }
  };

  const handleMultiColorChange = (color) => {
    let newTemplate = { ...template };
    selectedSlots.forEach(({ day, id }) => {
      if (newTemplate[day]) {
        newTemplate[day] = newTemplate[day].map(s => s.id === id ? { ...s, color } : s);
      }
    });
    setTemplate(newTemplate);
    setSelectedSlots([]);
  };

  const handleMultiDelete = () => {
    if (window.confirm(`${selectedSlots.length} varsayılan plan ögesini silmek istediğinize emin misiniz?`)) {
      let newTemplate = { ...template };
      selectedSlots.forEach(({ day, id }) => {
        if (newTemplate[day]) {
          newTemplate[day] = newTemplate[day].filter(s => s.id !== id);
        }
      });
      setTemplate(newTemplate);
      setSelectedSlots([]);
    }
  };

  const handleEditActivity = (day, slotId, newActivity) => {
    const trimmed = newActivity ? newActivity.trim() : '';
    if (!trimmed) return;
    setTemplate({
      ...template,
      [day]: template[day].map(s => s.id === slotId ? { ...s, activity: trimmed } : s)
    });
  };

  const handleQuickSaveTime = (day, slotId, newTime) => {
    const trimmed = newTime ? newTime.trim() : '';
    if (!trimmed) return;
    setTemplate({
      ...template,
      [day]: template[day].map(s => s.id === slotId ? { ...s, time: trimmed } : s)
    });
  };

  const handleDeleteSlot = (day, slotId) => {
    setTemplate({
      ...template,
      [day]: template[day].filter(s => s.id !== slotId)
    });
  };

  const handleAddSlot = (day) => {
    const newSlot = {
      id: generateId(),
      time: '09:00',
      activity: 'Yeni Varsayılan İş',
      color: 'gray',
      notes: '',
      checklist: [],
      links: [],
      images: []
    };
    setTemplate({
      ...template,
      [day]: [...template[day], newSlot]
    });
  };

  const handleColorChange = (day, slotId, color) => {
    if (selectedSlots.some(s => s.id === slotId) && selectedSlots.length > 1) {
      // Toplu renk değiştirme
      const newTemplate = { ...template };
      for (const dayKey in newTemplate) {
        newTemplate[dayKey] = newTemplate[dayKey].map(s => 
          selectedSlots.some(selected => selected.id === s.id) ? { ...s, color } : s
        );
      }
      setTemplate(newTemplate);
      setSelectedSlots([]); // Renk değiştikten sonra seçimi kaldır
    } else {
      // Tekli renk değiştirme
      setTemplate({
        ...template,
        [day]: template[day].map(s => s.id === slotId ? { ...s, color } : s)
      });
    }
  };

  const handleSaveAll = async () => {
    await saveDefaultScheduleTemplate(template);
    alert('✓ Varsayılan plan şablonunuz başarıyla kaydedildi!');
    onClose();
  };

  const handleResetFactory = async () => {
    if (window.confirm('Varsayılan plan şablonu fabrika ayarlarına döndürülsün mü?')) {
      const reseted = await resetDefaultScheduleTemplateToFactory();
      setTemplate(reseted);
      setSelectedSlots([]);
    }
  };

  const handleApplyToWeek = async () => {
    if (window.confirm('Bu varsayılan plan şablonu mevcut aktif haftanıza yüklensin mi?')) {
      await saveDefaultScheduleTemplate(template);
      if (onApplyToCurrentWeek) {
        await onApplyToCurrentWeek(template);
      }
      onClose();
    }
  };

  return (
    <div className="default-plan-overlay" onClick={onClose}>
      <div className="default-plan-content full-scene-container" onClick={e => e.stopPropagation()}>
        
        {/* SCENE HEADER BAR */}
        <div className="default-plan-header scene-header">
          <div className="header-title-box">
            <Sparkles className="icon-sparkle text-primary" size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Varsayılan Plan Şablonu (Düzenleme Sahnesi)</h2>
              <p className="subtext" style={{ margin: 0, fontSize: '0.88rem', opacity: 0.85 }}>
                Yeni haftalarınıza ve sıfırlamalarınıza yüklenecek şablonunuzu planlayın. (Ctrl ile toplu renk değiştirebilirsiniz)
              </p>
            </div>
          </div>
          
          <div className="header-actions-box" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn-secondary flex-btn" onClick={handleResetFactory} title="Fabrika Ayarlarına Sıfırla">
              <RotateCcw size={16} /> Fabrika Ayarları
            </button>
            <button className="btn-primary flex-btn" onClick={handleApplyToWeek} title="Mevcut Haftaya Yükle">
              <Play size={16} /> Haftaya Yükle
            </button>
            <button className="btn-primary flex-btn save-btn" onClick={handleSaveAll}>
              <Save size={16} /> Şablonu Kaydet
            </button>
            <button className="close-btn" onClick={onClose}><X size={24} /></button>
          </div>
        </div>

        {/* 7-DAY SCENE GRID BODY - SMOOTH SCROLLABLE */}
        <div className="default-plan-scene-body">
          <div className="schedule-grid default-scene-grid">
            {days.map(day => (
              <div key={day} className="day-column default-day-column">
                <div className="day-title">{day} ({template[day]?.length || 0})</div>

                {template[day]?.map((slot) => {
                  const isSelected = selectedSlots.some(s => s.id === slot.id);
                  return (
                    <div 
                      key={slot.id} 
                      className={`time-slot color-${slot.color || 'gray'} ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => handleSlotClick(e, day, slot)}
                    >
                      <div className="slot-actions no-print">
                        <select
                          value={slot.color || 'gray'}
                          onChange={(e) => handleColorChange(day, slot.id, e.target.value)}
                          className="mini-color-select"
                          title="Renk Değiştir"
                        >
                          <option value="gray">Gri</option>
                          <option value="red">Kırmızı</option>
                          <option value="blue">Mavi</option>
                          <option value="green">Yeşil</option>
                          <option value="yellow">Sarı</option>
                          <option value="purple">Açık Mor</option>
                          <option value="violet">Koyu Kraliçe Moru</option>
                          <option value="orange">Turuncu</option>
                          <option value="pink">Pembe</option>
                          <option value="teal">Deniz Mavisi (Teal)</option>
                          <option value="lime">Limon Yeşili</option>
                          <option value="brown">Kahverengi</option>
                        </select>

                        <button 
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSlot(day, slot.id);
                          }}
                          title="Şablondan Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* RED REGION: Time text with clock button */}
                      <div className="time-row-container" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="clock-quick-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setQuickTimeTarget({ slot, day });
                          }}
                          title="Saat ve süre menüsünü aç"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: 'var(--primary)'
                          }}
                        >
                          <Clock size={14} />
                        </button>
                        <div
                          className="time-input red-region-time"
                          contentEditable
                          suppressContentEditableWarning
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                              handleSlotClick(e, day, slot);
                            } else {
                              e.stopPropagation();
                              setQuickTimeTarget({ slot, day });
                            }
                          }}
                          onBlur={(e) => handleQuickSaveTime(day, slot.id, e.target.textContent)}
                          title="Saate tıklayarak menüyü açın veya doğrudan düzenleyin"
                        >
                          {slot.time}
                        </div>
                      </div>

                      {/* YELLOW REGION: Activity title inline text edit */}
                      <div
                        className="activity-input yellow-region-activity"
                        contentEditable
                        suppressContentEditableWarning
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            handleSlotClick(e, day, slot);
                          } else {
                            e.stopPropagation();
                          }
                        }}
                        onBlur={(e) => handleEditActivity(day, slot.id, e.target.textContent)}
                        title="İsmi değiştirmek için tıklayıp yazın (Ctrl ile çoklu seçin)"
                      >
                        {slot.activity}
                      </div>
                    </div>
                  );
                })}

                <button 
                  className="add-btn no-print"
                  onClick={() => handleAddSlot(day)}
                >
                  <Plus size={16} /> Ekle
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* MULTI ACTION BAR FOR TEMPLATE SCENE */}
        {selectedSlots.length > 0 && (
          <div className="multi-action-bar no-print" style={{ zIndex: 60000 }}>
            <div className="multi-action-top-row">
              <span className="selection-count">{selectedSlots.length} şablon ögesi seçildi</span>
              <div className="multi-action-top-btns">
                <button type="button" className="btn-secondary danger-btn" onClick={handleMultiDelete}>
                  <Trash2 size={16} /> Sil
                </button>
                <button type="button" className="btn-secondary cancel-btn" onClick={() => setSelectedSlots([])}>
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
                    title="Seçilenlerin Rengini Değiştir"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUICK TIME PICKER FOR SCENE */}
        {quickTimeTarget && (
          <QuickTimePickerModal
            slot={quickTimeTarget.slot}
            day={quickTimeTarget.day}
            onClose={() => setQuickTimeTarget(null)}
            onSaveTime={handleQuickSaveTime}
          />
        )}

      </div>
    </div>
  );
}
