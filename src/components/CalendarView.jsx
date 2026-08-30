import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const CalendarView = ({ tasks, onAddTask, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Make Monday=0
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const days = daysInMonth(currentYear, currentMonth);
  const firstDay = firstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const calendarGrid = useMemo(() => {
    let grid = [];
    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }
    for (let i = 1; i <= days; i++) {
      grid.push(i);
    }
    return grid;
  }, [days, firstDay]);

  const getTasksForDate = (dayNum) => {
    if (!dayNum) return [];
    
    // YYYY-MM-DD
    const pad = n => n < 10 ? '0' + n : n;
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dayNum)}`;
    
    return tasks.filter(t => {
      // Direct exact match
      if (t.dueDate === dateStr) return true;
      // Match localized string label as fallback
      if (t.dueDateLabel && t.dueDateLabel.startsWith(dayNum.toString() + ' ' + monthNames[currentMonth])) return true;
      return false;
    });
  };

  const handleDayClick = (dayNum) => {
    if (!dayNum) return;
    const pad = n => n < 10 ? '0' + n : n;
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dayNum)}`;
    if (onAddTask) {
      onAddTask(dateStr);
    }
  };

  return (
    <div className="calendar-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)', height: '100%', overflow: 'hidden' }}>
      
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: '600' }}>
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={prevMonth} style={{ padding: '8px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} style={{ padding: '8px 16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '500' }}>
            Bugün
          </button>
          <button onClick={nextMonth} style={{ padding: '8px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="calendar-days-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)' }}>
        {dayNames.map(d => (
          <div key={d} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {d}
          </div>
        ))}
      </div>

      <div className="calendar-grid-content" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(100px, 1fr)', overflowY: 'auto', backgroundColor: 'var(--border-color)', gap: '1px' }}>
        {calendarGrid.map((dayNum, index) => {
          const dayTasks = getTasksForDate(dayNum);
          const isToday = dayNum && new Date().getDate() === dayNum && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
          
          return (
            <div 
              key={index} 
              className={`calendar-cell ${isToday ? 'today' : ''}`}
              onClick={() => handleDayClick(dayNum)}
              style={{ 
                backgroundColor: 'var(--bg-main)', 
                padding: '8px', 
                display: 'flex', 
                flexDirection: 'column', 
                cursor: dayNum ? 'pointer' : 'default',
                position: 'relative'
              }}
            >
              {dayNum && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      fontSize: '14px', 
                      fontWeight: isToday ? 'bold' : 'normal',
                      backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                      color: isToday ? '#fff' : 'var(--text-main)'
                    }}>
                      {dayNum}
                    </span>
                  </div>
                  
                  <div className="calendar-tasks" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                    {dayTasks.slice(0, 4).map(task => (
                      <div 
                        key={task.id} 
                        onClick={(e) => { e.stopPropagation(); if(onTaskClick) onTaskClick(task); }}
                        style={{ 
                          fontSize: '11px', 
                          padding: '4px 6px', 
                          backgroundColor: task.completed ? 'var(--bg-panel)' : 'rgba(var(--primary-rgb), 0.15)', 
                          color: task.completed ? 'var(--text-secondary)' : 'var(--primary)', 
                          borderRadius: '4px',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 4 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '2px 4px' }}>
                        +{dayTasks.length - 4} daha...
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default CalendarView;
