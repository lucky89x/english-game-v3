#!/usr/bin/env python3
"""Tạo khung cho mọi Unit chưa có file nội dung và gắn nhãn trạng thái cho các file đã có.

Khung chỉ có tên Unit, chủ đề, kỹ năng; từ vựng và ngữ pháp để trống cho đến khi có nguồn đã đối chiếu.
Trạng thái (status): "outline" = chỉ khung; "vocab" = có từ vựng; "playable" = có hoạt động chơi được.
Chạy lại nhiều lần vẫn cho kết quả như nhau.

    python tools/learning/make_outlines.py
"""
import json
from pathlib import Path

LEARNING = Path(__file__).resolve().parents[2] / "data" / "learning"


def status_of(content: dict) -> str:
    if content.get("activities"):
        return "playable"
    return "vocab" if content.get("vocabulary") else "outline"


def main() -> None:
    units_path = LEARNING / "units.json"
    catalog = json.loads(units_path.read_text(encoding="utf-8"))
    created = 0
    for entry in catalog["units"]:
        grade, unit = int(entry["grade"]), int(entry["unit"])
        file_name = f"g{grade}_u{unit:02d}.json"
        path = LEARNING / file_name
        if path.exists():
            content = json.loads(path.read_text(encoding="utf-8"))
        else:
            content = {
                "id": entry["id"], "grade": grade, "unit": unit, "title": entry["title"],
                "skills": ["vocabulary", "reading", "grammar"],
                "objectives": [f"Talk about the topic: {entry['title']}"],
                "vocabulary": [], "grammar": [], "activities": {}, "version": 1,
                "vocabulary_checked": False, "grammar_checked": False,
                "source_note": "Khung: chưa có từ vựng hay ngữ pháp đã đối chiếu; chưa lấy dữ liệu từ lớp khác.",
            }
            created += 1
        content["status"] = status_of(content)
        path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        entry["content_file"] = file_name
        entry["status"] = content["status"]
    units_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    counts: dict = {}
    for entry in catalog["units"]:
        counts[entry["status"]] = counts.get(entry["status"], 0) + 1
    print(f"Tạo mới {created} khung; trạng thái: {counts}")


if __name__ == "__main__":
    main()
