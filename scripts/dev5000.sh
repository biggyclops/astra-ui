#!/usr/bin/env bash
set -euo pipefail
sudo fuser -k 5000/tcp 2>/dev/null || true
PORT=5000 npm run dev -- --host 0.0.0.0 --port 5000
