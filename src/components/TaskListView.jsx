import React, { useState, useMemo, useRef } from 'react';
import { 
  CheckCircle2, Circle, Star, Calendar, Sun, Plus, Trash2, Edit3, 
  MoreHorizontal, ListFilter, ArrowUpDown, Share2, LayoutList, Table,
  Tag, Clock, CheckSquare, RefreshCw, X, ChevronDown, ChevronRight, FileText, Repeat, Folder
} from 'lucide-react';
import { 
  addCustomTask, 
  updateCustomTask, 
  deleteCustomTask, 
  toggleTaskStar, 
  toggleTaskComplete,
  deleteCustomList,
  renameCustomList,
  bulkDeleteCustomTasks,
  bulkMoveCustomTasksToList,
  bulkToggleMyDay,
  DAY_KEYS,
  isTaskActiveOnDate,
  getRecurrenceLabel
} from '../utils/storage';
import DialogModal from './DialogModal';

const TaskListView = ({ 
  currentList, 
  tasks = [], 
  customLists = [], 
  onRefreshData,
  onNavigateToList
}) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'table'
  const [sortOption, setSortOption] = useState('date'); // 'date' | 'title' | 'star' | 'dueDate'
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskStarred, setNewTaskStarred] = useState(false);
  const [newTaskInMyDay, setNewTaskInMyDay] = useState(false);
  const [newTaskRepeatType, setNewTaskRepeatType] = useState('none');
  const [newTaskRepeatDays, setNewTaskRepeatDays] = useState([]);
  const [showRepeatPopover, setShowRepeatPopover] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false, type: null, payload: null });
  const [showCompleted, setShowCompleted] = useState(true);

  // Multi-Select & Long-Press State
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const pressTimerRef = useRef(null);

  const [selectedAddListId, setSelectedAddListId] = useState('');

  React.useEffect(() => {
    if (currentList && !currentList.id?.startsWith('smart_')) {
      setSelectedAddListId(currentList.id);
    } else {
      setSelectedAddListId('list_programlanan');
    }
  }, [currentList]);

  // Safe list references
  const safeListId = currentList?.id || 'smart_all';
  const safeListName = currentList?.name || 'Görevler & Notlar';

  // Filter tasks according to selected list or smart category
  const filteredTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];

    let result = [...tasks];

    if (safeListId === 'smart_myday') {
      result = result.filter(t => isTaskActiveOnDate(t, new Date()));
    } else if (safeListId === 'smart_important') {
      result = result.filter(t => t.starred);
    } else if (safeListId === 'smart_planned') {
      result = result.filter(t => Boolean(t.dueDate || t.dueDateLabel || (t.repeatType && t.repeatType !== 'none')));
    } else if (safeListId === 'smart_all') {
      // all tasks
    } else {
      result = result.filter(t => t.listId === safeListId);
    }

    return result.sort((a, b) => {
      if (sortOption === 'star') {
        return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
      } else if (sortOption === 'title') {
        return a.title.localeCompare(b.title, 'tr');
      } else if (sortOption === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [tasks, safeListId, sortOption]);

  const activeTasks = useMemo(() => filteredTasks.filter(t => !t.completed), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter(t => t.completed), [filteredTasks]);

  // Long-press and Task Card Selection Logic
  const startLongPress = (task) => {
    pressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(40);
      setIsSelectMode(true);
      setSelectedTaskIds(prev => prev.includes(task.id) ? prev : [...prev, task.id]);
    }, 450);
  };

  const cancelLongPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleTaskCardClick = (task, e) => {
    if (isSelectMode || (e && (e.ctrlKey || e.metaKey || e.shiftKey))) {
      if (!isSelectMode) setIsSelectMode(true);
      if (selectedTaskIds.includes(task.id)) {
        const next = selectedTaskIds.filter(id => id !== task.id);
        setSelectedTaskIds(next);
        if (next.length === 0) setIsSelectMode(false);
      } else {
        setSelectedTaskIds(prev => prev.includes(task.id) ? prev : [...prev, task.id]);
      }
    } else {
      setSelectedTask(task);
    }
  };

  // Add New Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let targetListId = selectedAddListId;
    if (currentList && !safeListId.startsWith('smart_')) {
      targetListId = safeListId;
    }
    if (!targetListId) targetListId = 'list_programlanan';

    let dueDateLabel = '';
    if (newTaskDueDate) {
      const d = new Date(newTaskDueDate);
      const day = d.getDate();
      const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      dueDateLabel = `${day} ${months[d.getMonth()]}`;
    }

    await addCustomTask({
      listId: targetListId,
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate,
      dueDateLabel: dueDateLabel,
      starred: newTaskStarred,
      inMyDay: safeListId === 'smart_myday' || newTaskInMyDay,
      repeatType: newTaskRepeatType,
      repeatDays: newTaskRepeatDays,
      recurring: newTaskRepeatType !== 'none'
    });

    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskStarred(false);
    setNewTaskInMyDay(false);
    setNewTaskRepeatType('none');
    setNewTaskRepeatDays([]);
    setShowRepeatPopover(false);
    if (onRefreshData) onRefreshData();
  };

  const toggleQuickRepeatDay = (dayKey) => {
    setNewTaskRepeatType('custom');
    if (newTaskRepeatDays.includes(dayKey)) {
      setNewTaskRepeatDays(newTaskRepeatDays.filter(d => d !== dayKey));
    } else {
      setNewTaskRepeatDays([...newTaskRepeatDays, dayKey]);
    }
  };

  const handleToggleComplete = async (taskId, e) => {
    e.stopPropagation();
    await toggleTaskComplete(taskId);
    if (onRefreshData) onRefreshData();
  };

  const handleToggleStar = async (taskId, e) => {
    e.stopPropagation();
    await toggleTaskStar(taskId);
    if (onRefreshData) onRefreshData();
  };

  // Single Delete Confirmation Prompt
  const onRequestDeleteTask = (task, e) => {
    if (e) e.stopPropagation();
    setDialog({
      isOpen: true,
      type: 'deleteSingleTask',
      payload: { taskId: task.id, title: task.title }
    });
  };

  // Bulk Delete Confirmation Prompt
  const onRequestBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    setDialog({
      isOpen: true,
      type: 'deleteBulkTasks',
      payload: { count: selectedTaskIds.length }
    });
  };

  // Execute Bulk Operations
  const handleBulkMove = async (targetListId) => {
    await bulkMoveCustomTasksToList(selectedTaskIds, targetListId);
    setSelectedTaskIds([]);
    setIsSelectMode(false);
    setShowMoveModal(false);
    if (onRefreshData) onRefreshData();
  };

  const handleBulkAddMyDay = async () => {
    await bulkToggleMyDay(selectedTaskIds, true);
    setSelectedTaskIds([]);
    setIsSelectMode(false);
    if (onRefreshData) onRefreshData();
  };

  const handleUpdateTaskDetail = async (updatedFields) => {
    if (!selectedTask) return;
    await updateCustomTask(selectedTask.id, updatedFields);
    setSelectedTask(prev => ({ ...prev, ...updatedFields }));
    if (onRefreshData) onRefreshData();
  };

  const toggleDetailRepeatDay = (dayKey) => {
    if (!selectedTask) return;
    const currentDays = Array.isArray(selectedTask.repeatDays) ? selectedTask.repeatDays : [];
    let updatedDays = [];
    if (currentDays.includes(dayKey)) {
      updatedDays = currentDays.filter(d => d !== dayKey);
    } else {
      updatedDays = [...currentDays, dayKey];
    }
    handleUpdateTaskDetail({
      repeatType: 'custom',
      repeatDays: updatedDays,
      recurring: true
    });
  };

  const handleRenameListPrompt = () => {
    if (!currentList || !currentList.id || currentList.id.startsWith('smart_')) return;
    setDialog({ type: 'renameList', isOpen: true, payload: null });
  };

  const handleDeleteListPrompt = () => {
    if (!currentList || !currentList.id || currentList.id.startsWith('smart_')) return;
    setDialog({ type: 'deleteList', isOpen: true, payload: null });
  };

  const handleConfirmDialogAction = async (inputValue) => {
    if (dialog.type === 'deleteSingleTask') {
      await deleteCustomTask(dialog.payload.taskId);
      if (selectedTask?.id === dialog.payload.taskId) setSelectedTask(null);
      if (onRefreshData) onRefreshData();
    } else if (dialog.type === 'deleteBulkTasks') {
      await bulkDeleteCustomTasks(selectedTaskIds);
      setSelectedTaskIds([]);
      setIsSelectMode(false);
      if (onRefreshData) onRefreshData();
    } else if (dialog.type === 'renameList' && inputValue && inputValue.trim()) {
      await renameCustomList(currentList.id, inputValue.trim());
      if (onRefreshData) onRefreshData();
    } else if (dialog.type === 'deleteList') {
      await deleteCustomList(currentList.id);
      if (onRefreshData) onRefreshData();
      if (onNavigateToList) onNavigateToList('smart_all');
    }
    setDialog({ isOpen: false, type: null, payload: null });
  };

  const getDialogProps = () => {
    if (dialog.type === 'deleteSingleTask') {
      return {
        title: "Görevi Sil",
        message: `'${dialog.payload?.title}' görevi silinecektir. Emin misiniz?`,
        confirmText: "Evet, Sil"
      };
    } else if (dialog.type === 'deleteBulkTasks') {
      return {
        title: "Seçilen Görevleri Sil",
        message: `${dialog.payload?.count} adet görev silinecektir. Emin misiniz?`,
        confirmText: "Evet, Sil"
      };
    } else if (dialog.type === 'renameList') {
      return {
        title: "Listeyi Yeniden Adlandır",
        message: "Yeni liste adını girin:",
        type: "prompt",
        defaultValue: safeListName,
        confirmText: "Kaydet"
      };
    } else if (dialog.type === 'deleteList') {
      return {
        title: "Listeyi Sil",
        message: `'${safeListName}' listesini ve içindeki tüm görevleri silmek istediğinize emin misiniz?`,
        confirmText: "Evet, Sil"
      };
    }
    return {};
  };

  // Helper to map list ID to name
  const getListName = (listId) => {
    const found = customLists.find(l => l.id === listId);
    return found ? found.name : 'Genel';
  };

  return (
    <div className="task-list-view-container">
      {/* HEADER TOOLBAR */}
      <div className="task-header-toolbar">
        <div className="task-header-left">
          <h1 className="task-header-title">
            <span>{safeListName}</span>
            <span className="task-header-count">({filteredTasks.length})</span>
          </h1>

          {!safeListId.startsWith('smart_') && !currentList?.isDefault && (
            <div className="task-header-actions">
              <button 
                type="button" 
                className="icon-btn-subtle" 
                onClick={handleRenameListPrompt}
                title="Listeyi Yeniden Adlandır"
              >
                <Edit3 size={18} />
              </button>
              <button 
                type="button" 
                className="icon-btn-subtle text-danger" 
                onClick={handleDeleteListPrompt}
                title="Listeyi Sil"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="task-header-right">
          {/* LIVE REFRESH BUTTON */}
          <button 
            type="button" 
            className="icon-btn-subtle live-refresh-btn" 
            onClick={() => { if (onRefreshData) onRefreshData(); }}
            title="Buluttan Verileri Anında Yenile"
          >
            <RefreshCw size={18} />
            <span className="btn-text-responsive">Yenile</span>
          </button>

          {/* VIEW MODE TOGGLE */}
          <div className="view-mode-toggle">
            <button 
              type="button"
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Liste Görünümü"
            >
              <LayoutList size={18} />
              <span>Liste</span>
            </button>
            <button 
              type="button"
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Tablo Görünümü"
            >
              <Table size={18} />
              <span>Tablo</span>
            </button>
          </div>

          {/* SORT CONTROLS */}
          <div className="sort-dropdown-container">
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              className="task-sort-select"
            >
              <option value="date">Sırala: Eklenme Tarihi</option>
              <option value="dueDate">Sırala: Son Tarih</option>
              <option value="star">Sırala: Önem Derecesi</option>
              <option value="title">Sırala: Alfabetik</option>
            </select>
          </div>
        </div>
      </div>

      {/* QUICK ADD TASK CARD */}
      <form onSubmit={handleAddTask} className="add-task-card">
        <div className="add-task-input-row">
          <Circle size={22} className="add-task-circle-icon" />
          <input
            type="text"
            placeholder="Görev veya Not ekle..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="add-task-input"
          />
        </div>

        <div className="add-task-options-row">
          <div className="add-task-tools">
            <label className="add-task-tool-btn" title="Son Tarih Ekle">
              <Calendar size={18} />
              <input 
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="hidden-date-input"
              />
              <span className="tool-btn-text">
                {newTaskDueDate ? newTaskDueDate : 'Tarih'}
              </span>
            </label>

            {/* TARGET LIST SELECTOR */}
            <div className="add-task-tool-btn list-select-tool-btn" title="Eklenecek Hedef Liste">
              <Tag size={18} />
              <select
                value={selectedAddListId || (safeListId.startsWith('smart_') ? 'list_programlanan' : safeListId)}
                onChange={(e) => setSelectedAddListId(e.target.value)}
                className="add-task-list-dropdown"
              >
                {customLists.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className={`add-task-tool-btn ${newTaskInMyDay ? 'active' : ''}`}
              onClick={() => setNewTaskInMyDay(!newTaskInMyDay)}
              title="Günüm'e Ekle"
            >
              <Sun size={18} />
              <span>Günüm</span>
            </button>

            {/* REPEAT OPTIONS POPOVER */}
            <div className="repeat-popover-wrapper">
              <button
                type="button"
                className={`add-task-tool-btn ${newTaskRepeatType !== 'none' ? 'active' : ''}`}
                onClick={() => setShowRepeatPopover(!showRepeatPopover)}
                title="Tekrar Etme Mantığı"
              >
                <Repeat size={18} />
                <span>Tekrar Et</span>
              </button>

              {showRepeatPopover && (
                <div className="repeat-popover-menu">
                  <div className="popover-title">Tekrarlama Seçeneği</div>
                  <button 
                    type="button" 
                    className={`popover-option ${newTaskRepeatType === 'none' ? 'selected' : ''}`}
                    onClick={() => { setNewTaskRepeatType('none'); setNewTaskRepeatDays([]); setShowRepeatPopover(false); }}
                  >
                    Tekrarlama Yok
                  </button>
                  <button 
                    type="button" 
                    className={`popover-option ${newTaskRepeatType === 'daily' ? 'selected' : ''}`}
                    onClick={() => { setNewTaskRepeatType('daily'); setNewTaskRepeatDays([]); setShowRepeatPopover(false); }}
                  >
                    Her Gün
                  </button>
                  <button 
                    type="button" 
                    className={`popover-option ${newTaskRepeatType === 'weekdays' ? 'selected' : ''}`}
                    onClick={() => { setNewTaskRepeatType('weekdays'); setNewTaskRepeatDays([]); setShowRepeatPopover(false); }}
                  >
                    Hafta İçi (Pzt-Cum)
                  </button>
                  <button 
                    type="button" 
                    className={`popover-option ${newTaskRepeatType === 'weekly' ? 'selected' : ''}`}
                    onClick={() => { setNewTaskRepeatType('weekly'); setNewTaskRepeatDays([]); setShowRepeatPopover(false); }}
                  >
                    Haftalık
                  </button>

                  <div className="popover-subtitle">Özel Gün(ler) Seç:</div>
                  <div className="days-chip-group">
                    {DAY_KEYS.map(dayKey => (
                      <button
                        key={dayKey}
                        type="button"
                        className={`day-chip ${newTaskRepeatDays.includes(dayKey) ? 'active' : ''}`}
                        onClick={() => toggleQuickRepeatDay(dayKey)}
                      >
                        {dayKey}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="add-task-submit-btn"
            disabled={!newTaskTitle.trim()}
          >
            Ekle
          </button>
        </div>
      </form>

      {/* TASKS LIST OR TABLE VIEW */}
      {viewMode === 'list' ? (
        <div className="tasks-list-container">
          {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="empty-tasks-state">
              <CheckSquare size={52} className="empty-icon" />
              <h3>Bu listede henüz görev/not yok</h3>
              <p>Yukarıdaki alandan yeni bir görev veya not ekleyebilirsiniz.</p>
            </div>
          ) : (
            activeTasks.map(task => {
              const isSelected = selectedTaskIds.includes(task.id);

              return (
                <div 
                  key={task.id} 
                  className={`task-item-card ${task.completed ? 'completed' : ''} ${selectedTask?.id === task.id ? 'selected' : ''} ${isSelected ? 'bulk-selected' : ''}`}
                  onClick={(e) => handleTaskCardClick(task, e)}
                  onTouchStart={() => startLongPress(task)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onMouseDown={() => startLongPress(task)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                >
                  {isSelectMode ? (
                    <div className={`bulk-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected ? <CheckCircle2 size={22} className="text-primary" /> : <Circle size={22} className="text-muted" />}
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      className="task-check-btn"
                      onClick={(e) => handleToggleComplete(task.id, e)}
                      title="Tamamlandı İşaretle"
                    >
                      <Circle size={22} className="circle-icon" />
                    </button>
                  )}

                  <div className="task-item-body">
                    <span className="task-item-title">{task.title}</span>

                    <div className="task-item-badges">
                      {task.inMyDay && (
                        <span className="task-badge badge-myday">
                          <Sun size={13} /> Günüm
                        </span>
                      )}

                      {(task.dueDateLabel || task.dueDate) && (
                        <span className="task-badge badge-date">
                          <Calendar size={13} /> Son tarih: {task.dueDateLabel || task.dueDate}
                        </span>
                      )}

                      {(task.repeatType && task.repeatType !== 'none') ? (
                        <span className="task-badge badge-repeat" title="Tekrar Etme Mantığı">
                          <RefreshCw size={13} /> {getRecurrenceLabel(task)}
                        </span>
                      ) : task.recurring && (
                        <span className="task-badge badge-subtle" title="Tekrarlayan İş">
                          <RefreshCw size={13} /> Tekrarlayan
                        </span>
                      )}

                      {safeListId.startsWith('smart_') && (
                        <span className="task-badge badge-list">
                          <Tag size={13} /> {getListName(task.listId)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="task-item-actions">
                    <button 
                      type="button" 
                      className="task-star-btn"
                      onClick={(e) => handleToggleStar(task.id, e)}
                      title={task.starred ? "Önemli İşaretini Kaldır" : "Önemli İşaretle"}
                    >
                      <Star size={20} className={task.starred ? 'star-filled' : 'star-outline'} />
                    </button>

                    <button 
                      type="button"
                      className="task-delete-btn"
                      onClick={(e) => onRequestDeleteTask(task, e)}
                      title="Görevi Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* COMPLETED TASKS ACCORDION */}
          {completedTasks.length > 0 && (
            <div className="completed-tasks-section">
              <button 
                type="button" 
                className="completed-tasks-toggle"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span>Tamamlananlar ({completedTasks.length})</span>
              </button>

              {showCompleted && completedTasks.map(task => {
                const isSelected = selectedTaskIds.includes(task.id);
                return (
                  <div 
                    key={task.id} 
                    className={`task-item-card completed ${selectedTask?.id === task.id ? 'selected' : ''} ${isSelected ? 'bulk-selected' : ''}`}
                    onClick={(e) => handleTaskCardClick(task, e)}
                    onTouchStart={() => startLongPress(task)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onMouseDown={() => startLongPress(task)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                  >
                    {isSelectMode ? (
                      <div className={`bulk-checkbox ${isSelected ? 'checked' : ''}`}>
                        {isSelected ? <CheckCircle2 size={22} className="text-primary" /> : <Circle size={22} className="text-muted" />}
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        className="task-check-btn checked"
                        onClick={(e) => handleToggleComplete(task.id, e)}
                        title="Tamamlanmadı Olarak İşaretle"
                      >
                        <CheckCircle2 size={22} />
                      </button>
                    )}

                    <div className="task-item-body">
                      <span className="task-item-title line-through">{task.title}</span>
                    </div>

                    <div className="task-item-actions">
                      <button 
                        type="button"
                        className="task-delete-btn"
                        onClick={(e) => onRequestDeleteTask(task, e)}
                        title="Görevi Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW MODE */
        <div className="tasks-table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Görev / Not</th>
                <th>Ait Olduğu Liste</th>
                <th>Son Tarih</th>
                <th>Tekrar</th>
                <th style={{ width: '80px' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr 
                  key={task.id}
                  className={task.completed ? 'completed-tr' : ''}
                  onClick={() => setSelectedTask(task)}
                  style={{ cursor: 'pointer' }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <button 
                      type="button" 
                      className={`task-check-btn ${task.completed ? 'checked' : ''}`}
                      onClick={(e) => handleToggleComplete(task.id, e)}
                    >
                      {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                  </td>
                  <td>
                    <span className={`task-table-title ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </span>
                  </td>
                  <td>
                    <span className="task-badge badge-list">
                      {getListName(task.listId)}
                    </span>
                  </td>
                  <td>{task.dueDateLabel || task.dueDate || '-'}</td>
                  <td>{getRecurrenceLabel(task) || '-'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        type="button" 
                        className="task-star-btn"
                        onClick={(e) => handleToggleStar(task.id, e)}
                      >
                        <Star size={18} className={task.starred ? 'star-filled' : 'star-outline'} />
                      </button>
                      <button 
                        type="button"
                        className="task-delete-btn"
                        onClick={(e) => onRequestDeleteTask(task, e)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FLOATING BULK ACTION TOOLBAR */}
      {isSelectMode && selectedTaskIds.length > 0 && (
        <div className="bulk-action-bar no-print">
          <div className="bulk-info">
            <strong>{selectedTaskIds.length}</strong> Görev Seçildi
          </div>
          <div className="bulk-buttons">
            <button type="button" className="bulk-btn" onClick={handleBulkAddMyDay} title="Günüm'e Ekle">
              <Sun size={16} /> <span>Günüm</span>
            </button>
            <button type="button" className="bulk-btn" onClick={() => setShowMoveModal(true)} title="Başka Listeye Taşı">
              <Folder size={16} /> <span>Taşı</span>
            </button>
            <button type="button" className="bulk-btn bulk-btn-danger" onClick={onRequestBulkDelete} title="Seçilenleri Sil">
              <Trash2 size={16} /> <span>Sil</span>
            </button>
            <button type="button" className="bulk-btn bulk-btn-cancel" onClick={() => { setSelectedTaskIds([]); setIsSelectMode(false); }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* BULK MOVE TO LIST MODAL */}
      {showMoveModal && (
        <div className="task-detail-modal-overlay" onClick={() => setShowMoveModal(false)}>
          <div className="move-list-modal-card" onClick={e => e.stopPropagation()}>
            <h3>Seçilen Görevleri Başka Listeye Taşı</h3>
            <p>{selectedTaskIds.length} adet görevin aktarılacağı hedef listeyi seçin:</p>
            <div className="move-lists-options">
              {customLists.map(l => (
                <button
                  key={l.id}
                  type="button"
                  className="move-list-option-btn"
                  onClick={() => handleBulkMove(l.id)}
                >
                  <Tag size={16} />
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
            <button type="button" className="move-modal-cancel-btn" onClick={() => setShowMoveModal(false)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* TASK DETAIL DRAWER */}
      {selectedTask && (
        <div className="task-detail-modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="task-detail-header">
              <button 
                type="button" 
                className="task-check-btn"
                onClick={(e) => handleToggleComplete(selectedTask.id, e)}
              >
                {selectedTask.completed ? <CheckCircle2 size={24} className="text-success" /> : <Circle size={24} />}
              </button>
              <input
                type="text"
                value={selectedTask.title}
                onChange={(e) => handleUpdateTaskDetail({ title: e.target.value })}
                className="task-detail-title-input"
              />
              <button 
                type="button" 
                className="task-star-btn"
                onClick={(e) => handleToggleStar(selectedTask.id, e)}
              >
                <Star size={24} className={selectedTask.starred ? 'star-filled' : 'star-outline'} />
              </button>
              <button 
                type="button" 
                className="task-detail-close-btn"
                onClick={() => setSelectedTask(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="task-detail-body">
              <button
                type="button"
                className={`task-detail-action-btn ${selectedTask.inMyDay ? 'active' : ''}`}
                onClick={() => handleUpdateTaskDetail({ inMyDay: !selectedTask.inMyDay })}
              >
                <Sun size={18} />
                <span>{selectedTask.inMyDay ? 'Günüm\'den Çıkar' : 'Günüm\'e Ekle'}</span>
              </button>

              {/* RECURRENCE OPTIONS IN DETAIL DRAWER */}
              <div className="task-detail-field">
                <label><Repeat size={18} /> Tekrar Etme Mantığı</label>
                <select
                  value={selectedTask.repeatType || 'none'}
                  onChange={(e) => handleUpdateTaskDetail({ 
                    repeatType: e.target.value,
                    recurring: e.target.value !== 'none'
                  })}
                  className="task-detail-select"
                >
                  <option value="none">Tekrarlama Yok</option>
                  <option value="daily">Her Gün</option>
                  <option value="weekdays">Hafta İçi (Pzt-Cum)</option>
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                  <option value="custom">Özel Gün(ler)</option>
                </select>
              </div>

              {selectedTask.repeatType === 'custom' && (
                <div className="task-detail-field">
                  <label>Özel Günler:</label>
                  <div className="days-chip-group">
                    {DAY_KEYS.map(dayKey => {
                      const active = Array.isArray(selectedTask.repeatDays) && selectedTask.repeatDays.includes(dayKey);
                      return (
                        <button
                          key={dayKey}
                          type="button"
                          className={`day-chip ${active ? 'active' : ''}`}
                          onClick={() => toggleDetailRepeatDay(dayKey)}
                        >
                          {dayKey}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DUE DATE SELECTOR */}
              <div className="task-detail-field">
                <label><Calendar size={18} /> Son Tarih</label>
                <input 
                  type="date"
                  value={selectedTask.dueDate || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    let label = val;
                    if (val) {
                      const d = new Date(val);
                      const day = d.getDate();
                      const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                      label = `${day} ${months[d.getMonth()]}`;
                    }
                    handleUpdateTaskDetail({ dueDate: val, dueDateLabel: label });
                  }}
                  className="task-detail-input"
                />
              </div>

              {/* LIST CATEGORY ASSIGNMENT */}
              <div className="task-detail-field">
                <label><Tag size={18} /> Ait Olduğu Liste</label>
                <select
                  value={selectedTask.listId}
                  onChange={(e) => handleUpdateTaskDetail({ listId: e.target.value })}
                  className="task-detail-select"
                >
                  {customLists.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* NOTE TEXT AREA */}
              <div className="task-detail-field">
                <label><FileText size={18} /> Not Ekle</label>
                <textarea
                  placeholder="Bu görevle ilgili notlar, bağlantılar veya detaylar..."
                  value={selectedTask.note || ''}
                  onChange={(e) => handleUpdateTaskDetail({ note: e.target.value })}
                  className="task-detail-textarea"
                  rows={4}
                />
              </div>
            </div>

            <div className="task-detail-footer">
              <button 
                type="button" 
                className="task-detail-delete-btn"
                onClick={(e) => onRequestDeleteTask(selectedTask, e)}
              >
                <Trash2 size={18} /> Görevi Sil
              </button>
              <button 
                type="button"
                className="task-detail-save-btn"
                onClick={() => setSelectedTask(null)}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      <DialogModal 
        isOpen={dialog.isOpen}
        {...getDialogProps()}
        onConfirm={handleConfirmDialogAction}
        onCancel={() => setDialog({ isOpen: false, type: null, payload: null })}
      />
    </div>
  );
};

export default TaskListView;
