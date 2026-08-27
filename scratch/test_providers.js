const testProviders = async () => {
  const payload = {
    updatedAt: new Date().toISOString(),
    weeks: [{ id: "w1", name: "Hafta 1" }],
    customTasks: [{ id: "t1", title: "Test Görev" }]
  };

  // Provider 1: api.restful-api.dev
  try {
    console.log("Testing api.restful-api.dev...");
    const res = await fetch("https://api.restful-api.dev/objects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "MUZAFFER-PLAN-2026",
        data: payload
      })
    });
    const data = await res.json();
    console.log("api.restful-api.dev POST result:", data);
    if (data.id) {
      const getRes = await fetch(`https://api.restful-api.dev/objects/${data.id}`);
      const getData = await getRes.json();
      console.log("api.restful-api.dev GET result:", getData);
    }
  } catch (e) {
    console.error("Provider 1 failed:", e.message);
  }

  // Provider 2: jsonstorage.net
  try {
    console.log("Testing jsonstorage.net...");
    const res = await fetch("https://api.jsonstorage.net/v1/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("jsonstorage.net status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("jsonstorage.net result:", data);
    }
  } catch (e) {
    console.error("Provider 2 failed:", e.message);
  }

  // Provider 3: npoint.io
  try {
    console.log("Testing npoint.io...");
    const res = await fetch("https://api.npoint.io/bins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("npoint.io status:", res.status);
    const data = await res.json();
    console.log("npoint.io result:", data);
  } catch (e) {
    console.error("Provider 3 failed:", e.message);
  }
};

testProviders();
