import React from 'react';
import { Sun, Star, Calendar, CheckSquare, Menu } from 'lucide-react';

const MobileNav = ({ activeTab, onTabChange, onToggleSidebarDrawer, customTasks = [] }) => {
  const myDayCount = customTasks.filter(t => !t.completed && (t.inMyDay || t.dueDateLabel === 'Bugün')).length;
  const importantCount = customTasks.filter(t => !t.completed && t.starred).length;
  const plannedCount = customTasks.filter(t => !t.completed && (t.dueDate || t.dueDateLabel)).length;
  const allCount = customTasks.filter(t => !t.completed).length;

  return (
    <nav className="mobile-bottom-nav no-print">
      <button 
        type="button" 
        className={`mobile-nav-btn ${activeTab === 'smart_myday' ? 'active' : ''}`}
        onClick={() => onTabChange('smart_myday')}
      >
        <div className="mobile-icon-container">
          <Sun size={22} className="icon-myday" />
          {myDayCount > 0 && <span className="mobile-badge-dot">{myDayCount > 99 ? '99+' : myDayCount}</span>}
        </div>
        <span>Günüm</span>
      </button>

      <button 
        type="button" 
        className={`mobile-nav-btn ${activeTab === 'smart_important' ? 'active' : ''}`}
        onClick={() => onTabChange('smart_important')}
      >
        <div className="mobile-icon-container">
          <Star size={22} className="icon-important" />
          {importantCount > 0 && <span className="mobile-badge-dot">{importantCount > 99 ? '99+' : importantCount}</span>}
        </div>
        <span>Önemli</span>
      </button>

      <button 
        type="button" 
        className={`mobile-nav-btn ${activeTab === 'smart_planned' ? 'active' : ''}`}
        onClick={() => onTabChange('smart_planned')}
      >
        <div className="mobile-icon-container">
          <Calendar size={22} className="icon-planned" />
          {plannedCount > 0 && <span className="mobile-badge-dot">{plannedCount > 99 ? '99+' : plannedCount}</span>}
        </div>
        <span>Planlanan</span>
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
