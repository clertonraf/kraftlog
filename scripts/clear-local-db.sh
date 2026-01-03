#!/bin/bash

# Find and delete the kraftlog.db file from simulator
DB_PATH=$(find ~/Library/Developer/CoreSimulator -name "kraftlog.db" 2>/dev/null | grep "kraftlog/SQLite/kraftlog.db" | head -1)

if [ -n "$DB_PATH" ]; then
    echo "Found database at: $DB_PATH"
    
    # Get the directory
    DB_DIR=$(dirname "$DB_PATH")
    
    # Remove all database files
    rm -f "$DB_PATH"
    rm -f "$DB_PATH-shm"
    rm -f "$DB_PATH-wal"
    
    echo "Cleared local database successfully"
else
    echo "No database found"
fi

# Also clear AsyncStorage data
echo "To clear AsyncStorage, reset the app from simulator or uninstall and reinstall"
