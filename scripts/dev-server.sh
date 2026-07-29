#!/usr/bin/env bash
# Start a fixed-port local preview server for FoundrySuite website.
# Usage: ./scripts/dev-server.sh
# Stop:  ./scripts/dev-server.sh stop
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${FOUNDRY_DEV_PORT:-5500}"
PID_FILE="$ROOT/.dev-server.pid"
URL="http://127.0.0.1:${PORT}"

is_our_server() {
  local pid="$1"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  local cmd
  cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  [[ "$cmd" == *"http.server"* ]]
}

port_in_use() {
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
}

stop_server() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if is_our_server "$pid"; then
      kill "$pid" 2>/dev/null || true
      sleep 0.3
      kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
      echo "Stopped FoundrySuite preview on port ${PORT} (pid ${pid})."
    fi
    rm -f "$PID_FILE"
  fi

  # Clear a leftover listener on the fixed port if it is python http.server
  if port_in_use; then
    local pids
    pids="$(lsof -t -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
    for pid in $pids; do
      local cmd
      cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
      if [[ "$cmd" == *"http.server"* ]]; then
        kill "$pid" 2>/dev/null || true
        echo "Cleared leftover http.server on port ${PORT} (pid ${pid})."
      else
        echo "Port ${PORT} is in use by another process (pid ${pid}): ${cmd}"
        echo "Set FOUNDRY_DEV_PORT to a free port, or stop that process."
        exit 1
      fi
    done
  fi
}

start_server() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if is_our_server "$pid"; then
      echo "Already running: ${URL}"
      echo "  Home:     ${URL}/"
      echo "  Platform: ${URL}/foundry-platform.html"
      exit 0
    fi
    rm -f "$PID_FILE"
  fi

  if port_in_use; then
    local cmd
    cmd="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print}')"
    if [[ "$cmd" == *"Python"* ]] || [[ "$cmd" == *"python"* ]]; then
      echo "Reusing existing preview on ${URL}"
      exit 0
    fi
    echo "Port ${PORT} is busy. Run: ./scripts/dev-server.sh stop"
    echo "Or use: FOUNDRY_DEV_PORT=5501 ./scripts/dev-server.sh"
    exit 1
  fi

  cd "$ROOT"
  # Prefer python3; fall back to python
  local py="python3"
  command -v python3 >/dev/null 2>&1 || py="python"

  nohup "$py" -m http.server "$PORT" --bind 127.0.0.1 >"$ROOT/.dev-server.log" 2>&1 &
  local pid=$!
  echo "$pid" >"$PID_FILE"
  sleep 0.4

  if ! kill -0 "$pid" 2>/dev/null; then
    echo "Failed to start server. See .dev-server.log"
    rm -f "$PID_FILE"
    exit 1
  fi

  echo "FoundrySuite preview started on fixed port ${PORT}"
  echo "  Home:     ${URL}/"
  echo "  Platform: ${URL}/foundry-platform.html"
  echo "  Stop:     ./scripts/dev-server.sh stop"
}

case "${1:-start}" in
  start) start_server ;;
  stop) stop_server ;;
  restart) stop_server; start_server ;;
  status)
    if [[ -f "$PID_FILE" ]] && is_our_server "$(cat "$PID_FILE")"; then
      echo "Running: ${URL} (pid $(cat "$PID_FILE"))"
    elif port_in_use; then
      echo "Port ${PORT} is listening (see lsof -iTCP:${PORT})"
    else
      echo "Not running"
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
