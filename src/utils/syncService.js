// --- SUPABASE REALTIME CLOUD SYNC SERVICE ---
import { getSupabaseClient, getSupabaseConfig, setSupabaseConfig } from './supabaseClient';

export { getSupabaseConfig, setSupabaseConfig };

export const getSyncRoom = () => {
  return 'MUZAFFER-PLAN-2026';
};

export const setSyncRoom = (roomId) => {
  return 'MUZAFFER-PLAN-2026';
};

export const fetchCloudState = async () => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sync_data')
      .select('data')
      .eq('id', 'MUZAFFER-PLAN-2026')
      .single();

    if (error || !data) return null;
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.weeks)) {
      return data.data;
    }
  } catch (e) {}
  return null;
};

let realtimeChannel = null;
let pollInterval = null;

let lastCloudString = '';

export const subscribeToCloudSync = async (roomId, onDataReceived) => {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const handleData = (data) => {
    try {
      const dataStr = JSON.stringify(data);
      if (dataStr !== lastCloudString) {
        lastCloudString = dataStr;
        onDataReceived(data);
      }
    } catch(e) {}
  };

  // 1. Initial Fetch
  const initial = await fetchCloudState();
  if (initial) {
    handleData(initial);
  }

  // 2. Setup Supabase Realtime WebSocket Listener
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }
  if (pollInterval) {
    clearInterval(pollInterval);
  }

  try {
    realtimeChannel = supabase
      .channel('public:sync_data')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sync_data', filter: 'id=eq.MUZAFFER-PLAN-2026' },
        (payload) => {
          if (payload.new && payload.new.data && Array.isArray(payload.new.data.weeks)) {
            handleData(payload.new.data);
          }
        }
      )
      .subscribe();
  } catch (e) {}

  // 3. Fallback Poll every 2.5s for instant sync guarantee
  pollInterval = setInterval(async () => {
    const latest = await fetchCloudState();
    if (latest) {
      handleData(latest);
    }
  }, 2500);
};

export const broadcastToCloud = async (roomId, fullState) => {
  try {
    const dataStr = JSON.stringify(fullState);
    lastCloudString = dataStr; // Optimistically update local cache
    
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('sync_data')
      .upsert({
        id: 'MUZAFFER-PLAN-2026',
        data: fullState,
        updated_at: new Date().toISOString()
      });
  } catch (err) {}
};
