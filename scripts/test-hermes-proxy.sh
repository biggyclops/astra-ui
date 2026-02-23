#!/bin/bash
# Regression test for Hermes media proxy.
# Usage: scripts/test-hermes-proxy.sh [BASE_URL]
# Default BASE_URL: http://localhost:5000

set -e

BASE_URL="${1:-http://localhost:5000}"
LIST_PATH="${2:-/files/5.%20AI/My%20Favs/vids/}"
PASS=0
FAIL=0

fail() {
  echo "FAIL: $1"
  ((FAIL++)) || true
}

pass() {
  echo "PASS: $1"
  ((PASS++)) || true
}

echo "=== Hermes Proxy Regression Test ==="
echo "BASE_URL=$BASE_URL"
echo ""

# 1. List directory, get first item path
echo "1. GET /api/media/hermes?path=$LIST_PATH"
LIST_RESP=$(curl -s "${BASE_URL}/api/media/hermes?path=${LIST_PATH}")
FIRST_PATH=$(echo "$LIST_RESP" | jq -r '.items[0].path // empty')
if [ -z "$FIRST_PATH" ]; then
  fail "No items in listing; cannot test proxy"
  echo "Response: $LIST_RESP" | head -c 200
  echo "..."
else
  pass "Listing returned items; first path: $FIRST_PATH"
fi

# 2. Proxy with Range
echo ""
echo "2. GET /api/media/proxy with Range: bytes=0-1023"
PROXY_RESP=$(curl -s -w "\n%{http_code}\n%{content_type}" -G "${BASE_URL}/api/media/proxy" \
  --data-urlencode "path=$FIRST_PATH" \
  -H "Range: bytes=0-1023" -o /tmp/hermes-proxy-test.bin)
BODY_SIZE=$(wc -c < /tmp/hermes-proxy-test.bin)
HTTP_CODE=$(echo "$PROXY_RESP" | tail -2 | head -1)
CONTENT_TYPE=$(echo "$PROXY_RESP" | tail -1)

if [ "$HTTP_CODE" != "206" ] && [ "$HTTP_CODE" != "200" ]; then
  fail "Expected 206 or 200, got $HTTP_CODE"
else
  pass "Status $HTTP_CODE"
fi

if echo "$CONTENT_TYPE" | grep -qE "application/zip|text/html"; then
  fail "Content-Type must NOT be zip or html; got $CONTENT_TYPE"
else
  pass "Content-Type OK: $CONTENT_TYPE"
fi

# 3. Check accept-ranges when Range was requested
echo ""
echo "3. Check Accept-Ranges header"
HEADERS=$(curl -s -D - -o /dev/null -G "${BASE_URL}/api/media/proxy" \
  --data-urlencode "path=$FIRST_PATH" \
  -H "Range: bytes=0-1023")
if echo "$HEADERS" | grep -qi "accept-ranges: bytes"; then
  pass "Accept-Ranges: bytes present"
else
  fail "Accept-Ranges: bytes missing (needed for video seeking)"
fi

# 4. X-Hermes-Source
if echo "$HEADERS" | grep -qi "x-hermes-source: local"; then
  pass "X-Hermes-Source: local (streaming from mount)"
elif echo "$HEADERS" | grep -qi "x-hermes-source: http"; then
  pass "X-Hermes-Source: http (HTTP fallback)"
else
  fail "X-Hermes-Source header missing"
fi

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
