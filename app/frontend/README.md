# Siege Helper Frontend

This frontend is the checked-in static app under `dist/`.

There is intentionally no Vite/React source tree in this repository anymore. The previous `src/` version diverged from the deployed app and caused local/production mismatches.

## Run locally

Start the backend first, then run:

```shell
PORT=3000 PYTHON_BACKEND_URL=http://127.0.0.1:8000 npm start
```

On Windows PowerShell:

```powershell
$env:PORT="3000"
$env:PYTHON_BACKEND_URL="http://127.0.0.1:8000"
npm start
```

The static server serves `dist/` and proxies `/api/v1/*` to `PYTHON_BACKEND_URL`.
