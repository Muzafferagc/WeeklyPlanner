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

export const getWeeks = async () => {
  let weeks = await localforage.getItem('weeks');
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
  weeks.push(newWeek);
  await localforage.setItem('weeks', weeks);
  
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
  await localforage.setItem('weeks', weeks);
  return weeks;
};

export const exportData = async (weekIds = null) => {
  let weeks = await getWeeks();
  if (weekIds && weekIds.length > 0) {
    weeks = weeks.filter(w => weekIds.includes(w.id));
  }
  const data = { weeks, schedules: {}, customDefaultSchedule: await localforage.getItem('customDefaultSchedule') };
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
    
    await localforage.clear();
    await localforage.setItem('weeks', data.weeks);
    if (data.customDefaultSchedule) {
      await localforage.setItem('customDefaultSchedule', data.customDefaultSchedule);
    }
    for (const weekId of Object.keys(data.schedules)) {
      await localforage.setItem(`schedule_${weekId}`, data.schedules[weekId]);
    }
    return true;
  } catch(e) {
    return false;
  }
};
