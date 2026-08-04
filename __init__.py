"""
@author: Crystian
@title: UsageMonitor
@nickname: UsageMonitor
@version: 1.32.1
@project: "https://github.com/576576/ComfyUI-UsageMonitor",
@description: A real-time resource monitor for ComfyUI: CPU, GPU, RAM, VRAM, GPU temperature and disk space.
"""

from .core import version, logger
logger.info(f'UsageMonitor version: {version}')

from .server import *
from .general import *

WEB_DIRECTORY = "./web"
__all__ = ["WEB_DIRECTORY"]
