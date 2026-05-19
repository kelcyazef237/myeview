#!/bin/bash
# MYEVIEW Daemon Management Script
# This script safely starts, stops, and restarts MYEVIEW in the background.

set -e

COMMAND=$1

show_help() {
    echo "Usage: ./daemon.sh [start|stop|restart|status]"
    echo ""
    echo "Commands:"
    echo "  start    - Starts MYEVIEW services as a background daemon."
    echo "  stop     - Gracefully stops all MYEVIEW services."
    echo "  restart  - Restarts MYEVIEW services."
    echo "  status   - Shows the status of the Docker containers."
    echo ""
}

if [ -z "$COMMAND" ]; then
    show_help
    exit 1
fi

cd "$(dirname "$0")"

case "$COMMAND" in
    start)
        echo "Starting MYEVIEW daemon..."
        docker compose up -d
        echo "✅ Services are running in the background."
        ;;
    stop)
        echo "Stopping MYEVIEW daemon..."
        docker compose down
        echo "✅ Services stopped."
        ;;
    restart)
        echo "Restarting MYEVIEW daemon..."
        docker compose restart
        echo "✅ Services restarted."
        ;;
    status)
        docker compose ps
        ;;
    *)
        echo "❌ Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac
