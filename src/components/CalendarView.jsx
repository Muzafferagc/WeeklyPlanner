import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Check, Calendar as CalendarIcon } from 'lucide-react';

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

  const handleMonthChange = (e) => setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1));
  const handleYearChange = (e) => setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1));

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

  const isTaskOnDate = (task, dateObj) => {
    const taskDateStr = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
    
    if (task.dueDate === taskDateStr) return true;
    
    // Check if it's a repeating task
    if (task.repeatType && task.repeatType !== 'none') {
      const createdDate = new Date(task.createdAt || task.dueDate || Date.now());
      createdDate.setHours(0,0,0,0);
      const targetDate = new Date(dateObj);
      targetDate.setHours(0,0,0,0);
      
      // Task hasn't been created yet
      if (targetDate < createdDate) return false;
      
      // If it has a dueDate, it acts as the END date of the repeat
      if (task.dueDate) {
         const end = new Date(task.dueDate);
         end.setHours(0,0,0,0);
         if (targetDate > end) return false;
      }
      
      const dayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday...
      
      if (task.repeatType === 'daily') return true;
      if (task.repeatType === 'weekdays' && dayOfWeek >= 1 && dayOfWeek <= 5) return true;
      if (task.repeatType === 'weekend' && (dayOfWeek === 0 || dayOfWeek === 6)) return true;
      if (task.repeatType === 'weekly' && targetDate.getDay() === createdDate.getDay()) return true;
      
      if (task.repeatType === 'custom' && task.repeatDays && task.repeatDays.length > 0) {
        const dayNamesMap = { 0: 'Pazar', 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi' };
        const currentDayName = dayNamesMap[dayOfWeek];
        if (task.repeatDays.includes(currentDayName)) return true;
      }
    }
    
    return false;
  };

  const getTasksForDate = (dayNum) => {
    if (!dayNum) return [];
    const targetDate = new Date(currentYear, currentMonth, dayNum);
    return tasks.filter(t => isTaskOnDate(t, targetDate));
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

  const generateYearOptions = () => {
    const years = [];
    for(let y = 2020; y <= 2040; y++) years.push(y);
    return years;
  };

  return (
    <div className="apple-calendar-container" style={{ 
      backgroundColor: 'var(--bg-color)', 
      color: 'var(--text-main)', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={24} color="var(--primary)" />
          
          <select value={currentMonth} onChange={handleMonthChange} style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
            {monthNames.map((m, i) => <option key={i} value={i} style={{color: 'var(--text-main)', backgroundColor: 'var(--bg-color)'}}>{m}</option>)}
          </select>
          
          <select value={currentYear} onChange={handleYearChange} style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
            {generateYearOptions().map(y => <option key={y} value={y} style={{color: 'var(--text-main)', backgroundColor: 'var(--bg-color)'}}>{y}</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }} onClick={prevMonth}><ChevronLeft size={24} /></button>
          <button onClick={() => setCurrentDate(new Date())} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '1rem', cursor: 'pointer', fontWeight: '600' }}>
            Bugün
          </button>
          <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }} onClick={nextMonth}><ChevronRight size={24} /></button>
        </div>
      </div>

      {/* DAYS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        {dayNames.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
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
                backgroundColor: 'var(--bg-color)',
                transition: 'background-color 0.2s',
                minHeight: '100px'
              }}
              onMouseOver={e => { if(dayNum) e.currentTarget.style.backgroundColor = 'var(--c-gray-bg)' }}
              onMouseOut={e => { if(dayNum) e.currentTarget.style.backgroundColor = 'var(--bg-color)' }}
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
                    {dayTasks.slice(0, 4).map(task => {
                      const c = getTaskColor(task.id);
                      return (
                        <div key={task.id} 
                             onClick={(e) => { e.stopPropagation(); if(onTaskClick) onTaskClick(task); }}
                             style={{
                               display: 'flex', alignItems: 'center', gap: '4px',
                               backgroundColor: 'var(--c-gray-bg)', padding: '3px 4px', borderRadius: '4px',
                               opacity: task.completed ? 0.5 : 1
                             }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                            {task.title}
                          </span>
                        </div>
                      )
                    })}
                    {dayTasks.length > 4 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>+{dayTasks.length - 4} daha</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD TASK MODAL OVERLAY */}
      {addingTaskForDate && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAddingTaskForDate(null)}>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{addingTaskForDate} İçin Görev Ekle</span>
              <button onClick={() => setAddingTaskForDate(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
            </h3>
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Görev adı..." 
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => { if(e.key === 'Enter') handleTaskSubmit(); }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--c-gray-bg)', color: 'var(--text-main)', marginBottom: '16px', fontSize: '1rem', outline: 'none' }}
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
