const testSync = async () => {
  try {
    const payload = {
      weeks: [{ id: "w1", name: "Hafta 1" }],
      customTasks: [{ id: "t1", title: "Test Görev" }],
      customLists: [{ id: "l1", name: "Test Liste" }]
    };

    console.log("Testing JSONBin.io...");
    const res = await fetch("https://api.jsonbin.io/v3/b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bin-Private": "false"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("JSONBin Response:", data);
    if (data.metadata && data.metadata.id) {
      console.log("SUCCESS! Bin ID:", data.metadata.id);
    }
  } catch (err) {
    console.error("Error:", err);
  }
};

testSync();
