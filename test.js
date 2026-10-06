// ============================================
// MCP Server Test Suite
// Tests MCP Protocol & Real API Integrations
// ============================================

import handler from "./src/index.js";

async function runTests() {
  console.log("🚀 Starting Enhanced MCP Server tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: Health check / info
  console.log("1. Testing GET /health");
  const resHealth = await handler(new Request("https://localhost/health", { method: "GET" }));
  assert(resHealth.status === 200, "Health status is 200");
  const healthData = await resHealth.json();
  assert(healthData.status === "ok", "Health response contains status 'ok'");
  assert(healthData.tools.includes("suggest_plz_ort"), "Health lists suggest_plz_ort tool");
  assert(healthData.tools.includes("suggest_aerzte"), "Health lists suggest_aerzte tool");
  assert(healthData.tools.includes("suche_doktor"), "Health lists suche_doktor tool");

  // Test 2: CORS Preflight
  console.log("\n2. Testing OPTIONS /sse (CORS Preflight)");
  const resOptions = await handler(new Request("https://localhost/sse", { method: "OPTIONS" }));
  assert(resOptions.status === 204, "OPTIONS status is 204");
  assert(resOptions.headers.get("access-control-allow-origin") === "*", "CORS header present");

  // Test 3: SSE Connection (GET /sse)
  console.log("\n3. Testing GET /sse (SSE Connection)");
  const resSse = await handler(new Request("https://localhost/sse", { method: "GET" }));
  assert(resSse.status === 200, "GET /sse status is 200");
  assert(resSse.headers.get("content-type").includes("text/event-stream"), "Content-Type is text/event-stream");
  
  const reader = resSse.body.getReader();
  const { value } = await reader.read();
  const chunkText = new TextDecoder().decode(value);
  assert(chunkText.includes("event: endpoint"), "SSE stream starts with 'event: endpoint'");
  assert(chunkText.includes("/sse?sessionId="), "SSE stream provides sessionId");
  reader.cancel();

  const sessionIdMatch = chunkText.match(/sessionId=([a-zA-Z0-9_-]+)/);
  const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;
  assert(sessionId !== null, `Extracted sessionId: ${sessionId}`);

  // Test 4: MCP Initialize (POST /sse)
  console.log("\n4. Testing POST /sse (initialize)");
  const initPayload = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" }
    }
  };
  const resInit = await handler(new Request(`https://localhost/sse?sessionId=${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(initPayload)
  }));
  assert(resInit.status === 200, "POST initialize status is 200");
  const initResult = await resInit.json();
  assert(initResult.id === 1, "Initialize response id matches");
  assert(initResult.result.serverInfo.name === "hessen-artz-suche-mcp", "Server name is correct");

  // Test 5: tools/list
  console.log("\n5. Testing POST /sse (tools/list)");
  const listPayload = { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} };
  const resList = await handler(new Request(`https://localhost/sse?sessionId=${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(listPayload)
  }));
  assert(resList.status === 200, "POST tools/list status is 200");
  const listResult = await resList.json();
  assert(listResult.result.tools.length === 3, "Returns 3 tools");
  assert(listResult.result.tools.some(t => t.name === "suggest_plz_ort"), "suggest_plz_ort tool found");
  assert(listResult.result.tools.some(t => t.name === "suggest_aerzte"), "suggest_aerzte tool found");
  assert(listResult.result.tools.some(t => t.name === "suche_doktor"), "suche_doktor tool found");

  // Test 6: tools/call (suggest_plz_ort: Groß-Gerau)
  console.log("\n6. Testing POST /sse (tools/call: suggest_plz_ort)");
  const plzPayload = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "suggest_plz_ort", arguments: { query: "Groß-Gerau" } }
  };
  const resPlz = await handler(new Request(`https://localhost/sse?sessionId=${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plzPayload)
  }));
  assert(resPlz.status === 200, "suggest_plz_ort status is 200");
  const plzResult = await resPlz.json();
  const plzData = JSON.parse(plzResult.result.content[0].text);
  assert(Array.isArray(plzData) && plzData.length > 0, "Returns location array");
  assert(plzData[0].plz === "64521" && plzData[0].lat !== undefined, "Extracted PLZ 64521 and coordinates");

  // Test 7: tools/call (suggest_aerzte: Orthopädie)
  console.log("\n7. Testing POST /sse (tools/call: suggest_aerzte)");
  const aerztePayload = {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: { name: "suggest_aerzte", arguments: { query: "Orthopädie" } }
  };
  const resAerzte = await handler(new Request(`https://localhost/sse?sessionId=${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aerztePayload)
  }));
  assert(resAerzte.status === 200, "suggest_aerzte status is 200");
  const aerzteResult = await resAerzte.json();
  const aerzteData = JSON.parse(aerzteResult.result.content[0].text);
  assert(Array.isArray(aerzteData) && aerzteData.length > 0, "Returns doctor suggestions array");
  assert(aerzteData.some(a => a.label.includes("Orthopädie")), "Finds Orthopädie specialty");

  // Test 8: tools/call (suche_doktor: Darmstadt + radius: 5 + query: Orthopädie)
  console.log("\n8. Testing POST /sse (tools/call: suche_doktor with Location & Radius)");
  const suchePayload = {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "suche_doktor",
      arguments: {
        location: "Darmstadt",
        radius: 5,
        query: "Orthopädie",
        limit: 5
      }
    }
  };
  const resSuche = await handler(new Request(`https://localhost/sse?sessionId=${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(suchePayload)
  }));
  assert(resSuche.status === 200, "suche_doktor status is 200");
  const sucheResult = await resSuche.json();
  const searchData = JSON.parse(sucheResult.result.content[0].text);
  assert(searchData.totalFound > 0, `Found ${searchData.totalFound} doctors in Darmstadt (5km radius)`);
  assert(searchData.doctors.length > 0, "Returned formatted doctor list");
  assert(searchData.doctors[0].name !== undefined, "Doctor has name");
  assert(searchData.doctors[0].address?.street !== undefined, "Doctor has address");
  assert(searchData.doctors[0].distance !== undefined, "Doctor has distance calculation");

  // Test 9: ping
  console.log("\n9. Testing POST /sse (ping)");
  const pingPayload = { jsonrpc: "2.0", id: 6, method: "ping" };
  const resPing = await handler(new Request("https://localhost/sse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pingPayload)
  }));
  assert(resPing.status === 200, "ping status is 200");

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
