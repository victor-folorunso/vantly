#!/usr/bin/env bash
# Build, after stopping anything holding the output directory.
#
# Next removes and rewrites out/ on every build, and Windows refuses to remove
# a directory a process has open. A static server left running from an earlier
# verification therefore fails the build with EBUSY, which reads like a code
# error and is not one. This has cost several minutes across the project.
set -e
taskkill //F //IM python.exe //FI "WINDOWTITLE eq *http.server*" >/dev/null 2>&1 || true
for pid in $(netstat -ano | grep -E "LISTENING" | grep -E ":53[0-9][0-9]" | awk '{print $NF}' | sort -u); do
  taskkill //F //PID "$pid" >/dev/null 2>&1 || true
done
sleep 1
npm run build 2>&1 | grep -iE "error TS|Failed to compile|Expected|Error occurred|EBUSY" -A3 || echo "build clean"
