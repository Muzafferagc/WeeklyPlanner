import React, { useState, useMemo } from 'react';
import { Plus, CalendarDays, Trash2, Edit3, Download, Settings, Search, Filter } from 'lucide-react';
import DialogModal from './DialogModal';

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const Sidebar = ({ 
  weeks, 
  currentWeekId, 
  onSelectWeek, 
  onCreateWeek, 
  onDeleteWeek, 
  onRenameWeek, 
  onMultiDeleteWeeks, 
  onMultiExportWeeks, 
  onOpenDefaultPlanModal 
}) => {
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [dialog, setDialog] = useState({ isOpen: false, type: null, payload: null });

  // Chronological Sort: Top = Newest, Bottom = Oldest (Aşağıdan yukarıya tarih artar)
  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) => {
      const dateA = new Date(a.startDate || a.createdAt || 0);
      const dateB = new Date(b.startDate || b.createdAt || 0);
      return dateB - dateA; // Index 0 (top) = newest, Last index (bottom) = oldest
    });
  }, [weeks]);

  // Extract unique years from weeks
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    weeks.forEach(w => {
      if (w.startDate) {
        yearsSet.add(new Date(w.startDate).getFullYear());
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [weeks]);

  // Filtered Weeks based on Search Query, Year, and Month
  const filteredWeeks = useMemo(() => {
    return sortedWeeks.filter(week => {
      const matchSearch = searchQuery.trim() === '' || 
        week.name.toLowerCase().includes(searchQuery.toLowerCase());

      const weekDate = week.startDate ? new Date(week.startDate) : null;

      const matchYear = selectedYear === 'ALL' || 
        (weekDate && weekDate.getFullYear() === Number(selectedYear));

      const matchMonth = selectedMonth === 'ALL' || 
        (weekDate && weekDate.getMonth() === Number(selectedMonth)) ||
        (week.name.toLowerCase().includes(MONTH_NAMES[Number(selectedMonth)].toLowerCase()));

      return matchSearch && matchYear && matchMonth;
    });
  }, [sortedWeeks, searchQuery, selectedYear, selectedMonth]);

  const handleCreate = (e) => {
    e.preventDefault();
    onCreateWeek();
  };

  const handleWeekClick = (e, id) => {
    if (e.ctrlKey || e.metaKey) {
      if (selectedWeeks.includes(id)) {
        setSelectedWeeks(selectedWeeks.filter(wId => wId !== id));
      } else {
        setSelectedWeeks([...selectedWeeks, id]);
      }
    } else {
      if (selectedWeeks.length > 0) {
        setSelectedWeeks([]);
      } else {
        onSelectWeek(id);
      }
    }
  };

  const handleConfirmAction = (inputValue) => {
    if (dialog.type === 'rename') {
      if (inputValue && inputValue.trim()) {
        onRenameWeek(dialog.payload.id, inputValue.trim());
      }
    } else if (dialog.type === 'singleDelete') {
      onDeleteWeek(dialog.payload.id);
    } else if (dialog.type === 'multiDelete') {
      onMultiDeleteWeeks(selectedWeeks);
      setSelectedWeeks([]);
    }
    setDialog({ isOpen: false });
  };

  const getDialogProps = () => {
    if (dialog.type === 'rename') {
      return {
        title: "Yeniden Adlandır",
        message: "Yeni hafta ismini girin:",
        type: "prompt",
        defaultValue: dialog.payload.name,
        confirmText: "Kaydet"
      };
    } else if (dialog.type === 'singleDelete') {
      return {
        title: "Haftayı Sil",
        message: `'${dialog.payload.name}' silinecek. Emin misiniz?`,
        confirmText: "Evet, Sil"
      };
    } else if (dialog.type === 'multiDelete') {
      return {
        title: "Haftaları Sil",
        message: `${selectedWeeks.length} hafta silinecek. Emin misiniz?`,
        confirmText: "Evet, Sil"
      };
    }
    return {};
  };

  return (
    <div className="sidebar no-print">
      <div className="sidebar-header">
        <CalendarDays className="text-primary" size={24} />
        <h2>Haftalar ({filteredWeeks.length})</h2>
      </div>

      {/* SEARCH AND FILTER CONTROLS */}
      <div className="sidebar-filter-container">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Hafta ara (örn: Eylül)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sidebar-search-input"
          />
        </div>

        <div className="filters-row">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="sidebar-filter-select"
            title="Aya Göre Filtrele"
          >
            <option value="ALL">Tüm Aylar</option>
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>

          {availableYears.length > 0 && (
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="sidebar-filter-select"
              title="Yıla Göre Filtrele"
            >
              <option value="ALL">Tüm Yıllar</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* WEEKS LIST - Top: Newest, Bottom: Oldest */}
      <div className="weeks-list">
        {filteredWeeks.map((week) => {
          const isSelected = selectedWeeks.includes(week.id);
          return (
          <div 
            key={week.id} 
            className={`week-item ${week.id === currentWeekId && selectedWeeks.length === 0 ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={(e) => handleWeekClick(e, week.id)}
          >
            <span className="week-name">{week.name}</span>
            <div className="week-actions">
              <button 
                className="week-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setDialog({ isOpen: true, type: 'rename', payload: { id: week.id, name: week.name }});
                }}
                title="Yeniden Adlandır"
              >
                <Edit3 size={14} />
              </button>
              {weeks.length > 1 && (
                <button 
                  className="week-action-btn delete-btn-sidebar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialog({ isOpen: true, type: 'singleDelete', payload: { id: week.id, name: week.name }});
                  }}
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        )})}
        {filteredWeeks.length === 0 && (
          <div className="empty-filter-state">
            Aranan kritere uygun hafta bulunamadı.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
        <button className="new-week-btn no-print" onClick={handleCreate}>
          <Plus size={18} />
          Yeni Hafta Ekle
        </button>

        <button 
          className="btn-secondary default-plan-trigger-btn"
          onClick={onOpenDefaultPlanModal}
          title="Varsayılan haftalık plan şablonunu düzenleyin"
        >
          <Settings size={16} /> Varsayılan Planı Düzenle
        </button>
      </div>

      {selectedWeeks.length > 0 && (
        <div style={{ padding: '1rem', background: 'var(--input-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>{selectedWeeks.length} Hafta Seçildi</span>
          <button className="btn-secondary" onClick={() => { onMultiExportWeeks(selectedWeeks); setSelectedWeeks([]); }} style={{ width: '100%', justifyContent: 'center' }}>
            <Download size={14} /> Yedekle
          </button>
          <button className="btn-secondary" onClick={() => setDialog({ isOpen: true, type: 'multiDelete' })} style={{ width: '100%', justifyContent: 'center', color: '#ef4444' }}>
            <Trash2 size={14} /> Sil
          </button>
        </div>
      )}

      <DialogModal 
        isOpen={dialog.isOpen}
        {...getDialogProps()}
        onConfirm={handleConfirmAction}
        onCancel={() => setDialog({ isOpen: false })}
      />
    </div>
  );
};

export default Sidebar;
