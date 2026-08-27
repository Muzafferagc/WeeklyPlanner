// --- NTFY.SH ULTRA-FAST REALTIME CLOUD SYNC SERVICE ---

const NTFY_BASE_URL = 'https://ntfy.sh';

export const getSyncRoom = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      const cleanRoom = roomFromUrl.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      try { localStorage.setItem('sync_room_id', cleanRoom); } catch (e) {}
      return cleanRoom;
    }

    let savedRoom = null;
    try { savedRoom = localStorage.getItem('sync_room_id'); } catch (e) {}
    if (!savedRoom || savedRoom === 'undefined' || savedRoom === 'null') {
      savedRoom = 'muzaffer-plan-2026';
      try { localStorage.setItem('sync_room_id', savedRoom); } catch (e) {}
    }
    return savedRoom;
  } catch (err) {
    return 'muzaffer-plan-2026';
  }
};

export const setSyncRoom = (roomId) => {
  const cleanRoom = roomId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  try { localStorage.setItem('sync_room_id', cleanRoom); } catch (e) {}
  return cleanRoom;
};

// Extract data from ntfy JSON message
const extractStateFromMessage = (msgText) => {
  try {
    if (!msgText) return null;
    const obj = typeof msgText === 'string' ? JSON.parse(msgText) : msgText;
    
    // 1. If wrapped in ntfy message container
    if (obj && obj.message) {
      try {
        const inner = typeof obj.message === 'string' ? JSON.parse(obj.message) : obj.message;
        if (inner && inner.weeks && Array.isArray(inner.weeks)) return inner;
      } catch (e) {}
    }
    
    // 2. Direct state object
    if (obj && obj.weeks && Array.isArray(obj.weeks)) return obj;
  } catch (e) {}
  return null;
};

export const fetchCloudState = async (roomId) => {
  try {
    const topic = roomId || getSyncRoom();
    const url = `${NTFY_BASE_URL}/${topic}/json?poll=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    
    // ntfy returns line-delimited JSON for poll
    const lines = text.trim().split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      const state = extractStateFromMessage(lines[i]);
      if (state) return state;
    }
  } catch (e) {}
  return null;
};

let activeEventSource = null;
let isBroadcasting = false;

export const subscribeToCloudSync = async (roomId, onDataReceived) => {
  const topic = roomId || getSyncRoom();

  if (activeEventSource) {
    activeEventSource.close();
  }

  // 1. Initial Fetch on Connect
  const initialData = await fetchCloudState(topic);
  if (initialData) {
    onDataReceived(initialData);
  }

  // 2. Subscribe to Realtime SSE Stream
  try {
    const streamUrl = `${NTFY_BASE_URL}/${topic}/json`;
    const es = new EventSource(streamUrl);
    activeEventSource = es;

    es.onmessage = (event) => {
      if (isBroadcasting) return; // Skip echo from own broadcast
      try {
        const state = extractStateFromMessage(event.data);
        if (state) {
          onDataReceived(state);
        }
      } catch (e) {}
    };

    es.onerror = () => {
      // EventSource auto reconnects
    };
  } catch (err) {}
};

export const broadcastToCloud = async (roomId, fullState) => {
  const topic = roomId || getSyncRoom();
  isBroadcasting = true;
  try {
    const url = `${NTFY_BASE_URL}/${topic}`;
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(fullState)
    });
  } catch (err) {
  } finally {
    setTimeout(() => {
      isBroadcasting = false;
    }, 400);
  }
};
