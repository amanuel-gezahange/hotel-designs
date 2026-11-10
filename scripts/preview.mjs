// Preview a built client site:   npm run preview -- beta-lodge   → http://localhost:4000
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2] ?? process.env.PREVIEW_SLUG;
if (slug && !/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/.test(slug)) { console.error("Invalid client name."); process.exit(1); }
const root = path.resolve("dist", slug ?? "");
if (!slug || !fs.existsSync(root)) {
  console.error(`Nothing built yet. Run: npm run build-site -- ${slug ?? "<name>"}`);
  process.exit(1);
}
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml", ".json": "application/json" };
const port = Number(process.env.PORT ?? 4000);

http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400).end(); return; }
  let p = path.join(root, rel);
  if (p !== root && !p.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!fs.existsSync(p)) { p = path.join(root, "404.html"); res.statusCode = 404; }
  res.setHeader("content-type", types[path.extname(p)] ?? "application/octet-stream");
  fs.createReadStream(p).pipe(res);
}).listen(port, () => console.log(`Preview: http://localhost:${port}   (Ctrl+C to stop)`));
