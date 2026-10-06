// ============================================
// MCP SERVER - Hessen Arzt Suche
// Universal Server (Cloudflare Worker + Vercel + Node.js)
// Full MCP Protocol (SSE + Streamable HTTP)
// ============================================

const SERVER_NAME = "hessen-artz-suche-mcp";
const SERVER_VERSION = "1.1.0";
const API_URL = "https://arztsuchehessen.de";

// CORS Headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "Content-Type, Mcp-Session-Id",
};

// Available MCP Tools with AI Behavioral Guidelines & Workflow Directives
const TOOLS = [
  {
    name: "suggest_plz_ort",
    description: "Search postal codes (PLZ) and city names in Hessen, Germany. AI DIRECTIVE: Always call this or provide location to get exact GPS coordinates (lat/lon) before performing a radius distance search.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "City name or 5-digit postal code in Hessen (e.g. 'Darmstadt', '64521', 'Groß-Gerau', 'Frankfurt am Main')"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "suggest_aerzte",
    description: "Search for doctors, medical specialties (Fachgebiet), sub-specialties (Schwerpunkt), or additional qualifications (Zusatzbezeichnung) in Hessen. AI DIRECTIVE: Use this when the user's search term needs German medical classification mapping (e.g. 'Kinderorthopädie', 'Kardiologie', 'Innere Medizin').",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "German medical search query (min. 2 characters, e.g. 'Kinderorthopädie', 'Orthopädie', 'Kardiologe', 'Müller')"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "suche_doktor",
    description: `Comprehensive doctor and specialist search in Hessen with location, radius (km), and specialty filters.

AI WORKFLOW & POST-PROCESSING GUIDELINES:
1. QUERY TRANSLATION: Automatically translate foreign language specialty requests to standard German medical terms (e.g., 'çocuk ortopedisi' -> 'Kinderorthopädie' or 'Orthopädie', 'kulak burun boğaz' -> 'Hals-Nasen-Ohrenheilkunde', 'göz doktoru' -> 'Augenheilkunde', 'dahiliye' -> 'Innere Medizin').
2. CONTACT & WEBSITE VERIFICATION: When doctors are returned, check the results for phone numbers and profile links. If the user requests full contact details, office hours, or website information, use web search to inspect the official practice website or online booking profile (e.g., Doctolib, Jameda).
3. MULTILINGUAL / LANGUAGE PREFERENCE: If the user requests a specific language (e.g. Turkish, English, Arabic), highlight and prioritize doctors who speak that language. If language info is not in the primary database, check the doctor's practice website to confirm spoken languages.
4. DETAILED PRESENTATION: Format output with Doctor Name/Title, Specialty, Distance (km), Full Address, Phone Number, and Direct Profile/Booking Link. Group results clearly.`,
    inputSchema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name or postal code in Hessen (e.g. 'Darmstadt', '64521 Groß-Gerau', 'Frankfurt am Main', 'Wiesbaden'). Coordinates will be auto-resolved."
        },
        radius: {
          type: "number",
          description: "Search radius in kilometers around the location (e.g. 0, 5, 10, 15, 20, 25, 50). Default is 5."
        },
        query: {
          type: "string",
          description: "Doctor name, German specialty keyword, or medical search query (e.g. 'Kinderorthopädie', 'Orthopädie', 'Hausarzt', 'Kardiologe', 'Müller'). AI: Always provide German medical terms here."
        },
        lat: {
          type: "string",
          description: "Optional explicit latitude (e.g. '49.872356')"
        },
        lon: {
          type: "string",
          description: "Optional explicit longitude (e.g. '8.650903')"
        },
        doctorType: {
          type: "string",
          description: "Optional doctor type filter: 'doctor' (Ärzte), 'psychotherapist' (Psychotherapeuten), or '' (all)"
        },
        professionDoctor: {
          type: "array",
          items: { type: "string" },
          description: "Optional profession / specialty codes (e.g. ['10'] for Allgemeinmedizin)"
        },
        limit: {
          type: "number",
          description: "Maximum number of doctor results to return (default: 25)"
        }
      }
    }
  }
];

// Helper: HTTP Request to Hessen Arzt JSON API
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

// Helper: Resolve Location to Coordinates
async function resolveLocation(locationQuery) {
  if (!locationQuery || typeof locationQuery !== "string") return null;

  // Extract clean query term (if user wrote "64521 Groß-Gerau", try "64521" first then "Groß-Gerau")
  const trimmed = locationQuery.trim();
  const zipMatch = trimmed.match(/\b\d{5}\b/);
  const searchTerm = zipMatch ? zipMatch[0] : trimmed;

  try {
    const locations = await apiRequest("/api/suggestPlzAndOrt", { q: searchTerm });
    if (Array.isArray(locations) && locations.length > 0) {
      const loc = locations[0];
      return {
        lat: loc.lat,
        lon: loc.lon,
        value: `${loc.plz} ${loc.ort}`,
        plz: loc.plz,
        ort: loc.ort
      };
    }
  } catch (e) {
    // Fallback: retry with full string if different
    if (searchTerm !== trimmed) {
      try {
        const locations = await apiRequest("/api/suggestPlzAndOrt", { q: trimmed });
        if (Array.isArray(locations) && locations.length > 0) {
          const loc = locations[0];
          return {
            lat: loc.lat,
            lon: loc.lon,
            value: `${loc.plz} ${loc.ort}`,
            plz: loc.plz,
            ort: loc.ort
          };
        }
      } catch (err) {
        // Ignore fallback errors
      }
    }
  }

  return null;
}

