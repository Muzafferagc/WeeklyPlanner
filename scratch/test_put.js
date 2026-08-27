const testPut = async () => {
  const objId = 'ff8081819ff5b11001a0411673852db9';
  const updatedPayload = {
    updatedAt: new Date().toISOString(),
    weeks: [{ id: "w1", name: "Hafta 1 Güncellendi" }],
    customTasks: [{ id: "t1", title: "Test Görev Güncellendi" }, { id: "t2", title: "İkinci Görev" }]
  };

  console.log("Testing PUT to api.restful-api.dev...");
  const res = await fetch(`https://api.restful-api.dev/objects/${objId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "MUZAFFER-PLAN-2026",
      data: updatedPayload
    })
  });
  console.log("PUT status:", res.status);
  const data = await res.json();
  console.log("PUT result:", data);

  console.log("Verifying GET...");
  const getRes = await fetch(`https://api.restful-api.dev/objects/${objId}`);
  const getData = await getRes.json();
  console.log("GET result:", getData.data.customTasks);
};

testPut();
