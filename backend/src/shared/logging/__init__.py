"""Structured Logging setup for Helix."""
import logging
from src.shared.config import settings

def setup_logging():
    """Configure centralized logging separating domains."""
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    # Base config
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

    # Separate loggers for different domains
    # In a production setting, these could write to different files or streams.
    loggers = {
        "application": logging.getLogger("helix.application"),
        "audit": logging.getLogger("helix.audit"),
        "runtime": logging.getLogger("helix.runtime"),
        "security": logging.getLogger("helix.security"),
        "ingestion": logging.getLogger("helix.ingestion"),
        "knowledge": logging.getLogger("helix.knowledge"),
    }
    
    for name, logger in loggers.items():
        logger.setLevel(log_level)
        
    return loggers

loggers = setup_logging()
application_logger = loggers["application"]
audit_logger = loggers["audit"]
runtime_logger = loggers["runtime"]
security_logger = loggers["security"]
ingestion_logger = loggers["ingestion"]
knowledge_logger = loggers["knowledge"]
