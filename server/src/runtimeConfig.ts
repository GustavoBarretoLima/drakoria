export function getServerPort(value: string | undefined): number {
  if (value === undefined) return 3001;
  if (!/^\d+$/.test(value)) throw new Error("PORT invalida.");
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT invalida.");
  return port;
}

export function getAllowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env.ALLOWED_ORIGINS ?? (env.NODE_ENV === "production" ? "" : "http://localhost:5173,http://localhost:3000");
  const origins = raw.split(",").map(origin => origin.trim()).filter(Boolean);
  if (!origins.length) throw new Error("Configure ALLOWED_ORIGINS.");
  for (const origin of origins) {
    const url = new URL(origin);
    if (!["https:", "http:"].includes(url.protocol) || url.origin !== origin) throw new Error("Origem invalida.");
    if (env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("Origens de producao exigem HTTPS.");
  }
  return origins;
}
