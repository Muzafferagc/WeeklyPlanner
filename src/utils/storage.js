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
  try {
    const custom = await localforage.getItem('customDefaultSchedule');
    if (custom && typeof custom === 'object' && Object.keys(custom).length > 0) {
      return JSON.parse(JSON.stringify(custom));
    }
  } catch (e) {}

  const lsCustom = localStorage.getItem('customDefaultSchedule');
  if (lsCustom) {
    try {
      const parsed = JSON.parse(lsCustom);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    } catch (e) {}
  }

  return JSON.parse(JSON.stringify(initialSchedule));
};

export const saveDefaultScheduleTemplate = async (template) => {
  await localforage.setItem('customDefaultSchedule', template);
  try {
    localStorage.setItem('customDefaultSchedule', JSON.stringify(template));
  } catch (e) {}
};

export const resetDefaultScheduleTemplateToFactory = async () => {
  await localforage.removeItem('customDefaultSchedule');
  try {
    localStorage.removeItem('customDefaultSchedule');
  } catch (e) {}
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
  return weeks.sort((a, b) => {
    const dateA = new Date(a.startDate || a.createdAt || 0);
    const dateB = new Date(b.startDate || b.createdAt || 0);
    return dateA - dateB;
  });
};

export const createNewWeek = async (mode = 'next', customStartDate = null, activeWeekId = null) => {
  const weeks = await getWeeks();
  
  let targetMonday;
  if (mode === 'custom' && customStartDate) {
    targetMonday = getMonday(new Date(customStartDate));
  } else {
    // Find reference date: active week or min/max week
    const activeWeekObj = weeks.find(w => w.id === activeWeekId);
    
    if (mode === 'prev') {
      let minDate = activeWeekObj && activeWeekObj.startDate ? new Date(activeWeekObj.startDate) : new Date();
      if (!activeWeekObj && weeks.length > 0) {
        minDate = new Date(weeks[0].startDate || weeks[0].createdAt);
      }
      targetMonday = new Date(minDate);
      targetMonday.setDate(targetMonday.getDate() - 7);
    } else { // mode === 'next'
      let maxDate = activeWeekObj && activeWeekObj.startDate ? new Date(activeWeekObj.startDate) : new Date();
      if (!activeWeekObj && weeks.length > 0) {
        maxDate = new Date(weeks[weeks.length - 1].startDate || weeks[weeks.length - 1].createdAt);
      }
      targetMonday = new Date(maxDate);
      targetMonday.setDate(targetMonday.getDate() + 7);
    }
  }

  const newWeek = {
    id: generateId(),
    name: formatWeekString(targetMonday),
    startDate: targetMonday.toISOString(),
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
  if (!schedule || typeof schedule !== 'object') {
    schedule = await getDefaultScheduleTemplate();
    for (let day in schedule) {
      schedule[day] = schedule[day].map(s => ({...s, id: generateId()}));
    }
    await localforage.setItem(`schedule_${weekId}`, schedule);
  }
  
  const WEEK_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  let needsSave = false;

  WEEK_DAYS.forEach(day => {
    if (!Array.isArray(schedule[day])) {
      schedule[day] = [];
      needsSave = true;
    }
  });

  for (const day in schedule) {
    if (Array.isArray(schedule[day])) {
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
    id: 'f_root_1',
    type: 'folder',
    title: 'Örnek Klasör (Data & ML)',
    color: '#8b5cf6',
    description: 'Burası bir klasördür, içine başka klasörler veya konular ekleyebilirsiniz.',
    children: []
  }
];

export const getCourseDetailsData = async () => {
  let data = await localforage.getItem('course_details_data');
  if (!data || !Array.isArray(data) || data.length === 0) {
    data = JSON.parse(JSON.stringify(initialCourseData));
    await localforage.setItem('course_details_data', data);
  } else {
    // Migration: Check if first element is old format (no 'type' property)
    if (data.length > 0 && !data[0].type) {
      data = data.map(course => ({
        id: course.id || generateId(),
        type: 'folder',
        title: course.title || course.name || 'İsimsiz Klasör',
        color: course.color || '#3b82f6',
        description: course.description || '',
        children: (course.topics || []).map(topic => ({
          ...topic,
          type: 'topic'
        }))
      }));
      await localforage.setItem('course_details_data', data);
    }
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



// --- RECURRENCE & DAY MATCHING HELPERS ---
export const DAY_KEYS = ['Pzr', 'Pzt', 'Sal', 'Çrş', 'Prş', 'Cum', 'Cmt'];
export const DAY_NAMES_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export const isTaskActiveOnDate = (task, targetDate = new Date()) => {
  if (!task) return false;
  
  const todayStr = targetDate.toISOString().split('T')[0];
  const targetDayIdx = targetDate.getDay();
  const targetDayKey = DAY_KEYS[targetDayIdx];

  // 1. Explicitly in My Day or Due Today
  if (task.inMyDay || task.dueDate === todayStr || task.dueDateLabel === 'Bugün') {
    return true;
  }

  // 2. Check Recurrence Pattern
  if (task.repeatType === 'daily') {
    return true;
  }
  if (task.repeatType === 'weekdays') {
    return targetDayIdx >= 1 && targetDayIdx <= 5; // Mon-Fri
  }
  if (task.repeatType === 'weekly') {
    if (task.dueDate) {
      return new Date(task.dueDate).getDay() === targetDayIdx;
    }
    return true;
  }
  if (task.repeatType === 'custom' && Array.isArray(task.repeatDays)) {
    return task.repeatDays.includes(targetDayKey);
  }

  return false;
};

export const getRecurrenceLabel = (task) => {
  if (!task || !task.repeatType || task.repeatType === 'none') return '';
  if (task.repeatType === 'daily') return 'Her Gün';
  if (task.repeatType === 'weekdays') return 'Hafta İçi (Pzt-Cum)';
  if (task.repeatType === 'weekly') return 'Haftalık';
  if (task.repeatType === 'monthly') return 'Aylık';
  if (task.repeatType === 'custom' && Array.isArray(task.repeatDays) && task.repeatDays.length > 0) {
    return task.repeatDays.join(', ');
  }
  return 'Tekrarlayan';
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

export const initialCustomTasks = [];

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
    tasks = [];
    await localforage.setItem('custom_tasks', tasks);
  } else {
    // Purge old sample tasks if they still linger in localforage
    const sampleIds = ['task_1', 'task_2', 'task_3', 'task_4', 'task_5', 'task_6', 'task_7', 'task_8', 'task_9', 'task_10', 'task_11', 'task_12'];
    const cleaned = tasks.filter(t => !sampleIds.includes(t.id));
    if (cleaned.length !== tasks.length) {
      tasks = cleaned;
      await localforage.setItem('custom_tasks', tasks);
    }
  }
  return tasks;
};

export const saveCustomTasks = async (tasks) => {
  await localforage.setItem('custom_tasks', tasks || []);
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

export const bulkDeleteCustomTasks = async (taskIds) => {
  if (!Array.isArray(taskIds) || taskIds.length === 0) return [];
  const tasks = await getCustomTasks();
  const updatedTasks = tasks.filter(t => !taskIds.includes(t.id));
  await saveCustomTasks(updatedTasks);
  return updatedTasks;
};

export const bulkMoveCustomTasksToList = async (taskIds, targetListId) => {
  if (!Array.isArray(taskIds) || taskIds.length === 0 || !targetListId) return [];
  const tasks = await getCustomTasks();
  const updatedTasks = tasks.map(t => taskIds.includes(t.id) ? { ...t, listId: targetListId } : t);
  await saveCustomTasks(updatedTasks);
  return updatedTasks;
};


export const bulkToggleMyDay = async (taskIds, inMyDay = true) => {
  if (!Array.isArray(taskIds) || taskIds.length === 0) return [];
  const tasks = await getCustomTasks();
  const updatedTasks = tasks.map(t => taskIds.includes(t.id) ? { ...t, inMyDay } : t);
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
  const notebookPages = await getNotebookData();

  const data = {
    exportedAt: new Date().toISOString(),
    activeWeekId: activeWeekId || (weeks[0] ? weeks[0].id : null),
    weeks,
    schedules: {},
    customDefaultSchedule: await localforage.getItem('customDefaultSchedule'),
    courseDetailsData,
    customLists,
    customTasks,
    notebookPages
  };

  for (let w of weeks) {
    const s = await localforage.getItem(`schedule_${w.id}`);
    data.schedules[w.id] = s;
  }
  return JSON.stringify(data);
};

export const importData = async (jsonData) => {
  try {
    if (!jsonData) return false;
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    if (!data || !data.weeks || !Array.isArray(data.weeks) || data.weeks.length === 0 || !data.schedules) {
      return false;
    }

    const cleanWeeks = deduplicateWeeks(data.weeks);
    if (cleanWeeks.length === 0) return false;

    // DO NOT clear localforage to prevent wiping unsynced data
    // await localforage.clear();
    
    await localforage.setItem('weeks', cleanWeeks);

    if (data.customDefaultSchedule) {
      await localforage.setItem('customDefaultSchedule', data.customDefaultSchedule);
    }

    if (data.courseDetailsData) {
      await localforage.setItem('course_details_data', data.courseDetailsData);
    }

    if (data.customLists && Array.isArray(data.customLists) && data.customLists.length > 0) {
      await localforage.setItem('custom_lists', data.customLists);
    }

    if (data.customTasks && Array.isArray(data.customTasks)) {
      await localforage.setItem('custom_tasks', data.customTasks);
    }

    if (data.notebookPages && Array.isArray(data.notebookPages)) {
      await localforage.setItem('notebook_pages', data.notebookPages);
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
  const weeks = await getWeeks();
  const targetWeek = weeks.find(w => w.id === weekId);
  if (!targetWeek) return weeks;

  const chosenMonday = getMonday(new Date(chosenDateStr));
  targetWeek.startDate = chosenMonday.toISOString();
  targetWeek.name = formatWeekString(chosenMonday);

  const cleanWeeks = deduplicateWeeks(weeks);
  await localforage.setItem('weeks', cleanWeeks);
  return cleanWeeks;
};

export const resetAllData = async () => {
  await localforage.clear();
  localStorage.removeItem('weeklySchedule');
  localStorage.removeItem('savedActiveWeekId');
  const defaultWeeks = await getWeeks();
  return defaultWeeks;
};

export const getNotebookData = async () => {
  try {
    const data = await localforage.getItem('notebook_pages');
    if (data && Array.isArray(data)) {
      // Backfill category for existing pages
      return data.map(p => ({ ...p, category: p.category || 'Genel' }));
    }
    
    // Default initial data
    const initial = [{
      id: generateId(),
      title: 'İlk Sayfam',
      category: 'Genel',
      content: 'Bu sayfada çizim yapabilir, fotoğraf ekleyebilir ve notlar alabilirsiniz.',
      drawingData: null,
      images: [],
      createdAt: new Date().toISOString()
    }];
    await saveNotebookData(initial);
    return initial;
  } catch (error) {
    console.error('Error fetching notebook data:', error);
    return [];
  }
};

export const saveNotebookData = async (data) => {
  try {
    await localforage.setItem('notebook_pages', data);
  } catch (error) {
    console.error('Error saving notebook data:', error);
  }
};
