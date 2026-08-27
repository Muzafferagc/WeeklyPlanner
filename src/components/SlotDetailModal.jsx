import React, { useState, useRef } from 'react';
import { X, FileText, CheckSquare, Link as LinkIcon, Image as ImageIcon, Plus, Trash2, Clock, Bell } from 'lucide-react';
import { requestNotificationPermissionOnce } from '../utils/audioAlarm';

const SlotDetailModal = ({ slot, onClose, onSave, onOpenTimePicker }) => {
  const [activeTab, setActiveTab] = useState('notes');
  const [activity, setActivity] = useState(slot.activity || '');
  const [notes, setNotes] = useState(slot.notes || '');
  const [checklist, setChecklist] = useState(slot.checklist || []);
  const [links, setLinks] = useState(slot.links || []);
  const [images, setImages] = useState(slot.images || []);
  const [color, setColor] = useState(slot.color || 'gray');
  const [alarm, setAlarm] = useState(slot.alarm || 'none');

  const fileInputRef = useRef(null);

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleSave = () => {
    onSave({
      ...slot,
      activity: activity.trim() || slot.activity,
      notes,
      checklist,
      links,
      images,
      color,
      alarm
    });
    onClose();
  };

  const addChecklistItem = (e) => {
    e.preventDefault();
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, { id: Date.now(), text: newChecklistItem.trim(), completed: false }]);
      setNewChecklistItem('');
    }
  };
  
  const toggleChecklist = (id) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const removeChecklist = (id) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const addLink = (e) => {
    e.preventDefault();
    if (newLinkUrl.trim()) {
      let url = newLinkUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      setLinks([...links, { id: Date.now(), title: newLinkTitle.trim() || url, url }]);
      setNewLinkUrl('');
      setNewLinkTitle('');
    }
  };

  const removeLink = (id) => {
    setLinks(links.filter(item => item.id !== id));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages([...images, { id: Date.now(), dataUrl: reader.result }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
  };

  const colors = [
    { name: 'gray', hex: '#6b7280' },
    { name: 'red', hex: '#ef4444' },
    { name: 'blue', hex: '#3b82f6' },
    { name: 'green', hex: '#22c55e' },
    { name: 'yellow', hex: '#eab308' },
    { name: 'purple', hex: '#a855f7' },
    { name: 'violet', hex: '#7c3aed' },
    { name: 'orange', hex: '#f97316' },
    { name: 'pink', hex: '#f43f5e' },
    { name: 'teal', hex: '#14b8a6' },
    { name: 'lime', hex: '#84cc16' },
    { name: 'brown', hex: '#92400e' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="detail-time-badge">
                <Clock size={14} />
                <span>{slot.time}</span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Etkinlik / Ders Başlığı:</span>
            </div>

            <div className="detail-title-input-wrapper">
              <input
                type="text"
                autoFocus
                value={activity}
                onChange={e => setActivity(e.target.value)}
                className="slot-activity-edit-title"
                placeholder="Etkinlik veya Ders Adını Yazın..."
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
              <div className="color-picker" style={{ margin: 0 }}>
                {colors.map(c => (
                  <div 
                    key={c.name}
                    className={`color-option ${color === c.name ? 'selected' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setColor(c.name)}
                    title={`${c.name} seç`}
                  />
                ))}
              </div>

              <div className="alarm-select-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Bell size={15} style={{ color: alarm !== 'none' ? '#ef4444' : 'var(--text-muted)' }} />
                <select 
                  value={alarm} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setAlarm(val);
                    if (val !== 'none') {
                      requestNotificationPermissionOnce();
                    }
                  }}
                  className="alarm-select-dropdown"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: alarm !== 'none' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                    color: alarm !== 'none' ? '#ef4444' : 'var(--text-color)'
                  }}
                >
                  <option value="none">🔔 Alarm: Kapalı</option>
                  <option value="on_time">🔔 Saati Gelince</option>
                  <option value="5min">🔔 5 Dakika Önce</option>
                  <option value="15min">🔔 15 Dakika Önce</option>
                  <option value="30min">🔔 30 Dakika Önce</option>
                </select>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        <div className="modal-tabs">
          <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
            <FileText size={16} /> Notlar
          </button>
          <button className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>
            <CheckSquare size={16} /> Görevler ({checklist.filter(c => c.completed).length}/{checklist.length})
          </button>
          <button className={`tab-btn ${activeTab === 'links' ? 'active' : ''}`} onClick={() => setActiveTab('links')}>
            <LinkIcon size={16} /> Kaynaklar ({links.length})
          </button>
          <button className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`} onClick={() => setActiveTab('images')}>
            <ImageIcon size={16} /> Görseller ({images.length})
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'notes' && (
            <textarea 
              className="notes-textarea"
              placeholder="Bu etkinlik için notlarınızı buraya yazabilirsiniz..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}

          {activeTab === 'checklist' && (
            <div className="checklist-container">
              <form onSubmit={addChecklistItem} className="add-form">
                <input 
                  type="text" 
                  placeholder="Yeni alt görev ekle..." 
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="modal-input"
                />
                <button type="submit" className="btn-primary"><Plus size={18} /></button>
              </form>
              <div className="list-items">
                {checklist.map(item => (
                  <div key={item.id} className="list-item">
                    <input 
                      type="checkbox" 
                      checked={item.completed} 
                      onChange={() => toggleChecklist(item.id)} 
                      className="custom-checkbox"
                    />
                    <span className={item.completed ? 'completed-text' : ''}>{item.text}</span>
                    <button className="icon-btn-danger" onClick={() => removeChecklist(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {checklist.length === 0 && <p className="empty-state">Henüz bir alt görev eklenmemiş.</p>}
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="links-container">
              <form onSubmit={addLink} className="add-form multi-input">
                <input 
                  type="text" 
                  placeholder="Başlık (Opsiyonel)" 
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="modal-input"
                />
                <input 
                  type="text" 
                  placeholder="URL (Link)" 
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="modal-input"
                  required
                />
                <button type="submit" className="btn-primary"><Plus size={18} /></button>
              </form>
              <div className="list-items">
                {links.map(item => (
                  <div key={item.id} className="list-item link-item">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-title">
                      <LinkIcon size={14} /> {item.title}
                    </a>
                    <button className="icon-btn-danger" onClick={() => removeLink(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {links.length === 0 && <p className="empty-state">Henüz bir kaynak linki eklenmemiş.</p>}
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="images-container">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                style={{display: 'none'}} 
              />
              <button className="btn-secondary add-image-btn" onClick={() => fileInputRef.current.click()}>
                <ImageIcon size={18} /> Yeni Görsel Yükle
              </button>
              
              <div className="image-grid">
                {images.map(img => (
                  <div key={img.id} className="image-card">
                    <img src={img.dataUrl} alt="Eklenti" />
                    <button className="delete-image-btn" onClick={() => removeImage(img.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              {images.length === 0 && <p className="empty-state">Henüz görsel eklenmemiş.</p>}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>İptal</button>
          <button className="btn-primary" onClick={handleSave}>Kaydet</button>
        </div>
      </div>
    </div>
  );
};

export default SlotDetailModal;
