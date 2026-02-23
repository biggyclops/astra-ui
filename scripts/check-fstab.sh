#!/bin/bash
# Detect broken fstab entries (e.g. UUID missing).
# Usage: sudo bash scripts/check-fstab.sh
# Prints which lines are failing. Does NOT auto-edit; user must fix manually.

set -e

echo "=== Fstab Check ==="
echo "Running: mount -a"
if sudo mount -a 2>/tmp/fstab-errors.txt; then
  echo "OK: All fstab entries mounted successfully."
  exit 0
fi

echo ""
echo "Some entries failed. Captured output:"
cat /tmp/fstab-errors.txt
echo ""
echo "To fix:"
echo "  1. Run: sudo nano /etc/fstab"
echo "  2. Comment out the failing line(s) with # at the start"
echo "  3. Or fix the UUID/path if the device moved"
echo ""
echo "Do NOT auto-edit — review and confirm each change."
