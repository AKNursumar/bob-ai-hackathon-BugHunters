"""
PortPulse Backend — Logging configuration
"""

import logging
import sys
from typing import Optional


def setup_logging(level: int = logging.INFO) -> None:
    """Configure application logging."""
    
    # Create logger
    logger = logging.getLogger("portpulse")
    logger.setLevel(level)
    
    # Remove existing handlers
    logger.handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    
    # Add handler
    logger.addHandler(console_handler)
    
    # Set levels for libraries
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("ortools").setLevel(logging.WARNING)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """Get logger instance."""
    return logging.getLogger(f"portpulse.{name}")
