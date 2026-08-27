import React, { useState } from 'react';
import { X } from 'lucide-react';

const DialogModal = ({ 
  isOpen, 
  title, 
  message, 
  type = 'confirm', // 'confirm' or 'prompt'
  defaultValue = '',
  confirmText = 'Onayla', 
  secondaryConfirmText = null,
  cancelText = 'İptal', 
  onConfirm, 
  onSecondaryConfirm = null,
  onCancel 
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (type === 'prompt') {
      if (onConfirm) onConfirm(inputValue);
    } else {
      if (onConfirm) onConfirm();
    }
  };

  return (
    <div className="modal-overlay mobile-high-overlay" style={{ zIndex: 60000 }} onClick={onCancel}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{title}</h3>
          <button className="close-btn" type="button" onClick={onCancel}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="dialog-body">
          <p>{message}</p>
          {type === 'prompt' && (
            <input 
              type="text" 
              autoFocus
              className="modal-input" 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              style={{ marginTop: '1rem', width: '100%' }}
            />
          )}
          <div className="dialog-footer" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onCancel}>{cancelText}</button>
            {secondaryConfirmText && (
              <button 
                type="button" 
                className="btn-secondary"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 700 }}
                onClick={() => { if (onSecondaryConfirm) onSecondaryConfirm(); }}
              >
                {secondaryConfirmText}
              </button>
            )}
            <button 
              type="button" 
              className={`btn-primary ${title && (title.includes('Sil') || title.includes('Sıfırla')) ? 'danger-bg' : ''}`}
              onClick={handleSubmit}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DialogModal;
