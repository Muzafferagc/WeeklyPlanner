import React, { useEffect, useState } from 'react';
import { getScheduleForWeek } from '../utils/storage';

const DetailedReport = ({ weekId, weekName }) => {
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    getScheduleForWeek(weekId).then(setSchedule);
  }, [weekId]);

  if (!schedule) return <div>Rapor Hazırlanıyor...</div>;

  const days = Object.keys(schedule);

  // Sadece içi dolu olan (not, görev, resim veya link içeren) etkinlikleri filtreleyelim
  // Veya hepsini gösterelim? Kullanıcı "içine yazdığım şeyler varsa" dediği için içi dolu olanları göstermek daha mantıklı.
  
  return (
    <div className="detailed-report print-only">
      <h1 className="report-main-title">Haftalık Detaylı Rapor: {weekName}</h1>
      
      {days.map(day => {
        const slotsWithDetails = schedule[day].filter(slot => 
          (slot.notes && slot.notes.trim() !== '') || 
          (slot.checklist && slot.checklist.length > 0) || 
          (slot.links && slot.links.length > 0) ||
          (slot.images && slot.images.length > 0)
        );

        if (slotsWithDetails.length === 0) return null;

        return (
          <div key={day} className="report-day-section">
            <h2 className="report-day-title">{day}</h2>
            
            {slotsWithDetails.map(slot => (
              <div key={slot.id} className="report-slot-card">
                <div className="report-slot-header">
                  <span className="report-time">{slot.time}</span>
                  <span className="report-activity">{slot.activity}</span>
                </div>
                
                <div className="report-slot-body">
                  {slot.notes && slot.notes.trim() !== '' && (
                    <div className="report-block">
                      <strong>📝 Notlar:</strong>
                      <p className="report-notes">{slot.notes}</p>
                    </div>
                  )}

                  {slot.checklist && slot.checklist.length > 0 && (
                    <div className="report-block">
                      <strong>✅ Görevler:</strong>
                      <ul className="report-list">
                        {slot.checklist.map(item => (
                          <li key={item.id}>
                            {item.completed ? '[x]' : '[ ]'} <span className={item.completed ? 'report-strike' : ''}>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {slot.links && slot.links.length > 0 && (
                    <div className="report-block">
                      <strong>🔗 Kaynaklar:</strong>
                      <ul className="report-list">
                        {slot.links.map(link => (
                          <li key={link.id}>
                            {link.title} - <a href={link.url}>{link.url}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {slot.images && slot.images.length > 0 && (
                    <div className="report-block">
                      <strong>🖼️ Görseller ({slot.images.length} adet):</strong>
                      <div className="report-images">
                        {slot.images.map(img => (
                          <img key={img.id} src={img.dataUrl} alt="Eklenti" className="report-thumb" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default DetailedReport;
