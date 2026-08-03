"""
@author: Crystian
@title: UsageMonitor
@nickname: UsageMonitor
@version: 1.27.4
@project: "https://github.com/576576/ComfyUI-UsageMonitor",
@description: Plugins for multiples uses, mainly for debugging, you need them! IG: https://www.instagram.com/crystian.ia
"""

from .core import version, logger
logger.info(f'UsageMonitor version: {version}')

from .server import *
from .general import *

WEB_DIRECTORY = "./web"
__all__ = ["WEB_DIRECTORY"]
