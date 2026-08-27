import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, QrCode, Wifi, Copy, Check, X, Database, Key } from 'lucide-react';
import { getSyncRoom, setSyncRoom, getSupabaseConfig, setSupabaseConfig } from '../utils/syncService';

const SyncModal = ({ isOpen, onClose, onRoomChanged }) => {
  const [roomInput, setRoomInput] = useState(getSyncRoom());
  const [copied, setCopied] = useState(false);
  
  const currentSupabase = getSupabaseConfig();
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(currentSupabase.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(currentSupabase.key);

  if (!isOpen) return null;

  const currentRoom = getSyncRoom();
  
  // Build URL with ?room= parameter
  let baseUrl = `${window.location.origin}${window.location.pathname}`;
  if (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null') {
    baseUrl = 'https://muzafferagc.github.io/WeeklyPlanner/';
  }
  const shareUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}?room=${currentRoom}`;

  const handleSaveRoom = (e) => {
    e.preventDefault();
    if (!roomInput.trim()) return;
    const newRoom = setSyncRoom(roomInput);
    if (onRoomChanged) onRoomChanged(newRoom);
    alert(`✓ Senkronizasyon Odası '${newRoom}' olarak güncellendi!`);
  };

  const handleSaveSupabase = (e) => {
    e.preventDefault();
    setSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    alert("✓ Supabase Bulut Veritabanı bilgileri kaydedildi! Sayfa yenileniyor...");
    window.location.reload();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="task-detail-modal-overlay" onClick={onClose}>
      <div className="sync-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sync-modal-header">
          <div className="sync-title-box">
            <Database className="text-primary" size={24} />
            <h2>Supabase Realtime Senkronizasyon</h2>
          </div>
          <button type="button" className="task-detail-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="sync-modal-body">
          {/* SUPABASE CONFIG FORM */}
          <form onSubmit={handleSaveSupabase} className="sync-room-form" style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={18} className="text-primary" /> Supabase Veritabanı Bilgileri
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Supabase Project URL:</label>
                <input
                  type="text"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="sync-room-input"
                  style={{ width: '100%', marginTop: '3px' }}
                  placeholder="https://xxxx.supabase.co"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Supabase Anon Public Key:</label>
                <input
                  type="text"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  className="sync-room-input"
                  style={{ width: '100%', marginTop: '3px', fontSize: '0.8rem' }}
                  placeholder="eyJhbGciOi..."
                />
              </div>

              <button type="submit" className="sync-save-btn" style={{ width: '100%', marginTop: '4px' }}>
                Supabase Bilgilerini Kaydet
              </button>
            </div>
          </form>

          {/* QR CODE DISPLAY */}
          <div className="qr-code-wrapper" style={{ marginTop: '1rem' }}>
            <div className="qr-code-box">
              <QRCodeSVG 
                value={shareUrl} 
                size={160}
                bgColor="#ffffff"
                fgColor="#1e293b"
                level="M"
              />
            </div>
            <p className="qr-hint">
              📱 <strong>Telefonunuzdan QR Kodu Okutun:</strong> Supabase ayarlarınız kaydedildiğinde telefonunuz doğrudan bu odaya bağlanır.
            </p>
          </div>

          <div className="sync-action-box">
            <button type="button" className="sync-copy-btn" onClick={handleCopyLink}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Link Kopyalandı!' : 'Mobil Linkini Kopyala'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
