import os
import logging

CONFIG = {
    "loglevel": int(os.environ.get("USAGEMONITOR_LOGLEVEL", logging.INFO)),
    "indent": int(os.environ.get("USAGEMONITOR_INDENT", 2))
}
