// ============================================
// MCP SERVER - Hessen Arzt Suche
// Universal Server (Cloudflare Worker + Vercel + Node.js)
// SSE Transport for MCP
// ============================================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SseServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const API_URL = "https://arztsuchehessen.de";

// HTTP Request Helper
async function apiRequest(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "MCP-Client/1.0"
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

// Tool Definitions
const tools = [
  {
    name: "suggest_aerzte",
    description: "Search for doctor suggestions, specializations, or general medicine",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term (minimum 2 characters)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "suche_doktor",
    description: "Detailed doctor search with all information (name, address, phone, specializations)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term (doctor name, specialization, city, etc.)"
        }
      },
      required: ["query"]
    }
  }
];

// Create MCP Server
const server = new Server(
  {
    name: "hessen-artz-suche-mcp",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Register Tool Handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    if (name === "suggest_aerzte") {
      result = await apiRequest("/api/suggestAerzteAndFgbAndSpAndGenAndZus", { q: args.query });
    } else if (name === "suche_doktor") {
      result = await apiRequest("/api/suche", { q: args.query });
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `ERROR: ${error.message}`
      }],
      isError: true
    };
  }
});

// Create SSE Transport
const transport = new SseServerTransport();
await server.connect(transport);

// Universal Handler - Works with Cloudflare Worker, Vercel, and Node.js
const handler = async (request) => {
  const url = new URL(request.url);

  // SSE endpoint for MCP
  if (url.pathname === "/sse" || url.pathname === "/mcp") {
    return transport.handleRequest(request);
  }

  // Health check
  if (url.pathname === "/" || url.pathname === "/health") {
    return new Response("Hessen Arzt Suche MCP Server - Use /sse or /mcp for MCP connection", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }

  return new Response("Not Found", { status: 404 });
};

// Export for different platforms
try {
  // Cloudflare Worker
  export default { fetch: handler };
} catch (e) {
  // Node.js / Vercel
  export { handler as default };
}