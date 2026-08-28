import React, { useState, useEffect, useRef } from 'react';
import { getNotebookData, saveNotebookData, generateId } from '../utils/storage';
import { Plus, Trash2, Edit3, Image as ImageIcon, PenTool, MousePointer2, Eraser, Trash } from 'lucide-react';
import { ReactSketchCanvas } from 'react-sketch-canvas';

export default function NotebookView({ refreshTrigger, onDataChange }) {
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Drawing state
  const [drawMode, setDrawMode] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#2b2b2b');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.eraseMode(isEraser);
    }
  }, [isEraser]);
  
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

  // When active page changes, load its drawing paths
  useEffect(() => {
    if (activePage && canvasRef.current && activePage.drawingData) {
      canvasRef.current.loadPaths(activePage.drawingData);
    } else if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  }, [activePageId]); // Do NOT include activePage directly, otherwise it resets on every keystroke

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
  
  // Save drawing paths automatically
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
      title: 'Yeni Sayfa',
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
      const newImage = { id: generateId(), url: base64 };
      const newPages = pages.map(p => p.id === activePageId ? { ...p, images: [...(p.images || []), newImage] } : p);
      setPages(newPages);
      await saveNotebookData(newPages);
      if (onDataChange) onDataChange();
    };
    reader.readAsDataURL(file);
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

  if (loading) return <div className="loading-screen">Defter Yükleniyor...</div>;

  return (
    <div className="notebook-layout" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      
      {/* PAGES SIDEBAR */}
      <div className="notebook-sidebar no-print" style={{ width: '250px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-panel)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>Sayfalar</h3>
          <button className="icon-btn-subtle" onClick={handleAddPage}><Plus size={18}/></button>
        </div>
        <div className="pages-list" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {pages.map(page => (
            <div 
              key={page.id} 
              className={`page-item ${activePageId === page.id ? 'active' : ''}`}
              onClick={() => setActivePageId(page.id)}
              style={{ 
                padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
                backgroundColor: activePageId === page.id ? 'rgba(217, 74, 56, 0.1)' : 'transparent',
                border: activePageId === page.id ? '1px solid var(--primary-light)' : '1px solid transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: activePageId === page.id ? '600' : '400', color: activePageId === page.id ? 'var(--primary)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {page.title || 'İsimsiz Sayfa'}
              </span>
              <button 
                className="delete-page-btn"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', opacity: activePageId === page.id ? 1 : 0 }}
                onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }}
              >
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN NOTEBOOK PAGE */}
      <div className="notebook-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', position: 'relative' }}>
        
        {activePage ? (
          <>
            {/* TOOLBAR */}
            <div className="notebook-toolbar no-print" style={{ padding: '12px 24px', backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center', zIndex: 10 }}>
              <input 
                type="text" 
                value={activePage.title}
                onChange={e => handleSavePageTitle(activePage.id, e.target.value)}
                style={{ fontSize: '20px', fontWeight: 'bold', border: 'none', outline: 'none', background: 'transparent', width: '300px' }}
                placeholder="Sayfa Başlığı"
              />
              
              <div style={{ flex: 1 }}></div>
              
              {/* IMAGE UPLOAD */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', fontSize: '14px', fontWeight: '500' }}>
                <ImageIcon size={16}/> Fotoğraf Ekle
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              </label>

              <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>

              {/* DRAWING TOOLS */}
              <button 
                onClick={() => setDrawMode(!drawMode)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', backgroundColor: drawMode ? 'var(--primary)' : 'var(--bg-panel)', color: drawMode ? '#fff' : 'var(--text-main)', border: drawMode ? '1px solid var(--primary)' : '1px solid var(--border-color)', fontSize: '14px', fontWeight: '600' }}
              >
                {drawMode ? <PenTool size={16}/> : <MousePointer2 size={16}/>}
                {drawMode ? 'Çizim Modu Açık' : 'Yazı Modu Açık'}
              </button>
              
              {drawMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                  <input type="color" value={strokeColor} onChange={e => { setStrokeColor(e.target.value); setIsEraser(false); }} style={{ width: '24px', height: '24px', padding: 0, border: 'none', cursor: 'pointer' }} />
                  <input type="range" min="1" max="20" value={strokeWidth} onChange={e => setStrokeWidth(parseInt(e.target.value))} style={{ width: '80px' }} />
                  <button onClick={() => setIsEraser(!isEraser)} style={{ background: isEraser ? '#e5e7eb' : 'transparent', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer' }} title="Silgi"><Eraser size={18}/></button>
                  <button onClick={clearCanvas} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '4px', cursor: 'pointer' }} title="Tüm Çizimi Temizle"><Trash size={18}/></button>
                </div>
              )}
            </div>

            {/* PAGE CONTENT WRAPPER */}
            <div className="notebook-paper" style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
              
              {/* LINED BACKGROUND */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.1) 31px, rgba(0,0,0,0.1) 32px)', backgroundAttachment: 'local', zIndex: 1, pointerEvents: 'none' }}></div>
              
              {/* IMAGE GALLERY */}
              {activePage.images && activePage.images.length > 0 && (
                <div className="notebook-images" style={{ position: 'relative', zIndex: 2, padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {activePage.images.map(img => (
                    <div key={img.id} style={{ position: 'relative', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transform: 'rotate(-2deg)' }}>
                      <img src={img.url} alt="Note Attachment" style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
                      <button 
                        onClick={() => handleDeleteImage(img.id)}
                        style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      ><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              )}

              {/* TEXT AREA */}
              <textarea
                value={activePage.content || ''}
                onChange={e => handleSavePageContent(activePage.id, e.target.value)}
                style={{ 
                  position: 'relative', zIndex: 2, width: '100%', minHeight: '100%', 
                  background: 'transparent', border: 'none', resize: 'none', outline: 'none',
                  padding: '32px', fontSize: '16px', lineHeight: '32px', color: 'var(--text-main)',
                  fontFamily: 'inherit',
                  pointerEvents: drawMode ? 'none' : 'auto'
                }}
                placeholder="Notlarınızı buraya yazın..."
              />

              {/* DRAWING CANVAS (OVERLAY) */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, pointerEvents: drawMode ? 'auto' : 'none' }}>
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
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
            Lütfen sol menüden bir sayfa seçin.
          </div>
        )}
      </div>

      <style>{`
        .notebook-layout { animation: fadeIn 0.3s ease; }
        .page-item:hover { background-color: var(--bg-color) !important; }
        .page-item:hover .delete-page-btn { opacity: 1 !important; }
        @media (max-width: 768px) {
          .notebook-layout { flexDirection: 'column'; }
          .notebook-sidebar { width: '100% !important; borderRight: none !important; borderBottom: 1px solid var(--border-color); maxHeight: 150px; }
          .notebook-toolbar { flexWrap: wrap; }
          .notebook-toolbar input[type="text"] { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
