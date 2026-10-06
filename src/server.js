// ============================================
// Local Node.js Development Server
// Wraps Web Standard MCP Handler with node:http
// ============================================

import http from "node:http";
import handler from "./index.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

const server = http.createServer(async (req, res) => {
  try {
    const fullUrl = `http://${req.headers.host || "localhost:" + PORT}${req.url}`;

    // Read body for POST/PUT/PATCH
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
