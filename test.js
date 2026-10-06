// ============================================
// MCP Server Test Suite
// Tests MCP Protocol & HTTP Endpoints
// ============================================

import handler from "./src/index.js";

async function runTests() {
  console.log("🚀 Starting MCP Server tests...\n");
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
  assert(healthData.tools.includes("suggest_aerzte"), "Health lists suggest_aerzte tool");

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
  
  // Read first chunk from SSE stream
  const reader = resSse.body.getReader();
  const { value } = await reader.read();
  const chunkText = new TextDecoder().decode(value);
  assert(chunkText.includes("event: endpoint"), "SSE stream starts with 'event: endpoint'");
  assert(chunkText.includes("/sse?sessionId="), "SSE stream provides sessionId");
  reader.cancel();

  // Extract sessionId
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
  assert(initResult.result.capabilities.tools !== undefined, "Tools capability advertised");

  // Test 5: tools/list
  console.log("\n5. Testing POST /sse (tools/list)");
  const listPayload = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };
  const resList = await handler(new Request(`https://localhost/sse?sessionId=${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(listPayload)
  }));
  assert(resList.status === 200, "POST tools/list status is 200");
  const listResult = await resList.json();
  assert(listResult.result.tools.length === 2, "Returns 2 tools");
  assert(listResult.result.tools.some(t => t.name === "suggest_aerzte"), "suggest_aerzte tool found");
  assert(listResult.result.tools.some(t => t.name === "suche_doktor"), "suche_doktor tool found");

  // Test 6: tools/call (suggest_aerzte)
  console.log("\n6. Testing POST /sse (tools/call: suggest_aerzte)");
  const callPayload = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "suggest_aerzte",
      arguments: { query: "Müller" }
    }
  };
  const resCall = await handler(new Request(`https://localhost/sse?sessionId=${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(callPayload)
  }));
  assert(resCall.status === 200, "tools/call status is 200");
  const callResult = await resCall.json();
  assert(callResult.result.isError === false, "Tool executed without error");
  assert(callResult.result.content[0].text.length > 0, "Tool returned content");
  assert(callResult.result.content[0].text.includes("Müller"), "Result contains searched doctor data");

  // Test 7: ping
  console.log("\n7. Testing POST /sse (ping)");
  const pingPayload = { jsonrpc: "2.0", id: 4, method: "ping" };
  const resPing = await handler(new Request("https://localhost/sse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pingPayload)
  }));
  assert(resPing.status === 200, "ping status is 200");
  const pingResult = await resPing.json();
  assert(pingResult.id === 4, "ping id matches");

  // Test 8: Discovery probe (/.well-known/oauth-protected-resource)
  console.log("\n8. Testing GET /.well-known/... (Discovery probe)");
  const resDiscovery = await handler(new Request("https://localhost/.well-known/oauth-protected-resource", { method: "GET" }));
  assert(resDiscovery.status === 404, "Returns 404 cleanly instead of 500 error");

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
