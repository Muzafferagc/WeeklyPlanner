import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, QrCode, Wifi, Copy, Check, X, RefreshCw } from 'lucide-react';
import { getSyncRoom, setSyncRoom } from '../utils/syncService';

const SyncModal = ({ isOpen, onClose, onRoomChanged }) => {
  const [roomInput, setRoomInput] = useState(getSyncRoom());
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentRoom = getSyncRoom();
  
  // Build URL with ?room= parameter (fallback to web address if running locally via file://)
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
            <Smartphone className="text-primary" size={24} />
            <h2>Mobil & Cihaz Senkronizasyonu</h2>
          </div>
          <button type="button" className="task-detail-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="sync-modal-body">
          {/* LIVE STATUS BANNER */}
          <div className="sync-status-banner">
            <Wifi size={18} className="wifi-icon" />
            <span>Canlı Senkronizasyon Oda Kodu: <strong>{currentRoom}</strong></span>
          </div>

          {/* QR CODE DISPLAY */}
          <div className="qr-code-wrapper">
            <div className="qr-code-box">
              <QRCodeSVG 
                value={shareUrl} 
                size={180}
                bgColor="#ffffff"
                fgColor="#1e293b"
                level="M"
              />
            </div>
            <p className="qr-hint">
              📱 <strong>Telefonunuzun Kamerasıyla Okutun:</strong> QR kodu taradığınızda telefonunuz doğrudan canlı senkronize odaya bağlanır. Sadece 1 kez okutmanız yeterlidir!
            </p>
          </div>

          {/* COPY LINK AND CUSTOM ROOM */}
          <div className="sync-action-box">
            <button type="button" className="sync-copy-btn" onClick={handleCopyLink}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Link Kopyalandı!' : 'Mobil Linkini Kopyala'}</span>
            </button>
          </div>

          {/* CUSTOM ROOM FORM */}
          <form onSubmit={handleSaveRoom} className="sync-room-form">
            <label>Özel Oda Kodu Belirle:</label>
            <div className="sync-room-input-row">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                className="sync-room-input"
                placeholder="Örn: MUZAFFER-2026"
              />
              <button type="submit" className="sync-save-btn">
                Değiştir
              </button>
            </div>
          </form>

          {/* PWA INSTALL INSTRUCTIONS */}
          <div className="pwa-instructions">
            <h4>💡 Telefonda Uygulamaya Dönüştürme (Ana Ekrana Ekle):</h4>
            <ol>
              <li>Telefonunuzda linki açtıktan sonra tarayıcı menüsünü açın.</li>
              <li><strong>"Ana Ekrana Ekle" (Add to Home Screen)</strong> seçeneğine basın.</li>
              <li>Uygulama simgesi telefonunuzun ekranına gelecektir!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
