// --- RESTFUL CLOUD REALTIME SYNC SERVICE ---

const CLOUD_OBJECT_ID = 'ff8081819ff5b11001a0411673852db9';
const API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

export const getSyncRoom = () => {
  return 'MUZAFFER-PLAN-2026';
};

export const setSyncRoom = (roomId) => {
  return 'MUZAFFER-PLAN-2026';
};

export const fetchCloudState = async () => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.data && typeof json.data === 'object' && Array.isArray(json.data.weeks)) {
      return json.data;
    }
  } catch (e) {}
  return null;
};

let activePollInterval = null;

export const subscribeToCloudSync = async (roomId, onDataReceived) => {
  if (activePollInterval) {
    clearInterval(activePollInterval);
  }

  // 1. Initial Fetch on Connect
  const initialData = await fetchCloudState();
  if (initialData) {
    onDataReceived(initialData);
  }

  // 2. Poll every 2.5 seconds
  activePollInterval = setInterval(async () => {
    const data = await fetchCloudState();
    if (data) {
      onDataReceived(data);
    }
  }, 2500);
};

export const broadcastToCloud = async (roomId, fullState) => {
  try {
    await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'MUZAFFER-PLAN-2026',
        data: fullState
      })
    });
  } catch (err) {}
};
