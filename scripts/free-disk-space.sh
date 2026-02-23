#!/bin/bash
# Free 10–20GB without deleting user projects. Run with: sudo bash scripts/free-disk-space.sh
set -e
echo "=== Disk cleanup (requires sudo) ==="
echo "Before:"; df -h /

echo ""
echo "1. APT cache + autoremove..."
apt clean
apt autoremove --purge -y

echo ""
echo "2. Journal vacuum..."
journalctl --vacuum-time=7d
journalctl --vacuum-size=200M

echo ""
echo "3. Log cleanup..."
find /var/log -type f -name "*.gz" -delete 2>/dev/null || true
find /var/log -type f -name "*.1" -delete 2>/dev/null || true
find /var/log -type f -name "*.old" -delete 2>/dev/null || true
find /var/log -type f -name "*.log" -size +100M -exec truncate -s 10M {} \; 2>/dev/null || true

echo ""
echo "4. Temp cleanup..."
rm -rf /tmp/* 2>/dev/null || true
rm -rf /var/tmp/* 2>/dev/null || true

echo ""
echo "After:"; df -h /
echo ""
echo "Top dirs:"; du -xh / --max-depth=1 2>/dev/null | sort -hr | head -15
