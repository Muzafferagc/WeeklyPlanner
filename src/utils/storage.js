import localforage from 'localforage';
import { initialSchedule } from '../data/initialSchedule';

localforage.config({
  name: 'HaftalikPlanlayici',
  storeName: 'plannerData'
});

export const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);

export const getMonday = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
};

export const formatWeekString = (mondayDate) => {
  const endDate = new Date(mondayDate);
  endDate.setDate(mondayDate.getDate() + 6);
  
  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const startDay = mondayDate.getDate();
  const startMonth = months[mondayDate.getMonth()];
  const endDay = endDate.getDate();
  const endMonth = months[endDate.getMonth()];
  
  if (startMonth === endMonth) {
    return `${startDay}-${endDay} ${startMonth}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }
};

export const getDefaultScheduleTemplate = async () => {
  const custom = await localforage.getItem('customDefaultSchedule');
  if (custom && typeof custom === 'object') {
    return JSON.parse(JSON.stringify(custom));
  }
  return JSON.parse(JSON.stringify(initialSchedule));
};

export const saveDefaultScheduleTemplate = async (template) => {
  await localforage.setItem('customDefaultSchedule', template);
};

export const resetDefaultScheduleTemplateToFactory = async () => {
  await localforage.removeItem('customDefaultSchedule');
  return JSON.parse(JSON.stringify(initialSchedule));
};

// Deduplicate helper by unique ID
const deduplicateWeeks = (weeksArr) => {
  if (!Array.isArray(weeksArr)) return [];
  const unique = [];
  const seenIds = new Set();
  for (const w of weeksArr) {
    if (w && w.id && !seenIds.has(w.id)) {
      seenIds.add(w.id);
      unique.push(w);
    }
  }
  return unique;
};

export const getWeeks = async () => {
  let weeks = await localforage.getItem('weeks');
  weeks = deduplicateWeeks(weeks);

  if (!weeks || weeks.length === 0) {
    const oldSaved = localStorage.getItem('weeklySchedule');
    let baseSchedule = await getDefaultScheduleTemplate();
    if (oldSaved) {
      try {
        baseSchedule = JSON.parse(oldSaved);
      } catch (e) {}
    }

    const currentMonday = getMonday();
    const defaultWeek = {
      id: generateId(),
      name: formatWeekString(currentMonday),
      startDate: currentMonday.toISOString(),
      createdAt: new Date().toISOString()
    };
    weeks = [defaultWeek];
    await localforage.setItem('weeks', weeks);
    await localforage.setItem(`schedule_${defaultWeek.id}`, baseSchedule);
  }
  return weeks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

export const createNewWeek = async () => {
  const weeks = await getWeeks();
  
  let nextMonday;
  if (weeks.length > 0 && weeks[weeks.length - 1].startDate) {
    nextMonday = new Date(weeks[weeks.length - 1].startDate);
    nextMonday.setDate(nextMonday.getDate() + 7);
  } else {
    nextMonday = getMonday();
    nextMonday.setDate(nextMonday.getDate() + 7);
  }

  const newWeek = {
    id: generateId(),
    name: formatWeekString(nextMonday),
    startDate: nextMonday.toISOString(),
    createdAt: new Date().toISOString()
  };
  
  const cleanWeeks = deduplicateWeeks([...weeks, newWeek]);
  await localforage.setItem('weeks', cleanWeeks);
  
  const newSchedule = await getDefaultScheduleTemplate();
  
  for (let day in newSchedule) {
    newSchedule[day] = newSchedule[day].map(s => ({...s, id: generateId()}));
  }

  await localforage.setItem(`schedule_${newWeek.id}`, newSchedule);
  return newWeek;
};

export const getScheduleForWeek = async (weekId) => {
  let schedule = await localforage.getItem(`schedule_${weekId}`);
  if (!schedule) {
    schedule = await getDefaultScheduleTemplate();
    for (let day in schedule) {
      schedule[day] = schedule[day].map(s => ({...s, id: generateId()}));
    }
    await localforage.setItem(`schedule_${weekId}`, schedule);
  }
  
  let needsSave = false;
  for (const day in schedule) {
    schedule[day] = schedule[day].map(slot => {
      let updatedSlot = { ...slot };
      if (!updatedSlot.id) { updatedSlot.id = generateId(); needsSave = true; }
      if (updatedSlot.notes === undefined) { updatedSlot.notes = ""; needsSave = true; }
      if (!updatedSlot.checklist) { updatedSlot.checklist = []; needsSave = true; }
      if (!updatedSlot.links) { updatedSlot.links = []; needsSave = true; }
      if (!updatedSlot.images) { updatedSlot.images = []; needsSave = true; }
      if (!updatedSlot.color) { updatedSlot.color = "gray"; needsSave = true; }
      return updatedSlot;
    });
  }
  
  if (needsSave) {
    await saveScheduleForWeek(weekId, schedule);
  }
  return schedule;
};

export const saveScheduleForWeek = async (weekId, schedule) => {
  await localforage.setItem(`schedule_${weekId}`, schedule);
};

export const copyWeekSchedule = async (sourceWeekId, targetWeekId) => {
  const sourceSchedule = await getScheduleForWeek(sourceWeekId);
  const targetSchedule = JSON.parse(JSON.stringify(sourceSchedule));

  for (let day in targetSchedule) {
    targetSchedule[day] = targetSchedule[day].map(s => ({
      ...s,
      id: generateId()
    }));
  }
  await saveScheduleForWeek(targetWeekId, targetSchedule);
  return targetSchedule;
};

export const deleteWeek = async (weekId) => {
  let weeks = await getWeeks();
  if (weeks.length <= 1) return false;
  
  weeks = weeks.filter(w => w.id !== weekId);
  await localforage.setItem('weeks', weeks);
  await localforage.removeItem(`schedule_${weekId}`);
  return true;
};

export const renameWeek = async (weekId, newName) => {
  let weeks = await getWeeks();
  weeks = weeks.map(w => w.id === weekId ? { ...w, name: newName } : w);
  await localforage.setItem('weeks', deduplicateWeeks(weeks));
  return weeks;
};

export const initialCourseData = [
  {
    id: 'c_mlops',
    title: 'MLOps & Yapay Zeka',
    color: '#8b5cf6',
    description: 'Model deployment, CI/CD pipelines, Docker, MLflow ve monitoring müfredatı',
    topics: []
  },
  {
    id: 'c_java_oop',
    title: 'Java OOP (Nesne Yönelimli Programlama)',
    color: '#06b6d4',
    description: 'Nesne yönelimli tasarım ilkeleri, SOLID, Tasarım Desenleri ve Java Collection Framework',
    topics: []
  },
  {
    id: 'c_2nd_year',
    title: '2. Sınıf Dersleri (Müfredat Takibi)',
    color: '#ec4899',
    description: 'Veri Yapıları, İşletim Sistemleri, Veri Tabanı Yönetimi ve Algoritma Analizi ders notları',
    topics: []
  }
];


export const getCourseDetailsData = async () => {
  let data = await localforage.getItem('course_details_data');
  if (!data || !Array.isArray(data) || data.length === 0) {
    data = JSON.parse(JSON.stringify(initialCourseData));
    await localforage.setItem('course_details_data', data);
  } else {
    // Sanitize data: ensure topics are clean if user wants clean slate
    data = data.map(course => ({
      ...course,
      topics: Array.isArray(course.topics) ? course.topics : []
    }));
  }
  return data;
};

export const clearCourseDetailsData = async () => {
  const freshData = JSON.parse(JSON.stringify(initialCourseData));
  await localforage.setItem('course_details_data', freshData);
  return freshData;
};

export const saveCourseDetailsData = async (data) => {
  await localforage.setItem('course_details_data', data);
};



// --- MS TO-DO STYLE CUSTOM LISTS AND TASKS STORAGE ---

export const initialCustomLists = [
  { id: 'list_alinacaklar', name: 'Alınacaklar', icon: 'ShoppingCart', isDefault: true },
  { id: 'list_gunluk', name: 'Günlük Yapılacaklar', icon: 'CheckSquare', isDefault: true },
  { id: 'list_hafiza', name: 'HAFIZA', icon: 'Brain', isDefault: true },
  { id: 'list_projeler', name: 'Projeler', icon: 'Folder', isDefault: true },
  { id: 'list_planlar', name: 'Planlar', icon: 'Compass', isDefault: true },
  { id: 'list_yillik_hedefler', name: 'YILLIK HEDEFLER 2026-2027', icon: 'Target', isDefault: true },
  { id: 'list_odevler', name: 'Ödevler', icon: 'BookMarked', isDefault: true },
  { id: 'list_programlanan', name: 'Programlanan İşler', icon: 'ListTodo', isDefault: true },
  { id: 'list_birikimler', name: 'Birikimler', icon: 'PiggyBank', isDefault: true }
];

export const initialCustomTasks = [
  {
    id: 'task_1',
    listId: 'list_programlanan',
    title: 'Cumartesi Pazar 1 er saat Almanca',
    note: '',
    dueDate: '2026-08-29',
    dueDateLabel: '29 Ağustos Cmt',
    completed: false,
    starred: false,
    inMyDay: false,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_2',
    listId: 'list_programlanan',
    title: 'Cumartesi Pazar esnek şekilde Trading eğitimi , backtestler , stratejiler ve MLOps veya JAVA esnek çalışma . Ödev varsa ödev. Projeler üretme , geliştirme , planlama , tasarlama , uygulama vs.',
    note: '',
    dueDate: '2026-08-29',
    dueDateLabel: '29 Ağustos Cmt',
    completed: false,
    starred: true,
    inMyDay: false,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_3',
    listId: 'list_programlanan',
    title: '19.30-20.30 MLOps CUMA',
    note: '',
    dueDate: '2026-08-28',
    dueDateLabel: 'Yarın',
    completed: false,
    starred: false,
    inMyDay: false,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_4',
    listId: 'list_programlanan',
    title: '17.00-19.00 Statistical inference CUMA',
    note: '',
    dueDate: '2026-08-28',
    dueDateLabel: 'Yarın',
    completed: false,
    starred: false,
    inMyDay: false,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_5',
    listId: 'list_programlanan',
    title: 'Trading eğitim 18.00-19.00',
    note: '',
    dueDate: '2026-08-27',
    dueDateLabel: 'Bugün',
    completed: false,
    starred: true,
    inMyDay: true,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_6',
    listId: 'list_programlanan',
    title: '19.00-20.00 JAVA',
    note: '',
    dueDate: '2026-09-02',
    dueDateLabel: '2 Eylül Çar',
    completed: false,
    starred: false,
    inMyDay: false,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_7',
    listId: 'list_programlanan',
    title: '17.00-19.00 Data Structures ÇRŞ',
    note: '',
    dueDate: '2026-09-02',
    dueDateLabel: '2 Eylül Çar',
    completed: false,
    starred: false,
    inMyDay: false,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_8',
    listId: 'list_programlanan',
    title: '18.00-19.30 OOP and Desing SALI',
    note: '',
    dueDate: '2026-09-01',
    dueDateLabel: '1 Eylül Sal',
    completed: false,
    starred: false,
    inMyDay: false,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_9',
    listId: 'list_programlanan',
    title: '11.00-12.30 JAVA OOP Tekrar SALI',
    note: '',
    dueDate: '2026-09-01',
    dueDateLabel: '1 Eylül Sal',
    completed: false,
    starred: false,
    inMyDay: false,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_10',
    listId: 'list_programlanan',
    title: '23.30 veya 00.00 uyku PZT',
    note: '',
    dueDate: '2026-08-27',
    dueDateLabel: 'Bugün',
    completed: false,
    starred: false,
    inMyDay: true,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_11',
    listId: 'list_programlanan',
    title: '20.30-22.00 Discrete mat PZT',
    note: '',
    dueDate: '2026-08-31',
    dueDateLabel: '31 Ağustos Pzt',
    completed: false,
    starred: false,
    inMyDay: false,
    recurring: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_12',
    listId: 'list_programlanan',
    title: '11.30-13.00 MLOps zamanı PZT',
    note: '',
    dueDate: '2026-08-31',
    dueDateLabel: '31 Ağustos Pzt',
    completed: false,
    starred: true,
    inMyDay: false,
    recurring: true,
    createdAt: new Date().toISOString()
  }
];

export const getCustomLists = async () => {
  let lists = await localforage.getItem('custom_lists');
  if (!lists || !Array.isArray(lists) || lists.length === 0) {
    lists = JSON.parse(JSON.stringify(initialCustomLists));
    await localforage.setItem('custom_lists', lists);
  }
  return lists;
};

export const saveCustomLists = async (lists) => {
  await localforage.setItem('custom_lists', lists);
};

export const createCustomList = async (name, icon = 'List') => {
  const lists = await getCustomLists();
  const newList = {
    id: `list_${generateId()}`,
    name: name.trim(),
    icon: icon,
    isDefault: false,
    createdAt: new Date().toISOString()
  };
  const updatedLists = [...lists, newList];
  await saveCustomLists(updatedLists);
  return updatedLists;
};

export const renameCustomList = async (listId, newName) => {
  const lists = await getCustomLists();
  const updatedLists = lists.map(l => l.id === listId ? { ...l, name: newName.trim() } : l);
  await saveCustomLists(updatedLists);
  return updatedLists;
};

export const deleteCustomList = async (listId) => {
  const lists = await getCustomLists();
  const updatedLists = lists.filter(l => l.id !== listId);
  await saveCustomLists(updatedLists);

  // Also remove tasks associated with this list
  const tasks = await getCustomTasks();
  const updatedTasks = tasks.filter(t => t.listId !== listId);
  await saveCustomTasks(updatedTasks);
  return updatedLists;
};

export const getCustomTasks = async () => {
  let tasks = await localforage.getItem('custom_tasks');
  if (!tasks || !Array.isArray(tasks)) {
    tasks = JSON.parse(JSON.stringify(initialCustomTasks));
    await localforage.setItem('custom_tasks', tasks);
  }
  return tasks;
};

export const saveCustomTasks = async (tasks) => {
  await localforage.setItem('custom_tasks', tasks);
};

export const addCustomTask = async (taskData) => {
  const tasks = await getCustomTasks();
  const newTask = {
    id: `task_${generateId()}`,
    listId: taskData.listId || 'list_programlanan',
    title: taskData.title,
    note: taskData.note || '',
    dueDate: taskData.dueDate || '',
    dueDateLabel: taskData.dueDateLabel || '',
    completed: false,
    starred: taskData.starred || false,
    inMyDay: taskData.inMyDay || false,
    recurring: taskData.recurring || false,
    steps: taskData.steps || [],
    createdAt: new Date().toISOString()
  };
  const updatedTasks = [newTask, ...tasks];
  await saveCustomTasks(updatedTasks);
  return updatedTasks;
};

export const updateCustomTask = async (taskId, updates) => {
  const tasks = await getCustomTasks();
  const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
  await saveCustomTasks(updatedTasks);
  return updatedTasks;
};

export const deleteCustomTask = async (taskId) => {
  const tasks = await getCustomTasks();
  const updatedTasks = tasks.filter(t => t.id !== taskId);
  await saveCustomTasks(updatedTasks);
  return updatedTasks;
};

export const toggleTaskStar = async (taskId) => {
  const tasks = await getCustomTasks();
  const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, starred: !t.starred } : t);
  await saveCustomTasks(updatedTasks);
  return updatedTasks;
};

export const toggleTaskComplete = async (taskId) => {
  const tasks = await getCustomTasks();
  const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
  await saveCustomTasks(updatedTasks);
  return updatedTasks;
};


export const exportData = async (weekIds = null, activeWeekId = null) => {
  let weeks = await getWeeks();
  if (weekIds && weekIds.length > 0) {
    weeks = weeks.filter(w => weekIds.includes(w.id));
  }
  weeks = deduplicateWeeks(weeks);

  const courseDetailsData = await getCourseDetailsData();
  const customLists = await getCustomLists();
  const customTasks = await getCustomTasks();

  const data = {
    exportedAt: new Date().toISOString(),
    activeWeekId: activeWeekId || (weeks[0] ? weeks[0].id : null),
    weeks,
    schedules: {},
    customDefaultSchedule: await localforage.getItem('customDefaultSchedule'),
    courseDetailsData,
    customLists,
    customTasks
  };

  for (let w of weeks) {
    const s = await localforage.getItem(`schedule_${w.id}`);
    data.schedules[w.id] = s;
  }
  return JSON.stringify(data);
};

export const importData = async (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    if (!data.weeks || !data.schedules) return false;

    const cleanWeeks = deduplicateWeeks(data.weeks);

    await localforage.clear();
    await localforage.setItem('weeks', cleanWeeks);

    if (data.customDefaultSchedule) {
      await localforage.setItem('customDefaultSchedule', data.customDefaultSchedule);
    }

    if (data.courseDetailsData) {
      await localforage.setItem('course_details_data', data.courseDetailsData);
    }

    if (data.customLists) {
      await localforage.setItem('custom_lists', data.customLists);
    }

    if (data.customTasks) {
      await localforage.setItem('custom_tasks', data.customTasks);
    }

    for (const weekId of Object.keys(data.schedules)) {
      if (data.schedules[weekId]) {
        await localforage.setItem(`schedule_${weekId}`, data.schedules[weekId]);
      }
    }

    const restoredActiveWeekId = data.activeWeekId || (cleanWeeks[0] ? cleanWeeks[0].id : null);
    if (restoredActiveWeekId) {
      localStorage.setItem('savedActiveWeekId', restoredActiveWeekId);
    }

    return { success: true, activeWeekId: restoredActiveWeekId };
  } catch(e) {
    return false;
  }
};


export const updateWeekDate = async (weekId, chosenDateStr) => {
  let weeks = await getWeeks();
  const chosenDate = new Date(chosenDateStr);
  const mondayDate = getMonday(chosenDate);
  const newName = formatWeekString(mondayDate);

  weeks = weeks.map(w => w.id === weekId ? {
    ...w,
    name: newName,
    startDate: mondayDate.toISOString()
  } : w);

  await localforage.setItem('weeks', weeks);
  return weeks;
};


