import React, { useState, useEffect } from 'react';
import { Printer, Download, Upload, Sun, Moon, RotateCcw, FileText, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';
import Sidebar from './components/Sidebar';
import WeeklySchedule from './components/WeeklySchedule';
import DetailedReport from './components/DetailedReport';
import DialogModal from './components/DialogModal';
import DefaultPlanTemplateModal from './components/DefaultPlanTemplateModal';
import { 
  getWeeks, 
  createNewWeek, 
  deleteWeek, 
  renameWeek, 
  getScheduleForWeek,
  saveScheduleForWeek,
  exportData, 
  importData,
  getDefaultScheduleTemplate
} from './utils/storage';

function App() {
  const [weeks, setWeeks] = useState([]);
  const [currentWeekId, setCurrentWeekId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ total: 0, completed: 0 });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null });
  const [defaultPlanModalOpen, setDefaultPlanModalOpen] = useState(false);

  useEffect(() => {
    loadWeeks();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (currentWeekId) {
      updateProgress(currentWeekId);
    }
  }, [currentWeekId]);

  const loadWeeks = async () => {
    setLoading(true);
    const loadedWeeks = await getWeeks();
    setWeeks(loadedWeeks);
    if (!currentWeekId && loadedWeeks.length > 0) {
      setCurrentWeekId(loadedWeeks[0].id);
    }
    setLoading(false);
  };

  const handleCreateWeek = async () => {
    const newWeek = await createNewWeek();
    setWeeks(await getWeeks());
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
    const jsonStr = await exportData(weekIds);
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
        const success = await importData(event.target.result);
        if (success) {
          alert("Yedek başarıyla yüklendi!");
          window.location.reload();
        } else {
          alert("Dosya bozuk veya desteklenmeyen formatta.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
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

  const currentWeekName = weeks.find(w => w.id === currentWeekId)?.name;
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
                onClick={() => setDefaultPlanModalOpen(true)}
                title="Varsayılan Plan Şablonunu (%90 Ekran) Düzenle"
              >
                <Settings size={18} />
                <span className="btn-text-responsive">Varsayılan Plan</span>
              </button>

              <button className="print-btn" onClick={() => setIsDarkMode(!isDarkMode)} title="Gece/Gündüz Modu">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="print-btn" onClick={() => handleExport(null)} title="Tüm Verileri Yedekle">
                <Download size={18} />
              </button>
              <button className="print-btn" onClick={handleImport} title="Yedeği Yükle">
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

      {currentWeekId && (
        <DetailedReport weekId={currentWeekId} weekName={currentWeekName} />
      )}
    </div>
  );
}

export default App;
