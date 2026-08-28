import React, { useState, useEffect, useRef } from 'react';
import { Settings, Sun, Moon, Download, Upload, RotateCcw, Printer, FileText, Copy, BookOpen, CalendarDays, Smartphone, Wifi, QrCode, Trash2, Bell, Save } from 'lucide-react';
import WeeklySchedule from './components/WeeklySchedule';
import CourseDetailsView from './components/CourseDetailsView';
import Sidebar from './components/Sidebar';
import TaskListView from './components/TaskListView';
import SlotDetailModal from './components/SlotDetailModal';

import DetailedReport from './components/DetailedReport';
import DialogModal from './components/DialogModal';
import CopyWeekModal from './components/CopyWeekModal';
import ChangeWeekDateModal from './components/ChangeWeekDateModal';
import SyncModal from './components/SyncModal';
import MobileNav from './components/MobileNav';
import PwaBanner from './components/PwaBanner';
import CreateWeekModal from './components/CreateWeekModal';
import { Calendar } from 'lucide-react';
import { APP_VERSION } from './config/version';
import { 
  getWeeks, 
  createNewWeek, 
  deleteWeek, 
  renameWeek, 
  saveScheduleForWeek,
  getDefaultScheduleTemplate,
  exportData,
  importData,
  getScheduleForWeek,
  copyWeekSchedule,
  getCustomLists,
  getCustomTasks,
  generateId,
  resetDefaultScheduleTemplateToFactory,
  saveDefaultScheduleTemplate
} from './utils/storage';
import { getSyncRoom, subscribeToCloudSync, broadcastToCloud } from './utils/syncService';
import confetti from 'canvas-confetti';

const SMART_LISTS = {
  smart_myday: { id: 'smart_myday', name: 'Günüm', icon: 'Sun' },
  smart_important: { id: 'smart_important', name: 'Önemli', icon: 'Star' },
  smart_planned: { id: 'smart_planned', name: 'Planlanan', icon: 'Calendar' },
  smart_all: { id: 'smart_all', name: 'Görevler & Notlar', icon: 'CheckSquare' }
};

