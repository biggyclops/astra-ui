import http from "node:http";
import {
  buildAutonomySnapshot,
  normalizeProgress,
  normalizeJobStatus,
  deriveOrbState,
} from "../server/autonomy";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function startMockHades() {
  const server = http.createServer((req, res) => {
    const url = req.url || "";
    res.setHeader("Content-Type", "application/json");
    if (url === "/api/status") {
      res.end(JSON.stringify({
        status: "processing",
        task_id: "job-42",
        prompt: "Render nebula still",
        type: "comfyui.image",
        progress: 0.42,
        eta_seconds: 88,
        advisor_summary: "GPU warm, queue short",
      }));
      return;
    }
    if (url === "/api/queue") {
      res.end(JSON.stringify({
        tasks: [{ filename: "queued-1.json", title: "Upscale portrait", type: "comfyui.image", status: "queued" }],
      }));
      return;
    }
    if (url === "/api/jobs") {
      res.end(JSON.stringify([
        { id: "h1", title: "Night city timelapse", type: "comfyui.video", status: "completed", progress: 1 },
        { id: "job-42", title: "Render nebula still", type: "comfyui.image", status: "processing", progress: 0.42, eta_seconds: 88 },
      ]));
      return;
    }
    if (url === "/api/advisor") {
      res.end(JSON.stringify({
        top_recommendation: "Finish the nebula still before starting video.",
        current_advisories: ["ComfyUI workers idle after this job"],
      }));
      return;
    }
    res.statusCode = 404;
    res.end("{}");
  });
  return new Promise<{ server: http.Server; port: number }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("no port");
      resolve({ server, port: addr.port });
    });
  });
}

async function main() {
  assert(normalizeProgress(0.42) === 42, "0-1 progress should become 42");
  assert(normalizeProgress(80) === 80, "0-100 progress stays 80");
  assert(normalizeJobStatus("processing") === "running", "processing maps to running");
  assert(deriveOrbState(false, null) === "offline", "unreachable Hades is offline");
  assert(deriveOrbState(true, null) === "idle", "reachable idle is idle");

  const mock = await startMockHades();
  process.env.HADES_CORE_BASE = `http://127.0.0.1:${mock.port}`;
  process.env.HADES_FETCH_TIMEOUT_MS = "800";

  const fleet = async () => ({
    nodes: [
      { name: "Mini-Beast", status: "online" },
      { name: "Hades", status: "online" },
    ],
    checkedAt: new Date().toISOString(),
  });

  const online = await buildAutonomySnapshot(fleet);
  assert(online.hadesReachable === true, "mock Hades should be reachable");
  assert(online.working?.id === "job-42", "active job id");
  assert(online.working?.node === "Hades", "active job node");
  assert(online.working?.progress === 42, "progress normalized to 0-100");
  assert(online.working?.etaSeconds === 88, "eta seconds");
  assert(online.orbState === "working", "orb working while processing");
  assert(online.queue.length === 1, "queue mapped");
  assert(online.history.length === 2, "history mapped");
  assert(online.advisor.topRecommendation?.includes("nebula"), "advisor mapped");

  console.log("ONLINE SNAPSHOT");
  console.log(JSON.stringify(online, null, 2));

  mock.server.close();

  process.env.HADES_CORE_BASE = "http://127.0.0.1:9";
  const offline = await buildAutonomySnapshot(async () => ({
    nodes: [{ name: "Mini-Beast", status: "online" }, { name: "Hades", status: "offline" }],
    checkedAt: new Date().toISOString(),
  }));
  assert(offline.hadesReachable === false, "closed port must mark Hades unavailable");
  assert(offline.working === null, "offline snapshot has no working job");
  assert(offline.orbState === "offline", "offline orb");
  assert(offline.fleet.nodes.length === 2, "fleet still present when Hades fails");

  console.log("OFFLINE SNAPSHOT");
  console.log(JSON.stringify(offline, null, 2));
  console.log("verify-autonomy-snapshot: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
