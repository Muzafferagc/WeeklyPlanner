import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

const PwaBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if iOS Safari and not in standalone mode
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('pwa_banner_dismissed');

    if (isIos && !isStandalone && !dismissed) {
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="pwa-mobile-banner">
      <button type="button" className="pwa-banner-close" onClick={handleDismiss}>
        <X size={18} />
      </button>

      <div className="pwa-banner-content">
        <div className="pwa-banner-icon">📱</div>
        <div className="pwa-banner-text">
          <h3>Telefona Uygulama Olarak Yükle</h3>
          <p>
            Alttaki Paylaş simgesine <Share size={15} style={{ display: 'inline', margin: '0 2px' }} /> dokunun ve <strong>'Ana Ekrana Ekle'</strong> <PlusSquare size={15} style={{ display: 'inline', margin: '0 2px' }} /> seçeneğini seçin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PwaBanner;
