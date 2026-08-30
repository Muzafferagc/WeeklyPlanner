import React from 'react';
import { Calendar, CalendarDays, Settings, BookOpen, Sun, CheckSquare, Menu } from 'lucide-react';

const MobileNav = ({ activeTab, onTabChange, onToggleSidebarDrawer, customTasks = [] }) => {
  const allCount = customTasks.filter(t => !t.completed).length;

  return (
    <nav className="mobile-bottom-nav no-print">
      <button 
        type="button" 
        className={`mobile-nav-btn ${activeTab === 'schedule' ? 'active' : ''}`}
        onClick={() => onTabChange('schedule')}
      >
        <div className="mobile-icon-container">
          <Calendar size={22} className="icon-planned" />
        </div>
        <span>Planım</span>
      </button>

      <button 
        type="button" 
        className={`mobile-nav-btn ${activeTab === 'details' ? 'active' : ''}`}
        onClick={() => onTabChange('details')}
      >
        <div className="mobile-icon-container">
          <BookOpen size={22} className="icon-myday" />
        </div>
        <span>Müfredat</span>
      </button>

      <button 
        type="button" 
        className={`mobile-nav-btn ${activeTab === 'smart_myday' ? 'active' : ''}`}
        onClick={() => onTabChange('smart_myday')}
      >
        <div className="mobile-icon-container">
          <Sun size={22} className="icon-myday" />
        </div>
        <span>Günüm</span>
      </button>

      <button 
        type="button" 
        className={`mobile-nav-btn ${activeTab === 'smart_all' ? 'active' : ''}`}
        onClick={() => onTabChange('smart_all')}
      >
        <div className="mobile-icon-container">
          <CheckSquare size={22} className="icon-tasks" />
          {allCount > 0 && <span className="mobile-badge-dot">{allCount > 99 ? '99+' : allCount}</span>}
        </div>
        <span>Görevler</span>
      </button>

      <button 
        type="button" 
        className="mobile-nav-btn"
        onClick={onToggleSidebarDrawer}
      >
        <div className="mobile-icon-container">
          <Menu size={22} />
        </div>
        <span>Menü</span>
      </button>
    </nav>
  );
};

export default MobileNav;
