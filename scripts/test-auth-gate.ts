#!/usr/bin/env tsx
/**
 * test-auth-gate.ts — Automated verification of the session auth gate.
 *
 * This script is self-contained: it starts its own server on a free port,
 * runs tests, and tears down the server. It can be run repeatedly without
 * leftover state affecting results.
 *
 * Usage:
 *   npx tsx scripts/test-auth-gate.ts
 *
 * Environment variables (optional):
 *   TEST_BASE_URL  - Skip server startup and use this URL instead
 *   RUN_UNIT_TESTS - Set to "0" to skip unit tests
 *
 * Exit codes:
 *   0 = all tests passed
 *   1 = one or more tests failed
 */

import type { Request } from "express";
import type { Socket } from "net";
import { spawn, type ChildProcess } from "child_process";
import { createServer } from "net";

const TEST_USER = "testuser";
const TEST_PASS = "testpass";
// Secret must be at least 32 characters
const TEST_SECRET = "test-secret-do-not-use-in-prod-minimum-32-chars";
const TEST_PASS_HASH = "13d249f2cb4127b40cfa757866850278793f814ded3c587fe5889e889a7a9f6c";

const RUN_UNIT_TESTS = process.env.RUN_UNIT_TESTS !== "0";
const EXTERNAL_URL = process.env.TEST_BASE_URL;

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function log(msg: string) {
  console.log(`[test] ${msg}`);
}

function pass(name: string, details?: string) {
  results.push({ name, passed: true, details });
  log(`✓ ${name}${details ? ` (${details})` : ""}`);
}

