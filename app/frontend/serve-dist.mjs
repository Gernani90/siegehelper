import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "dist");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const rawBackendUrl = (process.env.PYTHON_BACKEND_URL || process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);
const backendBaseUrl = /^https?:\/\//i.test(rawBackendUrl) ? rawBackendUrl : `http://${rawBackendUrl}`;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
};

function resolvePath(urlPath) {
  const cleanPath = normalize(decodeURIComponent(urlPath.split("?")[0]))
    .replace(/\\/g, "/")
    .replace(/^(\.\.\/)+/, "");
  if (cleanPath === "/" || cleanPath === "/login") {
    return join(root, "login.html");
  }
  if (cleanPath === "/dashboard" || cleanPath === "/home") {
    return join(root, "home.html");
  }
  if (/^\/defenses\/\d+$/.test(cleanPath)) {
    return join(root, "defense-detail.html");
  }
  if (cleanPath === "/defenses/new") {
    return join(root, "defense-form.html");
  }
  if (/^\/defenses\/\d+\/edit$/.test(cleanPath)) {
    return join(root, "defense-form.html");
  }
  if (/^\/attacks\/\d+$/.test(cleanPath)) {
    return join(root, "attack-detail.html");
  }
  if (cleanPath === "/attacks/new") {
    return join(root, "attack-form.html");
  }
  if (/^\/attacks\/\d+\/edit$/.test(cleanPath)) {
    return join(root, "attack-form.html");
  }

  const candidate = join(root, cleanPath);
  const isImageAsset = /^\/assets\/.+\.(png|jpg|jpeg|webp|svg|gif)$/i.test(cleanPath);
  const blockLegacyShell = candidate === join(root, "index.html") || (cleanPath.startsWith("/assets/") && !isImageAsset);

  if (!blockLegacyShell && existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }

  return join(root, "login.html");
}

createServer((req, res) => {
  const requestPath = (req.url || "/").split("?")[0];
  if (requestPath.startsWith("/api/v1/")) {
    const targetUrl = `${backendBaseUrl}${req.url || "/"}`;
    const headers = { ...req.headers };
    delete headers.host;

    fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
      duplex: "half",
    })
      .then(async (response) => {
        res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
        res.end(Buffer.from(await response.arrayBuffer()));
      })
      .catch((error) => {
        res.writeHead(502, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify({ detail: error.message || "Erro ao acessar backend" }));
      });
    return;
  }

  if (requestPath === "/api/defenses-list") {
    fetch(`${backendBaseUrl}/api/v1/search/defenses?limit=100`)
      .then(async (response) => {
        const body = await response.text();
        res.writeHead(response.status, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(body);
      })
      .catch((error) => {
        res.writeHead(500, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify({ detail: error.message || "Erro ao carregar defesas" }));
      });
    return;
  }

  if (requestPath === "/api/defense-detail") {
    const url = new URL(req.url || "/", "http://127.0.0.1:3000");
    const id = url.searchParams.get("id");
    if (!id || !/^\d+$/.test(id)) {
      res.writeHead(400, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ detail: "Defense id inválido" }));
      return;
    }

    fetch(`${backendBaseUrl}/api/v1/search/defense/${id}`)
      .then(async (response) => {
        const body = await response.text();
        res.writeHead(response.status, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(body);
      })
      .catch((error) => {
        res.writeHead(500, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify({ detail: error.message || "Erro ao carregar defesa" }));
      });
    return;
  }

  if (requestPath === "/api/defenses") {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      fetch(`${backendBaseUrl}/api/v1/entities/defenses`, {
        method: req.method || "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
        .then(async (response) => {
          const responseBody = await response.text();
          res.writeHead(response.status, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          });
          res.end(responseBody);
        })
        .catch((error) => {
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          });
          res.end(JSON.stringify({ detail: error.message || "Erro ao salvar defesa" }));
        });
    });
    return;
  }

  if (/^\/api\/defenses\/\d+$/.test(requestPath)) {
    const id = requestPath.match(/^\/api\/defenses\/(\d+)$/)[1];
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      fetch(`${backendBaseUrl}/api/v1/entities/defenses/${id}`, {
        method: req.method || "GET",
        headers: { "Content-Type": "application/json" },
        body: body || undefined,
      })
        .then(async (response) => {
          const responseBody = await response.text();
          res.writeHead(response.status, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          });
          res.end(responseBody);
        })
        .catch((error) => {
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          });
          res.end(JSON.stringify({ detail: error.message || "Erro ao processar defesa" }));
        });
    });
    return;
  }

  if (requestPath === "/api/monster-search") {
    const url = new URL(req.url || "/", "http://127.0.0.1:3000");
    const name = url.searchParams.get("name") || "";
    const pageSize = url.searchParams.get("page_size") || "10";
    fetch(`${backendBaseUrl}/api/v1/monsters/search?name=${encodeURIComponent(name)}&page_size=${encodeURIComponent(pageSize)}`)
      .then(async (response) => {
        const body = await response.text();
        res.writeHead(response.status, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(body);
      })
      .catch((error) => {
        res.writeHead(500, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify({ detail: error.message || "Erro ao buscar monstro" }));
      });
    return;
  }

  if (requestPath === "/api/attack-detail") {
    const url = new URL(req.url || "/", "http://127.0.0.1:3000");
    const id = url.searchParams.get("id");
    if (!id || !/^\d+$/.test(id)) {
      res.writeHead(400, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ detail: "Attack id inválido" }));
      return;
    }

    fetch(`${backendBaseUrl}/api/v1/search/attack/${id}`)
      .then(async (response) => {
        const body = await response.text();
        res.writeHead(response.status, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(body);
      })
      .catch((error) => {
        res.writeHead(500, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify({ detail: error.message || "Erro ao carregar ataque" }));
      });
    return;
  }

  if (requestPath === "/api/attacks") {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      fetch(`${backendBaseUrl}/api/v1/entities/attacks`, {
        method: req.method || "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
        .then(async (response) => {
          const responseBody = await response.text();
          res.writeHead(response.status, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          });
          res.end(responseBody);
        })
        .catch((error) => {
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          });
          res.end(JSON.stringify({ detail: error.message || "Erro ao salvar ataque" }));
        });
    });
    return;
  }

  if (/^\/api\/attacks\/\d+$/.test(requestPath)) {
    const id = requestPath.match(/^\/api\/attacks\/(\d+)$/)[1];
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      fetch(`${backendBaseUrl}/api/v1/entities/attacks/${id}`, {
        method: req.method || "GET",
        headers: { "Content-Type": "application/json" },
        body: body || undefined,
      })
        .then(async (response) => {
          const responseBody = await response.text();
          res.writeHead(response.status, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          });
          res.end(responseBody);
        })
        .catch((error) => {
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          });
          res.end(JSON.stringify({ detail: error.message || "Erro ao processar ataque" }));
        });
    });
    return;
  }

  const filePath = resolvePath(req.url || "/");
  const type = contentTypes[extname(filePath)] || "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}).listen(port, host, () => {
  console.log(`Frontend running at http://${host}:${port}`);
});
