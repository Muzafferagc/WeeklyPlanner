import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Star, Calendar, Sun, Plus, Trash2, Edit3, 
  MoreHorizontal, ListFilter, ArrowUpDown, Share2, LayoutList, Table,
  Tag, Clock, CheckSquare, RefreshCw, X, ChevronDown, ChevronRight, FileText
} from 'lucide-react';
import { 
  addCustomTask, 
  updateCustomTask, 
  deleteCustomTask, 
  toggleTaskStar, 
  toggleTaskComplete,
  deleteCustomList,
  renameCustomList
} from '../utils/storage';
import DialogModal from './DialogModal';

const TaskListView = ({ 
  currentList, 
  tasks, 
  customLists, 
  onRefreshData,
  onNavigateToList
}) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'table'
  const [sortOption, setSortOption] = useState('date'); // 'date' | 'title' | 'star' | 'dueDate'
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskStarred, setNewTaskStarred] = useState(false);
  const [newTaskInMyDay, setNewTaskInMyDay] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false, type: null });
  const [showCompleted, setShowCompleted] = useState(true);

  // Filter tasks according to selected list or smart category
  const filteredTasks = useMemo(() => {
    if (!currentList) return tasks;

    let result = [...tasks];

    if (currentList.id === 'smart_myday') {
      result = result.filter(t => t.inMyDay || t.dueDateLabel === 'Bugün');
    } else if (currentList.id === 'smart_important') {
      result = result.filter(t => t.starred);
    } else if (currentList.id === 'smart_planned') {
      result = result.filter(t => Boolean(t.dueDate || t.dueDateLabel));
    } else if (currentList.id === 'smart_all') {
      // all tasks
    } else {
      // Custom list ID match
      result = result.filter(t => t.listId === currentList.id);
    }

    // Apply Sorting
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
      // default 'date': newest first
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [tasks, currentList, sortOption]);

  const activeTasks = useMemo(() => filteredTasks.filter(t => !t.completed), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter(t => t.completed), [filteredTasks]);

  // Handle Add New Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let targetListId = 'list_programlanan';
    if (currentList && !currentList.id.startsWith('smart_')) {
      targetListId = currentList.id;
    }

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
      inMyDay: currentList?.id === 'smart_myday' || newTaskInMyDay
    });

    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskStarred(false);
    setNewTaskInMyDay(false);
    if (onRefreshData) onRefreshData();
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

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    await deleteCustomTask(taskId);
    if (selectedTask?.id === taskId) setSelectedTask(null);
    if (onRefreshData) onRefreshData();
  };

  const handleUpdateTaskDetail = async (updatedFields) => {
    if (!selectedTask) return;
    await updateCustomTask(selectedTask.id, updatedFields);
    setSelectedTask(prev => ({ ...prev, ...updatedFields }));
    if (onRefreshData) onRefreshData();
  };

  const handleRenameListPrompt = () => {
    if (!currentList || currentList.id.startsWith('smart_')) return;
    setDialog({ type: 'renameList', isOpen: true });
  };

  const handleDeleteListPrompt = () => {
    if (!currentList || currentList.id.startsWith('smart_')) return;
    setDialog({ type: 'deleteList', isOpen: true });
  };

  const handleConfirmDialogAction = async (inputValue) => {
    if (dialog.type === 'renameList' && inputValue && inputValue.trim()) {
      await renameCustomList(currentList.id, inputValue.trim());
      if (onRefreshData) onRefreshData();
    } else if (dialog.type === 'deleteList') {
      await deleteCustomList(currentList.id);
      if (onRefreshData) onRefreshData();
      if (onNavigateToList) onNavigateToList('smart_all');
    }
    setDialog({ isOpen: false, type: null });
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
            <span>{currentList?.name || 'Programlanan İşler'}</span>
            <span className="task-header-count">({filteredTasks.length})</span>
          </h1>

          {!currentList?.id.startsWith('smart_') && !currentList?.isDefault && (
            <div className="task-header-actions">
              <button 
                type="button" 
                className="icon-btn-subtle" 
                onClick={handleRenameListPrompt}
                title="Listeyi Yeniden Adlandır"
              >
                <Edit3 size={16} />
              </button>
              <button 
                type="button" 
                className="icon-btn-subtle text-danger" 
                onClick={handleDeleteListPrompt}
                title="Listeyi Sil"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="task-header-right">
          {/* VIEW MODE TOGGLE */}
          <div className="view-mode-toggle">
            <button 
              type="button"
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Liste Görünümü"
            >
              <LayoutList size={16} />
              <span>Liste</span>
            </button>
            <button 
              type="button"
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Tablo Görünümü"
            >
              <Table size={16} />
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
          <Circle size={20} className="add-task-circle-icon" />
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
              <Calendar size={16} />
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

            <button
              type="button"
              className={`add-task-tool-btn ${newTaskInMyDay ? 'active' : ''}`}
              onClick={() => setNewTaskInMyDay(!newTaskInMyDay)}
              title="Günüm'e Ekle"
            >
              <Sun size={16} />
              <span className="tool-btn-text">Günüm</span>
            </button>

            <button
              type="button"
              className={`add-task-tool-btn ${newTaskStarred ? 'active' : ''}`}
              onClick={() => setNewTaskStarred(!newTaskStarred)}
              title="Önemli İşaretle"
            >
              <Star size={16} className={newTaskStarred ? 'star-filled' : ''} />
              <span className="tool-btn-text">Önemli</span>
            </button>
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

      {/* MAIN CONTENT: LIST OR TABLE */}
      {viewMode === 'list' ? (
        <div className="tasks-list-container">
          {/* ACTIVE TASKS */}
          {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="empty-tasks-state">
              <CheckSquare size={48} className="empty-icon" />
              <h3>Bu listede henüz görev/not yok</h3>
              <p>Yukarıdaki alandan yeni bir görev veya not ekleyebilirsiniz.</p>
            </div>
          ) : (
            activeTasks.map(task => (
              <div 
                key={task.id} 
                className={`task-item-card ${task.completed ? 'completed' : ''} ${selectedTask?.id === task.id ? 'selected' : ''}`}
                onClick={() => setSelectedTask(task)}
              >
                <button 
                  type="button" 
                  className="task-check-btn"
                  onClick={(e) => handleToggleComplete(task.id, e)}
                  title="Tamamlandı İşaretle"
                >
                  <Circle size={20} className="circle-icon" />
                </button>

                <div className="task-item-body">
                  <span className="task-item-title">{task.title}</span>

                  <div className="task-item-badges">
                    {task.inMyDay && (
                      <span className="task-badge badge-myday">
                        <Sun size={12} /> Günüm
                      </span>
                    )}

                    {(task.dueDateLabel || task.dueDate) && (
                      <span className="task-badge badge-date">
                        <Calendar size={12} /> Son tarih: {task.dueDateLabel || task.dueDate}
                      </span>
                    )}

                    {task.recurring && (
                      <span className="task-badge badge-subtle" title="Tekrarlayan İş">
                        <RefreshCw size={12} />
                      </span>
                    )}

                    {currentList?.id.startsWith('smart_') && (
                      <span className="task-badge badge-list">
                        <Tag size={12} /> {getListName(task.listId)}
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
                    <Star size={18} className={task.starred ? 'star-filled' : 'star-outline'} />
                  </button>

                  <button 
                    type="button"
                    className="task-delete-btn"
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    title="Görevi Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
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

              {showCompleted && completedTasks.map(task => (
                <div 
                  key={task.id} 
                  className="task-item-card completed"
                  onClick={() => setSelectedTask(task)}
                >
                  <button 
                    type="button" 
                    className="task-check-btn checked"
                    onClick={(e) => handleToggleComplete(task.id, e)}
                    title="Tamamlanmadı İşaretle"
                  >
                    <CheckCircle2 size={20} className="check-icon" />
                  </button>

                  <div className="task-item-body">
                    <span className="task-item-title line-through">{task.title}</span>
                  </div>

                  <div className="task-item-actions">
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
                      onClick={(e) => handleDeleteTask(task.id, e)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="tasks-table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Durum</th>
                <th>Görev / Not Başlığı</th>
                <th>Kategori / Liste</th>
                <th>Son Tarih</th>
                <th style={{ width: '60px' }}>Önemli</th>
                <th style={{ width: '80px' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    Görev bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className={task.completed ? 'completed-tr' : ''}>
                    <td>
                      <button 
                        type="button"
                        className="table-check-btn"
                        onClick={(e) => handleToggleComplete(task.id, e)}
                      >
                        {task.completed ? <CheckCircle2 size={18} className="check-icon" /> : <Circle size={18} />}
                      </button>
                    </td>
                    <td onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer' }}>
                      <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
                    </td>
                    <td>
                      <span className="table-badge-list">{getListName(task.listId)}</span>
                    </td>
                    <td>
                      {task.dueDateLabel || task.dueDate ? (
                        <span className="table-badge-date">{task.dueDateLabel || task.dueDate}</span>
                      ) : '-'}
                    </td>
                    <td>
                      <button 
                        type="button"
                        className="table-star-btn"
                        onClick={(e) => handleToggleStar(task.id, e)}
                      >
                        <Star size={16} className={task.starred ? 'star-filled' : 'star-outline'} />
                      </button>
                    </td>
                    <td>
                      <button 
                        type="button"
                        className="table-delete-btn"
                        onClick={(e) => handleDeleteTask(task.id, e)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TASK DETAIL DRAWER / MODAL */}
      {selectedTask && (
        <div className="task-detail-modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="task-detail-header">
              <button 
                type="button"
                className="task-check-btn"
                onClick={(e) => handleToggleComplete(selectedTask.id, e)}
              >
                {selectedTask.completed ? <CheckCircle2 size={22} className="check-icon" /> : <Circle size={22} />}
              </button>

              <input
                type="text"
                value={selectedTask.title}
                onChange={(e) => handleUpdateTaskDetail({ title: e.target.value })}
                className="task-detail-title-input"
              />

              <button 
                type="button"
                className="task-detail-close-btn"
                onClick={() => setSelectedTask(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="task-detail-body">
              {/* MY DAY TOGGLE */}
              <button
                type="button"
                className={`task-detail-action-btn ${selectedTask.inMyDay ? 'active' : ''}`}
                onClick={() => handleUpdateTaskDetail({ inMyDay: !selectedTask.inMyDay })}
              >
                <Sun size={18} />
                <span>{selectedTask.inMyDay ? "Günüm'den Çıkar" : "Günüm'e Ekle"}</span>
              </button>

              {/* STAR TOGGLE */}
              <button
                type="button"
                className={`task-detail-action-btn ${selectedTask.starred ? 'active' : ''}`}
                onClick={() => handleUpdateTaskDetail({ starred: !selectedTask.starred })}
              >
                <Star size={18} className={selectedTask.starred ? 'star-filled' : ''} />
                <span>{selectedTask.starred ? "Önemli İşaretini Kaldır" : "Önemli İşaretle"}</span>
              </button>

              {/* DUE DATE SELECTOR */}
              <div className="task-detail-field">
                <label><Calendar size={16} /> Son Tarih</label>
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
                <label><Tag size={16} /> Ait Olduğu Liste</label>
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
                <label><FileText size={16} /> Not Ekle</label>
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
                onClick={(e) => handleDeleteTask(selectedTask.id, e)}
              >
                <Trash2 size={16} /> Görevi Sil
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

      {/* DIALOG FOR LIST RENAME/DELETE */}
      <DialogModal 
        isOpen={dialog.isOpen}
        title={dialog.type === 'renameList' ? "Listeyi Yeniden Adlandır" : "Listeyi Sil"}
        message={dialog.type === 'renameList' ? "Yeni liste ismini girin:" : `'${currentList?.name}' listesini ve içindeki tüm görevleri silmek istediğinize emin misiniz?`}
        type={dialog.type === 'renameList' ? "prompt" : "confirm"}
        defaultValue={currentList?.name}
        confirmText={dialog.type === 'renameList' ? "Kaydet" : "Evet, Sil"}
        onConfirm={handleConfirmDialogAction}
        onCancel={() => setDialog({ isOpen: false, type: null })}
      />
    </div>
  );
};

export default TaskListView;
