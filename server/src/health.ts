import type { IncomingMessage, ServerResponse } from "node:http";

export function createHealthHandler(checkDatabase: () => Promise<void>) {
  return async (request: Pick<IncomingMessage, "method" | "url">, response: Pick<ServerResponse, "writeHead" | "end">): Promise<void> => {
    if (request.method !== "GET" || request.url !== "/healthz") {
      response.writeHead(404);
      response.end();
      return;
    }
    try {
      await checkDatabase();
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify({ status: "ok" }));
    } catch {
      response.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify({ status: "unavailable" }));
    }
  };
}
