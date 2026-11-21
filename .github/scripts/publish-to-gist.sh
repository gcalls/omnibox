#!/usr/bin/env bash
# =====================================================================================
#  publish-to-gist.sh – đăng file build lên gist chung của dự án omnibox.
#  Dùng chung cho mọi dự án trong monorepo (shell-mobile, …).
#
#  Cách dùng:  GIST_TOKEN=… bash .github/scripts/publish-to-gist.sh <file>...
#    GIST_TOKEN        PAT có quyền ghi gist (classic: scope "gist"; fine-grained: Gists read/write)
#    GIST_DESCRIPTION  mô tả để tìm gist (mặc định "omnibox builds"); chưa có thì tạo gist secret mới
#
#  Gist là thư mục phẳng: file cùng tên sẽ bị ghi đè (cùng branch + version).
#  Sau khi push, script tải lại từng file qua raw URL bằng curl và so sha256 để xác nhận.
# =====================================================================================
set -euo pipefail

: "${GIST_TOKEN:?Thiếu GIST_TOKEN (GitHub secret GIST_TOKEN)}"
[ "$#" -gt 0 ] || { echo "Cách dùng: $0 <file>..." >&2; exit 2; }
DESC="${GIST_DESCRIPTION:-omnibox builds}"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/null}"
export GH_TOKEN="$GIST_TOKEN"

# Đổi sang đường dẫn tuyệt đối trước khi cd vào bản clone của gist
files=()
for f in "$@"; do
  [ -f "$f" ] || { echo "Không có file: $f" >&2; exit 1; }
  # Gist (git) từ chối file > 100 MB
  size=$(wc -c < "$f")
  if [ "$size" -ge 100000000 ]; then
    echo "::error::$f nặng $((size / 1000000)) MB, vượt giới hạn 100 MB/file của gist" >&2; exit 1
  fi
  files+=("$(cd "$(dirname "$f")" && pwd)/$(basename "$f")")
done

owner="$(gh api user --jq .login)"
gist_id="$(gh api --paginate /gists --jq ".[] | select(.description == \"$DESC\") | .id" | head -n1)"
if [ -z "$gist_id" ]; then
  gist_id="$(gh api -X POST /gists -f description="$DESC" -F public=false \
    -f 'files[README.md][content]=# omnibox builds' --jq .id)"
  echo "Đã tạo gist mới: $gist_id"
fi
echo "Gist: https://gist.github.com/$owner/$gist_id"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
git clone -q "https://x-access-token:${GIST_TOKEN}@gist.github.com/${gist_id}.git" "$work/gist"
cd "$work/gist"
git config user.name "omnibox-ci"
git config user.email "omnibox-ci@users.noreply.github.com"

names=()
for f in "${files[@]}"; do
  cp "$f" "./$(basename "$f")"
  names+=("$(basename "$f")")
done

# README.md: mục lục mọi file build hiện có trong gist
raw="https://gist.githubusercontent.com/$owner/$gist_id/raw"
{
  echo "# omnibox builds"
  echo
  echo "Tự động cập nhật bởi GitHub Actions (repo ${GITHUB_REPOSITORY:-omnibox}). Tên file: \`{branch}-{version}.{đuôi}\`."
  echo
  echo "| File | Dung lượng | Tải về |"
  echo "| --- | --- | --- |"
  for f in $(ls -1 | grep -v '^README.md$' | sort); do
    size="$(du -h "$f" | cut -f1)"
    echo "| \`$f\` | $size | [$raw/$f]($raw/$f) |"
  done
} > README.md

git add -A
msg="build: ${names[*]} (${GITHUB_REPOSITORY:-local}@${GITHUB_SHA:-$(date -u +%FT%TZ)})"
git commit -q -m "$msg" || echo "Không có thay đổi để commit"
git push -q origin HEAD
rev="$(git rev-parse HEAD)"

# Xác nhận: tải lại qua raw URL (bản đúng commit vừa push) và so sha256
{
  echo "### Gist: https://gist.github.com/$owner/$gist_id"
  echo
  echo "| File | Link tải (luôn là bản mới nhất) |"
  echo "| --- | --- |"
} >> "$SUMMARY"
for n in "${names[@]}"; do
  pinned="$raw/$rev/$n"
  ok=""
  for attempt in 1 2 3 4 5 6; do
    if curl -fsSL -o "$work/check" "$pinned" \
       && [ "$(sha256sum "$work/check" | cut -d' ' -f1)" = "$(sha256sum "$n" | cut -d' ' -f1)" ]; then
      ok=1; break
    fi
    sleep $((attempt * 5))
  done
  [ -n "$ok" ] || { echo "::error::Không tải lại được $n qua $pinned" >&2; exit 1; }
  echo "OK  $n  →  $raw/$n"
  echo "| \`$n\` | $raw/$n |" >> "$SUMMARY"
done
