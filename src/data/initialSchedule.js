const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);

export const initialSchedule = {
  Pazartesi: [
    { id: generateId(), time: "07:00", activity: "Uyanış" },
    { id: generateId(), time: "07:30", activity: "Koşuya çıkış" },
    { id: generateId(), time: "08:10", activity: "Yurda geliş" },
    { id: generateId(), time: "08:10 - 09:20", activity: "Duş, diş fırçalama, kahvaltı, hazır oluş" },
    { id: generateId(), time: "09:30 - 10:30", activity: "Trading analiz, markete bakma, biraz Broken Lollipop vs." },
    { id: generateId(), time: "10:30 - 12:00", activity: "MLOps çalışması" },
    { id: generateId(), time: "12:00 - 12:30", activity: "Öğle yemeği ve derse gidiş" },
    { id: generateId(), time: "13:30 - 17:20", activity: "Ders" },
    { id: generateId(), time: "18:30", activity: "Spora varış (Full Body Antrenmanı)" },
    { id: generateId(), time: "19:30 - 20:00", activity: "Spordan çıkış ve yurda varış" },
    { id: generateId(), time: "20:30 - 22:00", activity: "Discrete Math (Yoğunluğa göre esnek)" },
    { id: generateId(), time: "23:30 - 00:00", activity: "Uyku" }
  ],
  Salı: [
    { id: generateId(), time: "07:00", activity: "Uyanış" },
    { id: generateId(), time: "07:30", activity: "Koşuya çıkış" },
    { id: generateId(), time: "08:10", activity: "Yurda geliş" },
    { id: generateId(), time: "08:10 - 09:20", activity: "Duş, diş fırçalama, kahvaltı, hazır oluş" },
    { id: generateId(), time: "09:30 - 10:30", activity: "Trading bakma, öğrenme, chart analizi" },
    { id: generateId(), time: "10:30 - 12:00", activity: "JAVA OOP tekrarı ve öğrenme" },
    { id: generateId(), time: "12:00", activity: "Öğle yemeği ve derse gidiş" },
    { id: generateId(), time: "13:30 - 17:20", activity: "Ders" },
    { id: generateId(), time: "18:00 - 19:30", activity: "OOP and Design ders tekrarı" },
    { id: generateId(), time: "19:30 - 23:30", activity: "Serbest (Esnek planlama imkanı)" },
    { id: generateId(), time: "23:30 - 00:00", activity: "Uyku" }
  ],
  Çarşamba: [
    { id: generateId(), time: "06:00", activity: "Uyanış" },
    { id: generateId(), time: "06:30", activity: "Koşuya çıkış" },
    { id: generateId(), time: "07:10", activity: "Yurda geliş" },
    { id: generateId(), time: "08:10 - 08:20", activity: "Duş, diş fırçalama, kahvaltı" },
    { id: generateId(), time: "08:30 - 09:20", activity: "Trading chart analizi" },
    { id: generateId(), time: "09:20", activity: "Yurttan çıkış" },
    { id: generateId(), time: "09:30 - 12:30", activity: "Ders" },
    { id: generateId(), time: "12:30", activity: "Dersten çıkış ve öğle yemeği" },
    { id: generateId(), time: "13:30", activity: "Yurda varış ve dinlenme" },
    { id: generateId(), time: "14:30", activity: "Sporda olacak şekilde çıkış" },
    { id: generateId(), time: "15:30 - 16:00", activity: "Yurda dönüş (Full Body Antrenmanı sonrası)" },
    { id: generateId(), time: "16:30 - 18:00", activity: "Data Structures çalışması" },
    { id: generateId(), time: "18:00 - 19:00", activity: "Java çalışması" },
    { id: generateId(), time: "19:00 - 23:00", activity: "Serbest" },
    { id: generateId(), time: "23:00 - 23:30", activity: "Uyku" }
  ],
  Perşembe: [
    { id: generateId(), time: "06:00", activity: "Uyanış" },
    { id: generateId(), time: "06:30", activity: "Koşuya çıkış" },
    { id: generateId(), time: "07:10", activity: "Yurda geliş" },
    { id: generateId(), time: "08:10 - 08:20", activity: "Duş, diş fırçalama, kahvaltı" },
    { id: generateId(), time: "08:20 - 09:20", activity: "Trading analiz, öğrenme, video" },
    { id: generateId(), time: "09:20", activity: "Yurttan çıkış" },
    { id: generateId(), time: "09:30 - 12:20", activity: "Ders" },
    { id: generateId(), time: "12:20 - 13:30", activity: "Öğle arası yemek molası" },
    { id: generateId(), time: "13:30 - 17:20", activity: "Ders" },
    { id: generateId(), time: "18:00 - 19:00", activity: "Trading eğitim" },
    { id: generateId(), time: "19:00 - 23:00", activity: "Serbest" },
    { id: generateId(), time: "23:00 - 23:30", activity: "Uyku" }
  ],
  Cuma: [
    { id: generateId(), time: "06:00 / 07:00", activity: "Uyanış" },
    { id: generateId(), time: "07:00 - 08:10", activity: "Hazırlık (Koşu yok)" },
    { id: generateId(), time: "08:20", activity: "Yurttan çıkış" },
    { id: generateId(), time: "08:30 - 12:20", activity: "Ders" },
    { id: generateId(), time: "12:20", activity: "Dersten çıkış ve öğle yemeği" },
    { id: generateId(), time: "14:00", activity: "Spora gidiş (Full Body Antrenmanı)" },
    { id: generateId(), time: "15:00 - 15:30", activity: "Yurtta olacak şekilde çıkış" },
    { id: generateId(), time: "16:30 - 18:00", activity: "Statistical Inference çalışması" },
    { id: generateId(), time: "18:20 - 19:30", activity: "MLOps çalışması" },
    { id: generateId(), time: "19:30 - 23:30", activity: "Serbest (Trading, dil öğrenme, dizi, oyun vb.)" },
    { id: generateId(), time: "23:30", activity: "Uyku" }
  ],
  Cumartesi: [
    { id: generateId(), time: "07:00", activity: "Uyanış" },
    { id: generateId(), time: "07:30", activity: "Koşuya çıkış" },
    { id: generateId(), time: "08:10", activity: "Yurda geliş, duş, kahvaltı" },
    { id: generateId(), time: "09:00", activity: "Güne başlama" },
    { id: generateId(), time: "Gün Boyu", activity: "Serbest çalışma (Trading, dil, projeler, MLOps, Java vb.)" }
  ],
  Pazar: [
    { id: generateId(), time: "07:00", activity: "Uyanış" },
    { id: generateId(), time: "07:30", activity: "Koşuya çıkış" },
    { id: generateId(), time: "08:10", activity: "Yurda geliş, duş, kahvaltı" },
    { id: generateId(), time: "09:00", activity: "Güne başlama" },
    { id: generateId(), time: "Gün Boyu", activity: "Serbest çalışma (Trading, dil, projeler, MLOps, Java vb.)" },
    { id: generateId(), time: "Yatmadan 1 Saat Önce", activity: "Gelecek haftanın detaylı planlaması" }
  ]
};
