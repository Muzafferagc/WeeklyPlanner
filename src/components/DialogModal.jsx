import React, { useState } from 'react';
import { X } from 'lucide-react';

const DialogModal = ({ 
  isOpen, 
  title, 
  message, 
  type = 'confirm', // 'confirm' or 'prompt'
  defaultValue = '',
  confirmText = 'Onayla', 
  cancelText = 'İptal', 
  onConfirm, 
  onCancel 
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onCancel}><X size={20} /></button>
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
          <div className="dialog-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>{cancelText}</button>
            <button type="submit" className={`btn-primary ${title.includes('Sil') || title.includes('Sıfırla') ? 'danger-bg' : ''}`}>
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DialogModal;
