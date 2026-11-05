# Hermes shares on Mini-Beast

Astra UI reads each Hermes SMB share from its own mount under `/mnt/hermes/<id>`.
Browser and AstraPhone paths are virtual: `/<id>/<relative path>`.

| Share (SMB) | id / mount | Astra access | Env override |
|---|---|---|---|
| 0. Hermes Storage | /mnt/hermes/storage | read only | `HERMES_SHARE_STORAGE` (falls back to `HERMES_LOCAL_PATH`) |
| 1. Hermes Images | /mnt/hermes/images | read only | `HERMES_SHARE_IMAGES` |
| 2. Hermes Videos | /mnt/hermes/videos | read only | `HERMES_SHARE_VIDEOS` |
| 3. Hermes Torrents | /mnt/hermes/torrents | read / write | `HERMES_SHARE_TORRENTS` |
| 4. Astra Drive | /mnt/hermes/astra-drive | read / write | `HERMES_SHARE_ASTRA_DRIVE` |
| 5. Hermes Backups | /mnt/hermes/backups | read only | `HERMES_SHARE_BACKUPS` |
| 6. Comfyui files | /mnt/hermes/comfyui | read only | `HERMES_SHARE_COMFYUI` |
| 7. Projects | /mnt/hermes/projects | read only | `HERMES_SHARE_PROJECTS` |

`HERMES_SHARES_BASE` (default `/mnt/hermes`) sets the default parent for all of them.

## Legacy paths

- `/files/...` resolves into the storage share. Media Wall and `/api/media/hermes` keep using `HERMES_LOCAL_PATH` as before.
- `/uploads/astraphone/...` and `/files/uploads/astraphone/...` resolve to `ASTRA_DRIVE_UPLOAD_DIR`, which defaults to `/mnt/hermes/astra-drive/astraphone`. AstraPhone can keep sending `POST /api/files/upload?path=/uploads/astraphone`.
- Media Wall drops (`/api/files/upload-media`) now go to `/astra-drive/media-wall`.

## Safety

- Every path is resolved with `realpath` and must stay inside its share root, so symlinks can't escape a share.
- Writes (upload, folder, delete, move) are refused on read-only shares. Share roots can't be deleted or moved, and moves across shares are refused.
- multipart/form-data is accepted only on `POST /api/files/upload` and `/api/files/upload-media`. Every other `/api` write is still JSON-only, with the Origin check and the session gate.

## Downloads

- `TORRENTS_DOWNLOAD_DIR` (default `/mnt/hermes/torrents`) is the `download-dir` Astra sends with `torrent-add`. The container must see the share **at the same path**; see the proposed volume change in the PR description.
- `TRANSMISSION_RPC_URL` (default `http://127.0.0.1:9091/transmission/rpc`), `TRANSMISSION_WEB_URL`, plus optional `TRANSMISSION_RPC_USER`/`TRANSMISSION_RPC_PASSWORD`. `TRANSMISSION_VPN_CONTAINER` defaults to `gluetun` and `TRANSMISSION_CONTAINER` to `transmission`.
- `RADARR_URL` (default `http://127.0.0.1:7878`) with `RADARR_API_KEY`, and `SONARR_URL` (default `http://127.0.0.1:8989`) with `SONARR_API_KEY`. Keys come only from env.
