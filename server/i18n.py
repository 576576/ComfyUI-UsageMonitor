"""Python-side i18n for the UsageMonitor frontend.

The frontend previously relied on ComfyUI's built-in i18n
(``web/languages/*.json``), which did not pick up custom-node translations.
Instead, we load the JSON bundles here and expose them through
``GET /usagemonitor/translations?lang=<lang>`` so the frontend can fetch and
apply them itself.
"""
import json
from pathlib import Path

from aiohttp import web
from server import PromptServer

from ..core import logger

_LANGUAGES_DIR = Path(__file__).resolve().parent.parent / "web" / "languages"
_SUPPORTED_LANGS = ("en", "zh", "zh-Hant")


def _load_translations():
    translations = {}
    for code in _SUPPORTED_LANGS:
        path = _LANGUAGES_DIR / f"{code}.json"
        try:
            with open(path, encoding="utf-8") as f:
                translations[code] = json.load(f)
        except (OSError, ValueError) as e:
            logger.warning(f"Could not load translations for '{code}': {e}")
    return translations


TRANSLATIONS = _load_translations()


def normalize_language(lang):
    """Map a browser/ComfyUI language code to one of the supported bundles."""
    if not lang:
        return "en"
    lang = lang.lower().replace("_", "-")
    if lang.startswith("zh-hant") or lang in ("zh-tw", "zh-hk", "zh-mo"):
        return "zh-Hant"
    if lang.startswith("zh"):
        return "zh"
    return "en"


def get_translations(lang):
    """Return the translation dict for a language (falls back to English)."""
    return TRANSLATIONS.get(normalize_language(lang), TRANSLATIONS.get("en", {}))


@PromptServer.instance.routes.get("/usagemonitor/translations")
def getTranslations(request):
    lang = request.query.get("lang", "en")
    return web.json_response(get_translations(lang))
