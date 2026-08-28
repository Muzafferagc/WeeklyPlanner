import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, CheckCircle2, Clock, Circle, FileText, X, ChevronRight, Folder, FolderOpen, CheckSquare, Square, CalendarIcon
} from 'lucide-react';
import { 
  getCourseDetailsData, saveCourseDetailsData, generateId, 
  getScheduleForWeek, saveScheduleForWeek 
} from '../utils/storage';
import confetti from 'canvas-confetti';

const STATUS_CONFIG = {
  pending: { label: 'Bekliyor', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: Clock },
  in_progress: { label: 'Devam Ediyor', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Circle },
  completed: { label: 'Tamamlandı', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: CheckCircle2 }
};

export default function CourseDetailsView({ weeks, currentWeekId, onDataChange, refreshTrigger }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [currentPath, setCurrentPath] = useState([]); // Array of folder IDs
  
  // Modals & UI State
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  
  const [activeTopic, setActiveTopic] = useState(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  
  const [assignForm, setAssignForm] = useState({ weekId: currentWeekId || '', day: 'Pazartesi' });

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  useEffect(() => {
    if (currentWeekId && !assignForm.weekId) {
      setAssignForm(prev => ({ ...prev, weekId: currentWeekId }));
    }
  }, [currentWeekId]);

  const loadData = async () => {
    const data = await getCourseDetailsData();
    setNodes(data);
    setLoading(false);
  };

  const saveData = async (newNodes) => {
    setNodes(newNodes);
    await saveCourseDetailsData(newNodes);
    if (onDataChange) onDataChange();
  };

  const findNode = (tree, id) => {
    for (const node of tree) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateNodeInTree = (tree, id, updater) => {
    return tree.map(node => {
      if (node.id === id) return updater(node);
      if (node.children) return { ...node, children: updateNodeInTree(node.children, id, updater) };
      return node;
    });
  };

  const deleteNodeFromTree = (tree, id) => {
    return tree.filter(node => node.id !== id).map(node => {
      if (node.children) return { ...node, children: deleteNodeFromTree(node.children, id) };
      return node;
    });
  };

  const getCurrentFolderChildren = () => {
    if (currentPath.length === 0) return nodes;
    const currentFolderId = currentPath[currentPath.length - 1];
    const folder = findNode(nodes, currentFolderId);
    return folder ? (folder.children || []) : [];
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const newNode = {
      id: generateId(),
      type: 'folder',
      title: newFolderName.trim(),
      color: '#3b82f6',
      children: []
    };
    
    if (currentPath.length === 0) {
      saveData([...nodes, newNode]);
    } else {
      const parentId = currentPath[currentPath.length - 1];
      const newTree = updateNodeInTree(nodes, parentId, (parent) => ({
        ...parent,
        children: [...parent.children, newNode]
      }));
      saveData(newTree);
    }
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    const newNode = {
      id: generateId(),
      type: 'topic',
      title: newTopicName.trim(),
      status: 'pending',
      targetWeekName: '',
      notes: '',
      checklist: [],
      updatedAt: new Date().toISOString()
    };
    
    if (currentPath.length === 0) {
      saveData([...nodes, newNode]);
    } else {
      const parentId = currentPath[currentPath.length - 1];
      const newTree = updateNodeInTree(nodes, parentId, (parent) => ({
        ...parent,
        children: [...parent.children, newNode]
      }));
      saveData(newTree);
    }
    setNewTopicName('');
    setIsAddingTopic(false);
  };

  const handleDeleteNode = (id, type) => {
    if (window.confirm(type === 'folder' ? 'Bu klasörü ve içindeki her şeyi silmek istediğinize emin misiniz?' : 'Bu konuyu silmek istediğinize emin misiniz?')) {
      saveData(deleteNodeFromTree(nodes, id));
      if (activeTopic && activeTopic.id === id) setActiveTopic(null);
    }
  };

  const navigateToFolder = (id) => {
    setCurrentPath([...currentPath, id]);
  };

  const navigateUp = (index) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
  };

  const getBreadcrumbs = () => {
    const crumbs = [{ id: 'root', title: 'Ana Dizin', index: -1 }];
    let currentLevel = nodes;
    
    currentPath.forEach((folderId, idx) => {
      const folder = currentLevel.find(n => n.id === folderId);
      if (folder) {
        crumbs.push({ id: folder.id, title: folder.title, index: idx });
        currentLevel = folder.children || [];
      }
    });
    return crumbs;
  };
  
  const handleUpdateTopic = (id, updates) => {
    const newTree = updateNodeInTree(nodes, id, (node) => ({
      ...node,
      ...updates,
      updatedAt: new Date().toISOString()
    }));
    saveData(newTree);
    
    if (activeTopic && activeTopic.id === id) {
      setActiveTopic(prev => ({ ...prev, ...updates }));
    }
  };

  const handleAddChecklist = (id) => {
    if (!newChecklistItem.trim()) return;
    const topic = findNode(nodes, id);
    if (!topic) return;
    
    const newItem = { id: generateId(), text: newChecklistItem.trim(), completed: false };
    handleUpdateTopic(id, { checklist: [...(topic.checklist || []), newItem] });
    setNewChecklistItem('');
  };

  const handleToggleChecklist = (topicId, itemId) => {
    const topic = findNode(nodes, topicId);
    if (!topic) return;
    
    const updatedChecklist = topic.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    
    const allCompleted = updatedChecklist.length > 0 && updatedChecklist.every(i => i.completed);
    const anyCompleted = updatedChecklist.some(i => i.completed);
    
    let newStatus = topic.status;
    if (allCompleted) newStatus = 'completed';
    else if (anyCompleted && newStatus === 'pending') newStatus = 'in_progress';

    handleUpdateTopic(topicId, { checklist: updatedChecklist, status: newStatus });
    if (allCompleted && topic.status !== 'completed') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleDeleteChecklist = (topicId, itemId) => {
    const topic = findNode(nodes, topicId);
    if (!topic) return;
    const updatedChecklist = topic.checklist.filter(item => item.id !== itemId);
    handleUpdateTopic(topicId, { checklist: updatedChecklist });
  };

  const handleAssignToWeek = async (topic) => {
    if (!assignForm.weekId) {
      alert("Lütfen önce hedef haftayı seçin.");
      return;
    }
    try {
      const schedule = await getScheduleForWeek(assignForm.weekId);
      const newSlot = {
        id: generateId(),
        time: "12:00 - 13:00",
        activity: topic.title,
        color: "blue",
        completed: false,
        notes: topic.notes || "",
        checklist: topic.checklist ? JSON.parse(JSON.stringify(topic.checklist)) : [],
        images: []
      };
      
      const daySchedule = schedule[assignForm.day] || [];
      const updatedSchedule = { ...schedule, [assignForm.day]: [...daySchedule, newSlot] };
      
      await saveScheduleForWeek(assignForm.weekId, updatedSchedule);
      alert(`✓ "${topic.title}" konusu başarıyla ${assignForm.day} gününe gönderildi!`);
    } catch (e) {
      alert("Gönderilirken bir hata oluştu: " + e.message);
    }
  };

  if (loading) return <div className="loading-screen">Yükleniyor...</div>;

  const currentChildren = getCurrentFolderChildren();
  const folders = currentChildren.filter(n => n.type === 'folder');
  const topics = currentChildren.filter(n => n.type === 'topic');

  return (
    <div className="course-details-view" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
      
      {/* BREADCRUMBS */}
      <div className="explorer-breadcrumbs no-print" style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-panel)', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {getBreadcrumbs().map((crumb, idx, arr) => (
          <React.Fragment key={crumb.id}>
            <span 
              className={`crumb ${idx === arr.length - 1 ? 'active' : ''}`}
              onClick={() => navigateUp(crumb.index)}
              style={{ cursor: 'pointer', fontWeight: idx === arr.length - 1 ? '600' : '400', color: idx === arr.length - 1 ? 'var(--text-main)' : 'var(--text-light)', fontSize: '15px' }}
            >
              {crumb.title}
            </span>
            {idx < arr.length - 1 && <ChevronRight size={16} style={{ color: 'var(--text-light)' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* EXPLORER ACTIONS */}
      <div className="explorer-actions no-print" style={{ display: 'flex', gap: '12px', padding: '16px' }}>
        {isAddingFolder ? (
          <form className="inline-add-form" onSubmit={(e) => { e.preventDefault(); handleAddFolder(); }} style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
            <Folder size={20} style={{ color: 'var(--primary)' }} />
            <input 
              autoFocus
              type="text" 
              placeholder="Klasör Adı..." 
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onBlur={() => { if(!newFolderName) setIsAddingFolder(false); }}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>Ekle</button>
            <button type="button" className="btn-secondary" style={{ padding: '8px' }} onClick={() => setIsAddingFolder(false)}><X size={16}/></button>
          </form>
        ) : (
          <button className="btn-secondary" onClick={() => setIsAddingFolder(true)} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Folder size={18} /> Yeni Klasör
          </button>
        )}

        {isAddingTopic ? (
          <form className="inline-add-form" onSubmit={(e) => { e.preventDefault(); handleAddTopic(); }} style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
            <FileText size={20} style={{ color: 'var(--primary)' }} />
            <input 
              autoFocus
              type="text" 
              placeholder="Konu Adı..." 
              value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
              onBlur={() => { if(!newTopicName) setIsAddingTopic(false); }}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>Ekle</button>
            <button type="button" className="btn-secondary" style={{ padding: '8px' }} onClick={() => setIsAddingTopic(false)}><X size={16}/></button>
          </form>
        ) : (
          <button className="btn-primary" onClick={() => setIsAddingTopic(true)} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={18} /> Yeni Konu Ekle
          </button>
        )}
      </div>

      {/* EXPLORER GRID */}
      <div className="explorer-grid" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', alignContent: 'start' }}>
        {folders.length === 0 && topics.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-light)' }}>
            <FolderOpen size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '16px' }}>Bu klasör boş. Yeni bir klasör veya konu ekleyerek başlayın.</p>
          </div>
        )}
        
        {folders.map(folder => (
          <div key={folder.id} className="explorer-card folder-card" onClick={() => navigateToFolder(folder.id)} style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', position: 'relative' }}>
            <div className="folder-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <Folder size={32} fill={folder.color || '#3b82f6'} color={folder.color || '#3b82f6'} />
            </div>
            <div className="folder-info" style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-main)', fontWeight: '600' }}>{folder.title}</h4>
              <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>{(folder.children || []).length} Öğe</span>
            </div>
            <button className="delete-btn-hover" style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px' }} onClick={(e) => { e.stopPropagation(); handleDeleteNode(folder.id, 'folder'); }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {topics.map(topic => {
          const Conf = STATUS_CONFIG[topic.status] || STATUS_CONFIG.pending;
          const Icon = Conf.icon;
          const totalChecks = topic.checklist ? topic.checklist.length : 0;
          const compChecks = topic.checklist ? topic.checklist.filter(c => c.completed).length : 0;
          
          return (
            <div key={topic.id} className="explorer-card topic-card" onClick={() => setActiveTopic(topic)} style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
              <div className="topic-status-bar" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: Conf.color }}></div>
              <div className="topic-info" style={{ paddingLeft: '8px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-main)', fontWeight: '600', lineHeight: '1.4' }}>{topic.title}</h4>
                <div className="topic-meta" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="status-badge" style={{ backgroundColor: Conf.bg, color: Conf.color, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', fontWeight: '500' }}>
                    <Icon size={14} style={{marginRight: '6px'}}/> {Conf.label}
                  </span>
                  {totalChecks > 0 && (
                    <span className="checklist-badge" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-light)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', fontWeight: '500' }}>
                      <CheckSquare size={14} style={{marginRight: '6px'}}/> {compChecks}/{totalChecks} Görev
                    </span>
                  )}
                  {topic.notes && (
                    <span className="notes-badge" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-light)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', fontWeight: '500' }}>
                      <FileText size={14} style={{marginRight: '6px'}}/> Not Eklendi
                    </span>
                  )}
                </div>
              </div>
              <button className="delete-btn-hover" style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px' }} onClick={(e) => { e.stopPropagation(); handleDeleteNode(topic.id, 'topic'); }}>
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* TOPIC DETAIL DRAWER */}
      {activeTopic && (
        <div className="topic-drawer-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setActiveTopic(null)}>
          <div className="topic-drawer" style={{ width: '450px', maxWidth: '100%', backgroundColor: 'var(--bg-panel)', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div className="drawer-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Konu Detayları</h3>
              <button onClick={() => setActiveTopic(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }}><X size={24}/></button>
            </div>
            
            <div className="drawer-body" style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div className="drawer-field">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-light)' }}>Konu Adı</label>
                <input 
                  type="text" 
                  value={activeTopic.title}
                  onChange={(e) => handleUpdateTopic(activeTopic.id, { title: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '15px' }}
                />
              </div>

              <div className="drawer-field">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-light)' }}>Durum</label>
                <div className="status-selector" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                    const SIcon = config.icon;
                    return (
                      <button 
                        key={key}
                        style={{ 
                          padding: '8px 12px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
                          backgroundColor: activeTopic.status === key ? config.color : 'transparent',
                          color: activeTopic.status === key ? 'white' : 'var(--text-main)',
                          borderColor: activeTopic.status === key ? config.color : 'var(--border-color)'
                        }}
                        onClick={() => handleUpdateTopic(activeTopic.id, { status: key })}
                      >
                        <SIcon size={16} /> {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="drawer-field">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-light)' }}>
                  Alt Görevler ({activeTopic.checklist ? activeTopic.checklist.filter(c=>c.completed).length : 0}/{activeTopic.checklist ? activeTopic.checklist.length : 0})
                </label>
                <div className="checklist-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeTopic.checklist && activeTopic.checklist.map(item => (
                    <div key={item.id} className="checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <button 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: item.completed ? '#22c55e' : 'var(--text-light)', display: 'flex' }}
                        onClick={() => handleToggleChecklist(activeTopic.id, item.id)}
                      >
                        {item.completed ? <CheckSquare size={20}/> : <Square size={20}/>}
                      </button>
                      <span style={{ flex: 1, fontSize: '15px', color: item.completed ? 'var(--text-light)' : 'var(--text-main)', textDecoration: item.completed ? 'line-through' : 'none' }}>{item.text}</span>
                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }} onClick={() => handleDeleteChecklist(activeTopic.id, item.id)}>
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))}
                  <div className="add-checklist-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <Plus size={20} style={{ color: 'var(--primary)' }} />
                    <input 
                      type="text" 
                      placeholder="Yeni alt görev ekle..." 
                      value={newChecklistItem}
                      onChange={e => setNewChecklistItem(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddChecklist(activeTopic.id);
                      }}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', fontSize: '15px' }}
                    />
                    <button className="btn-primary" style={{ padding: '10px 16px' }} onClick={() => handleAddChecklist(activeTopic.id)}>Ekle</button>
                  </div>
                </div>
              </div>

              <div className="drawer-field">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-light)' }}>Notlar</label>
                <textarea 
                  rows={6}
                  placeholder="Bu konuyla ilgili notlar, özetler veya önemli linkler..."
                  value={activeTopic.notes || ''}
                  onChange={e => handleUpdateTopic(activeTopic.id, { notes: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '15px', lineHeight: '1.6', resize: 'vertical' }}
                />
              </div>

              <div className="drawer-field" style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--primary-light)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: '600', fontSize: '15px', color: 'var(--primary)' }}>
                  <CalendarIcon size={18} /> Haftalık Plana Gönder
                </label>
                <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '12px', lineHeight: '1.4' }}>
                  Bu konuyu alt görevleri ve notlarıyla birlikte doğrudan bir haftanın planına ders bloğu olarak gönderebilirsiniz.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <select 
                    value={assignForm.weekId}
                    onChange={e => setAssignForm({...assignForm, weekId: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                  >
                    <option value="">Hafta Seçiniz...</option>
                    {(weeks || []).map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      value={assignForm.day} 
                      onChange={e => setAssignForm({...assignForm, day: e.target.value})}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                    >
                      {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <button className="btn-primary" style={{ padding: '12px 24px', fontWeight: '600' }} onClick={() => handleAssignToWeek(activeTopic)}>
                      Gönder
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`
        .course-explorer-view { animation: fadeIn 0.3s ease; }
        .explorer-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .delete-btn-hover { opacity: 0; }
        .explorer-card:hover .delete-btn-hover { opacity: 1; }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @media (max-width: 768px) {
          .topic-drawer { width: 100% !important; }
          .explorer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
