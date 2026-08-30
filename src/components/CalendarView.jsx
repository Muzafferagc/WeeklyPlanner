import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, LayoutList } from 'lucide-react';

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
  const dayNames = ["P", "S", "Ç", "P", "C", "C", "P"]; // Apple style single letters

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
      if (t.dueDate === dateStr) return true;
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

  const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const getTaskColor = (id) => {
    // Generate deterministic color based on task ID
    let sum = 0;
    for(let i=0; i<id.length; i++) sum += id.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="apple-calendar-container" style={{ 
      backgroundColor: '#000000', 
      color: '#ffffff', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
    }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#000000' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '1.2rem', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}>
          <ChevronLeft size={24} /> <span style={{ marginLeft: '4px' }}>{currentYear}</span>
        </button>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', padding: 0 }}><LayoutList size={22} /></button>
          <button style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', padding: 0 }} onClick={nextMonth}><ChevronRight size={24} /></button>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: '10px 0 20px 0' }}>{monthNames[currentMonth]}</h1>
      </div>

      {/* DAYS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        {dayNames.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#8e8e93' }}>
            {d}
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(100px, 1fr)', overflowY: 'auto' }}>
        {calendarGrid.map((dayNum, index) => {
          const dayTasks = getTasksForDate(dayNum);
          const isToday = dayNum && new Date().getDate() === dayNum && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
          
          return (
            <div 
              key={index} 
              onClick={() => handleDayClick(dayNum)}
              style={{ 
                borderBottom: '1px solid #1c1c1e', 
                borderRight: (index + 1) % 7 !== 0 ? '1px solid #1c1c1e' : 'none',
                padding: '8px 4px',
                cursor: dayNum ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {dayNum && (
                <>
                  {/* DATE NUMBER */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: isToday ? '#ff3b30' : 'transparent',
                    color: isToday ? '#fff' : '#fff',
                    fontWeight: isToday ? 'bold' : '500',
                    fontSize: '1.2rem',
                    marginBottom: '8px'
                  }}>
                    {dayNum}
                  </div>

                  {/* TASKS LIST INSIDE CELL (Apple Style) */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {dayTasks.slice(0, 3).map(task => {
                      const c = getTaskColor(task.id);
                      return (
                        <div key={task.id} 
                             onClick={(e) => { e.stopPropagation(); if(onTaskClick) onTaskClick(task); }}
                             style={{
                               display: 'flex', alignItems: 'center', gap: '4px',
                               backgroundColor: '#1c1c1e', padding: '3px 4px', borderRadius: '4px',
                               opacity: task.completed ? 0.5 : 1
                             }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#d1d1d6' }}>
                            {task.title}
                          </span>
                        </div>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <div style={{ fontSize: '0.65rem', color: '#8e8e93', textAlign: 'center' }}>+{dayTasks.length - 3} daha</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM ACTION BAR (Native iOS feel) */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333' }}>
        <button onClick={() => setCurrentDate(new Date())} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '1.1rem', cursor: 'pointer' }}>
          Bugün
        </button>
        <button style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LayoutList size={20} />
          Gelen Kutusu
        </button>
      </div>

    </div>
  );
};

export default CalendarView;
