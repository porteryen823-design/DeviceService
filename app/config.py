import os
import logging

# Diagnostic log: Indicate this file is loaded
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug("Loaded app/config.py - Checking exported items")

SHOULD_LOG_CHANGES = os.getenv("SHOULD_LOG_CHANGES", "False").lower() in ("true", "1", "yes")

# Diagnostic log: Show variables defined in this file
logger.debug(f"Variables defined in app/config.py: {dir()}")
logger.debug(f"Is 'settings' object present: {'settings' in dir()}")