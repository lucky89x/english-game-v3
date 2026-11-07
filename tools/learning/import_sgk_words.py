#!/usr/bin/env python3
"""Nhập từ vựng theo Unit vào data/learning.

Nguồn: data/source/sgk_notes_vocab.txt (chủ dự án tự chép từ sổ tay kiến thức lớp 6 và lớp 8).
Mỗi Unit ghi vào data/learning/g<lớp>_u<NN>.json (tạo mới nếu chưa có) và đăng ký content_file
trong units.json. Chạy lại nhiều lần vẫn cho kết quả như nhau: từ cũ giữ nguyên, từ mới thêm vào.
Chỉ lấy từ và nghĩa; bài đọc, câu hỏi trong game vẫn soạn nguyên bản.

    python tools/learning/import_sgk_words.py [đường_dẫn_nguồn]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEARNING = ROOT / "data" / "learning"
DEFAULT_SOURCE = ROOT / "data" / "source" / "sgk_notes_vocab.txt"
SOURCE_TAG = "sgk_notes"


def parse(path: Path) -> dict:
    """Trả về {(lớp, unit): [(từ, nghĩa), ...]}; báo lỗi nếu có dòng sai định dạng."""
    result: dict = {}
    current = None
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw.strip()
        if not line:
            continue
        header = re.fullmatch(r"#\s*g(\d+)\s+u(\d+)", line)
        if header:
            current = (int(header.group(1)), int(header.group(2)))
            result.setdefault(current, [])
            continue
        if line.startswith("#"):
            continue
        if current is None or "=" not in line:
            raise ValueError(f"{path.name}:{number}: dòng sai định dạng: {line!r}")
        word, meaning = (part.strip() for part in line.split("=", 1))
        if not word or not meaning:
            raise ValueError(f"{path.name}:{number}: thiếu từ hoặc nghĩa: {line!r}")
        result[current].append((word, meaning))
    return result


def main() -> int:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    parsed = parse(source)
    units_path = LEARNING / "units.json"
    catalog = json.loads(units_path.read_text(encoding="utf-8"))
    by_key = {(int(u["grade"]), int(u["unit"])): u for u in catalog["units"]}
    total_added = 0
    for (grade, unit), pairs in sorted(parsed.items()):
        entry = by_key.get((grade, unit))
        if entry is None:
            raise ValueError(f"Unit g{grade}_u{unit:02d} không có trong units.json")
        file_name = f"g{grade}_u{unit:02d}.json"
        path = LEARNING / file_name
        if path.exists():
            content = json.loads(path.read_text(encoding="utf-8"))
        else:
            content = {
                "id": entry["id"], "grade": grade, "unit": unit, "title": entry["title"],
                "skills": ["vocabulary"], "objectives": [], "vocabulary": [], "grammar": [],
                "activities": {}, "version": 1,
                "source_note": "Từ vựng do chủ dự án chép từ sổ tay kiến thức; chưa có bài đọc hay hoạt động.",
            }
        known = {w["word"].lower() for w in content["vocabulary"]}
        added = 0
        for word, meaning in pairs:
            if word.lower() in known:
                continue
            content["vocabulary"].append({"word": word, "vi": meaning, "source": SOURCE_TAG})
            known.add(word.lower())
            added += 1
        content["vocabulary_checked"] = True
        path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        entry["content_file"] = file_name
        entry["vocab_count"] = len(content["vocabulary"])
        total_added += added
        print(f"g{grade}_u{unit:02d}: +{added} từ (tổng {len(content['vocabulary'])})")
    units_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Xong: {len(parsed)} Unit, thêm {total_added} từ")
    return 0


if __name__ == "__main__":
    sys.exit(main())
