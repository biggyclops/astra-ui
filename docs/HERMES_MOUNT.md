# Hermes Storage Mount Setup

Astra can read media from a NAS through a local Samba/CIFS mount. Local mounting is the preferred path for efficient streaming and HTTP Range support.

This document intentionally uses placeholders. Do not commit real passwords, internal addresses, or credentials.

## 1. Create a credentials file

```bash
sudo mkdir -p /etc/samba
sudo nano /etc/samba/creds_hermes
```

Add:

```text
username=YOUR_USERNAME
password=YOUR_PASSWORD
```

Protect it:

```bash
sudo chmod 600 /etc/samba/creds_hermes
```

## 2. Create the mount point

```bash
sudo mkdir -p /mnt/hermes/storage
```

## 3. Mount the share

Replace `NAS_HOST` and `SHARE_NAME` with local values:

```bash
sudo mount -t cifs //NAS_HOST/SHARE_NAME /mnt/hermes/storage \
  -o credentials=/etc/samba/creds_hermes,vers=3.0,ro,uid=$(id -u),gid=$(id -g),iocharset=utf8,sec=ntlmssp
```

The share is mounted read-only here because Astra only needs media browsing/streaming access for this integration.

## 4. Optional persistent mount

Review an `/etc/fstab` entry before adding it:

```text
//NAS_HOST/SHARE_NAME /mnt/hermes/storage cifs credentials=/etc/samba/creds_hermes,vers=3.0,ro,_netdev,x-systemd.automount 0 0
```

Then:

```bash
sudo systemctl daemon-reload
sudo mount -a
```

## 5. Configure Astra

Copy the example environment file and set local values:

```bash
cp .env.example .env
```

At minimum, set:

```bash
HERMES_LOCAL_PATH=/mnt/hermes/storage
```

Optional remote/File Browser configuration:

```bash
HERMES_BASE_URL=http://NAS_HOST:8080
HERMES_AUTH=YOUR_USERNAME:YOUR_PASSWORD
```

Do not commit the `.env` file.

## 6. Verify the mount

```bash
mount | grep hermes
ls -la /mnt/hermes/storage
```

Verify that the media subtree expected by Astra exists beneath `HERMES_LOCAL_PATH`.

## 7. Start Astra

```bash
npm run dev
```

The API can then enumerate supported media files and proxy them to the frontend.

## 8. Test ranged streaming

Use any valid media path from the mounted share:

```bash
MEDIA_PATH="/files/path/to/example.mp4"

curl -v -G "http://localhost:5000/api/media/proxy" \
  --data-urlencode "path=$MEDIA_PATH" \
  -H "Range: bytes=0-1023" \
  -o /dev/null
```

A successful ranged response should return HTTP `206 Partial Content` with appropriate `Content-Range` and `Accept-Ranges` headers.

## Troubleshooting

### Mount fails

Check:

```bash
sudo mount -a
mount | grep hermes
```

Confirm:

- the NAS hostname resolves
- the share name is correct
- the credentials file is readable only by root
- SMB/CIFS protocol compatibility matches the NAS

### Astra cannot find media

Confirm that:

- `HERMES_LOCAL_PATH` points at the mounted share root expected by the application
- the requested media path is beneath that root
- the Astra process has read permissions
- the media extension is supported

### Security notes

- Never commit NAS passwords or authentication tokens.
- Prefer environment variables or local secret-management mechanisms.
- Keep storage mounts read-only unless write access is genuinely required.
- Avoid publishing internal IP addresses, usernames, or filesystem details in public documentation.
