// ============================================
// MCP SERVER - Hessen Arzt Suche
// Universal Server (Cloudflare Worker + Vercel + Node.js)
// Full MCP Protocol (SSE + Streamable HTTP)
// ============================================

const SERVER_NAME = "hessen-artz-suche-mcp";
const SERVER_VERSION = "1.0.0";
const API_URL = "https://arztsuchehessen.de";

// CORS Headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "Content-Type, Mcp-Session-Id",
};

// Available MCP Tools
const TOOLS = [
  {
    name: "suggest_aerzte",
    description: "Search for doctor suggestions, specializations, or general medicine in Hessen",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (min. 2 characters, e.g. 'Kardiologe', 'Müller', 'Frankfurt')"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "suche_doktor",
    description: "Detailed doctor search in Hessen (name, address, phone, specializations)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (e.g. doctor name, city, specialty)"
        }
      },
      required: ["query"]
    }
  }
];

// Helper: HTTP Request to Hessen Arzt API
async function apiRequest(endpoint, data) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*"
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper: Process JSON-RPC 2.0 Message
async function handleJsonRpcMessage(message) {
  if (!message || typeof message !== "object") {
    return {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" }
    };
  }

  const { id, method, params } = message;

  // Handle Notifications (messages without id)
  if (id === undefined || id === null) {
    // Client acknowledges initialization
    if (method === "notifications/initialized") {
      return null;
    }
    return null;
  }

  switch (method) {
    case "initialize": {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: SERVER_NAME,
            version: SERVER_VERSION
          }
        }
      };
    }

    case "ping": {
      return {
        jsonrpc: "2.0",
        id,
        result: {}
      };
    }

    case "tools/list": {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS
        }
      };
    }

    case "tools/call": {
      const toolName = params?.name;
      const args = params?.arguments || {};
      const query = args.query || "";

      try {
        let apiResult;
        if (toolName === "suggest_aerzte") {
          apiResult = await apiRequest("/api/suggestAerzteAndFgbAndSpAndGenAndZus", { q: query });
        } else if (toolName === "suche_doktor") {
          // Try search endpoint, fall back to suggestion if search times out or errors
          try {
            apiResult = await apiRequest("/api/suche", { q: query });
          } catch (searchErr) {
            // Fallback to suggest if search endpoint fails
            apiResult = await apiRequest("/api/suggestAerzteAndFgbAndSpAndGenAndZus", { q: query });
          }
        } else {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Unknown tool: ${toolName}` }
          };
        }

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(apiResult, null, 2)
              }
            ],
            isError: false
          }
        };
      } catch (err) {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: `Error calling tool ${toolName}: ${err.message}`
              }
            ],
            isError: true
          }
        };
      }
    }

    default: {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not supported: ${method}`
        }
      };
    }
  }
}

// In-Memory SSE Sessions Map (for live SSE connections)
const sseSessions = new Map();

// Generate Random Session ID
function generateSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Main Web Standards Fetch Handler
export async function handler(request) {
  const url = new URL(request.url);

  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  // Health check / Info page
  if (url.pathname === "/" || url.pathname === "/health") {
    return new Response(
      JSON.stringify({
        status: "ok",
        server: SERVER_NAME,
        version: SERVER_VERSION,
        endpoints: {
          sse: `${url.origin}/sse`,
          mcp: `${url.origin}/mcp`
        },
        tools: TOOLS.map(t => t.name)
      }, null, 2),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json; charset=utf-8"
        }
      }
    );
  }

  // Handle OAuth/Discovery probes cleanly with 404 (prevent 500)
  if (url.pathname.startsWith("/.well-known")) {
    return new Response(JSON.stringify({ error: "Not required" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }

  // SSE & MCP Endpoints: /sse or /mcp
  const isMcpPath = url.pathname === "/sse" || url.pathname === "/mcp";

  if (!isMcpPath) {
    return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
  }

  // 1. GET Request -> Open SSE Stream (2024-11-05 SSE Protocol)
  if (request.method === "GET") {
    const sessionId = url.searchParams.get("sessionId") || generateSessionId();
    const encoder = new TextEncoder();
    let keepAliveTimer;

    const stream = new ReadableStream({
      start(controller) {
        // Register session
        const session = {
          controller,
          send(data) {
            try {
              controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(data)}\n\n`));
            } catch (e) {
              // Ignore write errors on closed stream
            }
          }
        };
        sseSessions.set(sessionId, session);

        // Send initial 'endpoint' event with POST target URL
        const postEndpoint = `${url.pathname}?sessionId=${sessionId}`;
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${postEndpoint}\n\n`));

        // Periodic keep-alive comments to prevent timeouts
        keepAliveTimer = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: keep-alive\n\n`));
          } catch (e) {
            clearInterval(keepAliveTimer);
          }
        }, 15000);
      },
      cancel() {
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        sseSessions.delete(sessionId);
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });
  }

  // 2. POST Request -> Process JSON-RPC Messages
  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Invalid JSON" } }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const sessionId = url.searchParams.get("sessionId") || request.headers.get("mcp-session-id");
    const activeSession = sessionId ? sseSessions.get(sessionId) : null;

    // Handle batch or single message
    const isArray = Array.isArray(body);
    const messages = isArray ? body : [body];
    const responses = [];

    for (const msg of messages) {
      const response = await handleJsonRpcMessage(msg);
      if (response) {
        responses.push(response);
        // Forward to active SSE stream if connected
        if (activeSession) {
          activeSession.send(response);
        }
      }
    }

    // If notifications only, respond 202 Accepted
    if (responses.length === 0) {
      return new Response(null, {
        status: 202,
        headers: CORS_HEADERS
      });
    }

    // Return the JSON-RPC response in the HTTP response body as well
    // (Ensures compatibility with both Streamable HTTP and SSE clients across serverless instances)
    const resultBody = isArray ? responses : responses[0];
    return new Response(JSON.stringify(resultBody), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }

  return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
}

// Support both Cloudflare Worker (`fetch` object) and standard function export
handler.fetch = handler;
export default handler;

// If executed directly with Node.js CLI (e.g. `node src/index.js` or `npm start`)
if (typeof process !== "undefined" && process.argv && process.argv[1]) {
  const currentFilePath = new URL(import.meta.url).pathname;
  if (process.argv[1] === currentFilePath || process.argv[1].endsWith("/src/index.js")) {
    const http = await import("node:http");
    const PORT = parseInt(process.env.PORT || "3000", 10);

    const server = http.createServer(async (req, res) => {
      try {
        const fullUrl = `http://${req.headers.host || "localhost:" + PORT}${req.url}`;
        
        // Read body for POST
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const bodyBuffer = Buffer.concat(chunks);
        const hasBody = ["POST", "PUT", "PATCH"].includes(req.method || "");

        const webRequest = new Request(fullUrl, {
          method: req.method,
          headers: req.headers,
          body: hasBody && bodyBuffer.length > 0 ? bodyBuffer : undefined,
          duplex: "half"
        });

        const webResponse = await handler(webRequest);

        res.statusCode = webResponse.status;
        webResponse.headers.forEach((val, key) => {
          res.setHeader(key, val);
        });

        if (webResponse.body) {
          const reader = webResponse.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } else {
          res.end();
        }
      } catch (err) {
        res.statusCode = 500;
        res.end(`Internal Server Error: ${err.message}`);
      }
    });

    server.listen(PORT, () => {
      console.log(`[MCP Server] Running on http://localhost:${PORT}`);
      console.log(`[MCP Server] SSE Endpoint: http://localhost:${PORT}/sse`);
    });
  }
}