// Helper: Comprehensive Search via /api/suche FormData Endpoint
async function searchDoctors(args = {}) {
  const {
    location,
    radius = 5,
    query,
    lat,
    lon,
    doctorType = "",
    professionDoctor,
    limit = 25
  } = args;

  let targetLat = lat;
  let targetLon = lon;
  let targetLocValue = location || "";

  // If location string provided without lat/lon, resolve coordinates
  if ((!targetLat || !targetLon) && location) {
    const resolved = await resolveLocation(location);
    if (resolved) {
      targetLat = resolved.lat;
      targetLon = resolved.lon;
      targetLocValue = resolved.value;
    }
  }

  const formData = new FormData();

  if (targetLat && targetLon) {
    formData.append("location[lat]", String(targetLat));
    formData.append("location[lon]", String(targetLon));
    formData.append("location[value]", targetLocValue || `${targetLat}, ${targetLon}`);
    formData.append("radius", String(radius));
  }

  formData.append("doctorType", doctorType || "");

  if (Array.isArray(professionDoctor)) {
    for (const prof of professionDoctor) {
      formData.append("professionDoctor[]", String(prof));
    }
  } else if (professionDoctor) {
    formData.append("professionDoctor[]", String(professionDoctor));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let data;
  try {
    const response = await fetch(`${API_URL}/api/suche`, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*"
      },
      body: formData,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Search API responded with status: ${response.status} ${response.statusText}`);
    }

    data = await response.json();
  } finally {
    clearTimeout(timeoutId);
  }

  let items = data.items || [];

  // Filter items by query keywords (matches doctor name, titles, specializations)
  if (query && typeof query === "string" && query.trim().length > 0) {
    const qTrimmed = query.trim().toLowerCase();
    const queryWords = qTrimmed.split(/\s+/).filter(w => w.length > 1);

    // 1. Strict match: all words match headline or description
    let filtered = items.filter(item => {
      const fullText = `${item.headline || ""} ${item.description || ""}`.toLowerCase();
      return queryWords.every(word => fullText.includes(word));
    });

    // 2. Partial/fuzzy fallback if strict match yields 0 results (e.g. specific keywords like "Kinderorthopädie" vs "Orthopädie")
    if (filtered.length === 0 && queryWords.length > 1) {
      filtered = items.filter(item => {
        const fullText = `${item.headline || ""} ${item.description || ""}`.toLowerCase();
        return queryWords.some(word => fullText.includes(word));
      });
    }

    // 3. Fallback for sub-specialties: if query contains "orthop", match all orthopedics
    if (filtered.length === 0 && qTrimmed.includes("orthop")) {
      filtered = items.filter(item => {
        const fullText = `${item.headline || ""} ${item.description || ""}`.toLowerCase();
        return fullText.includes("orthop");
      });
    }

    if (filtered.length > 0) {
      items = filtered;
    }
  }

  const limitedItems = items.slice(0, limit).map(item => ({
    name: item.headline || "Unbekannt",
    distance: item.distance !== undefined ? `${item.distance} km` : undefined,
    specialty: item.description?.trim() || "Keine Angabe",
    address: item.address ? {
      street: item.address.street || "",
      zip: item.address.zip || "",
      place: item.address.place || "",
      placeDistrict: item.address.placeDistrict || null,
      phone: item.address.phone || null,
      mobile: item.address.mobile || null,
      fax: item.address.fax || null
    } : null,
    profileUrl: item.href || null
  }));

  return {
    totalFound: items.length,
    returnedCount: limitedItems.length,
    searchCriteria: {
      location: targetLocValue || null,
      coordinates: targetLat && targetLon ? { lat: targetLat, lon: targetLon } : null,
      radiusKm: radius,
      query: query || null
    },
    doctors: limitedItems
  };
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

      try {
        let apiResult;

        if (toolName === "suggest_plz_ort") {
          apiResult = await apiRequest("/api/suggestPlzAndOrt", { q: args.query || "" });
        } else if (toolName === "suggest_aerzte") {
          apiResult = await apiRequest("/api/suggestAerzteAndFgbAndSpAndGenAndZus", { q: args.query || "" });
        } else if (toolName === "suche_doktor") {
          apiResult = await searchDoctors(args);
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