# Hermes Storage Mount Setup

To make `/api/media/proxy` return real mp4 bytes (not zip), mount the Hermes Samba share and set `HERMES_LOCAL_PATH`.

## Media Wall quick start (test without mount)

Use the built-in test directory:

```bash
# Terminal 1: API with test media
cd /home/comea/astra-ui/Grok-UI-Redesign-main
npm run dev:api:media

# Terminal 2: Frontend
npm run dev
```

Open http://localhost:5173 → Media → Hermes → path `/files/5. AI/My Favs/vids/` → Load. You should see 1 video.

## Quick setup

```bash
# Run the interactive mount script (prompts for password securely)
sudo bash scripts/mount-hermes.sh
```

## Manual steps

### 1. Create credentials file

```bash
sudo mkdir -p /etc/samba
sudo nano /etc/samba/creds_hermes
```

Paste (edit password):

```
username=comeau
password=YOUR_HERMES_PASSWORD
```

Then: `sudo chmod 600 /etc/samba/creds_hermes`

### 2. Mount HermesStorage

```bash
sudo mkdir -p /mnt/hermes/storage
sudo mount -t cifs //100.120.145.15/HermesStorage /mnt/hermes/storage \
  -o credentials=/etc/samba/creds_hermes,vers=3.0,ro,uid=$(id -u),gid=$(id -g),iocharset=utf8,sec=ntlmssp
```

### 3. Add to fstab (persist across reboots)

```bash
echo "//100.120.145.15/HermesStorage /mnt/hermes/storage cifs credentials=/etc/samba/creds_hermes,vers=3.0,ro,uid=$(id -u),gid=$(id -g),iocharset=utf8,sec=ntlmssp,_netdev,x-systemd.automount 0 0" | sudo tee -a /etc/fstab
sudo systemctl daemon-reload
sudo mount -a
```

### 4. Verify

Ensure the mount uses `uid=$(id -u),gid=$(id -g)` so files aren't root-owned:

```bash
# Check mount options include uid/gid
mount | grep hermes
# Verify files/ subtree exists (required for local streaming)
find /mnt/hermes/storage -maxdepth 2 -type d -name files -print
# If files/ isn't found: "Mounted share has no files/ subtree — check share points to HermesStorage root."
ls -la "/mnt/hermes/storage/files/5. AI/My Favs/vids/generated_video (1).mp4"
```

### 5. Start server

```bash
export HERMES_LOCAL_PATH=/mnt/hermes/storage
PORT=5000 npm run dev -- --host 0.0.0.0 --port 5000
```

### 6. Test

```bash
P="/files/5. AI/My Favs/vids/generated_video (1).mp4"
curl -v -G "http://localhost:5000/api/media/proxy" --data-urlencode "path=$P" -H "Range: bytes=0-1023" -o /dev/null
```

Expected: `HTTP/1.1 206 Partial Content`, `content-type: video/mp4`, `content-range: bytes 0-1023/...`.

### 7. Regression test

```bash
bash scripts/test-hermes-proxy.sh
```

Prints PASS/FAIL for listing, proxy status, content-type, accept-ranges, and X-Hermes-Source.

---

## Broken fstab entries

If `mount -a` fails with `can't find UUID=...` or similar, a fstab entry references a missing device.

### Detect

```bash
sudo bash scripts/check-fstab.sh
```

Or manually: `sudo mount -a 2>&1 | tee /tmp/mount-errors.txt`

### Fix

1. Identify the failing line (e.g. `/mnt/mybook` with UUID=...).
2. `sudo nano /etc/fstab` and comment out the broken line with `#`.
3. Or fix the UUID/path if the device moved.

**Do not auto-edit fstab** — review and confirm each change.
