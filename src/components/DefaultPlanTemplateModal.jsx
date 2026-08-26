import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RotateCcw, Save, Sparkles, Clock, Play } from 'lucide-react';
import { getDefaultScheduleTemplate, saveDefaultScheduleTemplate, resetDefaultScheduleTemplateToFactory, generateId } from '../utils/storage';
import QuickTimePickerModal from './QuickTimePickerModal';

export default function DefaultPlanTemplateModal({ isOpen, onClose, onApplyToCurrentWeek }) {
  const [template, setTemplate] = useState(null);
  const [quickTimeTarget, setQuickTimeTarget] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplate();
    }
  }, [isOpen]);

  const loadTemplate = async () => {
    const data = await getDefaultScheduleTemplate();
    setTemplate(data);
  };

  if (!isOpen || !template) return null;

  const days = Object.keys(template);

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
    setTemplate({
      ...template,
      [day]: template[day].map(s => s.id === slotId ? { ...s, color } : s)
    });
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
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>Varsayılan Plan Şablonu (Düzenleme Sahnesi)</h2>
              <p className="subtext" style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>
                Yeni haftalarınıza ve sıfırlamalarınıza yüklenecek varsayılan 7 günlük programınızı burada serbestçe planlayın.
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

                {template[day]?.map((slot) => (
                  <div key={slot.id} className={`time-slot color-${slot.color || 'gray'}`}>
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
                        onClick={() => handleDeleteSlot(day, slot.id)}
                        title="Şablondan Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* RED REGION: Time text with clock button & inline editing + quick modal trigger */}
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
                          e.stopPropagation();
                          setQuickTimeTarget({ slot, day });
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
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => handleEditActivity(day, slot.id, e.target.textContent)}
                      title="İsmi değiştirmek için tıklayıp yazın"
                    >
                      {slot.activity}
                    </div>
                  </div>
                ))}

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
