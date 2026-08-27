import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kpyumuujjehptxplalhp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweXVtdXVqamVocHR4cGxhbGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODUxNTAsImV4cCI6MjEwMzM2MTE1MH0.coq2OZizMS2H170WWbC4AfLXKDrvfM8YbWovleB5Xas";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const testUserSupabase = async () => {
  console.log("Testing connection to User Supabase Project:", SUPABASE_URL);
  
  // Test 1: Insert / Upsert test row
  const payload = {
    id: "MUZAFFER-PLAN-2026",
    data: {
      weeks: [{ id: "w1", name: "Hafta 1" }],
      customTasks: [{ id: "t1", title: "Supabase Test Görevi" }],
      customLists: [{ id: "l1", name: "Programlanan İşler" }]
    },
    updated_at: new Date().toISOString()
  };

  const { data: upsertData, error: upsertError } = await supabase
    .from("sync_data")
    .upsert(payload);

  if (upsertError) {
    console.error("Upsert Error:", upsertError);
  } else {
    console.log("SUCCESS! Upsert completed!");
  }

  // Test 2: Select row
  const { data, error } = await supabase
    .from("sync_data")
    .select("*")
    .eq("id", "MUZAFFER-PLAN-2026");

  if (error) {
    console.error("Select Error:", error);
  } else {
    console.log("SELECT Result:", JSON.stringify(data, null, 2));
  }
};

testUserSupabase();
