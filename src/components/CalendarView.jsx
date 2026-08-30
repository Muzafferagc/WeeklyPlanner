import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, LayoutList, X, Check } from 'lucide-react';

const CalendarView = ({ tasks, onAddTask, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addingTaskForDate, setAddingTaskForDate] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef(null);

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
  const dayNames = ["P", "S", "Ç", "P", "C", "C", "P"]; 

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

  const pad = n => n < 10 ? '0' + n : n;

  const getTasksForDate = (dayNum) => {
    if (!dayNum) return [];
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dayNum)}`;
    return tasks.filter(t => {
      if (t.dueDate === dateStr) return true;
      if (t.dueDateLabel && t.dueDateLabel.startsWith(dayNum.toString() + ' ' + monthNames[currentMonth])) return true;
      return false;
    });
  };

  const handleDayClick = (dayNum) => {
    if (!dayNum) return;
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dayNum)}`;
    setAddingTaskForDate(dateStr);
    setNewTaskTitle('');
  };

  useEffect(() => {
    if (addingTaskForDate && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingTaskForDate]);

  const handleTaskSubmit = () => {
    if (newTaskTitle.trim() && onAddTask) {
      onAddTask(addingTaskForDate, newTaskTitle.trim());
    }
    setAddingTaskForDate(null);
    setNewTaskTitle('');
  };

  const colors = ['var(--primary)', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const getTaskColor = (id) => {
    let sum = 0;
    for(let i=0; i<id.length; i++) sum += id.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="apple-calendar-container" style={{ 
      backgroundColor: 'var(--bg-main)', 
      color: 'var(--text-main)', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}>
          <ChevronLeft size={24} /> <span style={{ marginLeft: '4px' }}>{currentYear}</span>
        </button>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }} onClick={nextMonth}><ChevronRight size={24} /></button>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: '10px 0 20px 0' }}>{monthNames[currentMonth]}</h1>
      </div>

      {/* DAYS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        {dayNames.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
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
                borderBottom: '1px solid var(--border-color)', 
                borderRight: (index + 1) % 7 !== 0 ? '1px solid var(--border-color)' : 'none',
                padding: '8px 4px',
                cursor: dayNum ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'var(--bg-main)'
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
                    backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                    color: isToday ? '#fff' : 'var(--text-main)',
                    fontWeight: isToday ? 'bold' : '500',
                    fontSize: '1.2rem',
                    marginBottom: '8px'
                  }}>
                    {dayNum}
                  </div>

                  {/* TASKS LIST INSIDE CELL */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {dayTasks.slice(0, 3).map(task => {
                      const c = getTaskColor(task.id);
                      return (
                        <div key={task.id} 
                             onClick={(e) => { e.stopPropagation(); if(onTaskClick) onTaskClick(task); }}
                             style={{
                               display: 'flex', alignItems: 'center', gap: '4px',
                               backgroundColor: 'var(--bg-panel)', padding: '3px 4px', borderRadius: '4px',
                               opacity: task.completed ? 0.5 : 1
                             }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                            {task.title}
                          </span>
                        </div>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center' }}>+{dayTasks.length - 3} daha</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)' }}>
        <button onClick={() => setCurrentDate(new Date())} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '1.1rem', cursor: 'pointer' }}>
          Bugün
        </button>
      </div>

      {/* ADD TASK MODAL OVERLAY */}
      {addingTaskForDate && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAddingTaskForDate(null)}>
          <div style={{ backgroundColor: 'var(--bg-panel)', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{addingTaskForDate} İçin Görev Ekle</span>
              <button onClick={() => setAddingTaskForDate(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20}/></button>
            </h3>
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Görev adı..." 
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => { if(e.key === 'Enter') handleTaskSubmit(); }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', marginBottom: '16px', fontSize: '1rem', outline: 'none' }}
            />
            <button onClick={handleTaskSubmit} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Check size={20} /> Kaydet
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CalendarView;
