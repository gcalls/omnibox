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
#  Script chỉ đăng file; việc kiểm tra tải về bằng gh + curl làm ở máy local, không thuộc CI.
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
names=(); for f in "${files[@]}"; do names+=("$(basename "$f")"); done
# Chỉ giữ file của main / test / tag v* (file nhánh tạm bị xoá để gist không phình to)
KEEP="${GIST_KEEP_REGEX:-^(main|test|v[0-9][^-]*)-}"
msg="build: ${names[*]} (${GITHUB_REPOSITORY:-local}@${GITHUB_SHA:-$(date -u +%FT%TZ)})"

# publish <gist_id> → 0: xong; 2: gist vượt quota dung lượng; 1: lỗi khác
publish() {
  local id="$1" dir="$work/gist-$1" branch out f
  rm -rf "$dir"
  git clone -q --depth 1 "https://x-access-token:${GIST_TOKEN}@gist.github.com/${id}.git" "$dir" || return 1
  ( cd "$dir"
    branch="$(git symbolic-ref --short HEAD)"
    git config user.name "omnibox-ci"; git config user.email "omnibox-ci@users.noreply.github.com"
    for f in "${files[@]}"; do cp "$f" "./$(basename "$f")"; done
    for f in *; do
      [ "$f" = README.md ] && continue
      [[ " ${names[*]} " == *" $f "* || "$f" =~ $KEEP ]] || { git rm -q -f "$f" 2>/dev/null || rm -f "$f"; echo "  xoá file cũ $f"; }
    done
    raw="https://gist.githubusercontent.com/$owner/$id/raw"
    { echo "# omnibox builds"; echo
      echo "Tự động cập nhật bởi GitHub Actions (repo ${GITHUB_REPOSITORY:-omnibox}). Tên file: \`{branch}-{version}.{đuôi}\`."; echo
      echo "| File | Dung lượng | Tải về |"; echo "| --- | --- | --- |"
      for f in $(ls -1 | grep -v '^README.md$' | sort); do echo "| \`$f\` | $(du -h "$f" | cut -f1) | [$raw/$f]($raw/$f) |"; done
    } > README.md
    # Một commit duy nhất (không giữ lịch sử) → gist chỉ chứa bản mới nhất, không vượt quota
    git checkout -q --orphan omnibox-latest
    git add -A; git commit -q -m "$msg"
    out="$(git push -q -f origin "omnibox-latest:$branch" 2>&1)" && exit 0
    echo "$out" >&2
    echo "$out" | grep -qi 'size quota' && exit 2
    exit 1 )
}

rc=0; publish "$gist_id" || rc=$?
if [ "$rc" = 2 ]; then
  # Gist cũ vượt quota (lịch sử cũ còn lớn): đổi tên gist cũ, tạo gist mới cùng mô tả
  gh api -X PATCH "/gists/$gist_id" -f description="$DESC (cũ – vượt quota)" >/dev/null || true
  gist_id="$(gh api -X POST /gists -f description="$DESC" -F public=false -f 'files[README.md][content]=# omnibox builds' --jq .id)"
  echo "::warning::Gist cũ vượt quota dung lượng – đã tạo gist mới $gist_id, link tải đổi"
  rc=0; publish "$gist_id" || rc=$?
fi
[ "$rc" = 0 ] || { echo "::error::Không đăng được lên gist"; exit 1; }
raw="https://gist.githubusercontent.com/$owner/$gist_id/raw"

# Ghi link tải vào Summary của lần chạy. Việc kiểm tra tải về (gh + curl) làm ngoài CI.
{
  echo "### Gist: https://gist.github.com/$owner/$gist_id"
  echo
  echo "| File | Link tải (luôn là bản mới nhất) |"
  echo "| --- | --- |"
  for n in "${names[@]}"; do echo "| \`$n\` | $raw/$n |"; done
} >> "$SUMMARY"
for n in "${names[@]}"; do echo "Đã đăng $n → $raw/$n"; done
