#!/usr/bin/env bash
set -euo pipefail

if [ -n "${GOOGLE_SERVICES_JSON:-}" ]; then
  echo "$GOOGLE_SERVICES_JSON" | base64 -d > google-services.json
  echo "google-services.json written successfully"
else
  echo "GOOGLE_SERVICES_JSON secret not set — skipping"
fi
