#!/usr/bin/env tsx
/**
 * test-auth-gate.ts — Automated verification of the session auth gate.
 *
 * Usage:
 *   # Set test credentials (these are for testing only, never commit real values)
 *   export ASTRA_AUTH_SECRET="test-secret-do-not-use-in-prod"
 *   export ASTRA_AUTH_USER="testuser"
 *   export ASTRA_AUTH_PASSWORD_SHA256="$(echo -n 'testpass' | sha256sum | cut -d' ' -f1)"
 *
 *   # Start the server in another terminal:
 *   npm run dev
 *
 *   # Run the tests:
 *   npx tsx scripts/test-auth-gate.ts
 *
 * Exit codes:
 *   0 = all tests passed
 *   1 = one or more tests failed
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";
const TEST_USER = process.env.ASTRA_AUTH_USER || "testuser";
const TEST_PASS = "testpass";

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

async function fetchJson(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; data: any; cookies?: string }> {
  const url = `${BASE_URL}${path}`;
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
  return { status: res.status, data, cookies };
}

async function fetchText(path: string): Promise<{ status: number; text: string }> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url);
  const text = await res.text();
  return { status: res.status, text };
}

function extractSessionCookie(setCookie: string | undefined): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(/astra_session=([^;]+)/);
  return match ? match[1] : null;
}

async function runTests() {
  log(`Testing auth gate at ${BASE_URL}`);
  log(`Test user: ${TEST_USER}`);
  log("");

  // Test 1: /healthz is public (200 without auth)
  {
    const { status, text } = await fetchText("/healthz");
    if (status === 200 && text.includes("astra-ui ok")) {
      pass("/healthz returns 200 without auth");
    } else {
      fail("/healthz returns 200 without auth", `got ${status}: ${text}`);
    }
  }

  // Test 2: GET /api/autonomy/snapshot returns 401 without cookie
  {
    const { status, data } = await fetchJson("/api/autonomy/snapshot");
    if (status === 401 && data?.authenticated === false) {
      pass("GET /api/autonomy/snapshot returns 401 without auth");
    } else {
      fail("GET /api/autonomy/snapshot returns 401 without auth", `got ${status}`);
    }
  }

  // Test 3: POST /api/actions returns 401 without cookie
  {
    const { status, data } = await fetchJson("/api/actions", {
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
    const { status, data } = await fetchJson("/api/actions/1/approve", {
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
    const { status, data } = await fetchJson("/api/jobs", {
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
    const { status, data } = await fetchJson("/api/messages", {
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
    const { status, data } = await fetchJson("/api/auth/session");
    if (status === 200 && data?.authenticated === false) {
      pass("GET /api/auth/session returns authenticated: false without cookie");
    } else {
      fail("GET /api/auth/session returns authenticated: false without cookie", `got ${status}: ${JSON.stringify(data)}`);
    }
  }

  // Test 8: POST /api/auth/login with correct credentials returns 200 and sets cookie
  let validCookie: string | null = null;
  {
    const { status, data, cookies } = await fetchJson("/api/auth/login", {
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
    const { status, data } = await fetchJson("/api/auth/login", {
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
    const { status, data } = await fetchJson("/api/autonomy/snapshot", {
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
    const { status, data } = await fetchJson("/api/auth/session", {
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
    const { status, data } = await fetchJson("/api/autonomy/snapshot", {
      headers: { Cookie: `astra_session=${tamperedCookie}` },
    });
    if (status === 401 && data?.authenticated === false) {
      pass("Tampered cookie returns 401");
    } else {
      fail("Tampered cookie returns 401", `got ${status}`);
    }
  }

  // Test 13: POST /api/auth/logout clears cookie
  if (validCookie) {
    const { status, data, cookies } = await fetchJson("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: `astra_session=${validCookie}` },
    });
    const clearedCookie = cookies?.includes("Max-Age=0") || cookies?.includes("astra_session=;");
    if (status === 200 && data?.authenticated === false && clearedCookie) {
      pass("POST /api/auth/logout clears cookie");
    } else {
      fail("POST /api/auth/logout clears cookie", `got ${status}, cookie cleared: ${clearedCookie}`);
    }
  } else {
    fail("POST /api/auth/logout clears cookie", "no valid cookie obtained");
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
    process.exit(1);
  } else {
    log("All tests passed!");
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
