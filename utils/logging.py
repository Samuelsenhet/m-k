"""
Logging utility module with JSON formatting, log rotation, and colored output.
"""

import json
import logging
import sys
import traceback
from datetime import datetime
from functools import wraps
from logging.handlers import RotatingFileHandler
from typing import Any, Dict, Optional


# ANSI color codes for terminal output
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"

    # Log level colors
    DEBUG = "\033[36m"     # Cyan
    INFO = "\033[32m"      # Green
    WARNING = "\033[33m"   # Yellow
    ERROR = "\033[31m"     # Red
    CRITICAL = "\033[35m"  # Magenta

    # Structural colors
    TIMESTAMP = "\033[90m"  # Gray
    NAME = "\033[34m"       # Blue


LEVEL_COLORS = {
    logging.DEBUG: Colors.DEBUG,
    logging.INFO: Colors.INFO,
    logging.WARNING: Colors.WARNING,
    logging.ERROR: Colors.ERROR,
    logging.CRITICAL: Colors.CRITICAL,
}


class ColoredFormatter(logging.Formatter):
    """Formatter that adds ANSI colors to log output."""

    def format(self, record: logging.LogRecord) -> str:
        level_color = LEVEL_COLORS.get(record.levelno, Colors.RESET)

        timestamp = datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S")

        formatted = (
            f"{Colors.TIMESTAMP}{timestamp}{Colors.RESET} | "
            f"{level_color}{Colors.BOLD}{record.levelname:<8}{Colors.RESET} | "
            f"{Colors.NAME}{record.name}{Colors.RESET} | "
            f"{record.getMessage()}"
        )

        if record.exc_info:
            formatted += f"\n{level_color}{self.formatException(record.exc_info)}{Colors.RESET}"

        return formatted


class JsonFormatter(logging.Formatter):
    """Formatter that outputs structured JSON logs."""

    def __init__(self, include_extra: bool = True):
        super().__init__()
        self.include_extra = include_extra
        self._default_keys = {
            "name", "msg", "args", "created", "filename", "funcName",
            "levelname", "levelno", "lineno", "module", "msecs",
            "pathname", "process", "processName", "relativeCreated",
            "stack_info", "exc_info", "exc_text", "thread", "threadName",
            "taskName", "message",
        }

    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Include extra fields passed to logger
        if self.include_extra:
            extras = {
                k: v for k, v in record.__dict__.items()
                if k not in self._default_keys
            }
            if extras:
                log_data["extra"] = extras

        # Include exception info
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info),
            }

        return json.dumps(log_data, default=str)


def get_logger(
    name: str,
    level: int = logging.INFO,
    log_file: Optional[str] = None,
    use_json: bool = False,
    use_colors: bool = True,
    max_bytes: int = 10 * 1024 * 1024,  # 10 MB
    backup_count: int = 5,
) -> logging.Logger:
    """
    Create and configure a logger instance.

    Args:
        name: Logger name (typically __name__ of calling module)
        level: Logging level (default: INFO)
        log_file: Optional file path for log rotation
        use_json: Use JSON formatting (useful for log aggregation)
        use_colors: Use colored console output (default: True)
        max_bytes: Max file size before rotation (default: 10MB)
        backup_count: Number of backup files to keep (default: 5)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Prevent duplicate handlers
    if logger.handlers:
        return logger

    # Console handler with colors or JSON
    console_handler = logging.StreamHandler(sys.stdout)
    if use_json:
        console_handler.setFormatter(JsonFormatter())
    elif use_colors:
        console_handler.setFormatter(ColoredFormatter())
    else:
        console_handler.setFormatter(logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        ))
    logger.addHandler(console_handler)

    # Rotating file handler (optional)
    if log_file:
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
        )
        # Always use JSON for file logs (easier to parse)
        file_handler.setFormatter(JsonFormatter())
        logger.addHandler(file_handler)

    return logger


def log_execution_time(logger: logging.Logger):
    """
    Decorator to log function execution time.

    Usage:
        @log_execution_time(logger)
        def my_function():
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = datetime.now()
            try:
                result = func(*args, **kwargs)
                elapsed = (datetime.now() - start).total_seconds()
                logger.info(
                    f"{func.__name__} executed in {elapsed:.3f}s",
                    extra={"duration_seconds": elapsed, "status": "success"},
                )
                return result
            except Exception as e:
                elapsed = (datetime.now() - start).total_seconds()
                logger.error(
                    f"{func.__name__} failed after {elapsed:.3f}s: {e}",
                    extra={"duration_seconds": elapsed, "status": "error"},
                    exc_info=True,
                )
                raise
        return wrapper
    return decorator


def log_context(logger: logging.Logger, **context):
    """
    Context manager that adds extra fields to all logs within the block.

    Usage:
        with log_context(logger, request_id="abc123", user_id=42):
            logger.info("Processing request")  # includes request_id and user_id
    """
    class LogContext:
        def __init__(self):
            self._old_factory = None

        def __enter__(self):
            self._old_factory = logging.getLogRecordFactory()

            def record_factory(*args, **kwargs):
                record = self._old_factory(*args, **kwargs)
                for key, value in context.items():
                    setattr(record, key, value)
                return record

            logging.setLogRecordFactory(record_factory)
            return self

        def __exit__(self, *args):
            logging.setLogRecordFactory(self._old_factory)

    return LogContext()
