import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { log } from "./logger";
import { runHermesStartupSanityCheck } from "./hermes-startup";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  runHermesStartupSanityCheck();
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // In production: serve static built assets
  // In dev with two-process setup: API_ONLY=1, no Vite (Vite runs on 5173, proxies /api here)
  // In dev single-process: Vite runs as Express middleware
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else if (process.env.API_ONLY === "1") {
    log("API-only mode: Express serves /api on 5000, frontend at http://localhost:5173");
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const argv = process.argv.slice(2);
  const cliPort = argv.indexOf("--port") >= 0 ? argv[argv.indexOf("--port") + 1] : undefined;
  const cliHost = argv.indexOf("--host") >= 0 ? argv[argv.indexOf("--host") + 1] : undefined;

  const port = parseInt(cliPort || process.env.PORT || "5000", 10);
  const host = cliHost || "0.0.0.0";
  httpServer.listen(
    {
      port,
      host,
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      fetch(`http://localhost:${port}/api/status`)
        .then(() => log("initial node status check complete"))
        .catch((e) => log(`initial status check failed: ${e.message}`));
    },
  );
})();
