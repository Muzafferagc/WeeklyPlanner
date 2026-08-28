import React, { useState, useEffect, useRef } from 'react';
import { getNotebookData, saveNotebookData, generateId } from '../utils/storage';
import { Plus, Trash2, Image as ImageIcon, PenTool, MousePointer2, Eraser, Trash, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import Draggable from 'react-draggable';

export default function NotebookView({ refreshTrigger, onDataChange }) {
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
    setPages(data);
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

  // When active page changes, load its drawing paths
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
      title: `Sayfa ${pages.length + 1}`,
      content: '',
      drawingData: null,
      images: [],
      createdAt: new Date().toISOString()
    };
    const newPages = [...pages, newPage];
    setPages(newPages);
    setActivePageId(newPage.id);
    await saveNotebookData(newPages);
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
      if (activePageId === id) {
        setActivePageId(newPages[0].id);
      }
      await saveNotebookData(newPages);
      if (onDataChange) onDataChange();
    }
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activePage) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      const newImage = { id: generateId(), url: base64, x: 50, y: 50 }; // Default spawn coordinates
      const newPages = pages.map(p => p.id === activePageId ? { ...p, images: [...(p.images || []), newImage] } : p);
      setPages(newPages);
      await saveNotebookData(newPages);
      if (onDataChange) onDataChange();
    };
    reader.readAsDataURL(file);
  };
  
  const handleUpdateImagePosition = async (imgId, data) => {
    if (!activePage) return;
    const newPages = pages.map(p => {
      if (p.id === activePageId) {
        const updatedImages = (p.images || []).map(img => 
          img.id === imgId ? { ...img, x: data.x, y: data.y } : img
        );
        return { ...p, images: updatedImages };
      }
      return p;
    });
    setPages(newPages);
    await saveNotebookData(newPages);
  };

  const handleDeleteImage = async (imgId) => {
    if (!activePage) return;
    const newPages = pages.map(p => {
      if (p.id === activePageId) {
        return { ...p, images: (p.images || []).filter(img => img.id !== imgId) };
      }
      return p;
    });
    setPages(newPages);
    await saveNotebookData(newPages);
    if (onDataChange) onDataChange();
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

  if (loading) return <div className="loading-screen">Defter Yükleniyor...</div>;

  return (
    <div className="notebook-layout" style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
      
      {activePage ? (
        <>
          {/* TOPBAR */}
          <div className="notebook-toolbar no-print" style={{ 
            padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', 
            display: 'flex', gap: '12px', alignItems: 'center', zIndex: 10, flexWrap: 'wrap'
          }}>
            <input 
              type="text" 
              value={activePage.title}
              onChange={e => handleSavePageTitle(activePage.id, e.target.value)}
              style={{ fontSize: '18px', fontWeight: 'bold', border: 'none', outline: 'none', background: 'transparent', minWidth: '150px', flex: '1 1 auto' }}
              placeholder="Sayfa Başlığı"
            />
            
            <div className="toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
