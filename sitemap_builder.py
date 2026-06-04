#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sitemap_builder.py
==================================================================
แผนที่เว็บไซต์แบบ LOCAL ล้วน สำหรับเว็บที่ดาวน์โหลดด้วย HTTrack

หลักการทำงาน (โปร่งใส ตรวจสอบได้):
  * อ่านเฉพาะไฟล์ .html / .htm ในเครื่องเท่านั้น
  * ไม่ดึงเว็บจริง  ไม่เรียก AI / API ภายนอกใด ๆ
  * ไม่แต่งข้อมูลสินค้าเอง  ดึงเฉพาะสิ่งที่อยู่ใน HTML จริง
  * ใช้เฉพาะไลบรารีมาตรฐานของ Python (ไม่ต้อง pip install อะไรเลย)

สิ่งที่สกัด / ตรวจจับ:
  - URL ต้นฉบับจากคอมเมนต์ HTTrack  <!-- Mirrored from ... -->
  - <title>, <h1>, <h2>, รูปภาพ <img src>
  - ลิงก์ <a href> ทั้งหมด + ข้อความลิงก์ (resolve ว่าไฟล์ปลายทางมีจริงไหม)
  - นับลิงก์ขาเข้า (incoming)
  - เดาประเภทหน้า: homepage / brand / product / info / empty(404) / unknown
  - ตรวจหน้าซ้ำ (query-string duplicate) ด้วยลายเซ็นรูปภาพ + แฮชเนื้อหา
  - แยกลิงก์เสียเป็น 2 กลุ่ม: ไทย-ชื่อเพี้ยน (น่าจะมีไฟล์จริง) / หายจริง

หมายเหตุข้อมูล:
  เว็บนี้เป็น tis-620 และ HTTrack เก็บชื่อไฟล์ภาษาไทยแบบเสียหาย
  (มี U+FFFD ฝังในชื่อไฟล์บนดิสก์) ทำให้ลิงก์ไทยบางส่วน match ไฟล์ไม่ได้
  สคริปต์จึงแยกแยะกรณีนี้ออกมาให้เห็นชัด แทนการเดา

ไฟล์ผลลัพธ์:
  site-map.json, site-map.md, broken-links.md,
  page-inventory.csv, graph-data.json
