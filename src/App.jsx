import React, { useState, useEffect } from 'react';
import { Settings, Sun, Moon, Download, Upload, RotateCcw, Printer, FileText, Copy } from 'lucide-react';
import WeeklySchedule from './components/WeeklySchedule';
import Sidebar from './components/Sidebar';
import SlotDetailModal from './components/SlotDetailModal';
import DefaultPlanTemplateModal from './components/DefaultPlanTemplateModal';
import DetailedReport from './components/DetailedReport';
import DialogModal from './components/DialogModal';
import CopyWeekModal from './components/CopyWeekModal';
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
  copyWeekSchedule
} from './utils/storage';
import confetti from 'canvas-confetti';

function App() {
  const [weeks, setWeeks] = useState([]);
  const [currentWeekId, setCurrentWeekId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [defaultPlanModalOpen, setDefaultPlanModalOpen] = useState(false);
  const [copyWeekModalOpen, setCopyWeekModalOpen] = useState(false);
  const [progress, setProgress] = useState({ total: 0, completed: 0 });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null });

  useEffect(() => {
    loadApp();
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

  const loadApp = async () => {
    const loadedWeeks = await getWeeks();
    setWeeks(loadedWeeks);
    
    // Date Backup Restore: Check if backup restored a saved active week date
    const savedActiveWeekId = localStorage.getItem('savedActiveWeekId');
    if (savedActiveWeekId && loadedWeeks.some(w => w.id === savedActiveWeekId)) {
      setCurrentWeekId(savedActiveWeekId);
    } else if (loadedWeeks.length > 0) {
      setCurrentWeekId(loadedWeeks[0].id);
    }
    setLoading(false);
  };

  const handleCreateWeek = async () => {
    const newWeek = await createNewWeek();
    const updatedWeeks = await getWeeks();
    setWeeks(updatedWeeks);
    setCurrentWeekId(newWeek.id);
  };

  const handleDeleteWeek = async (id) => {
    const success = await deleteWeek(id);
    if (success) {
      const updatedWeeks = await getWeeks();
      setWeeks(updatedWeeks);
      if (currentWeekId === id) {
        setCurrentWeekId(updatedWeeks[0].id);
      }
    } else {
      alert("Son haftayı silemezsiniz!");
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
    if (successCount < weekIds.length) {
      alert("Bazı haftalar silindi ancak son hafta silinemedi.");
    }
  };

  const handleRenameWeek = async (id, newName) => {
    const updatedWeeks = await renameWeek(id, newName);
    setWeeks(updatedWeeks);
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

  const handleConfirmReset = async () => {
    if (currentWeekId) {
      const defaultTemplate = await getDefaultScheduleTemplate();
      await saveScheduleForWeek(currentWeekId, defaultTemplate);
      setConfirmDialog({ isOpen: false });
      window.location.reload();
    }
  };

  const handleApplyTemplateToWeek = async (template) => {
    if (currentWeekId && template) {
      await saveScheduleForWeek(currentWeekId, template);
      window.location.reload();
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

  return (
    <div className="app-layout">
      <Sidebar 
        weeks={weeks}
        currentWeekId={currentWeekId}
        onSelectWeek={setCurrentWeekId}
        onCreateWeek={handleCreateWeek}
        onDeleteWeek={handleDeleteWeek}
        onRenameWeek={handleRenameWeek}
        onMultiDeleteWeeks={handleMultiDeleteWeeks}
        onMultiExportWeeks={handleExport}
        onOpenDefaultPlanModal={() => setDefaultPlanModalOpen(true)}
      />
      <div className="app-container">
        <header className="header no-print">
          <div className="header-top">
            <div>
              <h1>Haftalık Planım</h1>
              <p className="subtitle">{currentWeekName}</p>
            </div>
            <div className="header-actions">
              <button 
                className="print-btn default-plan-btn"
                onClick={() => setCopyWeekModalOpen(true)}
                title="Mevcut haftanın planını başka haftaya kopyala"
              >
                <Copy size={18} />
                <span className="btn-text-responsive">Haftayı Kopyala</span>
              </button>

              <button 
                className="print-btn default-plan-btn"
                onClick={() => setDefaultPlanModalOpen(true)}
                title="Varsayılan Plan Şablonunu Düzenle"
              >
                <Settings size={18} />
                <span className="btn-text-responsive">Varsayılan Plan</span>
              </button>

              <button className="print-btn" onClick={() => setIsDarkMode(!isDarkMode)} title="Gece/Gündüz Modu">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="print-btn" onClick={() => handleExport(null)} title="Tüm Verileri (ve Aktif Tarihi) Yedekle">
                <Download size={18} />
              </button>
              <button className="print-btn" onClick={handleImport} title="Yedeği (Tarih Bilgisiyle) Yükle">
                <Upload size={18} />
              </button>
              <button className="print-btn reset-btn" onClick={requestReset} title="Varsayılana Sıfırla">
                <RotateCcw size={18} />
              </button>
              <button className="print-btn" onClick={handleDetailedPrint} title="Notlar ve görevlerle birlikte detaylı rapor yazdır">
                <FileText size={18} />
                Detaylı Rapor
              </button>
              <button className="print-btn" onClick={handlePrint} title="Sadece haftalık tabloyu yazdır">
                <Printer size={18} />
                Poster Yazdır
              </button>
            </div>
          </div>
          
          <div className="progress-container" title={`Haftalık Görevler: ${progress.completed}/${progress.total}`}>
            <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div className="progress-text">Haftalık Görev İlerlemesi: %{progressPercent}</div>
        </header>
        <main>
          {currentWeekId && <WeeklySchedule key={currentWeekId} weekId={currentWeekId} onScheduleChange={() => updateProgress(currentWeekId)} />}
        </main>
      </div>

      <DialogModal 
        isOpen={confirmDialog.isOpen}
        title="Mevcut Haftayı Varsayılana Sıfırla"
        message="Mevcut haftanızın planı silinecek ve kayıtlı Varsayılan Plan Şablonunuz yüklenecektir. Onaylıyor musunuz?"
        confirmText="Evet, Sıfırla"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmDialog({ isOpen: false })}
      />

      <DefaultPlanTemplateModal
        isOpen={defaultPlanModalOpen}
        onClose={() => setDefaultPlanModalOpen(false)}
        onApplyToCurrentWeek={handleApplyTemplateToWeek}
      />

      <CopyWeekModal
        isOpen={copyWeekModalOpen}
        sourceWeek={currentWeekObj}
        weeks={weeks}
        onClose={() => setCopyWeekModalOpen(false)}
        onCopyWeek={handleExecuteCopyWeek}
      />

      {currentWeekId && (
        <DetailedReport weekId={currentWeekId} weekName={currentWeekName} />
      )}
    </div>
  );
}

export default App;
