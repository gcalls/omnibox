#!/usr/bin/env python3
"""store_sync_ios.py – đồng bộ App Store Connect từ shell-mobile/store/ (không fastlane).

Điền qua App Store Connect API (key trong 1config/ios, token qua 1config/appconnect/env.sh):
  • App Information: danh mục, tên/phụ đề/URL chính sách theo ngôn ngữ, khai báo bản quyền nội dung
  • Xếp hạng độ tuổi (mọi mục = không có)
  • Giá: miễn phí; phát hành ở mọi quốc gia
  • Phiên bản App Store đang soạn: bản quyền, phát hành tự động sau khi duyệt, mô tả/từ khoá/URL/ghi chú
  • Thông tin App Review + tài khoản demo (APP_REVIEW_* trong 1config/ios/app.env, nếu đã điền)
  • TestFlight: nhóm nội bộ "Omnibox Internal" (mọi build), thông tin beta (email phản hồi, mô tả)
Cách dùng:  python3 -I scripts/store_sync_ios.py [--version 1.0]
Mục nào API từ chối sẽ được báo "✖" và chạy tiếp; script thoát lỗi nếu có mục ✖.
"""
import argparse, json, os, subprocess, sys, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE = os.path.join(ROOT, "store")
API = "https://api.appstoreconnect.apple.com"
FAILED = []


def env_file(path):
    out = {}
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            out[k] = v.strip().strip('"')
    return out


IOS_ENV = env_file(os.path.join(ROOT, "1config/ios/app.env"))
STORE_ENV = env_file(os.path.join(STORE, "store.env"))
TOKEN = subprocess.run(["bash", "-c", f'source "{ROOT}/1config/appconnect/env.sh" && asc_token'],
                       capture_output=True, text=True, check=True).stdout.strip()