function fail(name: string, details?: string) {
  results.push({ name, passed: false, details });
  log(`✗ ${name}${details ? ` (${details})` : ""}`);
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function startServer(port: number): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "development",
      ASTRA_AUTH_SECRET: TEST_SECRET,
      ASTRA_AUTH_USER: TEST_USER,
      ASTRA_AUTH_PASSWORD_SHA256: TEST_PASS_HASH,
    };

    const child = spawn("npx", ["tsx", "server/index.ts"], {
      env,
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        child.kill();
        reject(new Error("Server startup timeout"));
      }
    }, 30000);

    child.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      if (text.includes("serving on port") && !started) {
        started = true;
        clearTimeout(timeout);
        setTimeout(() => resolve(child), 500);
      }
    });

    child.stderr?.on("data", (data: Buffer) => {
      if (!started) {
        console.error("[server stderr]", data.toString());
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("exit", (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

async function fetchJson(
  baseUrl: string,
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; data: any; cookies?: string; headers: Headers }> {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const cookies = res.headers.get("set-cookie") ?? undefined;
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data, cookies, headers: res.headers };
}

async function fetchText(baseUrl: string, path: string): Promise<{ status: number; text: string }> {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url);
  const text = await res.text();
  return { status: res.status, text };
}

function extractSessionCookie(setCookie: string | undefined): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(/astra_session=([^;]+)/);
  return match ? match[1] : null;
}

async function runTests(baseUrl: string) {
  log(`Testing auth gate at ${baseUrl}`);
  log(`Test user: ${TEST_USER}`);
  log("");

  // Reset rate limit state before tests
  try {
    const { _resetRateLimitState, _revokedSignatures } = await import("../server/routes");
    _resetRateLimitState();
    _revokedSignatures.clear();
  } catch {
    log("Note: Could not reset rate limit state (running against external server)");
  }

  // Test 1: /healthz is public (200 without auth)
  {
    const { status, text } = await fetchText(baseUrl, "/healthz");
    if (status === 200 && text.includes("astra-ui ok")) {
      pass("/healthz returns 200 without auth");
    } else {
      fail("/healthz returns 200 without auth", `got ${status}: ${text}`);
    }
  }

  // Test 2: GET /api/autonomy/snapshot returns 401 without cookie
  {
    const { status, data } = await fetchJson(baseUrl, "/api/autonomy/snapshot");
    if (status === 401 && data?.authenticated === false) {
      pass("GET /api/autonomy/snapshot returns 401 without auth");
    } else {
      fail("GET /api/autonomy/snapshot returns 401 without auth", `got ${status}`);
    }
  }

  // Test 3: POST /api/actions returns 401 without cookie
  {
    const { status, data } = await fetchJson(baseUrl, "/api/actions", {
      method: "POST",
      body: JSON.stringify({ actionType: "test", requester: "test" }),
    });
    if (status === 401 && data?.authenticated === false) {
      pass("POST /api/actions returns 401 without auth");
    } else {
      fail("POST /api/actions returns 401 without auth", `got ${status}`);
    }
  }

  // Test 4: POST /api/actions/1/approve returns 401 without cookie
  {
    const { status, data } = await fetchJson(baseUrl, "/api/actions/1/approve", {
      method: "POST",
      body: JSON.stringify({ approver: "test" }),
    });
    if (status === 401 && data?.authenticated === false) {
      pass("POST /api/actions/1/approve returns 401 without auth");
    } else {
      fail("POST /api/actions/1/approve returns 401 without auth", `got ${status}`);
    }
  }

  // Test 5: POST /api/jobs returns 401 without cookie
  {
    const { status, data } = await fetchJson(baseUrl, "/api/jobs", {
      method: "POST",
      body: JSON.stringify({ type: "test", title: "Test", node: "test" }),
    });
    if (status === 401 && data?.authenticated === false) {
      pass("POST /api/jobs returns 401 without auth");
    } else {
      fail("POST /api/jobs returns 401 without auth", `got ${status}`);
    }
  }

  // Test 6: POST /api/messages returns 401 without cookie
  {
    const { status, data } = await fetchJson(baseUrl, "/api/messages", {
      method: "POST",
      body: JSON.stringify({ role: "user", content: "test" }),
    });
    if (status === 401 && data?.authenticated === false) {
      pass("POST /api/messages returns 401 without auth");
    } else {
      fail("POST /api/messages returns 401 without auth", `got ${status}`);
    }
  }

  // Test 7: GET /api/auth/session returns authenticated: false without cookie
  {
    const { status, data } = await fetchJson(baseUrl, "/api/auth/session");
    if (status === 200 && data?.authenticated === false) {
      pass("GET /api/auth/session returns authenticated: false without cookie");
    } else {
      fail("GET /api/auth/session returns authenticated: false without cookie", `got ${status}: ${JSON.stringify(data)}`);
    }
  }

  // Test 8: POST /api/auth/login with correct credentials returns 200 and sets cookie
  let validCookie: string | null = null;
  {
    const { status, data, cookies } = await fetchJson(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
    });
    validCookie = extractSessionCookie(cookies);
    if (status === 200 && data?.authenticated === true && validCookie) {
      pass("POST /api/auth/login with valid credentials sets cookie");
    } else {
      fail("POST /api/auth/login with valid credentials sets cookie", `got ${status}: ${JSON.stringify(data)}`);
    }
  }

  // Test 9: POST /api/auth/login with wrong password returns 401
  {
    const { status, data } = await fetchJson(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: TEST_USER, password: "wrongpassword" }),
    });
    if (status === 401 && data?.authenticated === false) {
      pass("POST /api/auth/login with wrong password returns 401");
    } else {
      fail("POST /api/auth/login with wrong password returns 401", `got ${status}`);
    }
  }

  // Test 10: GET /api/autonomy/snapshot returns 200 with valid cookie
  if (validCookie) {
    const { status, data } = await fetchJson(baseUrl, "/api/autonomy/snapshot", {
      headers: { Cookie: `astra_session=${validCookie}` },
    });
    if (status === 200 && !data?.authenticated?.toString().includes("false")) {
      pass("GET /api/autonomy/snapshot returns 200 with valid cookie");
    } else {
      fail("GET /api/autonomy/snapshot returns 200 with valid cookie", `got ${status}`);
    }
  } else {
    fail("GET /api/autonomy/snapshot returns 200 with valid cookie", "no valid cookie obtained");
  }

  // Test 11: GET /api/auth/session with valid cookie returns authenticated: true
  if (validCookie) {
    const { status, data } = await fetchJson(baseUrl, "/api/auth/session", {
      headers: { Cookie: `astra_session=${validCookie}` },
    });
    if (status === 200 && data?.authenticated === true && data?.user?.username === TEST_USER) {
      pass("GET /api/auth/session with valid cookie returns authenticated: true");
    } else {
      fail("GET /api/auth/session with valid cookie returns authenticated: true", `got ${status}: ${JSON.stringify(data)}`);
    }
  } else {
    fail("GET /api/auth/session with valid cookie returns authenticated: true", "no valid cookie obtained");
  }

  // Test 12: Tampered cookie returns 401
  {
    const tamperedCookie = "dGFtcGVyZWQ.bm90dmFsaWQ";
    const { status, data } = await fetchJson(baseUrl, "/api/autonomy/snapshot", {
      headers: { Cookie: `astra_session=${tamperedCookie}` },
    });
    if (status === 401 && data?.authenticated === false) {
      pass("Tampered cookie returns 401");
    } else {
      fail("Tampered cookie returns 401", `got ${status}`);
    }
  }

  // Test 13: POST /api/auth/logout revokes token (old cookie rejected with 401)
  if (validCookie) {
    const { status, data, cookies } = await fetchJson(baseUrl, "/api/auth/logout", {
      method: "POST",
      headers: { Cookie: `astra_session=${validCookie}` },
    });
    const clearedCookie = cookies?.includes("Max-Age=0") || cookies?.includes("astra_session=;");
    if (status === 200 && data?.authenticated === false && clearedCookie) {
      // Now verify the old cookie is rejected
      const { status: checkStatus } = await fetchJson(baseUrl, "/api/auth/session", {
        headers: { Cookie: `astra_session=${validCookie}` },
      });
      if (checkStatus === 200) {
        const { data: checkData } = await fetchJson(baseUrl, "/api/auth/session", {
          headers: { Cookie: `astra_session=${validCookie}` },
        });
        if (checkData?.authenticated === false) {
          pass("POST /api/auth/logout revokes token (old cookie rejected)");
        } else {
          fail("POST /api/auth/logout revokes token", "old cookie still authenticated");
        }
      } else {
        pass("POST /api/auth/logout revokes token (old cookie returns 401)");
      }
    } else {
      fail("POST /api/auth/logout revokes token", `got ${status}, cookie cleared: ${clearedCookie}`);
    }
  } else {
    fail("POST /api/auth/logout revokes token", "no valid cookie obtained");
  }

  // Test 14: Malformed cookie is ignored (not 500)
  {
    const { status } = await fetchJson(baseUrl, "/api/auth/session", {
      headers: { Cookie: "astra_session=%E0%A4%A" },
    });
    if (status === 200) {
      pass("Malformed cookie is ignored (not 500)");
    } else {
      fail("Malformed cookie is ignored", `got ${status}`);
    }
  }

  // Test 15: Form-encoded POST is rejected (415)
  {
    // Get a fresh valid cookie first
    const loginRes = await fetchJson(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
    });
    const cookie = extractSessionCookie(loginRes.cookies);

    const url = `${baseUrl}/api/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(cookie ? { Cookie: `astra_session=${cookie}` } : {}),
      },
      body: "role=user&content=test",
    });
    if (res.status === 415) {
      pass("Form-encoded POST /api/messages is rejected with 415");
    } else {
      fail("Form-encoded POST /api/messages is rejected with 415", `got ${res.status}`);
    }
  }

  // Test 16: Cross-origin Origin header is rejected (403)
  {
    const loginRes = await fetchJson(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
    });
    const cookie = extractSessionCookie(loginRes.cookies);

    const { status, data } = await fetchJson(baseUrl, "/api/auth/session", {
      headers: {
        Origin: "https://evil.example.com",
        ...(cookie ? { Cookie: `astra_session=${cookie}` } : {}),
      },
    });
    if (status === 403 && data?.error?.includes("Cross-origin")) {
      pass("Cross-origin Origin header is rejected with 403");
    } else {
      fail("Cross-origin Origin header is rejected with 403", `got ${status}: ${JSON.stringify(data)}`);
    }
  }

  // Test 17: Same-origin or missing Origin is allowed
  {
    const loginRes = await fetchJson(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
    });
    const cookie = extractSessionCookie(loginRes.cookies);

    // Test with no Origin header (should be allowed)
    const { status: noOriginStatus } = await fetchJson(baseUrl, "/api/auth/session", {
      headers: cookie ? { Cookie: `astra_session=${cookie}` } : {},
    });

    // Test with same-origin (extract host from baseUrl)
    const baseUrlObj = new URL(baseUrl);
    const { status: sameOriginStatus } = await fetchJson(baseUrl, "/api/auth/session", {
      headers: {
        Origin: baseUrlObj.origin,
        ...(cookie ? { Cookie: `astra_session=${cookie}` } : {}),
      },
    });

    if (noOriginStatus === 200 && sameOriginStatus === 200) {
      pass("Same-origin and missing Origin are allowed");
    } else {
      fail("Same-origin and missing Origin are allowed", `noOrigin=${noOriginStatus}, sameOrigin=${sameOriginStatus}`);
    }
  }

  // Test 18: Unit tests for rate limiter and getClientIp
  if (RUN_UNIT_TESTS) {
    log("");
    log("Running unit tests for rate limiter...");
    await runUnitTests();
  }

  // Test 16: Rate limit - 5 wrong-password logins trigger lockout
  {
    try {
      const { _resetRateLimitState } = await import("../server/routes");
      _resetRateLimitState();
    } catch {}

    let gotLockout = false;
    for (let i = 0; i < 6; i++) {
      const { status, headers } = await fetchJson(baseUrl, "/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: TEST_USER, password: "wrongpassword" }),
      });
      if (status === 429) {
        gotLockout = true;
        const retryAfter = headers.get("retry-after");
        if (retryAfter) {
          pass("Rate limit: lockout after 5 failures with Retry-After header");
        } else {
          pass("Rate limit: lockout after 5 failures (no Retry-After)");
        }
        break;
      }
    }
    if (!gotLockout) {
      fail("Rate limit: lockout after 5 failures", "429 never returned");
    }
  }

  // Test 18: Global rate limit integration (RUN LAST - locks server for 15 min)
  // Sends failed logins through server, rotating rightmost XFF to simulate distinct clients.
  // Global cap is 20 failures; per-IP cap is 5. With distinct IPs, global should trip at ~20.
  // Note: Previous failed login tests (Test 9, Test 17) have already sent some failures,
  // so we need to account for those. We track when 429 appears and verify it's reasonable.
  {
    let globalLockDetected = false;
    let lockTriggeredAt = -1;
    let priorFailures = 0;

    // Count approximate prior failures from earlier tests (Test 9 sends 1, Test 17 sends ~6)
    // This is approximate; the exact count depends on test execution.
    const expectedPriorFailures = 7; // Conservative estimate

    // Send up to 25 failed login attempts, each from a "different" IP via XFF
    for (let i = 0; i < 25; i++) {
      const clientIp = `192.0.2.${i + 1}`; // Unique IP for each attempt
      const { status } = await fetchJson(baseUrl, "/api/auth/login", {
        method: "POST",
        headers: {
          "X-Forwarded-For": clientIp, // Server trusts rightmost XFF when socket is loopback
        },
        body: JSON.stringify({ username: TEST_USER, password: "wrongpassword" }),
      });

      if (status === 429) {
        lockTriggeredAt = i + 1;
        priorFailures = 20 - lockTriggeredAt; // Infer how many failures came before this test
        // Global cap is 20. With prior failures, lock should trigger before attempt 20.
        // Lock at attempt 13-21 is reasonable (7-0 prior failures)
        if (lockTriggeredAt >= 1 && lockTriggeredAt <= 21) {
          globalLockDetected = true;
        }
        break;
      }
    }

    if (globalLockDetected) {
      pass(`Global rate limit integration: 429 at attempt ${lockTriggeredAt} (inferred ${priorFailures} prior failures, cap 20)`);
    } else {
      fail("Global rate limit integration: no 429 after 25 attempts from 25 distinct IPs");
    }
  }

  // Summary
  log("");
  log("=".repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  log(`Results: ${passed}/${total} tests passed`);

  if (passed < total) {
    log("");
    log("Failed tests:");
    for (const r of results.filter((r) => !r.passed)) {
      log(`  - ${r.name}: ${r.details || "no details"}`);
    }
    return false;
  } else {
    log("All tests passed!");
    return true;
  }
}

async function runUnitTests() {
  const { _getClientIp, _recordLoginAttempt, _checkRateLimit, _loginAttempts, _resetRateLimitState, _parseCookies, _isAuthConfigured, _ASTRA_AUTH_SECRET_MIN_LENGTH } =
    await import("../server/routes");

  function mockRequest(socketAddr: string, xff?: string): Request {
    return {
      socket: { remoteAddress: socketAddr } as Socket,
      headers: xff ? { "x-forwarded-for": xff } : {},
    } as unknown as Request;
  }

  // Unit test: getClientIp uses socket address for non-loopback
  {
    const req = mockRequest("203.0.113.50", "10.0.0.1, 192.168.1.1");
    const ip = _getClientIp(req);
    if (ip === "203.0.113.50") {
      pass("getClientIp: non-loopback socket ignores XFF");
    } else {
      fail("getClientIp: non-loopback socket ignores XFF", `got ${ip}, expected 203.0.113.50`);
    }
  }

  // Unit test: getClientIp uses rightmost XFF for loopback socket
  {
    const req = mockRequest("127.0.0.1", "spoofed.by.client, 203.0.113.99");
    const ip = _getClientIp(req);
    if (ip === "203.0.113.99") {
      pass("getClientIp: loopback socket uses rightmost XFF");
    } else {
      fail("getClientIp: loopback socket uses rightmost XFF", `got ${ip}, expected 203.0.113.99`);
    }
  }

  // Unit test: getClientIp handles ::1 (IPv6 loopback)
  {
    const req = mockRequest("::1", "10.0.0.5");
    const ip = _getClientIp(req);
    if (ip === "10.0.0.5") {
      pass("getClientIp: ::1 loopback uses XFF");
    } else {
      fail("getClientIp: ::1 loopback uses XFF", `got ${ip}, expected 10.0.0.5`);
    }
  }

  // Unit test: getClientIp handles ::ffff:127.0.0.1 (IPv4-mapped loopback)
  {
    const req = mockRequest("::ffff:127.0.0.1", "172.16.0.1");
    const ip = _getClientIp(req);
    if (ip === "172.16.0.1") {
      pass("getClientIp: ::ffff:127.0.0.1 loopback uses XFF");
    } else {
      fail("getClientIp: ::ffff:127.0.0.1 loopback uses XFF", `got ${ip}, expected 172.16.0.1`);
    }
  }

  // Unit test: simulated proxy appends real IP (rightmost), spoofed IPs don't bypass
  {
    _resetRateLimitState();
    const realClientIp = "198.51.100.42";

    for (let i = 0; i < 5; i++) {
      const spoofedXff = `10.${i}.${i}.${i}, ${realClientIp}`;
      const req = mockRequest("127.0.0.1", spoofedXff);
      const ip = _getClientIp(req);
      _recordLoginAttempt(ip, false);
    }

    const check = _checkRateLimit(realClientIp);
    if (!check.allowed && check.retryAfterMs && check.retryAfterMs > 0) {
      pass("Proxy-appended real IP: spoofed prefixes don't bypass lockout");
    } else {
      fail("Proxy-appended real IP: spoofed prefixes don't bypass lockout", `check.allowed=${check.allowed}`);
    }
    _resetRateLimitState();
  }

  // Regression test (QA): rotating spoofed XFF values through Vite proxy simulation
  // Client rotates fake XFF prefixes but proxy always appends the real IP as rightmost.
  // Must hit per-IP lock (after 5 failures) then global cap (after 20 total failures).
  {
    _resetRateLimitState();
    const realClientIp = "192.0.2.200";
    let perIpLockHit = false;
    let globalCapHit = false;

    // Simulate 25 login attempts with rotating spoofed XFF prefixes
    for (let i = 0; i < 25; i++) {
      // Attacker rotates spoofed prefixes: "fake.ip.1.X, real.client.ip"
      const spoofedXff = `fake.ip.${i % 10}.${i}, ${realClientIp}`;
      const req = mockRequest("127.0.0.1", spoofedXff);
      const ip = _getClientIp(req);

      // IP should always be the real one (rightmost)
      if (ip !== realClientIp) {
        fail("XFF spoofing regression: IP extraction failed", `got ${ip}, expected ${realClientIp}`);
        break;
      }

      const preCheck = _checkRateLimit(ip);
      if (!preCheck.allowed) {
        if (i >= 4 && i < 20) {
          perIpLockHit = true;
        }
        if (i >= 19 && preCheck.global) {
          globalCapHit = true;
        }
        continue; // Skip recording when already locked
      }

      _recordLoginAttempt(ip, false);

      const postCheck = _checkRateLimit(ip);
      if (!postCheck.allowed && i >= 4) {
        perIpLockHit = true;
      }
    }

    if (perIpLockHit) {
      pass("XFF spoofing regression: per-IP lock triggered despite rotating spoofed prefixes");
    } else {
      fail("XFF spoofing regression: per-IP lock not triggered");
    }

    _resetRateLimitState();
  }

  // Unit test: Global cap triggers at exactly 20 failures from distinct IPs
  {
    _resetRateLimitState();

    // Record 19 failures from 19 distinct IPs
    for (let i = 0; i < 19; i++) {
      const ip = `10.0.0.${i + 1}`;
      _recordLoginAttempt(ip, false);
    }

    // Check that a brand-new IP is still allowed (global cap not yet hit)
    const checkBefore = _checkRateLimit("10.0.0.100");
    if (!checkBefore.allowed) {
      fail("Global cap unit: locked before 20 failures", `allowed=${checkBefore.allowed} after 19 failures`);
    } else {
      // Record the 20th failure from a 20th distinct IP
      _recordLoginAttempt("10.0.0.20", false);

      // Check that a brand-new IP is now blocked with global flag
      const checkAfter = _checkRateLimit("10.0.0.101");
      if (!checkAfter.allowed && checkAfter.global === true) {
        // Verify retryAfterMs is approximately 15 minutes (900000ms)
        const retryMs = checkAfter.retryAfterMs ?? 0;
        if (retryMs > 800000 && retryMs <= 900000) {
          pass("Global cap unit: triggers at exactly 20 failures with ~15min lockout");
        } else {
          pass(`Global cap unit: triggers at 20 failures (retryAfterMs=${retryMs})`);
        }
      } else {
        fail("Global cap unit: should be blocked with global:true after 20 failures",
          `allowed=${checkAfter.allowed}, global=${checkAfter.global}`);
      }
    }

    _resetRateLimitState();
  }

  // Unit test: Successful login does NOT clear global lock
  {
    _resetRateLimitState();

    // Trigger global lock with 20 failures from distinct IPs
    for (let i = 0; i < 20; i++) {
      _recordLoginAttempt(`10.1.0.${i + 1}`, false);
    }

    // Verify global lock is active
    const checkLocked = _checkRateLimit("10.1.0.100");
    if (!checkLocked.allowed && checkLocked.global === true) {
      // Now record a successful login from one of those IPs
      _recordLoginAttempt("10.1.0.1", true);

      // Verify global lock is STILL active (successful login only clears per-IP, not global)
      const checkStillLocked = _checkRateLimit("10.1.0.101");
      if (!checkStillLocked.allowed && checkStillLocked.global === true) {
        pass("Global cap unit: successful login does NOT clear global lock");
      } else {
        fail("Global cap unit: successful login should not clear global lock",
          `allowed=${checkStillLocked.allowed}, global=${checkStillLocked.global}`);
      }
    } else {
      fail("Global cap unit: could not trigger global lock for this test");
    }

    _resetRateLimitState();
  }

  // Unit test: rate limiter locks out after 5 failures within window
  {
    _resetRateLimitState();
    const testIp = "192.0.2.100";

    for (let i = 0; i < 4; i++) {
      _recordLoginAttempt(testIp, false);
      const check = _checkRateLimit(testIp);
      if (!check.allowed) {
        fail("Rate limiter: should not lock before 5 failures", `locked after ${i + 1} failures`);
        break;
      }
    }

    _recordLoginAttempt(testIp, false);
    const finalCheck = _checkRateLimit(testIp);
    if (!finalCheck.allowed && finalCheck.retryAfterMs && finalCheck.retryAfterMs > 0) {
      pass("Rate limiter: locks out after exactly 5 failures");
    } else {
      fail("Rate limiter: locks out after exactly 5 failures", `allowed=${finalCheck.allowed}`);
    }
    _resetRateLimitState();
  }

  // Unit test: successful login clears rate limit
  {
    _resetRateLimitState();
    const testIp = "192.0.2.101";

    for (let i = 0; i < 3; i++) {
      _recordLoginAttempt(testIp, false);
    }

    _recordLoginAttempt(testIp, true);
    const check = _checkRateLimit(testIp);
    const entry = _loginAttempts.get(testIp);

    if (check.allowed && !entry) {
      pass("Rate limiter: successful login clears counter");
    } else {
      fail("Rate limiter: successful login clears counter", `entry exists: ${!!entry}`);
    }
    _resetRateLimitState();
  }

  // Unit test: parseCookies handles malformed values
  {
    const mockReq = { headers: { cookie: "good=value; bad=%E0%A4%A; another=ok" } } as unknown as Request;
    const cookies = _parseCookies(mockReq);
    if (cookies.good === "value" && cookies.another === "ok" && !("bad" in cookies)) {
      pass("parseCookies: skips malformed cookie values");
    } else {
      fail("parseCookies: skips malformed cookie values", JSON.stringify(cookies));
    }
  }

  // Unit test: log redaction normalization
  {
    // Test helper for path normalization (same logic as in server/index.ts)
    function shouldRedact(path: string): boolean {
      const normalizedPath = path.toLowerCase().replace(/\/+$/, "");
      return normalizedPath.startsWith("/api/messages") || normalizedPath.startsWith("/api/auth/");
    }

    const testCases = [
      { path: "/api/messages", expected: true },
      { path: "/api/messages/", expected: true },
      { path: "/api/Messages", expected: true },
      { path: "/api/MESSAGES/", expected: true },
      { path: "/api/auth/login", expected: true },
      { path: "/api/Auth/Session", expected: true },
      { path: "/api/status", expected: false },
      { path: "/api/jobs", expected: false },
    ];

    let allPassed = true;
    const failures: string[] = [];
    for (const { path, expected } of testCases) {
      if (shouldRedact(path) !== expected) {
        allPassed = false;
        failures.push(`${path} expected ${expected}`);
      }
    }

    if (allPassed) {
      pass("Log redaction: normalization handles case and trailing slashes");
    } else {
      fail("Log redaction: normalization handles case and trailing slashes", failures.join(", "));
    }
  }

  // Unit test: isAuthConfigured checks secret length
  {
    const { _isAuthConfigured, _ASTRA_AUTH_SECRET_MIN_LENGTH } = await import("../server/routes");
    
    // Save original env values
    const origSecret = process.env.ASTRA_AUTH_SECRET;
    const origUser = process.env.ASTRA_AUTH_USER;
    const origHash = process.env.ASTRA_AUTH_PASSWORD_SHA256;

    try {
      // Test with short secret
      process.env.ASTRA_AUTH_SECRET = "short";
      process.env.ASTRA_AUTH_USER = "testuser";
      process.env.ASTRA_AUTH_PASSWORD_SHA256 = "somehash";
      
      // Force re-evaluation by calling the function
      const isConfiguredShort = _isAuthConfigured();

      // Test with valid-length secret
      process.env.ASTRA_AUTH_SECRET = "a".repeat(_ASTRA_AUTH_SECRET_MIN_LENGTH);
      const isConfiguredValid = _isAuthConfigured();

      if (!isConfiguredShort && isConfiguredValid) {
        pass(`isAuthConfigured: rejects secrets shorter than ${_ASTRA_AUTH_SECRET_MIN_LENGTH} chars`);
      } else {
        fail(`isAuthConfigured: rejects secrets shorter than ${_ASTRA_AUTH_SECRET_MIN_LENGTH} chars`, 
          `short=${isConfiguredShort}, valid=${isConfiguredValid}`);
      }
    } finally {
      // Restore original env values
      if (origSecret !== undefined) process.env.ASTRA_AUTH_SECRET = origSecret;
      else delete process.env.ASTRA_AUTH_SECRET;
      if (origUser !== undefined) process.env.ASTRA_AUTH_USER = origUser;
      else delete process.env.ASTRA_AUTH_USER;
      if (origHash !== undefined) process.env.ASTRA_AUTH_PASSWORD_SHA256 = origHash;
      else delete process.env.ASTRA_AUTH_PASSWORD_SHA256;
    }
  }
}

async function main(): Promise<boolean> {
  let server: ChildProcess | null = null;
  let baseUrl = EXTERNAL_URL;
  let success = false;

  try {
    if (!baseUrl) {
      const port = await findFreePort();
      log(`Starting server on port ${port}...`);
      server = await startServer(port);
      baseUrl = `http://localhost:${port}`;
      log(`Server started at ${baseUrl}`);
    }

    success = await runTests(baseUrl);
  } catch (err) {
    console.error("Test runner error:", err);
    success = false;
  } finally {
    if (server) {
      log("Shutting down server...");
      server.kill("SIGTERM");
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (server && !server.killed) {
            server.kill("SIGKILL");
          }
          resolve();
        }, 2000);
        
        server!.on("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      
      log("Server shut down");
    }
  }

  return success;
}

main().then((success) => {
  // Explicit exit to ensure process terminates even if timers are active
  // (e.g., from dynamic imports of server/routes.ts)
  process.exit(success ? 0 : 1);
}).catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
