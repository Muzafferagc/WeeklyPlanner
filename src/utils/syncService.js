// --- FIREBASE REALTIME CLOUD SYNC & DEVICE PAIRING SERVICE ---

const DEFAULT_FIREBASE_URL = 'https://weekly-planner-sync-default-rtdb.firebaseio.com';

export const getSyncRoom = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      const cleanRoom = roomFromUrl.trim().toUpperCase();
      try { localStorage.setItem('sync_room_id', cleanRoom); } catch (e) {}
      return cleanRoom;
    }

    let savedRoom = null;
    try { savedRoom = localStorage.setItem('sync_room_id', savedRoom); } catch (e) {}
    try { savedRoom = localStorage.getItem('sync_room_id'); } catch (e) {}
    if (!savedRoom) {
      savedRoom = 'MUZAFFER-PLAN-2026';
      try { localStorage.setItem('sync_room_id', savedRoom); } catch (e) {}
    }
    return savedRoom;
  } catch (err) {
    return 'MUZAFFER-PLAN-2026';
  }
};

export const setSyncRoom = (roomId) => {
  const cleanRoom = roomId.trim().toUpperCase();
  try { localStorage.setItem('sync_room_id', cleanRoom); } catch (e) {}
  return cleanRoom;
};

// Listen to Realtime Events via EventSource (Server-Sent Events)
let activeEventSource = null;
let isBroadcasting = false;

export const subscribeToCloudSync = (roomId, onDataReceived) => {
  if (activeEventSource) {
    activeEventSource.close();
  }

  const streamUrl = `${DEFAULT_FIREBASE_URL}/rooms/${roomId}.json`;
  
  try {
    const es = new EventSource(streamUrl);
    activeEventSource = es;

    es.onmessage = (event) => {
      if (isBroadcasting) return; // Skip echo from own broadcast
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.data && typeof payload.data === 'object') {
          onDataReceived(payload.data);
        }
      } catch (e) {
        // console.error("Sync Parse error", e);
      }
    };

    es.onerror = () => {
      // Automatic reconnect built-in to EventSource
    };
  } catch (err) {
    // console.error("SSE connection error", err);
  }
};

// Broadcast local state to Cloud Database
export const broadcastToCloud = async (roomId, fullState) => {
  isBroadcasting = true;
  try {
    const url = `${DEFAULT_FIREBASE_URL}/rooms/${roomId}.json`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: fullState,
        updatedAt: new Date().toISOString()
      })
    });
  } catch (err) {
    // console.error("Broadcast failed", err);
  } finally {
    setTimeout(() => {
      isBroadcasting = false;
    }, 500);
  }
};
