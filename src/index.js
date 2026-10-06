// ============================================
// MCP SERVER - Hessen Arzt Suche
// Vercel Edge Functions + Cloudflare Worker
// ============================================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SseServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const API_URL = "https://arztsuchehessen.de";

async function apiRequest(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response.json();
}

const tools = [
  {
    name: "suggest_aerzte",
    description: "Search for doctor suggestions",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"]
    }
  },
  {
    name: "suche_doktor",
    description: "Detailed doctor search",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"]
    }
  }
];

const server = new Server(
  { name: "hessen-artz-suche-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = name === "suggest_aerzte"
      ? await apiRequest("/api/suggestAerzteAndFgbAndSpAndGenAndZus", { q: args.query })
      : await apiRequest("/api/suche", { q: args.query });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text", text: `ERROR: ${error.message}` }], isError: true };
  }
});

const transport = new SseServerTransport();
await server.connect(transport);

// Edge Functions Handler
export default async function handler(request) {
  const url = new URL(request.url);

  if (url.pathname === "/sse") {
    return transport.handleRequest(request);
  }

  return new Response("Use /sse for MCP connection", { status: 200 });
}