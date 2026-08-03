#!/usr/bin/env python3
"""render_i18n.py — render READMEs (and docs/i18n.md) from assets, per repo-i18n.

One script, two modes:

    # CI mode (default) — driven by env: I18N_DO / DOCS_DO / *_HASH
    python3 scripts/render_i18n.py

    # One-shot clean run (former clear_run.py) — no CI, no .github writes
    python3 scripts/render_i18n.py --once
    python3 scripts/render_i18n.py --once --no-code   # non-code repo

Inputs (source of truth):
    assets/bundles/*.json        app UI strings per locale (code repos only)
    assets/docs/*.json           README content per locale
    assets/templates/README.md   README template ({{placeholder}} tokens)
    assets/templates/i18n.md     i18n status template
    assets/.i18n_config/i18n.yml root_lang (default en) + fallback tree

Outputs:
    docs/i18n.md                 language coverage table + hash footer
                                 (CI mode only, needs bundles)
    README.md                    root view of root_lang
    docs/{code}/README.md        docs view for every locale (incl. en)

Options:
    --once     one-shot clean run: always render the READMEs, ignore bundles
               and never write docs/i18n.md; create a simple Chinese README
               when no assets/docs/*.json exist.
    --no-code  declare a non-code repo (no app UI): assets/bundles/ is ignored
               even if present, and docs/i18n.md is never written (the
               coverage table needs bundles).
"""

import argparse
import glob
import json
import os
import re
import sys
import urllib.parse
from datetime import datetime, timezone

HEADER_KEYS = 4


def load_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except OSError:
        return None


def read_text(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return None


def write_text(path, text):
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def parse_i18n_config():
    """Read assets/.i18n_config/i18n.yml → (root_lang, fallback_map)."""
    text = read_text("assets/.i18n_config/i18n.yml")
    if text is None:
        return "en", {}
    root = "en"
    fallback = {}
    in_fallback = False
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"root_lang\s*:\s*[\"']?([\w-]+)", line)
        if m:
            root = m.group(1)
            continue
        if line.startswith("fallback:"):
            in_fallback = True
            continue
        if in_fallback:
            if raw[:1] in (" ", "\t") and ":" in line:
                m = re.match(r"([\w-]+)\s*:\s*\[(.*)\]", line)
                if m:
                    code = m.group(1)
                    chain = [x.strip().strip("\"'")
                             for x in m.group(2).split(",") if x.strip()]
                    fallback[code] = chain
                    continue
            break
    return root, fallback


def root_lang():
    root, _ = parse_i18n_config()
    return root


def content_keys(bundle):
    return [k for k in bundle if not k.startswith("_")]


def default_chain(code):
    """Default fallback chain: variant → base → en ; non-variant → en."""
    if "-" in code:
        base = code.split("-", 1)[0]
        chain = [base]
        if base != "en":
            chain.append("en")
        return chain
    return [] if code == "en" else ["en"]


def fallback_chain(code, fallback_map, seen=None):
    """Fully expanded, de-duplicated fallback chain (recursive).

    Recursive: after a locale's own chain is exhausted, each hop contributes
    its own (configured or default) chain — e.g. `zh-Hant: [zh]` with
    `zh: [en]` resolves to `[zh, en]`. Cycles are broken.
    """
    if seen is None:
        seen = set()
    seen.add(code)
    direct = fallback_map.get(code) if fallback_map else None
    if direct is None:
        direct = default_chain(code)
    chain = []
    for hop in direct:
        if hop == code or hop in seen:
            continue
        chain.append(hop)
        chain.extend(fallback_chain(hop, fallback_map, seen))
    return chain


def effective_keys(code, bundles_by_code, fallback_map):
    """Non-header keys of a locale, merged with every key on its fallback chain."""
    keys = set(content_keys(bundles_by_code[code]))
    for fc in fallback_chain(code, fallback_map):
        b = bundles_by_code.get(fc)
        if b:
            keys |= set(content_keys(b))
    return keys


def deep_merge(base, override):
    """Recursively merge override into base; override wins."""
    out = dict(base)
    for k, v in override.items():
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def bundles_sorted():
    """Reverse-alphabetical locale order (sort -r): zh-Hant, zh, ..., en."""
    bundles = []
    for path in sorted(glob.glob("assets/bundles/*.json"), reverse=True):
        b = load_json(path)
        if b:
            bundles.append(b)
    return bundles