==================================================================
"""

import os
import re
import sys
import csv
import json
import html
import hashlib
import posixpath
import urllib.parse
from collections import defaultdict, Counter
from datetime import datetime

# บังคับ stdout เป็น utf-8 เพื่อให้ print ภาษาไทยได้บน Windows console
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# ------------------------------------------------------------------
# 1) การตั้งค่า: โฟลเดอร์ต้นทาง + โฟลเดอร์ผลลัพธ์
#    - ค่าเริ่มต้นชี้ไปที่ "doc root" ของ mirror (โครงสร้างลิงก์ครบ)
#    - แทนที่ได้ด้วย argument:  python sitemap_builder.py <ROOT> <OUTDIR>
# ------------------------------------------------------------------
SANDBOX = r"C:\Users\PAN\OneDrive\รูปภาพ\เดสก์ท็อป\graphify-sandbox"
DEFAULT_ROOT = os.path.join(
    SANDBOX, "HTTrack My Web Sites", "Giga-Bike-", "www.thaigigabike.com"
)
DEFAULT_OUTDIR = os.path.join(SANDBOX, "sitemap-out")

ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_ROOT
OUTDIR = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTDIR

ENCODINGS = ("utf-8", "cp874", "latin-1")  # tis-620 -> cp874

# ------------------------------------------------------------------
# 2) regex สำหรับสกัดข้อมูล (ทนกับ HTML เก่า ๆ ที่เขียนไม่เป๊ะ)
# ------------------------------------------------------------------
RE_MIRROR = re.compile(r"Mirrored from\s+(\S+)\s+by HTTrack", re.I)
RE_MIRROR_LINE = re.compile(r"<!--\s*Mirrored from.*?-->", re.I | re.S)
RE_TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
RE_H1 = re.compile(r"<h1[^>]*>(.*?)</h1>", re.I | re.S)
RE_H2 = re.compile(r"<h2[^>]*>(.*?)</h2>", re.I | re.S)
RE_A = re.compile(r"<a\s+[^>]*?href\s*=\s*\"([^\"]*)\"[^>]*>(.*?)</a>", re.I | re.S)
RE_IMG = re.compile(r"<img\s+[^>]*?src\s*=\s*\"([^\"]*)\"", re.I)
RE_TAG = re.compile(r"<[^>]+>")
RE_WS = re.compile(r"\s+")

# ------------------------------------------------------------------
# 3) ตัวช่วยจัดประเภทหน้า
# ------------------------------------------------------------------
BRANDS = [
    "yamaha", "honda", "kawasaki", "suzuki", "ducati", "bmw", "ktm",
    "triumph", "harley", "royalenfield", "royal enfield", "enfield",
    "stallions", "hd",
]
INFO_WORDS = [
    "ชำระเงิน", "ติดต่อ", "เกี่ยวกับ", "วิธีการ", "เงื่อนไข", "สมัคร",
    "จัดส่ง", "นโยบาย", "contact", "about", "payment", "shipping",
    "info", "policy", "term", "faq", "help",
]
RE_MODEL_NUM = re.compile(
    r"(cbr?\d{2,4}|r\d{1,2}\b|nc\d{2}|ksr\d{2,3}|ninja\s?\d{3}|zx\d{2,3}|"
    r"msx\d*|dax\d*|xs\d{3}|sr\d{2,3}|w\d{3}|kr\d{3}|gb\d{3}|cb\d{3,4}|"
    r"tempter\d*|estrella\d*|monster\d*|truxton\d*|\b\d{3,4}\b)",
    re.I,
)


def strip_tags(text):
    if not text:
        return ""
    text = RE_TAG.sub(" ", text)
    text = html.unescape(text)
    return RE_WS.sub(" ", text).strip()


def read_text(path):
    with open(path, "rb") as f:
        raw = f.read()
    for enc in ENCODINGS:
        try:
            return raw.decode(enc), enc
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1", "replace"), "latin-1?"


def is_external(href):
    h = href.strip().lower()
    return (
        h.startswith("http://") or h.startswith("https://") or h.startswith("//")
        or h.startswith("mailto:") or h.startswith("javascript:")
        or h.startswith("tel:") or h.startswith("#") or h == ""
    )


def link_candidates(href):
    """
    คืนรายชื่อ 'ชื่อที่เป็นไปได้' ของไฟล์ปลายทาง (relative, ใช้ '/')
    จาก href โดยลอง decode หลายแบบ เพราะ HTTrack อาจตั้งชื่อไฟล์หลาย encoding
    คืน (candidates, is_html, target_is_nonascii)
    """
    raw = href.split("#", 1)[0].split("?", 1)[0].strip()
    if raw == "":
        return [], False, False
    b = urllib.parse.unquote_to_bytes(raw)
    target_nonascii = any(byte > 127 for byte in b)
    cands = []
    for enc in ("cp874", "latin-1", "cp1252", "utf-8"):
        try:
            cands.append(b.decode(enc))
        except Exception:
            continue
    # เพิ่มรูปแบบดิบ (เผื่อไม่มี %xx)
    cands.append(raw)
    # ทำให้ไม่ซ้ำ คงลำดับ
    seen, uniq = set(), []
    for c in cands:
        c = c.replace("\\", "/")
        if c not in seen:
            seen.add(c)
            uniq.append(c)
    is_html = uniq and uniq[0].lower().endswith((".html", ".htm"))
    return uniq, is_html, target_nonascii


def resolve(src_rel, cand, index):
    """join relative กับโฟลเดอร์ของหน้าต้นทาง แล้วเช็คใน index"""
    base = posixpath.dirname(src_rel.replace("\\", "/"))
    joined = posixpath.normpath(posixpath.join(base, cand))
    return index.get(joined.lower())


def classify(rel_path, src_url, title, is_empty):
    if is_empty:
        return "empty"
    name = os.path.basename(rel_path).lower()
    stem = os.path.splitext(name)[0]
    hay = " ".join([rel_path, src_url or "", title or "", stem]).lower()
    if stem in ("index", "index-2", "default", "home", "main") or src_url in (
        "www.thaigigabike.com/", "www.thaigigabike.com",
    ):
        return "homepage"
    if any(w in hay for w in INFO_WORDS):
        return "info"
    if RE_MODEL_NUM.search(stem) or RE_MODEL_NUM.search(title or ""):
        return "product"
    if any(b in hay for b in BRANDS):
        return "brand"
    return "unknown"


def is_corrupt_name(rel):
    """ชื่อไฟล์มีอักขระเพี้ยน (non-ascii / U+FFFD) — ชื่อไทยที่ HTTrack เก็บเสีย"""
    return any(ord(c) > 127 for c in rel)


# ==================================================================
# MAIN
# ==================================================================
def main():
    if not os.path.isdir(ROOT):
        print(f"[error] ไม่พบโฟลเดอร์ ROOT: {ROOT}")
        sys.exit(1)
    os.makedirs(OUTDIR, exist_ok=True)
    print(f"[scan] ROOT   = {ROOT}")
    print(f"[scan] OUTDIR = {OUTDIR}")

    # -- 1) ดัชนีไฟล์จริงทุกชนิด (lower(rel) -> rel) + รายชื่อ html --
    html_files = []
    index = {}
    for dirpath, _dirs, files in os.walk(ROOT):
        for fn in files:
            rel = os.path.relpath(os.path.join(dirpath, fn), ROOT).replace("\\", "/")
            index[rel.lower()] = rel
            if fn.lower().endswith((".html", ".htm")):
                html_files.append(rel)
    html_files.sort()
    print(f"[scan] พบไฟล์ HTML: {len(html_files)}")

    # -- 2) สกัดข้อมูลแต่ละหน้า --
    pages = {}
    incoming = Counter()
    incoming_sources = defaultdict(set)
    edges = []
    broken = []   # {source, href, kind: 'thai_name'|'ascii_missing', text}

    for rel in html_files:
        text, enc = read_text(os.path.join(ROOT, rel))

        m = RE_MIRROR.search(text)
        src_url = m.group(1) if m else ""
        title = strip_tags(RE_TITLE.search(text).group(1)) if RE_TITLE.search(text) else ""
        h1s = [strip_tags(x) for x in RE_H1.findall(text) if strip_tags(x)]
        h2s = [strip_tags(x) for x in RE_H2.findall(text) if strip_tags(x)]
        imgs = RE_IMG.findall(text)
        # รูปภายในเว็บ (ไม่ใช่ของ tarad.com) — ใช้เป็นลายเซ็นหน้า
        internal_imgs = sorted({s for s in imgs if not is_external(s)})

        # หน้า 404 / ว่าง: title มี "404" หรือ เนื้อหาน้อย+ไม่มีรูป
        body_len = len(strip_tags(RE_MIRROR_LINE.sub("", text)))
        is_empty = ("404" in title) or (len(internal_imgs) == 0 and body_len < 400)

        out_links = []
        link_texts = []
        ext_count = 0

        for href, inner in RE_A.findall(text):
            txt = strip_tags(inner)
            if txt:
                link_texts.append(txt)
            if is_external(href):
                ext_count += 1
                continue
            cands, is_html, target_nonascii = link_candidates(href)
            if not is_html:
                continue
            hit = None
            for c in cands:
                hit = resolve(rel, c, index)
                if hit:
                    break
            if hit:
                edges.append({"source": rel, "target": hit, "text": txt})
                out_links.append({"target": hit, "text": txt, "exists": True})
                incoming[hit.lower()] += 1
                incoming_sources[hit.lower()].add(rel)
            else:
                kind = "thai_name" if target_nonascii else "ascii_missing"
                broken.append({"source": rel, "href": href, "kind": kind, "text": txt})

        # แฮชเนื้อหา (ตัดบรรทัด Mirrored ที่มี timestamp ออก) ไว้จับหน้าซ้ำ
        norm = RE_WS.sub(" ", RE_MIRROR_LINE.sub("", text)).strip().lower()
        chash = hashlib.md5(norm.encode("utf-8", "replace")).hexdigest()

        pages[rel] = {
            "file_path": rel,
            "mirrored_url": src_url,
            "title": title,
            "encoding": enc,
            "h1": h1s,
            "h2": h2s,
            "images": imgs,
            "internal_images": internal_imgs,
            "image_count": len(imgs),
            "outgoing_links": out_links,
            "outgoing_count": len(out_links),
            "external_link_count": ext_count,
            "link_texts": link_texts,
            "is_empty": is_empty,
            "content_hash": chash,
            "corrupt_name": is_corrupt_name(rel),
        }

    # -- 3) incoming + ประเภท --
    for rel, p in pages.items():
        p["incoming_count"] = incoming.get(rel.lower(), 0)
        p["incoming_from"] = sorted(incoming_sources.get(rel.lower(), []))
        p["page_type"] = classify(rel, p["mirrored_url"], p["title"], p["is_empty"])

    # -- 4) จับหน้าซ้ำ (query-string duplicate) --
    #    ลายเซ็น = ชุดรูปภายใน (ถ้ามี) ไม่งั้นใช้แฮชเนื้อหา
    groups = defaultdict(list)
    for rel, p in pages.items():
        if p["is_empty"]:
            continue  # ไม่จับคู่หน้า 404 ว่าง
        if p["internal_images"]:
            sig = ("img", tuple(p["internal_images"]))
        else:
            sig = ("txt", p["content_hash"])
        groups[sig].append(rel)
    for sig, members in groups.items():
        if len(members) < 2:
            continue
        canonical = min(members, key=lambda r: (len(r), r))  # ชื่อสั้นสุด = ตัวจริง
        for r in members:
            pages[r]["duplicate_of"] = None if r == canonical else canonical
    for p in pages.values():
        p.setdefault("duplicate_of", None)

    # -- 5) สรุปสถิติ --
    total_pages = len(pages)
    total_internal_links = sum(p["outgoing_count"] for p in pages.values())
    broken_thai = [b for b in broken if b["kind"] == "thai_name"]
    broken_real = [b for b in broken if b["kind"] == "ascii_missing"]

    by_type = Counter(p["page_type"] for p in pages.values())
    canonical_pages = {r: p for r, p in pages.items() if not p["duplicate_of"]}
    dup_count = total_pages - len(canonical_pages)

    top_linked = sorted(pages.values(), key=lambda x: x["incoming_count"], reverse=True)[:15]
    orphans = sorted(
        r for r, p in pages.items()
        if p["incoming_count"] == 0 and p["page_type"] != "homepage" and not p["duplicate_of"]
    )
    orphan_corrupt = [r for r in orphans if pages[r]["corrupt_name"]]
    orphan_real = [r for r in orphans if not pages[r]["corrupt_name"]]

    # หน้าสินค้า/ยี่ห้อ "ตัวจริง" (ไม่ซ้ำ ไม่ว่าง) เรียงตามจำนวนรูป
    def real(rtype):
        return sorted(
            (r for r, p in pages.items()
             if p["page_type"] == rtype and not p["duplicate_of"] and not p["is_empty"]),
            key=lambda r: pages[r]["image_count"], reverse=True,
        )
    product_pages = real("product")
    brand_pages = real("brand")
    info_pages = real("info")

    summary = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "root": ROOT,
        "total_html_pages": total_pages,
        "unique_pages": len(canonical_pages),
        "duplicate_pages": dup_count,
        "empty_404_pages": by_type.get("empty", 0),
        "total_internal_links": total_internal_links,
        "broken_links_total": len(broken),
        "broken_links_thai_name": len(broken_thai),
        "broken_links_real_missing": len(broken_real),
        "page_type_counts": dict(by_type),
        "top_linked_pages": [
            {"file": p["file_path"], "incoming": p["incoming_count"], "title": p["title"]}
            for p in top_linked
        ],
        "orphan_pages_total": len(orphans),
        "orphan_corrupt_name": orphan_corrupt,
        "orphan_real": orphan_real,
        "product_pages": product_pages,
        "brand_pages": brand_pages,
        "info_pages": info_pages,
    }

    # ==============================================================
    # 6) เขียนไฟล์ผลลัพธ์
    # ==============================================================
    with open(os.path.join(OUTDIR, "site-map.json"), "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "pages": pages}, f, ensure_ascii=False, indent=2)

    # graph-data.json (nodes + links) สำหรับ visualize ทีหลัง
    nodes = [
        {
            "id": p["file_path"],
            "label": p["title"] or os.path.basename(p["file_path"]),
            "type": p["page_type"],
            "incoming": p["incoming_count"],
            "outgoing": p["outgoing_count"],
            "duplicate_of": p["duplicate_of"],
            "url": p["mirrored_url"],
        }
        for p in pages.values()
    ]
    links = [{"source": e["source"], "target": e["target"], "text": e["text"]} for e in edges]
    with open(os.path.join(OUTDIR, "graph-data.json"), "w", encoding="utf-8") as f:
        json.dump({"nodes": nodes, "links": links}, f, ensure_ascii=False, indent=2)

    # page-inventory.csv
    with open(os.path.join(OUTDIR, "page-inventory.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow([
            "file_path", "page_type", "is_empty", "duplicate_of", "title",
            "mirrored_url", "incoming", "outgoing", "external_links",
            "image_count", "h1", "encoding", "corrupt_name",
        ])
        for rel in sorted(pages):
            p = pages[rel]
            w.writerow([
                p["file_path"], p["page_type"], p["is_empty"], p["duplicate_of"] or "",
                p["title"], p["mirrored_url"], p["incoming_count"], p["outgoing_count"],
                p["external_link_count"], p["image_count"], " | ".join(p["h1"]),
                p["encoding"], p["corrupt_name"],
            ])

    # broken-links.md (แยก 2 กลุ่ม)
    with open(os.path.join(OUTDIR, "broken-links.md"), "w", encoding="utf-8") as f:
        f.write("# ลิงก์ภายในที่ resolve ไม่ได้\n\n")
        f.write(f"- รวมทั้งหมด: **{len(broken)}**\n")
        f.write(f"- กลุ่ม A — ชื่อไฟล์ไทยเพี้ยน (ไฟล์น่าจะมีอยู่จริง ต้องตรวจมือ): **{len(broken_thai)}**\n")
        f.write(f"- กลุ่ม B — หายจริง (ไม่มีไฟล์บนดิสก์): **{len(broken_real)}**\n\n")
        f.write("> กลุ่ม A เกิดจาก HTTrack เก็บชื่อไฟล์ภาษาไทยเสียหาย (tis-620) — "
                "หน้าปลายทางมักมีอยู่จริงแต่ชื่อไฟล์ match ไม่ได้ "
                "ตอนย้ายเว็บให้ทำ URL/slug ใหม่เป็นภาษาอังกฤษหรือ utf-8\n\n")

        f.write("## กลุ่ม B — ลิงก์ที่หายจริง (ควรตรวจ/ตัดทิ้ง)\n\n")
        if not broken_real:
            f.write("_ไม่มี_\n")
        else:
            seen = set()
            for b in sorted(broken_real, key=lambda x: x["href"]):
                key = b["href"].lower()
                if key in seen:
                    continue
                seen.add(key)
                f.write(f"- `{b['href']}` — ข้อความ: {b['text'] or '(ไม่มี)'}\n")

        f.write(f"\n## กลุ่ม A — ลิงก์ชื่อไทยเพี้ยน ({len(broken_thai)} รายการ)\n\n")
        f.write("_ตัวอย่าง 40 รายการแรก (ที่เหลือดูใน site-map.json):_\n\n")
        for b in broken_thai[:40]:
            f.write(f"- จาก `{b['source']}` — ข้อความ: {b['text'] or '(ไม่มี)'}\n")

    # site-map.md (รายงานสรุป)
    with open(os.path.join(OUTDIR, "site-map.md"), "w", encoding="utf-8") as f:
        f.write("# แผนที่เว็บไซต์ (Local Site Map)\n\n")
        f.write(f"- สร้างเมื่อ: {summary['generated_at']}\n")
        f.write(f"- ต้นทาง: `{ROOT}`\n\n")
        f.write("## สรุปภาพรวม\n\n| รายการ | จำนวน |\n|---|---|\n")
        f.write(f"| หน้า HTML ทั้งหมด | {total_pages} |\n")
        f.write(f"| หน้า 'ตัวจริง' (ไม่ซ้ำ) | {len(canonical_pages)} |\n")
        f.write(f"| หน้าซ้ำ (query duplicate) | {dup_count} |\n")
        f.write(f"| หน้า 404/ว่าง | {by_type.get('empty', 0)} |\n")
        f.write(f"| ลิงก์ภายใน (resolve ได้) | {total_internal_links} |\n")
        f.write(f"| ลิงก์เสีย-ไทยชื่อเพี้ยน | {len(broken_thai)} |\n")
        f.write(f"| ลิงก์เสีย-หายจริง | {len(broken_real)} |\n")
        for t in ("homepage", "brand", "product", "info", "empty", "unknown"):
            f.write(f"| ประเภท: {t} | {by_type.get(t, 0)} |\n")

        f.write("\n## หน้าที่ถูกลิงก์มากที่สุด (Top linked)\n\n")
        f.write("| # | ขาเข้า | หน้า | ประเภท | รูป |\n|---|---|---|---|---|\n")
        for i, p in enumerate(top_linked, 1):
            f.write(f"| {i} | {p['incoming_count']} | `{p['file_path']}` | "
                    f"{p['page_type']} | {p['image_count']} |\n")

        f.write(f"\n## หน้าสินค้า/รุ่น 'ตัวจริง' เรียงตามจำนวนรูป — {len(product_pages)} หน้า\n\n")
        for r in product_pages:
            f.write(f"- `{r}` — รูป {pages[r]['image_count']} ใบ\n")

        f.write(f"\n## หน้ายี่ห้อ/หมวด 'ตัวจริง' — {len(brand_pages)} หน้า\n\n")
        for r in brand_pages:
            f.write(f"- `{r}` — รูป {pages[r]['image_count']} ใบ\n")

        f.write(f"\n## หน้า info/ติดต่อ/ชำระเงิน — {len(info_pages)} หน้า\n\n")
        for r in info_pages:
            f.write(f"- `{r}`\n")

        f.write(f"\n## หน้ากำพร้าจริง (ไม่มีลิงก์เข้า, ชื่อไม่เพี้ยน) — {len(orphan_real)} หน้า\n\n")
        for r in orphan_real:
            f.write(f"- `{r}` — {pages[r]['page_type']}\n")
        f.write(f"\n## หน้ากำพร้าเพราะชื่อไฟล์ไทยเพี้ยน — {len(orphan_corrupt)} หน้า\n\n")
        f.write("_(จริง ๆ มีลิงก์ชี้มา แต่ resolve ไม่ได้เพราะชื่อไฟล์เสีย)_\n\n")
        for r in orphan_corrupt:
            f.write(f"- `{r}`\n")

    # -- สรุปหน้าจอ --
    print("\n===== สรุป =====")
    print(f"หน้า HTML ทั้งหมด        : {total_pages}")
    print(f"  - ตัวจริง (ไม่ซ้ำ)     : {len(canonical_pages)}")
    print(f"  - ซ้ำ (query dup)      : {dup_count}")
    print(f"  - 404/ว่าง            : {by_type.get('empty', 0)}")
    print(f"ลิงก์ภายใน (resolve ได้) : {total_internal_links}")
    print(f"ลิงก์เสีย-ไทยชื่อเพี้ยน   : {len(broken_thai)}")
    print(f"ลิงก์เสีย-หายจริง        : {len(broken_real)}")
    print(f"ประเภท                  : {dict(by_type)}")
    print(f"หน้ากำพร้าจริง           : {len(orphan_real)}")
    print(f"สินค้า/brand/info ตัวจริง : {len(product_pages)}/{len(brand_pages)}/{len(info_pages)}")
    print(f"\nไฟล์ผลลัพธ์: {OUTDIR}")


if __name__ == "__main__":
    main()