def call(method, path, body=None, ok_status=None):
    req = urllib.request.Request(API + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        if ok_status and e.code in ok_status:
            return None
        errs = json.loads(raw).get("errors", [{}]) if raw.startswith("{") else [{"detail": raw[:200]}]
        raise RuntimeError("; ".join(f'{x.get("status", e.code)} {x.get("detail") or x.get("title")}' for x in errs))


def step(label, fn):
    try:
        msg = fn()
        print(f"  ✔ {label}" + (f": {msg}" if msg else ""))
    except Exception as e:  # noqa: BLE001 – báo lỗi từng mục, chạy tiếp
        FAILED.append(label)
        print(f"  ✖ {label}: {e}")


def read(*parts):
    p = os.path.join(STORE, "ios", *parts)
    return open(p, encoding="utf-8").read().strip() if os.path.exists(p) else None


def rel(type_, id_):
    return {"data": {"type": type_, "id": id_}}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", default=os.environ.get("APP_VERSION", "1.0"))
    args = ap.parse_args()
    bundle = IOS_ENV["APP_ID"]
    apps = call("GET", f"/v1/apps?filter[bundleId]={bundle}")["data"]
    if not apps:
        sys.exit(f"Chưa có app record {bundle} trên App Store Connect")
    app_id = apps[0]["id"]
    locales = sorted(d for d in os.listdir(os.path.join(STORE, "ios")) if os.path.isdir(os.path.join(STORE, "ios", d)))
    print(f"App Store Connect: {apps[0]['attributes']['name']} ({bundle}, id {app_id}) – ngôn ngữ {locales}")

    # ---- App Information -----------------------------------------------------------------
    infos = call("GET", f"/v1/apps/{app_id}/appInfos")["data"]
    info = next((i for i in infos if i["attributes"].get("state") not in ("READY_FOR_DISTRIBUTION", "REPLACED_WITH_NEW_INFO")), infos[0])
    info_id = info["id"]

    def categories():
        rels = {"primaryCategory": rel("appCategories", STORE_ENV["IOS_PRIMARY_CATEGORY"])}
        if STORE_ENV.get("IOS_SECONDARY_CATEGORY"):
            rels["secondaryCategory"] = rel("appCategories", STORE_ENV["IOS_SECONDARY_CATEGORY"])
        call("PATCH", f"/v1/appInfos/{info_id}", {"data": {"type": "appInfos", "id": info_id, "relationships": rels}})
        return f'{STORE_ENV["IOS_PRIMARY_CATEGORY"]} / {STORE_ENV.get("IOS_SECONDARY_CATEGORY")}'
    step("Danh mục", categories)

    existing = {x["attributes"]["locale"]: x["id"] for x in call("GET", f"/v1/appInfos/{info_id}/appInfoLocalizations")["data"]}
    for loc in locales:
        def info_loc(loc=loc):
            attrs = {"name": read(loc, "name.txt"), "subtitle": read(loc, "subtitle.txt"),
                     "privacyPolicyUrl": read(loc, "privacy_url.txt")}
            if loc in existing:
                try:
                    call("PATCH", f"/v1/appInfoLocalizations/{existing[loc]}", {"data": {"type": "appInfoLocalizations", "id": existing[loc], "attributes": attrs}})
                except RuntimeError as e:  # tên có thể đã bị app khác dùng → giữ tên hiện tại
                    if "name" not in str(e).lower():
                        raise
                    attrs.pop("name")
                    call("PATCH", f"/v1/appInfoLocalizations/{existing[loc]}", {"data": {"type": "appInfoLocalizations", "id": existing[loc], "attributes": attrs}})
                    return "giữ tên hiện tại (tên mới bị từ chối)"
            else:
                attrs["locale"] = loc
                call("POST", "/v1/appInfoLocalizations", {"data": {"type": "appInfoLocalizations", "attributes": attrs, "relationships": {"appInfo": rel("appInfos", info_id)}}})
            return attrs.get("subtitle")
        step(f"App Information [{loc}]", info_loc)

    def content_rights():
        call("PATCH", f"/v1/apps/{app_id}", {"data": {"type": "apps", "id": app_id, "attributes": {"contentRightsDeclaration": "DOES_NOT_USE_THIRD_PARTY_CONTENT"}}})
    step("Khai báo bản quyền nội dung", content_rights)

    # Mức độ nội dung → NONE; câu hỏi có/không → False. Đây là KHAI BÁO CHÍNH SÁCH: sửa tại đây nếu app thay đổi.
    AGE_LEVELS = ["alcoholTobaccoOrDrugUseOrReferences", "contests", "gamblingSimulated", "gunsOrOtherWeapons",
                  "horrorOrFearThemes", "matureOrSuggestiveThemes", "medicalOrTreatmentInformation",
                  "profanityOrCrudeHumor", "sexualContentGraphicAndNudity", "sexualContentOrNudity",
                  "violenceCartoonOrFantasy", "violenceRealistic", "violenceRealisticProlongedGraphicOrSadistic"]
    AGE_BOOLS = ["advertising", "ageAssurance", "datingAndRelationships", "gambling", "healthOrWellnessTopics",
                 "lootBox", "messagingAndChat", "parentalControls", "sharedLocation", "socialMedia",
                 "socialMediaAgeRestricted", "unrestrictedWebAccess", "userGeneratedContent"]

    def age_rating():
        ar = call("GET", f"/v1/appInfos/{info_id}/ageRatingDeclaration")["data"]
        present = ar["attributes"].keys()
        attrs = {k: "NONE" for k in AGE_LEVELS if k in present}
        attrs.update({k: False for k in AGE_BOOLS if k in present})
        call("PATCH", f"/v1/ageRatingDeclarations/{ar['id']}", {"data": {"type": "ageRatingDeclarations", "id": ar["id"], "attributes": attrs}})
        unknown = sorted(set(present) - set(attrs) - {"kidsAgeBand", "ageRatingOverride", "ageRatingOverrideV2", "koreaAgeRatingOverride", "developerAgeRatingInfoUrl", "gracRatingClassificationNumber"})
        return f"{len(attrs)} câu hỏi = không" + (f"; câu hỏi mới chưa trả lời: {unknown}" if unknown else "")
    step("Xếp hạng độ tuổi", age_rating)

    # ---- Giá + quốc gia ------------------------------------------------------------------------
    def price_free():
        cur = call("GET", f"/v1/apps/{app_id}/appPriceSchedule", ok_status={404})
        points = call("GET", f"/v1/apps/{app_id}/appPricePoints?filter[territory]=USA&limit=200")["data"]
        free = next(p for p in points if float(p["attributes"]["customerPrice"]) == 0)
        call("POST", "/v1/appPriceSchedules", {
            "data": {"type": "appPriceSchedules", "relationships": {
                "app": rel("apps", app_id), "baseTerritory": rel("territories", "USA"),
                "manualPrices": {"data": [{"type": "appPrices", "id": "${free}"}]}}},
            "included": [{"type": "appPrices", "id": "${free}", "attributes": {"startDate": None},
                          "relationships": {"appPricePoint": rel("appPricePoints", free["id"])}}]})
        return "miễn phí" + (" (ghi đè lịch giá cũ)" if cur else "")
    step("Giá", price_free)

    def availability():
        terr = [t["id"] for t in call("GET", "/v1/territories?limit=200")["data"]]
        inc = [{"type": "territoryAvailabilities", "id": f"${{{t}}}", "attributes": {"available": True},
                "relationships": {"territory": rel("territories", t)}} for t in terr]
        call("POST", "/v2/appAvailabilities", {
            "data": {"type": "appAvailabilities", "attributes": {"availableInNewTerritories": True},
                     "relationships": {"app": rel("apps", app_id),
                                       "territoryAvailabilities": {"data": [{"type": "territoryAvailabilities", "id": x["id"]} for x in inc]}}},
            "included": inc}, ok_status={409})
        return f"{len(terr)} quốc gia"
    step("Quốc gia phát hành", availability)

    # ---- Phiên bản App Store đang soạn -------------------------------------------------------
    editable = ("PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED", "INVALID_BINARY")
    vers = call("GET", f"/v1/apps/{app_id}/appStoreVersions?filter[platform]=IOS&limit=50")["data"]
    ver = next((v for v in vers if v["attributes"]["appStoreState"] in editable), None)
    first_release = not any(v["attributes"]["appStoreState"] == "READY_FOR_SALE" for v in vers)
    if ver is None:
        ver = call("POST", "/v1/appStoreVersions", {"data": {"type": "appStoreVersions",
                   "attributes": {"platform": "IOS", "versionString": args.version},
                   "relationships": {"app": rel("apps", app_id)}}})["data"]
    ver_id = ver["id"]

    def version_attrs():
        attrs = {"copyright": STORE_ENV.get("COPYRIGHT"), "releaseType": "AFTER_APPROVAL"}
        if ver["attributes"]["versionString"] != args.version:
            attrs["versionString"] = args.version
        call("PATCH", f"/v1/appStoreVersions/{ver_id}", {"data": {"type": "appStoreVersions", "id": ver_id, "attributes": attrs}})
        return f"{args.version}, tự phát hành sau khi duyệt"
    step("Phiên bản App Store", version_attrs)

    vloc = {x["attributes"]["locale"]: x["id"] for x in call("GET", f"/v1/appStoreVersions/{ver_id}/appStoreVersionLocalizations")["data"]}
    for loc in locales:
        def version_loc(loc=loc):
            attrs = {"description": read(loc, "description.txt"), "keywords": read(loc, "keywords.txt"),
                     "marketingUrl": read(loc, "marketing_url.txt"), "promotionalText": read(loc, "promotional_text.txt"),
                     "supportUrl": read(loc, "support_url.txt")}
            if not first_release:  # bản đầu tiên không được có "What's New"
                attrs["whatsNew"] = read(loc, "release_notes.txt")
            if loc in vloc:
                call("PATCH", f"/v1/appStoreVersionLocalizations/{vloc[loc]}", {"data": {"type": "appStoreVersionLocalizations", "id": vloc[loc], "attributes": attrs}})
            else:
                attrs["locale"] = loc
                call("POST", "/v1/appStoreVersionLocalizations", {"data": {"type": "appStoreVersionLocalizations", "attributes": attrs, "relationships": {"appStoreVersion": rel("appStoreVersions", ver_id)}}})
        step(f"Mô tả phiên bản [{loc}]", version_loc)

    # ---- App Review ------------------------------------------------------------------------------
    review = {k: IOS_ENV.get(f"APP_REVIEW_{k}", "") for k in ("FIRST_NAME", "LAST_NAME", "PHONE", "EMAIL", "DEMO_USER", "DEMO_PASSWORD", "NOTES")}
    if any(not v or "<TODO" in v for k, v in review.items() if k != "NOTES"):
        print("  … Bỏ qua App Review: APP_REVIEW_* trong 1config/ios/app.env chưa điền đủ")
        FAILED.append("App Review (thiếu APP_REVIEW_*)")
    else:
        def review_details():
            attrs = {"contactFirstName": review["FIRST_NAME"], "contactLastName": review["LAST_NAME"],
                     "contactPhone": review["PHONE"], "contactEmail": review["EMAIL"],
                     "demoAccountName": review["DEMO_USER"], "demoAccountPassword": review["DEMO_PASSWORD"],
                     "demoAccountRequired": True, "notes": review["NOTES"] if "<TODO" not in review["NOTES"] else ""}
            cur = call("GET", f"/v1/appStoreVersions/{ver_id}/appStoreReviewDetail", ok_status={404})
            if cur and cur.get("data"):
                rid = cur["data"]["id"]
                call("PATCH", f"/v1/appStoreReviewDetails/{rid}", {"data": {"type": "appStoreReviewDetails", "id": rid, "attributes": attrs}})
            else:
                call("POST", "/v1/appStoreReviewDetails", {"data": {"type": "appStoreReviewDetails", "attributes": attrs, "relationships": {"appStoreVersion": rel("appStoreVersions", ver_id)}}})
            return f'{review["FIRST_NAME"]} {review["LAST_NAME"]}, demo {review["DEMO_USER"]}'
        step("App Review", review_details)

    # ---- TestFlight ------------------------------------------------------------------------------
    def internal_group():
        groups = call("GET", f"/v1/apps/{app_id}/betaGroups?limit=50")["data"]
        g = next((x for x in groups if x["attributes"]["name"] == "Omnibox Internal"), None)
        if g is None:
            g = call("POST", "/v1/betaGroups", {"data": {"type": "betaGroups", "attributes": {"name": "Omnibox Internal", "isInternalGroup": True, "hasAccessToAllBuilds": True},
                                                       "relationships": {"app": rel("apps", app_id)}}})["data"]
        return "nhóm nội bộ, nhận mọi build"
    step("TestFlight: nhóm Omnibox Internal", internal_group)

    def beta_info():
        cur = {x["attributes"]["locale"]: x["id"] for x in call("GET", f"/v1/apps/{app_id}/betaAppLocalizations")["data"]}
        for loc in locales:
            attrs = {"feedbackEmail": STORE_ENV["CONTACT_EMAIL"], "description": read(loc, "promotional_text.txt"),
                     "marketingUrl": read(loc, "marketing_url.txt"), "privacyPolicyUrl": read(loc, "privacy_url.txt")}
            if loc in cur:
                call("PATCH", f"/v1/betaAppLocalizations/{cur[loc]}", {"data": {"type": "betaAppLocalizations", "id": cur[loc], "attributes": attrs}})
            else:
                attrs["locale"] = loc
                call("POST", "/v1/betaAppLocalizations", {"data": {"type": "betaAppLocalizations", "attributes": attrs, "relationships": {"app": rel("apps", app_id)}}})
        return f'email phản hồi {STORE_ENV["CONTACT_EMAIL"]}'
    step("TestFlight: thông tin beta", beta_info)

    shots = os.path.join(STORE, "ios", "screenshots")
    if not (os.path.isdir(shots) and os.listdir(shots)):
        print("  … Chưa có screenshot (store/ios/screenshots/) – App Store bắt buộc trước khi nộp duyệt")
    print("Xong." if not FAILED else f"Còn {len(FAILED)} mục chưa xong: {FAILED}")
    return 1 if FAILED else 0


if __name__ == "__main__":
    sys.exit(main())
