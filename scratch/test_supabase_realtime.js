import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kpyumuujjehptxplalhp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweXVtdXVqamVocHR4cGxhbGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODUxNTAsImV4cCI6MjEwMzM2MTE1MH0.coq2OZizMS2H170WWbC4AfLXKDrvfM8YbWovleB5Xas";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const runRealtimeTest = async () => {
  console.log("Subscribing to Supabase Realtime...");

  const channel = supabase
    .channel('test_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sync_data' },
      (payload) => {
        console.log("REALTIME EVENT RECEIVED!", payload);
      }
    )
    .subscribe((status) => {
      console.log("Subscription Status:", status);
    });

  setTimeout(async () => {
    console.log("Triggering upsert mutation...");
    const { error } = await supabase.from('sync_data').upsert({
      id: "MUZAFFER-PLAN-2026",
      data: {
        weeks: [{ id: "w1", name: "Hafta 1 Realtime Test" }],
        customTasks: [{ id: "t_rt", title: "Realtime Görevi " + new Date().toLocaleTimeString() }]
      },
      updated_at: new Date().toISOString()
    });
    if (error) console.error("Upsert Error:", error);
    else console.log("Upsert executed successfully!");
  }, 2000);
};

runRealtimeTest();
