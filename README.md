# Veltrix Motors

Next.js showroom and admin dashboard for Veltrix Motors. The public site, admin UI, and API routes run as a single Node.js web service.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Set a strong admin password and session secret in `.env.local`:

```bash
openssl rand -base64 32
```

Required variables:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Optional storage variables:

- `VELTRIX_DATA_DIR` — JSON data directory; defaults to `./data`
- `VELTRIX_UPLOAD_DIR` — uploaded image directory; defaults to `./uploads`

Relative paths are resolved from the project root. Absolute paths are used as-is.

## Data and uploads

Runtime data is stored as JSON files and image uploads on disk. No database or external storage service is used.

- Default JSON path: `data/`
- Default image path: `uploads/`
- Public image URL path: `/uploads/<filename>`
- Runtime data and uploads are excluded from Git by `.gitignore`
- `.env.local` and other environment files are excluded from Git

Do not commit production data, customer records, uploaded images, or secrets. The application does not seed, migrate, or overwrite an existing data directory during startup. The health check only creates missing storage directories.

## Render deployment

`render.yaml` defines one Node web service with a persistent disk. Persistent disks require a paid Render instance type; the Blueprint uses the Starter plan and a 1 GB disk.

### Blueprint setup

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and select the repository.
3. Apply `render.yaml`.
4. Enter `ADMIN_EMAIL` and `ADMIN_PASSWORD` when prompted. Render generates `ADMIN_SESSION_SECRET`.
5. Wait for the build and deploy to finish.
6. Confirm `https://<service-name>.onrender.com/api/health` returns `{"status":"ok"}`.
7. Log in, verify the public site, and test one temporary car, upload, contact message, and inquiry before removing the test records.

The Blueprint configures:

- Branch: `main`
- Auto deploy: enabled
- Build: `npm ci --include=dev && npm run build`
- Start: `npm start`
- Health check: `/api/health`
- Disk name: `veltrix-data`
- Disk mount: `/var/data`
- JSON storage: `/var/data/data`
- Upload storage: `/var/data/uploads`
- Node.js: `22`

`--include=dev` is required because `NODE_ENV=production` can otherwise skip build-time dependencies such as TypeScript, Tailwind, and Turbopack.

### Manual Render setup

If not using the Blueprint, create one **Web Service** with these settings:

- Runtime: Node
- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`
- Persistent disk mount path: `/var/data`
- Environment:
  - `NODE_VERSION=22`
  - `NODE_ENV=production`
  - `ADMIN_EMAIL=<admin email>`
  - `ADMIN_PASSWORD=<strong password>`
  - `ADMIN_SESSION_SECRET=<random secret>`
  - `VELTRIX_DATA_DIR=/var/data/data`
  - `VELTRIX_UPLOAD_DIR=/var/data/uploads`

Add the persistent disk before the first production deploy. A disk mount disables zero-downtime deploys, so each deploy restarts the service.

### Existing production data

Existing local files in `data/` and `uploads/` are intentionally excluded from Git and are not migrated automatically. If those records and images must be carried into a new Render disk, copy them to the mounted directories as an explicit operator action before accepting production traffic. Do not run any migration that overwrites files already on the disk.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:unit
```

Integration tests require a running server:

```bash
TEST_BASE_URL=http://localhost:3000 npm run test:integration
```

Run production smoke tests against a temporary data directory. Do not point tests at live data unless the test only reads it.

## Security notes

- Keep `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in environment variables only.
- Use a unique, high-entropy session secret.
- Keep `data/`, `uploads/`, and all `.env*` files except `.env.example` out of Git.
- Admin APIs and admin pages require an authenticated session.
- Login failure rate limiting is enforced in the running instance.