function App() {
  const [activeTab, setActiveTab] = useState('list_programlanan'); // Default to "Programlanan İşler" list
  const [weeks, setWeeks] = useState([]);
  const [currentWeekId, setCurrentWeekId] = useState(null);
  const [customLists, setCustomLists] = useState([]);
  const [customTasks, setCustomTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [copyWeekModalOpen, setCopyWeekModalOpen] = useState(false);
  const [changeDateModalOpen, setChangeDateModalOpen] = useState(false);
  const [createWeekModalOpen, setCreateWeekModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [progress, setProgress] = useState({ total: 0, completed: 0 });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, payload: null });

  useEffect(() => {
    loadApp();
  }, []);

  const [syncRefreshKey, setSyncRefreshKey] = useState(0);
  const lastMutationTimeRef = React.useRef(0);

  useEffect(() => {
    // Setup Realtime Cloud Sync Listener
    const room = getSyncRoom();
    const handleSync = async (cloudData) => {
      // If we made a local edit in the last 15 seconds, don't let incoming cloud polling overwrite our local state!
      if (Date.now() - lastMutationTimeRef.current < 15000) {
        return;
      }
      if (cloudData && typeof cloudData === 'object' && Array.isArray(cloudData.weeks) && cloudData.weeks.length > 0) {
        const res = await importData(JSON.stringify(cloudData));
        if (res && res.success) {
          const loadedWeeks = await getWeeks();
          const loadedLists = await getCustomLists();
          const loadedTasks = await getCustomTasks();
          setWeeks(loadedWeeks);
          setCustomLists(loadedLists);
          setCustomTasks(loadedTasks);
          setSyncRefreshKey(prev => prev + 1);
        }
      }
    };

    subscribeToCloudSync(room, handleSync);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (currentWeekId) {
      updateProgress(currentWeekId);
    }
  }, [currentWeekId]);

  // Lock body scroll when mobile drawer is open to prevent background scrolling
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.classList.add('drawer-open-lock');
    } else {
      document.body.classList.remove('drawer-open-lock');
    }
    return () => {
      document.body.classList.remove('drawer-open-lock');
    };
  }, [isMobileDrawerOpen]);

  const broadcastCurrentState = async () => {
    lastMutationTimeRef.current = Date.now();
    const room = getSyncRoom();
    const jsonStr = await exportData(null, currentWeekId);
    try {
      const dataObj = JSON.parse(jsonStr);
      await broadcastToCloud(room, dataObj);
    } catch (e) {}
  };

  const loadApp = async () => {
    const loadedWeeks = await getWeeks();
    setWeeks(loadedWeeks);

    const loadedLists = await getCustomLists();
    setCustomLists(loadedLists);

    const loadedTasks = await getCustomTasks();
    setCustomTasks(loadedTasks);
    
    // Date Backup Restore: Check if backup restored a saved active week date
    const savedActiveWeekId = localStorage.getItem('savedActiveWeekId');
    if (savedActiveWeekId && loadedWeeks.some(w => w.id === savedActiveWeekId)) {
      setCurrentWeekId(savedActiveWeekId);
    } else if (loadedWeeks.length > 0) {
      setCurrentWeekId(loadedWeeks[0].id);
    }
    setLoading(false);
    setTimeout(() => {
      broadcastCurrentState();
    }, 500);
  };

  const refreshCustomData = async () => {
    const lists = await getCustomLists();
    const tasks = await getCustomTasks();
    setCustomLists(lists);
    setCustomTasks(tasks);
    await broadcastCurrentState();

    try {
      const room = getSyncRoom();
      const { fetchCloudState } = await import('./utils/syncService');
      const cloudData = await fetchCloudState(room);
      if (cloudData) {
        const res = await importData(JSON.stringify(cloudData));
        if (res && res.success) {
          setWeeks(await getWeeks());
          setCustomLists(await getCustomLists());
          setCustomTasks(await getCustomTasks());
        }
      }
    } catch (e) {}
  };

  const handleCreateWeek = async (mode = 'next', customDate = null) => {
    const newWeek = await createNewWeek(mode, customDate, currentWeekId);
    const updatedWeeks = await getWeeks();
    setWeeks(updatedWeeks);
    setCurrentWeekId(newWeek.id);
    broadcastCurrentState();
  };

  const handleDeleteWeek = (id) => {
    if (weeks.length <= 1) {
      alert("Son haftayı silemezsiniz!");
      return;
    }
    setConfirmDialog({ isOpen: true, type: 'delete_week', payload: id });
  };

  const executeDeleteWeek = async (id) => {
    const success = await deleteWeek(id);
    if (success) {
      const updatedWeeks = await getWeeks();
      setWeeks(updatedWeeks);
      if (currentWeekId === id) {
        setCurrentWeekId(updatedWeeks[0].id);
      }
      broadcastCurrentState();
    }
  };

  const handleMultiDeleteWeeks = async (weekIds) => {
    let successCount = 0;
    for (const id of weekIds) {
      const success = await deleteWeek(id);
      if (success) successCount++;
    }
    const updatedWeeks = await getWeeks();
    setWeeks(updatedWeeks);
    if (weekIds.includes(currentWeekId)) {
      setCurrentWeekId(updatedWeeks[0].id);
    }
    broadcastCurrentState();
  };

  const handleRenameWeek = async (id, newName) => {
    const updatedWeeks = await renameWeek(id, newName);
    setWeeks(updatedWeeks);
    broadcastCurrentState();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDetailedPrint = () => {
    document.body.classList.add('print-mode-detailed');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-mode-detailed');
    }, 100);
  };

  const requestReset = () => {
    setConfirmDialog({ isOpen: true, type: 'reset' });
  };

  const handleConfirmReset = async (mode = 'factory') => {
    if (currentWeekId) {
      setConfirmDialog({ isOpen: false, type: null });
      lastMutationTimeRef.current = Date.now() + 15000; // Lock cloud polling overwrite for 15s

      // 1. Clear any corrupted custom template from localforage & localStorage or load custom template
      let baseTemplate;
      if (mode === 'template') {
        baseTemplate = await getDefaultScheduleTemplate();
      } else {
        baseTemplate = await resetDefaultScheduleTemplateToFactory();
      }
      
      // 2. Generate fresh schedule with new IDs & completed: false
      const freshSchedule = JSON.parse(JSON.stringify(baseTemplate));
      for (let day in freshSchedule) {
        if (Array.isArray(freshSchedule[day])) {
          freshSchedule[day] = freshSchedule[day].map(s => ({ 
            ...s, 
            id: generateId(),
            completed: false 
          }));
        }
      }

      // 3. Save locally to localforage
      await saveScheduleForWeek(currentWeekId, freshSchedule);
      await updateProgress(currentWeekId);

      // 4. Force React UI re-mount
      setSyncRefreshKey(Date.now());

      // 5. Broadcast fresh reset data to Cloud Supabase immediately
      await broadcastCurrentState();

      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.7 }
        });
      } catch (e) {}
    }
  };

  const handleApplyTemplateToWeek = async (template) => {
    if (currentWeekId && template) {
      const freshSchedule = JSON.parse(JSON.stringify(template));
      for (let day in freshSchedule) {
        if (Array.isArray(freshSchedule[day])) {
          freshSchedule[day] = freshSchedule[day].map(s => ({ ...s, id: generateId() }));
        }
      }
      await saveScheduleForWeek(currentWeekId, freshSchedule);
      await updateProgress(currentWeekId);
      setSyncRefreshKey(prev => prev + 1);
      await broadcastCurrentState();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 }
        });
      } catch (e) {}
    }
  };

  const handleSaveCurrentWeekAsTemplate = async () => {
    if (!currentWeekId) return;
    if (window.confirm('Bu haftaki mevcut planınız "Varsayılan Plan Şablonu" olarak kaydedilsin mi?\n\n(Bundan sonra oluşturacağınız tüm yeni haftalar veya sıfırlamalar bu haftanın düzeniyle başlayacaktır.)')) {
      try {
        const currentData = await getScheduleForWeek(currentWeekId);
        
        const cleanTemplate = JSON.parse(JSON.stringify(currentData));
        for (let day in cleanTemplate) {
          if (Array.isArray(cleanTemplate[day])) {
            cleanTemplate[day] = cleanTemplate[day].map(s => ({
              ...s,
              completed: false
            }));
          }
        }
        
        await saveDefaultScheduleTemplate(cleanTemplate);
        
        alert(`✓ Mevcut hafta başarıyla Varsayılan Plan Şablonu olarak kaydedildi!`);
      } catch (err) {
        alert('Şablon kaydedilirken bir hata oluştu: ' + err.message);
      }
    }
  };

  const handleExport = async (weekIds = null) => {
    const jsonStr = await exportData(weekIds, currentWeekId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haftalik-planlayici-yedek.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const res = await importData(event.target.result);
        if (res && res.success) {
          alert("✓ Yedek ve tarih bilgisi başarıyla yüklendi!");
          window.location.reload();
        } else {
          alert("Dosya bozuk veya desteklenmeyen formatta.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleChangeWeekDate = async (weekId, chosenDateStr) => {
    const { updateWeekDate } = await import('./utils/storage');
    const updatedWeeks = await updateWeekDate(weekId, chosenDateStr);
    setWeeks(updatedWeeks);
    broadcastCurrentState();
    alert("✓ Hafta tarihi başarıyla güncellendi!");
  };

  const handleExecuteCopyWeek = async (sourceWeekId, targetId) => {
    let finalTargetId = targetId;
    if (targetId === 'new') {
      const newWeek = await createNewWeek();
      finalTargetId = newWeek.id;
    }
    
    await copyWeekSchedule(sourceWeekId, finalTargetId);
    const updatedWeeks = await getWeeks();
    setWeeks(updatedWeeks);
    setCurrentWeekId(finalTargetId);
    broadcastCurrentState();

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 }
    });

    const targetWeekObj = updatedWeeks.find(w => w.id === finalTargetId);
    alert(`✓ Plan başarıyla ${targetWeekObj ? targetWeekObj.name : ''} tarihine kopyalandı!`);
  };

  const updateProgress = async (weekId) => {
    const sched = await getScheduleForWeek(weekId);
    let total = 0;
    let completed = 0;
    if (sched) {
      Object.values(sched).forEach(dayArr => {
        if (Array.isArray(dayArr)) {
          dayArr.forEach(slot => {
            total += 1;
            if (slot.completed) {
              completed += 1;
            }
          });
        }
      });
    }
    setProgress(prev => {
      if (total > 0 && completed === total && prev.completed !== prev.total) {
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
          confetti({
            particleCount: 8,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#2b2b2b', '#5c5c5c', '#d94a38']
          });
          confetti({
            particleCount: 8,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#2b2b2b', '#5c5c5c', '#d94a38']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      }
      return { total, completed };
    });
  };

  if (loading) {
    return <div className="loading-screen">Yükleniyor...</div>;
  }

  const currentWeekObj = weeks.find(w => w.id === currentWeekId);
  const currentWeekName = currentWeekObj?.name;
  const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  // Determine current active list object (smart or custom)
  let currentListObj = null;
  if (SMART_LISTS[activeTab]) {
    currentListObj = SMART_LISTS[activeTab];
  } else if (activeTab !== 'schedule' && activeTab !== 'details') {
    currentListObj = customLists.find(l => l.id === activeTab) || customLists[0] || SMART_LISTS.smart_all;
  }
  if (!currentListObj) {
    currentListObj = SMART_LISTS.smart_all;
  }

  return (
    <div className="app-layout">
      <PwaBanner />
      <Sidebar 
        weeks={weeks}
        currentWeekId={currentWeekId}
        onSelectWeek={setCurrentWeekId}
        onCreateWeek={() => setCreateWeekModalOpen(true)}
        onDeleteWeek={handleDeleteWeek}
        onRenameWeek={handleRenameWeek}
        onMultiDeleteWeeks={handleMultiDeleteWeeks}
        onMultiExportWeeks={handleExport}
        onOpenDefaultPlanModal={() => setDefaultPlanModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        customLists={customLists}
        customTasks={customTasks}
        onRefreshData={refreshCustomData}
        onResetCurrentWeek={requestReset}
        onSaveCurrentWeekAsTemplate={handleSaveCurrentWeekAsTemplate}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
      />
      <div className="app-container">
        {/* HEADER ONLY ON SCHEDULE/DETAILS TABS, OR CUSTOM HEADER BAR */}
        {(activeTab === 'schedule' || activeTab === 'details') ? (
          <header className="header no-print">
            <div className="header-top">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0 }}>{activeTab === 'details' ? 'Ders & Müfredat Yol Haritası' : 'Haftalık Planım'}</h1>
                  <span className="app-version-badge" title="Mevcut Güncel Sürüm">{APP_VERSION}</span>
                </div>
                {activeTab === 'schedule' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p className="subtitle" style={{ margin: 0 }}>{currentWeekName}</p>
                    <button
                      type="button"
                      className="icon-btn-date"
                      onClick={() => setChangeDateModalOpen(true)}
                      title="Takvimden Tarih Seçip Güncelle"
                      style={{
                        background: 'rgba(0,0,0,0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--primary)'
                      }}
                    >
                      <Calendar size={14} /> Tarih Değiştir
                    </button>
                  </div>
                )}
                {activeTab === 'details' && (
                  <p className="subtitle" style={{ margin: 0 }}>Konular, Çalışma Notları ve Yol Haritaları</p>
                )}
              </div>
              <div className="header-actions">
                <button 
                  className="print-btn sync-btn-highlight" 
                  onClick={() => setSyncModalOpen(true)} 
                  title="Mobil & Cihaz Senkronizasyonu (QR Kod)"
                >
                  <Smartphone size={18} />
                  <span className="btn-text-responsive">Mobil / QR Bağlan</span>
                </button>

                {activeTab === 'schedule' && (
                  <>
                    <button 
                      className="print-btn default-plan-btn"
                      onClick={() => setCopyWeekModalOpen(true)}
                      title="Mevcut haftanın planını başka haftaya kopyala"
                    >
                      <Copy size={18} />
                      <span className="btn-text-responsive">Haftayı Kopyala</span>
                    </button>

                    {weeks.length > 1 && (
                      <button 
                        className="print-btn"
                        onClick={() => handleDeleteWeek(currentWeekId)}
                        title="Mevcut Haftayı Sil"
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                      >
                        <Trash2 size={18} />
                        <span className="btn-text-responsive">Haftayı Sil</span>
                      </button>
                    )}
                  </>
                )}

                <button className="print-btn" onClick={() => setIsDarkMode(!isDarkMode)} title="Gece/Gündüz Modu">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="print-btn" onClick={() => handleExport(null)} title="Tüm Verileri (ve Aktif Tarihi) Yedekle">
                  <Download size={18} />
                </button>
                <button className="print-btn" onClick={handleImport} title="Yedeği (Tarih Bilgisiyle) Yükle">
                  <Upload size={18} />
                </button>
                {activeTab === 'schedule' && (
                  <>
                    <button className="print-btn" onClick={handleSaveCurrentWeekAsTemplate} title="Mevcut Haftayı Varsayılan Şablon Yap" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                      <Save size={18} />
                      <span className="btn-text-responsive">Şablon Yap</span>
                    </button>
                    <button className="print-btn reset-btn" onClick={requestReset} title="Mevcut Haftayı Varsayılan Plana Sıfırla" style={{ color: '#d97706', borderColor: 'rgba(217, 119, 6, 0.4)' }}>
                      <RotateCcw size={18} />
                      <span className="btn-text-responsive">Haftayı Sıfırla</span>
                    </button>
                    <button className="print-btn" onClick={handleDetailedPrint} title="Notlar ve görevlerle birlikte detaylı rapor yazdır">
                      <FileText size={18} />
                      Detaylı Rapor
                    </button>
                    <button className="print-btn" onClick={handlePrint} title="Sadece haftalık tabloyu yazdır">
                      <Printer size={18} />
                      Poster Yazdır
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {activeTab === 'schedule' && (
              <>
                <div className="progress-container" title={`Haftalık Görevler: ${progress.completed}/${progress.total}`}>
                  <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="progress-text">Haftalık Görev İlerlemesi: %{progressPercent}</div>
              </>
            )}
          </header>
        ) : (
          /* QUICK GLOBAL TOP BAR FOR TASK LIST VIEWS */
          <div className="top-global-bar no-print">
            <div className="bar-actions-right">
              <button 
                className="print-btn sync-btn-highlight" 
                onClick={() => setSyncModalOpen(true)} 
                title="Mobil & Cihaz Senkronizasyonu (QR Kod)"
              >
                <Smartphone size={18} />
                <span className="btn-text-responsive">Mobil / QR Bağlan</span>
              </button>
              <button className="print-btn" onClick={() => setIsDarkMode(!isDarkMode)} title="Gece/Gündüz Modu">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="print-btn" onClick={() => handleExport(null)} title="Tüm Verileri Yedekle">
                <Download size={18} /> Yedekle
              </button>
              <button className="print-btn" onClick={handleImport} title="Yedeği Yükle">
                <Upload size={18} /> Yükle
              </button>
            </div>
          </div>
        )}

        <main className="main-content-area">
          {activeTab === 'schedule' && currentWeekId && (
            <WeeklySchedule 
              key={`${currentWeekId}_${syncRefreshKey}`} 
              weekId={currentWeekId} 
              weeks={weeks}
              onSelectWeek={(id) => setCurrentWeekId(id)}
              onCreateNewWeek={() => setCreateWeekModalOpen(true)}
              onDeleteWeek={handleDeleteWeek}
              onMultiDeleteWeeks={handleMultiDeleteWeeks}
              refreshTrigger={syncRefreshKey}
              onScheduleChange={() => { updateProgress(currentWeekId); broadcastCurrentState(); }} 
            />
          )}
          {activeTab === 'details' && (
            <CourseDetailsView 
              weeks={weeks} 
              currentWeekId={currentWeekId} 
              refreshTrigger={syncRefreshKey}
              onDataChange={broadcastCurrentState}
            />
          )}
          {activeTab !== 'schedule' && activeTab !== 'details' && (
            <TaskListView 
              key={activeTab}
              currentList={currentListObj}
              tasks={customTasks}
              customLists={customLists}
              onRefreshData={refreshCustomData}
              onNavigateToList={(listId) => setActiveTab(listId)}
            />
          )}
        </main>
      </div>

      <DialogModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'delete_week' ? "Haftayı Sil" : "Haftayı Şablona Sıfırla"}
        message={
          confirmDialog.type === 'delete_week' 
            ? "Bu haftayı ve içindeki tüm kayıtları kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
            : "Mevcut haftanızdaki tüm işlemler silinecek ve kaydettiğiniz 'Varsayılan Şablon' ekranınıza yüklenecektir. Emin misiniz?"
        }
        confirmText={confirmDialog.type === 'delete_week' ? "Evet, Sil" : "Evet, Şablona Sıfırla"}
        onConfirm={() => {
          if (confirmDialog.type === 'delete_week') {
            executeDeleteWeek(confirmDialog.payload);
            setConfirmDialog({ isOpen: false, type: null, payload: null });
          } else {
            handleConfirmReset('template');
          }
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null, payload: null })}
      />

      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onRoomChanged={(newRoom) => {
          setSyncModalOpen(false);
          window.location.reload();
        }}
      />


      <ChangeWeekDateModal
        isOpen={changeDateModalOpen}
        currentWeek={currentWeekObj}
        onClose={() => setChangeDateModalOpen(false)}
        onChangeDate={handleChangeWeekDate}
      />

      <CopyWeekModal
        isOpen={copyWeekModalOpen}
        sourceWeek={currentWeekObj}
        weeks={weeks}
        onClose={() => setCopyWeekModalOpen(false)}
        onCopyWeek={handleExecuteCopyWeek}
      />

      <CreateWeekModal
        isOpen={createWeekModalOpen}
        onClose={() => setCreateWeekModalOpen(false)}
        onCreateWeek={handleCreateWeek}
      />

      {currentWeekId && (
        <DetailedReport weekId={currentWeekId} weekName={currentWeekName} />
      )}



      <MobileNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleSidebarDrawer={() => setIsMobileDrawerOpen(prev => !prev)}
        customTasks={customTasks}
      />
    </div>
  );
}

export default App;

