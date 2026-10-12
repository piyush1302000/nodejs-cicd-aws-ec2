#!/bin/bash
# Runs ON the EC2 instance (invoked through AWS Systems Manager) after a release
# has been extracted to /opt/app/releases/<release-id>.
# Usage: remote-deploy.sh <release-id>
set -euo pipefail

RELEASE_ID="${1:?usage: remote-deploy.sh <release-id>}"
APP_DIR="${APP_DIR:-/opt/app}"
SERVICE="${SERVICE:-nodeapp}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

NEW_RELEASE="$APP_DIR/releases/$RELEASE_ID"
PREVIOUS_RELEASE=""
if [ -L "$APP_DIR/current" ]; then
  PREVIOUS_RELEASE="$(readlink -f "$APP_DIR/current")"
fi

[ -d "$NEW_RELEASE" ] || { echo "Release directory not found: $NEW_RELEASE"; exit 1; }

echo "Deploying release $RELEASE_ID"
chown -R nodeapp:nodeapp "$NEW_RELEASE"
ln -sfn "$NEW_RELEASE" "$APP_DIR/current"
systemctl restart "$SERVICE"

# Wait up to ~30 seconds for the app to report healthy
for attempt in $(seq 1 15); do
  if curl -fsS "$HEALTH_URL" > /dev/null 2>&1; then
    echo "Health check passed for $RELEASE_ID (attempt $attempt)"
    # Keep only the newest releases
    ls -1dt "$APP_DIR"/releases/* | tail -n +"$((KEEP_RELEASES + 1))" | xargs -r rm -rf
    exit 0
  fi
  sleep 2
done

echo "Health check FAILED for $RELEASE_ID after 15 attempts"
journalctl -u "$SERVICE" -n 30 --no-pager || true

if [ -n "$PREVIOUS_RELEASE" ] && [ -d "$PREVIOUS_RELEASE" ] && [ "$PREVIOUS_RELEASE" != "$NEW_RELEASE" ]; then
  echo "Rolling back to $PREVIOUS_RELEASE"
  ln -sfn "$PREVIOUS_RELEASE" "$APP_DIR/current"
  systemctl reset-failed "$SERVICE" || true
  systemctl restart "$SERVICE"
  echo "Rollback complete"
else
  echo "No previous release to roll back to"
fi
exit 1
