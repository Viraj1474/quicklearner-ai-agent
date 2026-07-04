"""
SQLite Database Backup Script

Simple utility to backup the SQLite database with timestamp.
Run this script periodically (e.g., via cron job) for production safety.

Usage:
    python backup_db.py              # Creates timestamped backup
    python backup_db.py --source=/path/to/db.db --dest=/path/to/backups/
    
Example cron setup (daily backup at 2 AM):
    0 2 * * * cd /path/to/backend && python backup_db.py >> backup.log 2>&1
"""

import shutil
import argparse
from pathlib import Path
from datetime import datetime
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def backup_database(source_path: str | Path = None, dest_path: str | Path = None, max_backups: int = 10):
    """
    Backup the SQLite database to a timestamped file.
    
    Args:
        source_path: Path to the database file (defaults to backend/ai_agent.db)
        dest_path: Directory to store backups (defaults to backend/backups/)
        max_backups: Maximum number of backups to keep (older ones deleted)
    """
    # Default paths
    if source_path is None:
        source_path = Path(__file__).resolve().parent / "ai_agent.db"
    else:
        source_path = Path(source_path)
    
    if dest_path is None:
        dest_path = Path(__file__).resolve().parent / "backups"
    else:
        dest_path = Path(dest_path)
    
    # Create backup directory if it doesn't exist
    dest_path.mkdir(parents=True, exist_ok=True)
    
    # Check source exists
    if not source_path.exists():
        logger.error(f"Database file not found: {source_path}")
        return False
    
    # Create timestamped backup filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"ai_agent_backup_{timestamp}.db"
    backup_path = dest_path / backup_filename
    
    try:
        # Copy the database file
        shutil.copy2(source_path, backup_path)
        logger.info(f"✓ Database backup created: {backup_path}")
        
        # Clean up old backups if exceeding max_backups
        _cleanup_old_backups(dest_path, max_backups)
        
        return True
    except Exception as e:
        logger.error(f"✗ Backup failed: {e}")
        return False


def _cleanup_old_backups(backup_dir: Path, max_backups: int):
    """Delete oldest backups if count exceeds max_backups."""
    backup_files = sorted(
        backup_dir.glob("ai_agent_backup_*.db"),
        key=lambda p: p.stat().st_mtime,
        reverse=True  # Most recent first
    )
    
    if len(backup_files) > max_backups:
        for old_backup in backup_files[max_backups:]:
            try:
                old_backup.unlink()
                logger.info(f"🗑️  Removed old backup: {old_backup.name}")
            except Exception as e:
                logger.warning(f"Could not delete {old_backup.name}: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Backup SQLite database with automatic cleanup of old backups"
    )
    parser.add_argument(
        "--source",
        type=str,
        default=None,
        help="Path to source database file (default: backend/ai_agent.db)"
    )
    parser.add_argument(
        "--dest",
        type=str,
        default=None,
        help="Path to backup directory (default: backend/backups/)"
    )
    parser.add_argument(
        "--max-backups",
        type=int,
        default=10,
        help="Maximum number of backups to keep (default: 10)"
    )
    
    args = parser.parse_args()
    
    success = backup_database(
        source_path=args.source,
        dest_path=args.dest,
        max_backups=args.max_backups
    )
    
    exit(0 if success else 1)
