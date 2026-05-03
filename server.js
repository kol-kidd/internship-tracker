import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distDir = resolve(__dirname, "dist");
const port = Number(process.env.PORT) || 4173;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function resolvePublicPath(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, "http://localhost").pathname);
  const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = resolve(distDir, `.${sep}${normalizedPath}`);

  if (requestedPath !== distDir && !requestedPath.startsWith(`${distDir}${sep}`)) {
    return null;
  }

  return requestedPath;
}

async function getFilePath(requestedPath) {
  if (!requestedPath || !existsSync(requestedPath)) {
    return join(distDir, "index.html");
  }

  const fileStat = await stat(requestedPath);
  if (fileStat.isDirectory()) {
    const indexPath = join(requestedPath, "index.html");
    return existsSync(indexPath) ? indexPath : join(distDir, "index.html");
  }

  return requestedPath;
}

const server = createServer(async (req, res) => {
  try {
    if (!existsSync(distDir)) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Build output not found. Run npm run build before starting.");
      return;
    }

    const requestedPath = resolvePublicPath(req.url || "/");
    const filePath = await getFilePath(requestedPath);
    const contentType = mimeTypes[extname(filePath)] || "application/octet-stream";

    res.writeHead(200, {
      "Cache-Control": filePath.endsWith("index.html")
        ? "no-cache"
        : "public, max-age=31536000, immutable",
      "Content-Type": contentType,
    });
    createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`InternPal frontend running on port ${port}`);
});
