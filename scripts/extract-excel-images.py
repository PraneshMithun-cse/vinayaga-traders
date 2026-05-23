#!/usr/bin/env python3
import zipfile, re, os, shutil, sys

XLSX = "/Users/pranesh/Downloads/Copy of vinayaga traders all products edit (1).xlsx"
OUT  = os.path.join(os.path.dirname(__file__), "../public/images/products")
os.makedirs(OUT, exist_ok=True)

def to_slug(name):
    s = name.lower()
    s = re.sub(r'\(([^)]+)\)', r'-\1', s)
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'[^a-z0-9-]', '', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')

with zipfile.ZipFile(XLSX) as z:
    # Parse rels: rId → media filename
    rels_xml = z.read("xl/drawings/_rels/drawing1.xml.rels").decode()
    rid_to_media = {}
    for m in re.finditer(r'Id="(rId\d+)"[^>]*Target="\.\./media/([^"]+)"', rels_xml):
        rid_to_media[m.group(1)] = m.group(2)

    # Parse drawing: row → rId
    drawing_xml = z.read("xl/drawings/drawing1.xml").decode()
    row_to_rid = {}
    for anchor in re.finditer(r'<xdr:from><xdr:col>3</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>(\d+)</xdr:row>', drawing_xml):
        row_idx = int(anchor.group(1))
        # Find the rId in the next blip embed after this anchor
        pos = anchor.end()
        rid_match = re.search(r'r:embed="(rId\d+)"', drawing_xml[pos:pos+500])
        if rid_match:
            row_to_rid[row_idx] = rid_match.group(1)

    # Row index → product slug mapping (0-indexed rows from the xlsx)
    # Built from the Excel data we already read
    ROW_SLUGS = {
        # Dry chips (rows 28-30)
        28: "bat-chips",
        29: "wheel-chips",
        30: "onion-chips",
        # Whole spices (rows 53-74, skipping 58)
        53: "milagu",
        54: "marati-moku",
        55: "annachi-poo",
        56: "kirambu",
        57: "sukku",
        # 58 = thalippu vadagam (no image in drawing)
        59: "ellaka",
        60: "munthri",
        61: "thirachai",
        62: "kasakasa",
        63: "karunjeeragam",
        64: "ommam",
        65: "vella-ellu",
        66: "karupu-ellu",
        67: "jeeragam",
        68: "soombu",
        69: "karupu-thirachai",
        70: "birayani-illai",
        71: "kalpasi",
        72: "kasuri-methi",
        73: "pattai",
        74: "jathi-pathri",
        # Flour (rows 76-87)
        76: "kadalai-mavu",
        77: "corn-flour-mavu",
        78: "arsi-mavu",
        79: "koola-mavu",
        80: "maida-mavu",
        81: "kothumai-mavu",
        82: "ragi-mavu",
        83: "rava",
        84: "kothumai-rava",
        85: "vella-avul",
        86: "red-avul",
        87: "getti-avul",
        # Pulses (rows 89-99, skip 100)
        89: "thuvaram-parupu",
        90: "paasi-parupu",
        91: "kadalai-parupu",
        92: "mysoor-parupu",
        93: "vada-parupu",
        94: "avarai-parupu",
        95: "karupu-ulunthu",
        96: "udacha-ulunthu",
        97: "urutu-ulunthu",
        98: "pottukallai",
        99: "mulu-pottukalai",
        101: "pacha-nilakadalai",
    }

    extracted = []
    for row_idx, slug in ROW_SLUGS.items():
        if row_idx not in row_to_rid:
            print(f"  WARN: no drawing anchor at row {row_idx} for {slug}")
            continue
        rid = row_to_rid[row_idx]
        if rid not in rid_to_media:
            print(f"  WARN: rId {rid} not in rels for {slug}")
            continue
        media_name = rid_to_media[rid]
        media_path = f"xl/media/{media_name}"
        ext = os.path.splitext(media_name)[1]  # .png
        dest = os.path.join(OUT, f"{slug}{ext}")
        data = z.read(media_path)
        with open(dest, 'wb') as f:
            f.write(data)
        extracted.append((slug, dest, len(data)))
        print(f"  ✓ {slug} ← {media_name} ({len(data)//1024}KB)")

print(f"\nExtracted {len(extracted)}/{len(ROW_SLUGS)} images")