def load_docs_by_code():
    """All locale docs, keyed by langCode (missing/invalid files skipped)."""
    docs = {}
    for path in glob.glob("assets/docs/*.json"):
        d = load_json(path)
        if d and d.get("langCode"):
            docs[d["langCode"]] = d
    return docs


def merged_doc(code, docs_by_code, fallback_map):
    """Locale doc with missing keys filled from its fallback chain."""
    merged = {}
    for c in list(reversed(fallback_chain(code, fallback_map))) + [code]:
        d = docs_by_code.get(c)
        if d:
            merged = deep_merge(merged, d)
    return merged


def lang_counts(objs):
    counts = {}
    for o in objs:
        counts[o.get("lang", "")] = counts.get(o.get("lang", ""), 0) + 1
    return counts


def shared_label(lang, region, counts):
    """Shared labels (e.g. 中文 in zh + zh-Hant) get a region suffix."""
    return f"{lang} ({region})" if counts.get(lang, 0) > 1 else lang


def render_languages(cur_code, doc_prefix, objs, counts):
    items = []
    for o in objs:
        label = shared_label(o.get("lang", o.get("langCode", "")),
                             o.get("langRegion", ""), counts)
        if o.get("langCode") == cur_code:
            items.append(label)  # current language = plain text
        else:
            items.append(f'<a href="{doc_prefix}{o["langCode"]}/README.md">{label}</a>')
    return " &nbsp;|&nbsp; ".join(items)


def collect_tokens(obj, prefix=""):
    """Flatten a doc into {dot_path: value}; dicts nest, lists become indexed
    (features.title -> features.title.0, features.title.1, ...)."""
    tokens = {}
    for k, v in obj.items():
        path = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            tokens.update(collect_tokens(v, path))
        elif isinstance(v, list):
            for i, item in enumerate(v):
                tokens[f"{path}.{i}"] = item
        else:
            tokens[path] = v
    return tokens


def render_readme(code, out_path, root_view, objs, counts, docs_by_code,
                  fallback_map, no_code=False):
    doc = merged_doc(code, docs_by_code, fallback_map)
    if no_code:
        # non-code repos have no platform — drop the key before rendering so
        # no platform badge appears even if the docs JSON still has `platforms`.
        doc.pop("platforms", None)
    tpl = read_text("assets/templates/README.md")
    if tpl is None:
        return False  # missing template -> skip

    doc_prefix = "docs/" if root_view else "../"
    icon_prefix = "" if root_view else "../../"

    tpl = tpl.replace("{{icon_prefix}}", icon_prefix)
    tpl = tpl.replace("{{languages}}",
                      render_languages(code, doc_prefix, objs, counts))

    # whole-value tokens: platforms (URL-encoded), license (plain text)
    if isinstance(doc.get("platforms"), list):
        tpl = tpl.replace("{{platforms}}",
                          urllib.parse.quote(" | ".join(doc["platforms"]), safe=""))
    if doc.get("license") is not None:
        tpl = tpl.replace("{{license}}", str(doc["license"]))

    # drop any leftover {{platforms}} line (no-code, or JSON without platforms)
    if "{{platforms}}" in tpl:
        tpl = "\n".join(line for line in tpl.splitlines()
                        if "{{platforms}}" not in line)

    # dot-path tokens: headings.block1, features.title.0, archTree.dir1.1 ...
    for token, value in collect_tokens(doc).items():
        if token == "platforms":
            continue  # handled above as a whole
        if not root_view and token in ("building", "i18n"):
            # docs view: body doc links become ../docs/...
            value = value.replace("](docs/", "](../docs/")
        tpl = tpl.replace("{{" + token + "}}", str(value))

    # icon is attached by the script only when assets/images/icon.png exists
    icon_html = ""
    if os.path.exists("assets/images/icon.png"):
        title = doc.get("title", "")
        icon_html = (
            '<p align="center">\n'
            f'  <img src="{icon_prefix}assets/images/icon.png" width="64" alt="{title}">\n'
            '</p>\n\n'
        )

    write_text(out_path, icon_html + tpl)
    return True


