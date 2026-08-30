import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/storage';

const SettingsModal = ({ isOpen, onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState({
    appFontFamily: 'Inter',
    appFontSize: 'medium',
    notebookFontFamily: 'Inter',
    notebookFontSize: 'medium'
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const saved = await getSettings();
    if (saved) {
      setSettings({...settings, ...saved});
    }
  };

  const handleSave = async () => {
    await saveSettings(settings);
    if (onSettingsChange) onSettingsChange(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>Uygulama Ayarları</h3>
          <button className="close-btn" onClick={onClose}><X size={20}/></button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="settings-section">
            <h4 style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Genel Görünüm</h4>
            
            <div className="form-group">
              <label>Uygulama Yazı Tipi</label>
              <select 
                value={settings.appFontFamily} 
                onChange={e => setSettings({...settings, appFontFamily: e.target.value})}
              >
                <option value="Inter">Inter (Modern)</option>
                <option value="Roboto">Roboto (Klasik)</option>
                <option value="Outfit">Outfit (Şık)</option>
                <option value="Comic Sans MS">Comic Sans (Eğlenceli)</option>
                <option value="Times New Roman">Times New Roman (Resmi)</option>
              </select>
            </div>
            
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Uygulama Yazı Boyutu</label>
              <select 
                value={settings.appFontSize} 
                onChange={e => setSettings({...settings, appFontSize: e.target.value})}
              >
                <option value="small">Küçük</option>
                <option value="medium">Orta (Varsayılan)</option>
                <option value="large">Büyük</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h4 style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Not Defteri Görünümü</h4>
            
            <div className="form-group">
              <label>Not Defteri Yazı Tipi</label>
              <select 
                value={settings.notebookFontFamily} 
                onChange={e => setSettings({...settings, notebookFontFamily: e.target.value})}
              >
                <option value="Inter">Inter (Modern)</option>
                <option value="Roboto">Roboto (Klasik)</option>
                <option value="Outfit">Outfit (Şık)</option>
                <option value="Comic Sans MS">Comic Sans (Eğlenceli)</option>
                <option value="Times New Roman">Times New Roman (Resmi)</option>
              </select>
            </div>
            
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Not Defteri Yazı Boyutu</label>
              <select 
                value={settings.notebookFontSize} 
                onChange={e => setSettings({...settings, notebookFontSize: e.target.value})}
              >
                <option value="small">Küçük</option>
                <option value="medium">Orta (Varsayılan)</option>
                <option value="large">Büyük</option>
              </select>
            </div>
          </div>

        </div>
        
        <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="btn-cancel" onClick={onClose}>İptal</button>
          <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16}/> Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
