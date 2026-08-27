import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Circle, 
  Search, 
  BookOpen, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Square, 
  FileText,
  Copy,
  X,
  RotateCcw,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { 
  getCourseDetailsData, 
  saveCourseDetailsData, 
  generateId, 
  getScheduleForWeek, 
  saveScheduleForWeek 
} from '../utils/storage';
import confetti from 'canvas-confetti';

const STATUS_CONFIG = {
  pending: { label: 'Bekliyor', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: Clock },
  in_progress: { label: 'Devam Ediyor', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Circle },
  completed: { label: 'Tamamlandı', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: CheckCircle2 }
};

// Helper: Format YYYY-MM-DD to Turkish Date string (e.g. 15 Mart 2026)
const formatTurkishDate = (dateStr) => {
  if (!dateStr) return '';
  // If it's already formatted text like "1. Hafta", return as is
  if (!dateStr.includes('-') || dateStr.length < 8) return dateStr;

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

export default function CourseDetailsView({ weeks, currentWeekId, onDataChange, refreshTrigger }) {
  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Quick Add State (Super Simple Inline Creation)
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDate, setQuickDate] = useState('');

  // Modals
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isAssignWeekModalOpen, setIsAssignWeekModalOpen] = useState(false);

  // Quick Course Name Form
  const [newCourseTitle, setNewCourseTitle] = useState('');

  // Editing state
  const [editingTopic, setEditingTopic] = useState(null);
  const [selectedTopicForAssign, setSelectedTopicForAssign] = useState(null);

  // Form state for detailed modal
  const [topicForm, setTopicForm] = useState({
    title: '',
    status: 'pending',
    targetDate: '',
    notes: '',
    checklist: []
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [assignForm, setAssignForm] = useState({ weekId: '', day: 'Pazartesi' });

  useEffect(() => {
    loadCoursesData();
  }, [refreshTrigger]);

  const loadCoursesData = async () => {
    const data = await getCourseDetailsData();
    setCourses(data);
    if (data.length > 0 && !activeCourseId) {
      setActiveCourseId(data[0].id);
    }
    setLoading(false);
  };

  const handleSaveCourses = async (newCourses) => {
    setCourses(newCourses);
    await saveCourseDetailsData(newCourses);
    if (onDataChange) onDataChange();
  };

  // Quick Inline Add Topic (Çok Basit Konu Ekleme)
  const handleQuickAddTopic = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !activeCourseId) return;

    const formattedTarget = quickDate ? formatTurkishDate(quickDate) : '';

    const newTopic = {
      id: generateId(),
      title: quickTitle.trim(),
      status: 'pending',
      targetWeekName: formattedTarget,
      notes: '',
      checklist: [],
      updatedAt: new Date().toISOString()
    };

    const updatedCourses = courses.map(c => {
      if (c.id === activeCourseId) {
        return { ...c, topics: [...c.topics, newTopic] };
      }
      return c;
    });

    await handleSaveCourses(updatedCourses);
    setQuickTitle('');
    setQuickDate('');
  };

  // Quick Add Course (Çok Basit Ders Ekleme)
  const handleCreateSimpleCourse = async (e) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];
    const randomColor = colors[courses.length % colors.length];

    const newCourse = {
      id: generateId(),
      title: newCourseTitle.trim(),
      description: 'Ders ve müfredat yol haritam',
      color: randomColor,
      topics: []
    };

    const updated = [...courses, newCourse];
    await handleSaveCourses(updated);
    setActiveCourseId(newCourse.id);
    setNewCourseTitle('');
    setIsAddCourseModalOpen(false);
  };

  // Delete Course Category
  const handleDeleteCourse = async (courseId, e = null) => {
    if (e) e.stopPropagation();
    const courseToDelete = courses.find(c => c.id === courseId);
    if (!courseToDelete) return;

    if (!window.confirm(`"${courseToDelete.title}" dersini silmek istediğinize emin misiniz?`)) return;

    const updated = courses.filter(c => c.id !== courseId);
    if (updated.length === 0) {
      const defaultEmpty = {
        id: generateId(),
        title: 'Yeni Dersim',
        description: 'Ders ve müfredat yol haritam',
        color: '#8b5cf6',
        topics: []
      };
      await handleSaveCourses([defaultEmpty]);
      setActiveCourseId(defaultEmpty.id);
    } else {
      await handleSaveCourses(updated);
      if (activeCourseId === courseId) {
        setActiveCourseId(updated[0].id);
      }
    }
  };

  // Wipe All Topics
  const handleWipeCurrentCourseTopics = async () => {
    if (!window.confirm("Bu dersteki tüm konuları silmek istediğinize emin misiniz?")) return;
    const updated = courses.map(c => c.id === activeCourseId ? { ...c, topics: [] } : c);
    await handleSaveCourses(updated);
  };

  // Add / Edit Topic Modal
  const openTopicModal = (topic = null) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        title: topic.title,
        status: topic.status || 'pending',
        targetDate: topic.targetWeekName || '',
        notes: topic.notes || '',
        checklist: topic.checklist ? [...topic.checklist] : []
      });
    } else {
      setEditingTopic(null);
      setTopicForm({
        title: '',
        status: 'pending',
        targetDate: '',
        notes: '',
        checklist: []
      });
    }
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.title.trim()) return;

    const formattedTarget = formatTurkishDate(topicForm.targetDate);

    const updatedCourses = courses.map(course => {
      if (course.id === activeCourseId) {
        let updatedTopics;
        if (editingTopic) {
          updatedTopics = course.topics.map(t => t.id === editingTopic.id ? {
            ...t,
            title: topicForm.title,
            status: topicForm.status,
            targetWeekName: formattedTarget,
            notes: topicForm.notes,
            checklist: topicForm.checklist,
            updatedAt: new Date().toISOString()
          } : t);
        } else {
          const newTopic = {
            id: generateId(),
            title: topicForm.title,
            status: topicForm.status,
            targetWeekName: formattedTarget,
            notes: topicForm.notes,
            checklist: topicForm.checklist,
            updatedAt: new Date().toISOString()
          };
          updatedTopics = [...course.topics, newTopic];
        }
        return { ...course, topics: updatedTopics };
      }
      return course;
    });

    if (topicForm.status === 'completed' && (!editingTopic || editingTopic.status !== 'completed')) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    await handleSaveCourses(updatedCourses);
    setIsTopicModalOpen(false);
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm("Bu konuyu silmek istediğinize emin misiniz?")) return;
    const updatedCourses = courses.map(c => {
      if (c.id === activeCourseId) {
        return { ...c, topics: c.topics.filter(t => t.id !== topicId) };
      }
      return c;
    });
    await handleSaveCourses(updatedCourses);
  };

  const handleToggleTopicStatus = async (topic) => {
    const nextStatus = topic.status === 'completed' ? 'pending' : (topic.status === 'pending' ? 'in_progress' : 'completed');
    const updatedCourses = courses.map(c => {
      if (c.id === activeCourseId) {
        return {
          ...c,
          topics: c.topics.map(t => t.id === topic.id ? { ...t, status: nextStatus, updatedAt: new Date().toISOString() } : t)
        };
      }
      return c;
    });

    if (nextStatus === 'completed') {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
    await handleSaveCourses(updatedCourses);
  };

  // Direct toggle checklist item on card
  const handleToggleChecklistOnCard = async (topicId, itemId) => {
    const updatedCourses = courses.map(c => {
      if (c.id === activeCourseId) {
        return {
          ...c,
          topics: c.topics.map(t => {
            if (t.id === topicId && t.checklist) {
              return {
                ...t,
                checklist: t.checklist.map(chk => chk.id === itemId ? { ...chk, completed: !chk.completed } : chk)
              };
            }
            return t;
          })
        };
      }
      return c;
    });
    await handleSaveCourses(updatedCourses);
  };

  // Checklist Item management in Modal
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setTopicForm(prev => ({
      ...prev,
      checklist: [...prev.checklist, { id: generateId(), text: newChecklistItem.trim(), completed: false }]
    }));
    setNewChecklistItem('');
  };

  const handleToggleChecklistItem = (id) => {
    setTopicForm(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    }));
  };

  const handleDeleteChecklistItem = (id) => {
    setTopicForm(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  // Assign Topic to Weekly Schedule
  const openAssignWeekModal = (topic) => {
    setSelectedTopicForAssign(topic);
    setAssignForm({
      weekId: currentWeekId || (weeks[0] ? weeks[0].id : ''),
      day: 'Pazartesi'
    });
    setIsAssignWeekModalOpen(true);
  };

  const handleExecuteAssignWeek = async (e) => {
    e.preventDefault();
    if (!selectedTopicForAssign || !assignForm.weekId) return;

    const schedule = await getScheduleForWeek(assignForm.weekId);
    const daySlots = schedule[assignForm.day] || [];

    const newSlot = {
      id: generateId(),
      time: 'Ders Yol Haritası',
      subject: `[${activeCourse.title}] ${selectedTopicForAssign.title}`,
      type: 'ders',
      completed: selectedTopicForAssign.status === 'completed',
      color: activeCourse.color || 'blue',
      notes: selectedTopicForAssign.notes || '',
      checklist: selectedTopicForAssign.checklist ? selectedTopicForAssign.checklist.map(c => ({ text: c.text, completed: c.completed })) : [],
      links: [],
      images: []
    };

    schedule[assignForm.day] = [...daySlots, newSlot];
    await saveScheduleForWeek(assignForm.weekId, schedule);

    const targetWeekObj = weeks.find(w => w.id === assignForm.weekId);
    alert(`✓ "${selectedTopicForAssign.title}" konusu ${targetWeekObj?.name} - ${assignForm.day} gününe eklendi!`);
    setIsAssignWeekModalOpen(false);
  };

  if (loading) return <div className="loading-screen">Yükleniyor...</div>;

  const activeCourse = courses.find(c => c.id === activeCourseId) || courses[0];

  // Filtering topics
  let filteredTopics = activeCourse ? activeCourse.topics : [];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredTopics = filteredTopics.filter(t => 
      t.title.toLowerCase().includes(q) || 
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      (t.targetWeekName && t.targetWeekName.toLowerCase().includes(q))
    );
  }
  if (statusFilter !== 'all') {
    filteredTopics = filteredTopics.filter(t => t.status === statusFilter);
  }

  // Calculate course stats
  const totalTopics = activeCourse ? activeCourse.topics.length : 0;
  const completedTopics = activeCourse ? activeCourse.topics.filter(t => t.status === 'completed').length : 0;
  const inProgressTopics = activeCourse ? activeCourse.topics.filter(t => t.status === 'in_progress').length : 0;
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="course-details-page">
      {/* Course Categories Bar */}
      <div className="course-tabs-bar">
        <div className="course-tabs-scroll">
          {courses.map(course => {
            const isSelected = course.id === activeCourseId;
            const courseTotal = course.topics.length;
            const courseDone = course.topics.filter(t => t.status === 'completed').length;
            return (
              <div
                key={course.id}
                className={`course-tab-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveCourseId(course.id)}
                style={{ borderLeftColor: course.color || '#8b5cf6' }}
              >
                <div className="pill-content">
                  <span className="pill-title">{course.title}</span>
                  <span className="pill-badge">{courseDone}/{courseTotal} Konu</span>
                </div>
                {courses.length > 1 && (
                  <button 
                    className="delete-course-pill-btn" 
                    onClick={(e) => handleDeleteCourse(course.id, e)} 
                    title="Dersi Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
          <button className="add-course-pill-btn" onClick={() => setIsAddCourseModalOpen(true)}>
            <Plus size={16} /> Ders Ekle
          </button>
        </div>
      </div>

      {/* Active Course Banner */}
      {activeCourse && (
        <div className="modern-course-banner" style={{ borderLeft: `6px solid ${activeCourse.color || '#8b5cf6'}` }}>
          <div className="banner-header">
            <div>
              <div className="banner-tag">DERS & MÜFREDAT YOL HARİTASI</div>
              <h2 className="banner-title">{activeCourse.title}</h2>
            </div>
            <div className="banner-actions">
              {totalTopics > 0 && (
                <button className="btn-banner-action danger" onClick={handleWipeCurrentCourseTopics}>
                  <RotateCcw size={14} /> Konuları Temizle
                </button>
              )}
              <button className="btn-banner-action danger" onClick={(e) => handleDeleteCourse(activeCourse.id, e)}>
                <Trash2 size={14} /> Dersi Sil
              </button>
            </div>
          </div>

          <div className="banner-stats-row">
            <div className="stat-card">
              <span className="stat-num">{totalTopics}</span>
              <span className="stat-text">Konu</span>
            </div>
            <div className="stat-card">
              <span className="stat-num" style={{ color: '#22c55e' }}>{completedTopics}</span>
              <span className="stat-text">Tamamlanan</span>
            </div>
            <div className="stat-card">
              <span className="stat-num" style={{ color: '#3b82f6' }}>{inProgressTopics}</span>
              <span className="stat-text">Devam Eden</span>
            </div>
            <div className="stat-card progress-card">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, backgroundColor: activeCourse.color || '#8b5cf6' }}></div>
              </div>
              <span className="progress-text">İlerleme: %{progressPercent}</span>
            </div>
          </div>
        </div>
      )}

      {/* SUPER SIMPLE INLINE QUICK ADD BAR */}
      <form onSubmit={handleQuickAddTopic} className="simple-quick-add-card">
        <div className="quick-add-label">⚡ Hızlı Konu / Yol Haritası Ekle:</div>
        <div className="quick-add-inputs">
          <input
            type="text"
            className="quick-add-title-input"
            placeholder="Konu veya ders adını yazın... (Örn: Veri Yapıları Vize Notları)"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            required
          />

          {/* Calendar Picker Input */}
          <div className="quick-date-picker-box" title="Takvimden Hedef Tarih Seçin">
            <CalendarIcon size={16} className="date-icon" />
            <input
              type="date"
              className="quick-add-date-input"
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
            />
          </div>

          <button type="submit" className="quick-add-submit-btn">
            <Plus size={18} /> Ekle
          </button>
        </div>
      </form>

      {/* Filter and Search Bar */}
      <div className="modern-controls-bar">
        <div className="modern-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Konularda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="modern-status-filters">
          <button 
            className={`status-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tümü ({totalTopics})
          </button>
          <button 
            className={`status-chip ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Bekleyenler ({activeCourse ? activeCourse.topics.filter(t => t.status === 'pending').length : 0})
          </button>
          <button 
            className={`status-chip ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            Devam Edenler ({inProgressTopics})
          </button>
          <button 
            className={`status-chip ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Tamamlananlar ({completedTopics})
          </button>
        </div>
      </div>

      {/* Modern Roadmap Timeline List View */}
      <div className="modern-roadmap-list">
        {filteredTopics.length === 0 ? (
          <div className="empty-roadmap-state">
            <BookOpen size={48} className="empty-state-icon" />
            <h3>Henüz Konu Bulunmuyor</h3>
            <p>Yukarıdaki hızlı ekleme kutusuna konu adınızı yazıp <strong>"+ Ekle"</strong> butonuna basarak anında yeni konu oluşturabilirsiniz.</p>
          </div>
        ) : (
          filteredTopics.map((topic, index) => {
            const statusConfig = STATUS_CONFIG[topic.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const completedChecklistCount = topic.checklist ? topic.checklist.filter(c => c.completed).length : 0;
            const totalChecklistCount = topic.checklist ? topic.checklist.length : 0;

            return (
              <div key={topic.id} className={`roadmap-item-card status-border-${topic.status}`}>
                {/* Step Number */}
                <div className="step-badge-column">
                  <div className="step-badge-number">#{index + 1}</div>
                </div>

                {/* Content */}
                <div className="item-body">
                  <div className="item-top-header">
                    <div className="item-title-row">
                      <h3 className="item-title-text">{topic.title}</h3>
                      {topic.targetWeekName && (
                        <div className="item-week-badge">
                          <CalendarIcon size={14} />
                          <span>Hedef: {topic.targetWeekName}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      className="status-dropdown-badge"
                      style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                      onClick={() => handleToggleTopicStatus(topic)}
                      title="Durumu Değiştir"
                    >
                      <StatusIcon size={14} />
                      <span>{statusConfig.label}</span>
                    </button>
                  </div>

                  {/* Notes */}
                  {topic.notes && (
                    <div className="item-notes-container">
                      <div className="notes-header-label">
                        <FileText size={14} /> Notlar & Yol Haritası:
                      </div>
                      <div className="notes-content-box">
                        {topic.notes}
                      </div>
                    </div>
                  )}

                  {/* Checklist Items */}
                  {totalChecklistCount > 0 && (
                    <div className="item-checklist-container">
                      <div className="checklist-header-row">
                        <span className="checklist-title">Alt Görevler ({completedChecklistCount}/{totalChecklistCount}):</span>
                        <div className="checklist-progress-line">
                          <div className="fill" style={{ width: `${Math.round((completedChecklistCount/totalChecklistCount)*100)}%` }}></div>
                        </div>
                      </div>
                      <div className="checklist-cards-grid">
                        {topic.checklist.map(chk => (
                          <div 
                            key={chk.id} 
                            className={`checklist-card-item ${chk.completed ? 'completed' : ''}`}
                            onClick={() => handleToggleChecklistOnCard(topic.id, chk.id)}
                          >
                            {chk.completed ? <CheckSquare size={16} className="icon-checked" /> : <Square size={16} />}
                            <span className="chk-text">{chk.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="item-actions-row">
                    <button className="item-action-btn primary" onClick={() => openTopicModal(topic)}>
                      <Edit3 size={15} /> Not / Takvim Düzenle
                    </button>
                    <button className="item-action-btn secondary" onClick={() => openAssignWeekModal(topic)}>
                      <Copy size={15} /> Haftalık Plana Aktar
                    </button>
                    <button className="item-action-btn danger" onClick={() => handleDeleteTopic(topic.id)}>
                      <Trash2 size={15} /> Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Simple Create Course */}
      {isAddCourseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content medium-modal">
            <div className="modal-header">
              <h3>Yeni Ders / Kategori Ekle</h3>
              <button className="modal-close-btn" onClick={() => setIsAddCourseModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSimpleCourse} className="modal-body topic-modal-body">
              <div className="form-group full-width">
                <label className="form-label">Ders / Kategori Adı *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Örn: MLOps, Java OOP, Veri Yapıları..."
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsAddCourseModalOpen(false)}>İptal</button>
                <button type="submit" className="btn-primary">Ders Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Topic Details */}
      {isTopicModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>{editingTopic ? 'Konu Notları ve Takvimi Düzenle' : 'Yeni Konu ve Detay Ekle'}</h3>
              <button className="modal-close-btn" onClick={() => setIsTopicModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveTopic} className="modal-body topic-modal-body">
              <div className="form-group full-width">
                <label className="form-label">1. Konu Başlığı *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Konu başlığını yazın..."
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label className="form-label">2. Durum</label>
                  <select
                    className="form-control"
                    value={topicForm.status}
                    onChange={(e) => setTopicForm({ ...topicForm, status: e.target.value })}
                  >
                    <option value="pending">🟡 Bekliyor</option>
                    <option value="in_progress">🔵 Devam Ediyor</option>
                    <option value="completed">🟢 Tamamlandı</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">3. Hedef Tarih / Takvim Seçin</label>
                  <div className="date-picker-input-wrap">
                    <input
                      type="date"
                      className="form-control"
                      value={topicForm.targetDate}
                      onChange={(e) => setTopicForm({ ...topicForm, targetDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">4. Çalışma Notlarım ("Nasıl bir yol izlemeliyim?")</label>
                <textarea
                  className="form-control form-textarea"
                  placeholder="İzleyeceğiniz adımları ve çalışma notlarınızı buraya yazın..."
                  value={topicForm.notes}
                  onChange={(e) => setTopicForm({ ...topicForm, notes: e.target.value })}
                  rows={5}
                />
              </div>

              {/* Checklist Section */}
              <div className="checklist-section">
                <label className="form-label">5. Alt Görevler (Checklist)</label>
                <div className="add-checklist-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Görev yazıp Ekle'ye basın..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                  />
                  <button type="button" className="btn-add-item" onClick={handleAddChecklistItem}>
                    <Plus size={16} /> Ekle
                  </button>
                </div>

                <div className="checklist-items-list">
                  {topicForm.checklist.map(item => (
                    <div key={item.id} className="checklist-item-row">
                      <button
                        type="button"
                        className="check-btn"
                        onClick={() => handleToggleChecklistItem(item.id)}
                      >
                        {item.completed ? <CheckSquare size={18} className="icon-checked" /> : <Square size={18} />}
                      </button>
                      <span className={`item-text ${item.completed ? 'completed' : ''}`}>{item.text}</span>
                      <button
                        type="button"
                        className="delete-item-btn"
                        onClick={() => handleDeleteChecklistItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsTopicModalOpen(false)}>İptal</button>
                <button type="submit" className="btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Topic to Weekly Schedule */}
      {isAssignWeekModalOpen && selectedTopicForAssign && (
        <div className="modal-overlay">
          <div className="modal-content medium-modal">
            <div className="modal-header">
              <h3>Haftalık Plana Aktar</h3>
              <button className="modal-close-btn" onClick={() => setIsAssignWeekModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleExecuteAssignWeek} className="modal-body topic-modal-body">
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>
                <strong>"{selectedTopicForAssign.title}"</strong> konusunu hangi haftanın planına eklemek istersiniz?
              </p>

              <div className="form-group full-width">
                <label className="form-label">Hedef Hafta Seçin</label>
                <select
                  className="form-control"
                  value={assignForm.weekId}
                  onChange={(e) => setAssignForm({ ...assignForm, weekId: e.target.value })}
                  required
                >
                  {weeks.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Hangi Güne Eklensin?</label>
                <select
                  className="form-control"
                  value={assignForm.day}
                  onChange={(e) => setAssignForm({ ...assignForm, day: e.target.value })}
                >
                  <option value="Pazartesi">Pazartesi</option>
                  <option value="Salı">Salı</option>
                  <option value="Çarşamba">Çarşamba</option>
                  <option value="Perşembe">Perşembe</option>
                  <option value="Cuma">Cuma</option>
                  <option value="Cumartesi">Cumartesi</option>
                  <option value="Pazar">Pazar</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsAssignWeekModalOpen(false)}>İptal</button>
                <button type="submit" className="btn-primary">
                  <Copy size={16} /> Plana Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