def render_i18n(hashes, bundles, fallback_map):
    counts = lang_counts(bundles)
    bundles_by_code = {b["langCode"]: b for b in bundles}
    tpl = read_text("assets/templates/i18n.md")
    if tpl is None:
        return False

    en = bundles_by_code["en"]
    actual = len(content_keys(en)) - HEADER_KEYS
    d = load_json("assets/docs/en.json")
    title = d.get("title", "repo") if d else "repo"

    rows = []
    for b in bundles:
        code = b["langCode"]
        region = b["langRegion"]
        keys = len(effective_keys(code, bundles_by_code, fallback_map)) - HEADER_KEYS
        pct = min(100, round(keys * 100 / actual)) if actual else 100
        n_docs = len(glob.glob(f"docs/{code}/*.md"))
        label = shared_label(b["lang"], region, counts)
        rows.append(
            f"| [{label}]({code}/README.md) | `{code}` | {region} | "
            f"{keys}/{actual} ({pct}%) | {n_docs} 📄 |"
        )

    tpl = tpl.replace("{{title}}", title)
    tpl = tpl.replace("{{date}}", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
    tpl = tpl.replace("{{rows}}", "\n".join(rows))
    tpl = tpl.replace("{{bundles_hash}}", hashes["bundles"])
    tpl = tpl.replace("{{docs_hash}}", hashes["docs"])
    tpl = tpl.replace("{{templates_hash}}", hashes["templates"])

    write_text("docs/i18n.md", tpl)
    return True


SIMPLE_README = """# {repo}

本仓库已接入 **repo-i18n** 国际化文档系统。

- 配置文件：`assets/.i18n_config/i18n.yml`
- 语言内容：`assets/docs/`（README 内容）与 `assets/bundles/`（UI 字符串）
- 渲染模板：`assets/templates/README.md`

这是 `render_i18n.py --once` 生成的占位 README。添加 `assets/docs/{{code}}.json` 后
再次运行 `python3 repo-i18n/scripts/render_i18n.py --once` 即可生成多语言 README。
"""


def create_simple_readme():
    if os.path.exists("README.md"):
        print("No assets/docs and README.md already exists — skipped.")
        return False
    repo = os.path.basename(os.getcwd()) or "repo"
    write_text("README.md", SIMPLE_README.format(repo=repo))
    print(f"Created simple Chinese README.md ({repo})")
    return True


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Render READMEs (and docs/i18n.md) from assets per repo-i18n.")
    parser.add_argument(
        "--once", action="store_true",
        help="One-shot clean run (former clear_run.py): always render the "
             "READMEs, ignore assets/bundles/ and never write docs/i18n.md; "
             "create a simple Chinese README when no assets/docs exist.")
    parser.add_argument(
        "--no-code", action="store_true",
        help="Declare a non-code repo (no app UI): ignore assets/bundles/ even "
             "if present and never write docs/i18n.md (it needs bundles).")
    args = parser.parse_args(argv)

    if args.no_code:
        print("Non-code mode: assets/bundles/ ignored, docs/i18n.md skipped.")

    if args.once:
        i18n_do, docs_do = False, True
    else:
        i18n_do = os.environ.get("I18N_DO") == "true"
        docs_do = os.environ.get("DOCS_DO") == "true"
        if not (i18n_do or docs_do):
            print("Nothing to do (I18N_DO=false, DOCS_DO=false)")
            return

    docs_by_code = load_docs_by_code()
    if not docs_by_code:
        if args.once:
            create_simple_readme()
        else:
            print("No assets/docs/*.json — nothing to render.")
        return

    bundles = bundles_sorted()
    if args.no_code:
        bundles = []
    # Language order mirrors the file-path sort (reverse-alphabetical), so
    # zh-Hant.json sorts before zh.json -> [zh, zh-Hant, en] in display order.
    objs = bundles if bundles else [
        docs_by_code[c] for c in sorted(
            docs_by_code, key=lambda c: f"{c}.json", reverse=True)]
    counts = lang_counts(objs)
    _, fallback_map = parse_i18n_config()
    rl = root_lang()

    if i18n_do:
        if bundles:
            hashes = {
                "bundles": os.environ.get("BUNDLES_HASH", "abcdef12"),
                "docs": os.environ.get("DOCS_HASH", "34567890"),
                "templates": os.environ.get("TEMPLATES_HASH", "fedcba98"),
            }
            if render_i18n(hashes, bundles, fallback_map):
                print("Rendered docs/i18n.md")
            else:
                print("No assets/templates/i18n.md — docs/i18n.md skipped.")
        else:
            print("No bundles — skipped docs/i18n.md (coverage needs bundles)")

    if docs_do:
        for code in sorted(docs_by_code):
            render_readme(code, f"docs/{code}/README.md", False,
                          objs, counts, docs_by_code, fallback_map, args.no_code)
        render_readme(rl, "README.md", True,
                      objs, counts, docs_by_code, fallback_map, args.no_code)
        print(f"Rendered README.md + {len(docs_by_code)} docs/{{code}}/README.md")


if __name__ == "__main__":
    sys.exit(main())
