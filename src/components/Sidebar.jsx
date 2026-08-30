import React, { useState, useMemo } from 'react';
import { 
  Plus, CalendarDays, Trash2, Edit3, Download, Settings, Search, Filter, BookOpen,
  Sun, Star, Calendar, CheckSquare, ListTodo, ShoppingCart, Brain, Folder, Compass,
  Target, BookMarked, PiggyBank, List, ChevronDown, ChevronRight, User, Share2, RotateCcw, Save
} from 'lucide-react';
import DialogModal from './DialogModal';
import { createCustomList, deleteCustomList, renameCustomList } from '../utils/storage';
import { APP_VERSION } from '../config/version';

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Map icon string name to Lucide icon component
const ICON_MAP = {
  ShoppingCart,
  CheckSquare,
  Brain,
  Folder,
  Compass,
  Target,
  BookMarked,
  ListTodo,
  PiggyBank,
  List
};

const Sidebar = ({ 
  onOpenSettings,
  weeks, 
  currentWeekId, 
  onSelectWeek, 
  onCreateWeek, 
  onDeleteWeek, 
  onRenameWeek, 
  onMultiDeleteWeeks, 
  onMultiExportWeeks, 
  onOpenDefaultPlanModal,
  onSaveCurrentWeekAsTemplate,
  activeTab = 'list_programlanan',
  onTabChange,
  customLists = [],
  customTasks = [],
  onRefreshData,
  onResetCurrentWeek,
  isMobileDrawerOpen,
  onCloseMobileDrawer
}) => {
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [showWeeksHistory, setShowWeeksHistory] = useState(true);
  const [dialog, setDialog] = useState({ isOpen: false, type: null, payload: null });

  const handleTabClick = (tabId) => {
    if (onTabChange) onTabChange(tabId);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  // Compute Task Counts for Smart Views
  const myDayCount = useMemo(() => customTasks.filter(t => !t.completed && (t.inMyDay || t.dueDateLabel === 'Bugün')).length, [customTasks]);
  const importantCount = useMemo(() => customTasks.filter(t => !t.completed && t.starred).length, [customTasks]);
  const plannedCount = useMemo(() => customTasks.filter(t => !t.completed && (t.dueDate || t.dueDateLabel)).length, [customTasks]);
  const allTasksCount = useMemo(() => customTasks.filter(t => !t.completed && (!t.listId || t.listId === 'smart_all')).length, [customTasks]);

  // Compute task count per custom list
  const getListTaskCount = (listId) => {
    return customTasks.filter(t => t.listId === listId && !t.completed).length;
  };

  // Chronological Sort: Top = Newest, Bottom = Oldest
  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) => {
      const dateA = new Date(a.startDate || a.createdAt || 0);
      const dateB = new Date(b.startDate || b.createdAt || 0);
      return dateB - dateA;
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

  const handleWeekClick = (e, id) => {
    handleTabClick('schedule');
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

  const handleCreateNewListPrompt = () => {
    setDialog({ type: 'newList', isOpen: true });
  };

  const handleConfirmAction = async (inputValue) => {
    if (dialog.type === 'newList' && inputValue && inputValue.trim()) {
      await createCustomList(inputValue.trim());
      if (onRefreshData) onRefreshData();
    } else if (dialog.type === 'renameCustomList' && inputValue && inputValue.trim()) {
      await renameCustomList(dialog.payload.id, inputValue.trim());
      if (onRefreshData) onRefreshData();
    } else if (dialog.type === 'deleteCustomList') {
      await deleteCustomList(dialog.payload.id);
      if (onRefreshData) onRefreshData();
      if (activeTab === dialog.payload.id) {
        handleTabClick('smart_all');
      }
    } else if (dialog.type === 'rename') {
      if (inputValue && inputValue.trim()) {
        onRenameWeek(dialog.payload.id, inputValue.trim());
      }
    } else if (dialog.type === 'singleDelete') {
      onDeleteWeek(dialog.payload.id);
    } else if (dialog.type === 'multiDelete') {
      onMultiDeleteWeeks(selectedWeeks);
      setSelectedWeeks([]);
    }
    setDialog({ isOpen: false, type: null, payload: null });
  };

  const getDialogProps = () => {
    if (dialog.type === 'newList') {
      return {
        title: "Yeni Liste Oluştur",
        message: "Oluşturmak istediğiniz listenin adını girin:",
        type: "prompt",
        defaultValue: "",
        confirmText: "Oluştur"
      };
    } else if (dialog.type === 'renameCustomList') {
      return {
        title: "Listeyi Yeniden Adlandır",
        message: "Yeni liste adını girin:",
        type: "prompt",
        defaultValue: dialog.payload?.name || "",
        confirmText: "Kaydet"
      };
    } else if (dialog.type === 'deleteCustomList') {
      return {
        title: "Listeyi Sil",
        message: `'${dialog.payload?.name}' listesini ve içindeki görevleri silmek istediğinize emin misiniz?`,
        confirmText: "Evet, Sil"
      };
    } else if (dialog.type === 'rename') {
      return {
        title: "Yeniden Adlandır",
        message: "Yeni hafta ismini girin:",
        type: "prompt",
        defaultValue: dialog.payload?.name || "",
        confirmText: "Kaydet"
      };
    } else if (dialog.type === 'singleDelete') {
      return {
        title: "Haftayı Sil",
        message: `'${dialog.payload?.name}' silinecek. Emin misiniz?`,
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
    <>
      {isMobileDrawerOpen && (
        <div className="mobile-drawer-overlay no-print" onClick={onCloseMobileDrawer} />
      )}
      <div className={`sidebar no-print ${isMobileDrawerOpen ? 'mobile-drawer-open' : ''}`}>
        {/* BRAND & VERSION HEADER */}
        <div className="sidebar-app-brand">
          <span className="brand-title">Haftalık Planlayıcı</span>
          <span className="sidebar-version-badge" title="Uygulama Sürümü">{APP_VERSION}</span>
        </div>

        {/* SMART SYSTEM CATEGORIES (MS To-Do Top Items) */}
        <div className="sidebar-section smart-views-section">
          <button 
            className={`sidebar-nav-item ${activeTab === 'smart_myday' ? 'active' : ''}`}
            onClick={() => handleTabClick('smart_myday')}
          >
            <div className="nav-item-left">
              <Sun size={18} className="icon-myday" />
              <span>Günüm</span>
            </div>
            {myDayCount > 0 && <span className="nav-badge">{myDayCount}</span>}
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'smart_important' ? 'active' : ''}`}
            onClick={() => handleTabClick('smart_important')}
          >
            <div className="nav-item-left">
              <Star size={18} className="icon-important" />
              <span>Önemli</span>
            </div>
            {importantCount > 0 && <span className="nav-badge">{importantCount}</span>}
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'smart_planned' ? 'active' : ''}`}
            onClick={() => handleTabClick('smart_planned')}
          >
            <div className="nav-item-left">
              <Calendar size={18} className="icon-planned" />
              <span>Planlanan</span>
            </div>
            {plannedCount > 0 && <span className="nav-badge">{plannedCount}</span>}
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'smart_all' ? 'active' : ''}`}
            onClick={() => handleTabClick('smart_all')}
          >
            <div className="nav-item-left">
              <CheckSquare size={18} className="icon-tasks" />
              <span>Görevler & Notlar</span>
            </div>
            {allTasksCount > 0 && <span className="nav-badge">{allTasksCount}</span>}
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => handleTabClick('schedule')}
          >
            <div className="nav-item-left">
              <CalendarDays size={18} className="icon-schedule" />
              <span>Haftalık Planım (Tablo)</span>
            </div>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => handleTabClick('details')}
          >
            <div className="nav-item-left">
              <BookOpen size={18} className="icon-details" />
              <span>Ders Detayları & Müfredat</span>
            </div>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'notebook' ? 'active' : ''}`}
            onClick={() => handleTabClick('notebook')}
          >
            <div className="nav-item-left">
              <BookMarked size={18} className="icon-notebook" />
              <span>Not Defteri</span>
            </div>
          </button>
        </div>

      <div className="sidebar-divider" />

      {/* CUSTOM USER LISTS */}
      <div className="sidebar-section custom-lists-section">
        {customLists.map(list => {
          const IconComp = ICON_MAP[list.icon] || List;
          const count = getListTaskCount(list.id);
          const isActive = activeTab === list.id;

          return (
            <div
              key={list.id}
              className={`sidebar-nav-item custom-list-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange && onTabChange(list.id)}
            >
              <div className="nav-item-left">
                <IconComp size={18} className="custom-list-icon" />
                <span className="custom-list-name">{list.name}</span>
              </div>
              
              <div className="nav-item-right-wrap">
                {count > 0 && <span className="nav-badge">{count}</span>}

                <div className="custom-list-actions">
                  <button 
                    type="button"
                    className="icon-btn-subtle-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDialog({ isOpen: true, type: 'renameCustomList', payload: { id: list.id, name: list.name } });
                    }}
                    title="Listeyi Yeniden Adlandır"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    type="button"
                    className="icon-btn-subtle-sm text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDialog({ isOpen: true, type: 'deleteCustomList', payload: { id: list.id, name: list.name } });
                    }}
                    title="Listeyi Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* ADD NEW LIST BUTTON */}
        <button 
          type="button" 
          className="sidebar-add-list-btn"
          onClick={handleCreateNewListPrompt}
        >
          <Plus size={18} />
          <span>Yeni liste</span>
        </button>
      </div>

      <div className="sidebar-divider" />


      {/* HISTORICAL WEEKS ACCORDION */}
      <div className="sidebar-section weeks-history-section">
        <button 
          type="button"
          className="weeks-history-toggle"
          onClick={() => setShowWeeksHistory(!showWeeksHistory)}
        >
          <div className="nav-item-left">
            <CalendarDays size={16} />
            <span>Geçmiş Haftalık Tablolar ({weeks.length})</span>
          </div>
          {showWeeksHistory ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {showWeeksHistory && (
          <div className="weeks-history-content">
            <div className="sidebar-filter-container">
              <div className="search-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Hafta ara..."
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
                  >
                    <option value="ALL">Tüm Yıllar</option>
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="weeks-list">
              {filteredWeeks.map((week) => {
                const isSelected = selectedWeeks.includes(week.id);
                return (
                  <div 
                    key={week.id} 
                    className={`week-item ${week.id === currentWeekId && activeTab === 'schedule' ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => handleWeekClick(e, week.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.65rem' }}
                  >
                    <span className="week-name" style={{ fontWeight: week.id === currentWeekId ? 800 : 600 }}>{week.name}</span>
                    <div className="week-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: 1 }}>
                      <button 
                        type="button"
                        className="week-action-btn"
                        title="Hafta İdefini Düzenle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDialog({ isOpen: true, type: 'rename', payload: { id: week.id, name: week.name }});
                        }}
                      >
                        <Edit3 size={14} />
                      </button>
                      {weeks.length > 1 && (
                        <button 
                          type="button"
                          className="week-action-btn delete-btn-sidebar"
                          title="Haftayı Sil"
                          style={{ color: '#ef4444' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDialog({ isOpen: true, type: 'singleDelete', payload: { id: week.id, name: week.name }});
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="new-week-btn" onClick={onCreateWeek}>
              <Plus size={16} /> Yeni Hafta Oluştur
            </button>
            <button 
              className="new-week-btn reset-week-btn-sidebar" 
              onClick={() => { if (onCloseMobileDrawer) onCloseMobileDrawer(); if (onSaveCurrentWeekAsTemplate) onSaveCurrentWeekAsTemplate(); }}
              style={{ marginTop: '0.5rem', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}
              title="Mevcut haftanızı Varsayılan Şablon olarak kaydedin"
            >
              <Save size={16} /> Mevcut Haftayı Şablon Yap
            </button>
            <button 
              className="new-week-btn reset-week-btn-sidebar" 
              onClick={() => { if (onCloseMobileDrawer) onCloseMobileDrawer(); if (onResetCurrentWeek) onResetCurrentWeek(); }}
              style={{ marginTop: '0.5rem', background: 'rgba(217, 119, 6, 0.12)', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.3)', fontWeight: 700 }}
              title="Aktif haftanızı Varsayılan Plan Şablonunuza döndürün"
            >
              <RotateCcw size={16} /> Mevcut Haftayı Sıfırla
            </button>
            <button 
              className="new-week-btn" 
              onClick={() => { if (onCloseMobileDrawer) onCloseMobileDrawer(); if (onOpenSettings) onOpenSettings(); }}
              style={{ marginTop: '0.5rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            >
              <Settings size={16} /> Ayarlar
            </button>
          </div>
        )}
      </div>
    </div>

    <DialogModal 
      isOpen={dialog.isOpen}
      {...getDialogProps()}
      onConfirm={handleConfirmAction}
      onCancel={() => setDialog({ isOpen: false, type: null, payload: null })}
    />
  </>
  );
};

export default Sidebar;

