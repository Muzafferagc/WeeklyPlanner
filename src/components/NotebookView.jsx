import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, ArrowLeft, ArrowRight, Image as ImageIcon, Eraser, PenTool, Type, Cloud, MousePointer2, Trash, ChevronLeft, ChevronRight, Edit2, Folder, FolderPlus, FilePlus } from 'lucide-react';
import { getNotebookData, saveNotebookData, getNotebookFolders, saveNotebookFolders, generateId, exportData } from '../utils/storage';
import { broadcastToCloud, getSyncRoom } from '../utils/syncService';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import Draggable from 'react-draggable';

export default function NotebookView({ refreshTrigger, onDataChange }) {

  const [pages, setPages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Overview state
  const [isOverview, setIsOverview] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  
  // Drawing state
  const [drawMode, setDrawMode] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#2b2b2b');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    const data = await getNotebookData();
    const folderData = await getNotebookFolders();
    setPages(data);
    setFolders(folderData);
    if (data.length > 0 && !activePageId) {
      setActivePageId(data[0].id);
    }
    setLoading(false);
  };

  const activePage = pages.find(p => p.id === activePageId);
  const activePageIndex = pages.findIndex(p => p.id === activePageId);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.eraseMode(isEraser);
    }
  }, [isEraser]);

  useEffect(() => {
    if (activePage && canvasRef.current && activePage.drawingData) {
      canvasRef.current.loadPaths(activePage.drawingData);
    } else if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  }, [activePageId]);

  const handleSavePageContent = async (id, newContent) => {
    const newPages = pages.map(p => p.id === id ? { ...p, content: newContent } : p);
    setPages(newPages);
    await saveNotebookData(newPages);
    if (onDataChange) onDataChange();
  };

  const handleSavePageTitle = async (id, newTitle) => {
    const newPages = pages.map(p => p.id === id ? { ...p, title: newTitle } : p);
    setPages(newPages);
    await saveNotebookData(newPages);
    if (onDataChange) onDataChange();
  };
  
  const handleCanvasUpdate = async () => {
    if (!canvasRef.current || !activePageId) return;
    try {
      const paths = await canvasRef.current.exportPaths();
      const newPages = pages.map(p => p.id === activePageId ? { ...p, drawingData: paths } : p);
      setPages(newPages);
      await saveNotebookData(newPages);
      if (onDataChange) onDataChange();
    } catch (e) {}
  };

  const handleAddPage = async () => {
    const newPage = {
      id: generateId(),
      title: `Yeni Not ${pages.length + 1}`,
      folderId: currentFolderId,
      content: '',
      drawingData: null,
      images: [],
      createdAt: new Date().toISOString()
    };
    const newPages = [...pages, newPage];
    setPages(newPages);
    setActivePageId(newPage.id);
    setIsOverview(false);
    await saveNotebookData(newPages);
    if (onDataChange) onDataChange();
  };

  const handleAddFolder = async () => {
    const folderName = window.prompt("Yeni klasörün adı:");
    if (!folderName || !folderName.trim()) return;
    
    const newFolder = {
      id: generateId(),
      name: folderName.trim(),
      parentId: currentFolderId,
      createdAt: new Date().toISOString()
    };
    const newFolders = [...folders, newFolder];
    setFolders(newFolders);
    await saveNotebookFolders(newFolders);
    if (onDataChange) onDataChange();
  };

  const handleDeletePage = async (id) => {
    if (pages.length <= 1) {
      alert("Son sayfayı silemezsiniz!");
      return;
    }
    if (window.confirm("Bu sayfayı silmek istediğinize emin misiniz?")) {
      const newPages = pages.filter(p => p.id !== id);
      setPages(newPages);
      await saveNotebookData(newPages);
      if (id === activePageId) {
        setIsOverview(true);
      }
      if (onDataChange) onDataChange();
    }
  };

  const handleDeleteFolder = async (id) => {
    if (window.confirm("Bu klasörü ve içindeki tüm verileri silmek istediğinize emin misiniz?")) {
      // Recursive delete function to find all sub-folders and pages
      const foldersToDelete = new Set([id]);
      let added = true;
      while(added) {
        added = false;
        for (const f of folders) {
          if (foldersToDelete.has(f.parentId) && !foldersToDelete.has(f.id)) {
            foldersToDelete.add(f.id);
            added = true;
          }
        }
      }
      
      const newFolders = folders.filter(f => !foldersToDelete.has(f.id));
      const newPages = pages.filter(p => !foldersToDelete.has(p.folderId));
      
      setFolders(newFolders);
      setPages(newPages);
      await saveNotebookFolders(newFolders);
      await saveNotebookData(newPages);
      if (onDataChange) onDataChange();
    }
  };

  const handleRenameFolder = async (id, oldName) => {
    const newName = window.prompt("Klasörün yeni adı:", oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
      const newFolders = folders.map(f => f.id === id ? { ...f, name: newName.trim() } : f);
      setFolders(newFolders);
      await saveNotebookFolders(newFolders);
      if (onDataChange) onDataChange();
    }
  };

  const handleAddImage = (e) => {
    if (!activePageId) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const newImage = {
          id: generateId(),
          dataUrl: event.target.result,
          x: 50,
          y: 50,
          width: 200
        };
        const newPages = pages.map(p => {
          if (p.id === activePageId) {
            return { ...p, images: [...(p.images || []), newImage] };
          }
          return p;
        });
        setPages(newPages);
        await saveNotebookData(newPages);
        if (onDataChange) onDataChange();
      };
      reader.readAsDataURL(file);
    }
  };

  const updateImagePosition = async (pageId, imageId, newX, newY) => {
    const newPages = pages.map(p => {
      if (p.id === pageId) {
        const newImages = p.images.map(img => img.id === imageId ? { ...img, x: newX, y: newY } : img);
        return { ...p, images: newImages };
      }
      return p;
    });
    setPages(newPages);
    await saveNotebookData(newPages);
    if (onDataChange) onDataChange();
  };

  const deleteImage = async (pageId, imageId) => {
    const newPages = pages.map(p => {
      if (p.id === pageId) {
        return { ...p, images: p.images.filter(img => img.id !== imageId) };
      }
      return p;
    });
    setPages(newPages);
    await saveNotebookData(newPages);
    if (onDataChange) onDataChange();
  };

  const handleManualSave = async () => {
    try {
      await saveNotebookData(pages);
      const fullState = JSON.parse(await exportData(null, null));
      await broadcastToCloud(getSyncRoom(), fullState);
      alert('Defteriniz başarıyla buluta kaydedildi! ✓');
    } catch(e) {
      alert('Kaydedilirken bir hata oluştu.');
    }
  };

  const clearCanvas = async () => {
    if (window.confirm("Tüm çizimleri silmek istediğinize emin misiniz?")) {
      canvasRef.current.clearCanvas();
      const newPages = pages.map(p => p.id === activePageId ? { ...p, drawingData: [] } : p);
      setPages(newPages);
      await saveNotebookData(newPages);
    }
  };

  const goToNextPage = () => {
    if (activePageIndex < pages.length - 1) {
      setActivePageId(pages[activePageIndex + 1].id);
    }
  };

  const goToPrevPage = () => {
    if (activePageIndex > 0) {
      setActivePageId(pages[activePageIndex - 1].id);
    }
  };

  const handleDragStart = (e, type, id) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, id }));
  };
  
  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '';
    
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const { type, id } = JSON.parse(dataStr);
      
      if (type === 'page') {
        const newPages = pages.map(p => p.id === id ? { ...p, folderId: targetFolderId } : p);
        setPages(newPages);
        await saveNotebookData(newPages);
        if (onDataChange) onDataChange();
      } else if (type === 'folder' && id !== targetFolderId) {
        // Prevent moving a folder into its own descendant
        let isDescendant = false;
        let curr = folders.find(f => f.id === targetFolderId);
        while (curr) {
          if (curr.id === id) {
            isDescendant = true;
            break;
          }
          curr = folders.find(f => f.id === curr.parentId);
        }
        
        if (!isDescendant) {
          const newFolders = folders.map(f => f.id === id ? { ...f, parentId: targetFolderId } : f);
          setFolders(newFolders);
          await saveNotebookFolders(newFolders);
          if (onDataChange) onDataChange();
        }
      }
    } catch(err) {}
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
  };
  
  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = '';
  };

  const getBreadcrumbs = () => {
    const crumbs = [];
    let curr = folders.find(f => f.id === currentFolderId);
    while (curr) {
      crumbs.unshift(curr);
      curr = folders.find(f => f.id === curr.parentId);
    }
    return crumbs;
  };
  
  const breadcrumbs = getBreadcrumbs();
  const currentFolders = folders.filter(f => f.parentId === currentFolderId);
  const currentPages = pages.filter(p => p.folderId === currentFolderId);

  const getCategoryColor = (categoryName) => {
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 75%, 55%)`;
  };

  if (loading) return <div className="loading-screen">Defter Yükleniyor...</div>;

  return (
    <div className="notebook-layout" style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      
      {isOverview ? (
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' }}>Defterlerim</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-primary" 
                onClick={handleAddFolder}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '12px', padding: '10px 16px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)', transition: 'all 0.2s', backgroundColor: '#e2e8f0', color: '#475569', border: '1px solid #cbd5e1' }}
              >
                <FolderPlus size={18} /> Yeni Klasör
              </button>
              <button 
                className="btn-primary" 
                onClick={handleAddPage}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '12px', padding: '10px 16px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)', transition: 'all 0.2s' }}
              >
                <FilePlus size={18} /> Yeni Defter
              </button>
              <button 
                className="btn-secondary"
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '12px', padding: '10px 16px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', transition: 'all 0.2s', cursor: 'pointer' }}
                onClick={handleManualSave}
                title="Tüm verileri buluta kaydet"
              >
                <Cloud size={18}/> Buluta Kaydet
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', backgroundColor: '#fff', padding: '12px 20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <span 
              onClick={() => setCurrentFolderId(null)} 
              style={{ cursor: 'pointer', fontWeight: currentFolderId === null ? 'bold' : 'normal', color: currentFolderId === null ? 'var(--primary)' : '#64748b' }}
            >
              Ana Dizin
            </span>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <span style={{ color: '#cbd5e1' }}>/</span>
                <span 
                  onClick={() => setCurrentFolderId(crumb.id)} 
                  style={{ cursor: 'pointer', fontWeight: idx === breadcrumbs.length - 1 ? 'bold' : 'normal', color: idx === breadcrumbs.length - 1 ? 'var(--primary)' : '#64748b' }}
                >
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
            {/* Folders */}
            {currentFolderId !== null && (
              <div 
                onDrop={(e) => handleDrop(e, breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].id : null)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => setCurrentFolderId(breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].id : null)}
                style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '24px',
                  border: '2px dashed #cbd5e1',
                  color: '#64748b',
                  transition: 'all 0.2s',
                  minHeight: '180px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              >
                <ArrowLeft size={24} />
                <span style={{ fontWeight: 'bold' }}>Geri Dön</span>
              </div>
            )}
            
            {currentFolders.map(folder => {
              const folderColor = getCategoryColor(folder.name);
              return (
                <div 
                  key={folder.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => setCurrentFolderId(folder.id)}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <Folder size={40} color={folderColor} fill={`${folderColor}30`} />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleRenameFolder(folder.id, folder.name); }} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><Edit2 size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{folder.name}</h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Klasör</span>
                </div>
              );
            })}

            {/* Pages */}
            {currentPages.map(page => {
              const pageCatColor = currentFolderId ? getCategoryColor(breadcrumbs[breadcrumbs.length-1].name) : getCategoryColor('Genel');
              return (
                <div 
                  key={page.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'page', page.id)}
                  onClick={() => {
                    setActivePageId(page.id);
                    setIsOverview(false);
                  }}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.01)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)';
                  }}
                >
                  <div style={{ height: '8px', width: '100%', backgroundColor: pageCatColor }} />
                  
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }}
                        style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b', lineHeight: '1.3' }}>{page.title}</h3>
                    
                    <div style={{ 
                      flex: 1, 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px', 
                      minHeight: '120px', 
                      backgroundImage: 'repeating-linear-gradient(#f1f5f9 0, #f1f5f9 1px, transparent 1px, transparent 24px)',
                      backgroundSize: '100% 24px',
                      backgroundPositionY: '8px',
                      border: '1px solid #e2e8f0',
                      position: 'relative'
                    }}>
                      <div style={{ position: 'absolute', left: '16px', top: 0, bottom: 0, width: '2px', backgroundColor: '#ef4444', opacity: 0.2 }} />
                    </div>
                    
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                      Oluşturulma: {new Date(page.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              );
            })}
            {currentFolders.length === 0 && currentPages.length === 0 && currentFolderId !== null && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#94a3b8' }}>
                  <Folder size={24} />
                </div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '18px' }}>Bu klasör boş</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', textAlign: 'center' }}>Hemen "Yeni Klasör" veya "Yeni Defter" oluşturabilirsiniz.</p>
              </div>
            )}
          </div>
        </div>
      ) : activePage ? (
        <>
          {/* TOPBAR */}
          <div className="notebook-toolbar no-print" style={{ 
            padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', 
            display: 'flex', gap: '12px', alignItems: 'center', zIndex: 10, flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setIsOverview(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
            >
              <ArrowLeft size={18} /> Geri Dön
            </button>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }} />
            <input 
              type="text" 
              value={activePage.title}
              onChange={e => handleSavePageTitle(activePage.id, e.target.value)}
              style={{ fontSize: '18px', fontWeight: 'bold', border: 'none', outline: 'none', background: 'transparent', minWidth: '120px', flex: '1 1 auto' }}
              placeholder="Sayfa Başlığı"
            />
            
            <select
              value={activePage.folderId || ''}
              onChange={async e => {
                const newFolderId = e.target.value === '' ? null : e.target.value;
                const newPages = pages.map(p => p.id === activePageId ? { ...p, folderId: newFolderId } : p);
                setPages(newPages);
                await saveNotebookData(newPages);
                if (onDataChange) onDataChange();
              }}
              style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', maxWidth: '150px' }}
            >
              <option value="">Ana Dizin</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            
            <div className="toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

              <button 
                className="delete-btn-hover"
                style={{ background: 'var(--primary)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}
                onClick={handleManualSave}
                title="Tüm verileri buluta kaydet"
              >
                <Cloud size={16}/> Buluta Kaydet
              </button>
              <button 
                className="delete-btn-hover"
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}
                onClick={() => {
                  handleDeletePage(activePage.id);
                  if (pages.length <= 1) {
                    setIsOverview(true);
                  }
                }}
                title="Sayfayı Sil"
              >
                <Trash2 size={18}/>
              </button>
              <button 
                className="delete-btn-hover"
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}
                onClick={() => handleDeletePage(activePage.id)}
                title="Sayfayı Sil"
              >
                <Trash2 size={18}/>
              </button>

              <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', fontSize: '14px', fontWeight: '500' }}>
                <ImageIcon size={16}/> <span className="hide-on-mobile">Fotoğraf Ekle</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              </label>

              <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>

              <button 
                onClick={() => setDrawMode(!drawMode)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', backgroundColor: drawMode ? 'var(--primary)' : 'var(--bg-panel)', color: drawMode ? '#fff' : 'var(--text-main)', border: drawMode ? '1px solid var(--primary)' : '1px solid var(--border-color)', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
              >
                {drawMode ? <PenTool size={16}/> : <MousePointer2 size={16}/>}
                <span className="hide-on-mobile">{drawMode ? 'Çizim Modu' : 'Yazı Modu'}</span>
              </button>
              
              {drawMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                  <input type="color" value={strokeColor} onChange={e => { setStrokeColor(e.target.value); setIsEraser(false); }} style={{ width: '24px', height: '24px', padding: 0, border: 'none', cursor: 'pointer' }} />
                  <input type="range" min="1" max="20" value={strokeWidth} onChange={e => setStrokeWidth(parseInt(e.target.value))} style={{ width: '60px' }} />
                  <button onClick={() => setIsEraser(!isEraser)} style={{ background: isEraser ? '#e5e7eb' : 'transparent', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer' }} title="Silgi"><Eraser size={18}/></button>
                  <button onClick={clearCanvas} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '4px', cursor: 'pointer' }} title="Tüm Çizimi Temizle"><Trash size={18}/></button>
                </div>
              )}
            </div>
          </div>

          {/* PAGE CONTENT WRAPPER */}
          <div className="notebook-paper" style={{ flex: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
            
            {/* GRID WRAPPER FOR PERFECT HEIGHT SYNC */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', minHeight: '100%' }}>
              
              {/* BACKGROUND LINES */}
              <div style={{ gridArea: '1/1', backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.1) 31px, rgba(0,0,0,0.1) 32px)', backgroundAttachment: 'local', zIndex: 1, pointerEvents: 'none' }}></div>
              
              {/* DRAGGABLE IMAGES */}
              <div style={{ gridArea: '1/1', position: 'relative', zIndex: 4, pointerEvents: 'none' }}>
                {activePage.images && activePage.images.map(img => (
                  <Draggable 
                    key={img.id} 
                    defaultPosition={{ x: img.x || 50, y: img.y || 50 }}
                    onStop={(e, data) => handleUpdateImagePosition(img.id, data)}
                    disabled={drawMode}
                  >
                    <div style={{ position: 'absolute', pointerEvents: 'auto', cursor: drawMode ? 'default' : 'move' }}>
                      <div style={{ position: 'relative', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '2px', backgroundColor: 'white' }}>
                        <img src={img.url} alt="Note Attachment" style={{ maxWidth: '250px', maxHeight: '350px', objectFit: 'contain', display: 'block', userSelect: 'none', pointerEvents: 'none' }} draggable="false" />
                        {!drawMode && (
                          <button 
                            onPointerDown={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                            style={{ position: 'absolute', top: '-12px', right: '-12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                          >
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                    </div>
                  </Draggable>
                ))}
              </div>

              {/* TEXT AREA */}
              <textarea
                value={activePage.content || ''}
                onChange={e => handleSavePageContent(activePage.id, e.target.value)}
                style={{ 
                  gridArea: '1/1',
                  position: 'relative', zIndex: 2, width: '100%', minHeight: '100%', 
                  background: 'transparent', border: 'none', resize: 'vertical', outline: 'none',
                  padding: '32px 16px 150px 16px', fontSize: '16px', lineHeight: '32px', color: 'var(--text-main)',
                  fontFamily: 'inherit',
                  pointerEvents: drawMode ? 'none' : 'auto'
                }}
                placeholder="Notlarınızı buraya yazın..."
              />

              {/* DRAWING CANVAS (OVERLAY) */}
              <div style={{ gridArea: '1/1', position: 'relative', zIndex: 3, pointerEvents: drawMode ? 'auto' : 'none' }}>
                <ReactSketchCanvas
                  ref={canvasRef}
                  strokeWidth={isEraser ? strokeWidth * 3 : strokeWidth}
                  strokeColor={strokeColor}
                  eraserWidth={strokeWidth * 3}
                  canvasColor="transparent"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  onStroke={handleCanvasUpdate}
                />
              </div>
            </div>
          </div>

          {/* FLOATING BOTTOM PAGINATION */}
          <div className="notebook-pagination no-print" style={{ 
            position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid var(--border-color)', 
            borderRadius: '30px', padding: '8px 16px', display: 'flex', alignItems: 'center', 
            gap: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 20, backdropFilter: 'blur(8px)'
          }}>
            <button 
              onClick={goToPrevPage}
              disabled={activePageIndex === 0}
              style={{ background: 'transparent', border: 'none', cursor: activePageIndex === 0 ? 'not-allowed' : 'pointer', color: activePageIndex === 0 ? '#ccc' : 'var(--text-main)', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={24} />
            </button>
            
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', userSelect: 'none', minWidth: '80px', textAlign: 'center' }}>
              Sayfa {activePageIndex + 1} / {pages.length}
            </div>

            <button 
              onClick={goToNextPage}
              disabled={activePageIndex === pages.length - 1}
              style={{ background: 'transparent', border: 'none', cursor: activePageIndex === pages.length - 1 ? 'not-allowed' : 'pointer', color: activePageIndex === pages.length - 1 ? '#ccc' : 'var(--text-main)', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={24} />
            </button>
            
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }}></div>
            
            <button 
              onClick={handleAddPage}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
            >
              <Plus size={18} /> <span className="hide-on-mobile">Yeni</span>
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
          Lütfen bir sayfa oluşturun.
        </div>
      )}

      <style>{`
        .notebook-layout { animation: fadeIn 0.3s ease; }
        .hide-on-mobile { display: inline; }
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .notebook-toolbar { justify-content: space-between; }
          .notebook-pagination { width: 90%; justify-content: space-between; bottom: 16px; }
        }
      `}</style>
    </div>
  );
}
