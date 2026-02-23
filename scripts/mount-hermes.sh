#!/bin/bash
# Mount HermesStorage Samba share for local streaming.
# Run with: sudo bash scripts/mount-hermes.sh
# You will be prompted for the Hermes password to create /etc/samba/creds_hermes

set -e

echo "=== Hermes Storage Mount Setup ==="

# 1. Create creds file (password via prompt, not in shell history)
echo "Creating /etc/samba/creds_hermes"
sudo mkdir -p /etc/samba
read -s -p "Hermes password for comeau: " HERMES_PASS
echo ""
printf 'username=comeau\npassword=%s\n' "$HERMES_PASS" | sudo tee /etc/samba/creds_hermes > /dev/null
unset HERMES_PASS
sudo chmod 600 /etc/samba/creds_hermes

# 2. Create mount point
sudo mkdir -p /mnt/hermes/storage

# 3. Mount
echo "Mounting HermesStorage..."
UID_GID=$(id -u):$(id -g)
sudo mount -t cifs //100.120.145.15/HermesStorage /mnt/hermes/storage \
  -o "credentials=/etc/samba/creds_hermes,vers=3.0,ro,uid=$(id -u),gid=$(id -g),iocharset=utf8,sec=ntlmssp"

echo "Mounted. Verifying..."
mount | grep hermes
ls -la /mnt/hermes/storage | head -5

# 3b. Verify files/ subtree exists
FILES_DIR=$(find /mnt/hermes/storage -maxdepth 2 -type d -name files -print 2>/dev/null | head -1)
if [ -z "$FILES_DIR" ]; then
  echo ""
  echo "ERROR: Mounted share has no files/ subtree — check share points to HermesStorage root."
  echo "  find /mnt/hermes/storage -maxdepth 2 -type d -name files -print"
  exit 1
fi
echo "OK: Found files/ at $FILES_DIR"

# 4. Add to fstab for persistence
if ! grep -q "HermesStorage" /etc/fstab 2>/dev/null; then
  echo "Adding to /etc/fstab for boot persistence..."
  echo "//100.120.145.15/HermesStorage /mnt/hermes/storage cifs credentials=/etc/samba/creds_hermes,vers=3.0,ro,uid=$(id -u),gid=$(id -g),iocharset=utf8,sec=ntlmssp,_netdev,x-systemd.automount 0 0" | sudo tee -a /etc/fstab
  sudo systemctl daemon-reload
fi

# 5. Verify target file (optional sanity check)
echo ""
echo "Checking target file..."
ls -la "/mnt/hermes/storage/files/5. AI/My Favs/vids/generated_video (1).mp4" 2>/dev/null && echo "OK: File exists" || echo "WARN: File not found (check path)"

echo ""
echo "Done. Start server with: export HERMES_LOCAL_PATH=/mnt/hermes/storage && PORT=5000 npm run dev -- --host 0.0.0.0 --port 5000"
