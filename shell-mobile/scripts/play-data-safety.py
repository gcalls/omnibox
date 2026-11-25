#!/usr/bin/env python3
"""play-data-safety.py – gửi khai báo Data safety (Google Play) từ 1config/store/android/data_safety.csv.

CSV theo mẫu Play Console (Question ID, Response ID, Response value, …). Google kiểm tra cả biểu mẫu:
sai một dòng thì không lưu gì và trả về dòng lỗi. Gửi lại nhiều lần không sao (ghi đè).
Khai báo hiện tại: thu thập Tên, Email, User ID, Số điện thoại, Ghi âm giọng nói – chỉ thu thập, không
chia sẻ, bắt buộc, mục đích chức năng app + quản lý tài khoản; mã hoá khi truyền; app không cho tự tạo tài khoản.
Cách dùng:  python3 -I scripts/play-data-safety.py
"""
import json, os, subprocess, sys, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
csv_text = open(os.path.join(ROOT, "1config/store/android/data_safety.csv"), encoding="utf-8").read()
env = subprocess.run(["bash", "-c", f'source "{ROOT}/1config/chplay/env.sh" && echo "$PLAY_PACKAGE_NAME" && play_token'],
                     capture_output=True, text=True, check=True).stdout.split()
pkg, token = env[0], env[1]
req = urllib.request.Request(f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{pkg}/dataSafety",
                             data=json.dumps({"safetyLabels": csv_text}).encode(), method="POST",
                             headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
try:
    urllib.request.urlopen(req).read()
    print(f"  ✔ Data safety ({pkg}): đã lưu {csv_text.count(chr(10)) - 1} câu trả lời")
except urllib.error.HTTPError as e:
    sys.exit("  ✖ Data safety: " + json.loads(e.read())["error"]["message"])
