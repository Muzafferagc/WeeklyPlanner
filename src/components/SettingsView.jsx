import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../utils/storage';
import { Settings2, Type, Layout, CheckCircle2 } from 'lucide-react';

const SettingsView = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({
    appFontFamily: 'Inter',
    appFontSize: 'medium',
    notebookFontFamily: 'Inter',
    notebookFontSize: 'medium'
  });
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const saved = await getSettings();
    if (saved) {
      setSettings({...settings, ...saved});
    }
  };

  const handleSave = async () => {
    await saveSettings(settings);
    if (onSettingsChange) onSettingsChange(settings);
    
    setSaveStatus('Ayarlar başarıyla kaydedildi!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const fontOptions = [
    { value: 'Inter', label: 'Inter (Modern & Temiz)' },
    { value: 'Roboto', label: 'Roboto (Klasik & Okunaklı)' },
    { value: 'Outfit', label: 'Outfit (Şık & Yuvarlak)' },
    { value: '"Comic Sans MS", "Comic Sans", cursive', label: 'Comic Sans (Eğlenceli)' },
    { value: 'Caveat', label: 'Caveat (El Yazısı)' },
    { value: '"Times New Roman", serif', label: 'Times New Roman (Resmi)' }
  ];

  const sizeOptions = [
    { value: 'small', label: 'Küçük' },
    { value: 'medium', label: 'Orta (Varsayılan)' },
    { value: 'large', label: 'Büyük' }
  ];

  return (
    <div className="settings-view-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      
      <div className="settings-header" style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Settings2 size={32} className="text-primary" />
          Uygulama Ayarları
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Uygulamanın ve not defterinin görünümünü kişiselleştirin.
        </p>
      </div>

      <div className="settings-card" style={{ background: 'var(--bg-panel)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <Layout size={20} className="text-primary" />
          Genel Uygulama Görünümü
        </h2>

        <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="settings-group">
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Yazı Tipi (Font)</label>
            <select 
              className="settings-select"
              value={settings.appFontFamily} 
              onChange={e => setSettings({...settings, appFontFamily: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
            >
              {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          
          <div className="settings-group">
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Yazı Boyutu</label>
            <select 
              className="settings-select"
              value={settings.appFontSize} 
              onChange={e => setSettings({...settings, appFontSize: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
            >
              {sizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <Type size={20} className="text-primary" />
          Not Defteri Görünümü
        </h2>

        <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div className="settings-group">
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Not Defteri Yazı Tipi</label>
            <select 
              className="settings-select"
              value={settings.notebookFontFamily} 
              onChange={e => setSettings({...settings, notebookFontFamily: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
            >
              {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          
          <div className="settings-group">
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Not Defteri Yazı Boyutu</label>
            <select 
              className="settings-select"
              value={settings.notebookFontSize} 
              onChange={e => setSettings({...settings, notebookFontSize: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
            >
              {sizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="settings-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
        {saveStatus && <span style={{ color: 'var(--success-color, #10b981)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18}/> {saveStatus}</span>}
        
        <button 
          onClick={handleSave} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            padding: '0.75rem 2rem', 
            backgroundColor: 'var(--primary)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '1rem', 
            fontWeight: '600', 
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Değişiklikleri Uygula ve Kaydet
        </button>
      </div>

    </div>
  );
};

export default SettingsView;
