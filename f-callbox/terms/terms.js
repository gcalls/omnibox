/*!
 * f-callbox terms – nhúng bộ điều khoản pháp lý vào bất kỳ trang/app nào bằng 1 thẻ script.
 *
 *   <div data-terms-doc="privacy-policy"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/gcalls/omnibox@main/f-callbox/terms/terms.js"
 *           data-app-name="My App" data-legal-name="My Co. Ltd." data-address="..."
 *           data-privacy-email="privacy@example.com"></script>
 *
 * Thông tin tổ chức được ghép theo thứ tự (sau ghi đè trước):
 *   1. org.json cạnh terms.js (hoặc URL trong data-org-url)
 *   2. window.TERMS_ORG = { ... } (nếu trang tự khai báo)
 *   3. thuộc tính data-* trên chính thẻ <script> (data-legal-name → legalName, …)
 * Phần tử có data-terms-doc="<tên>" được thay bằng docs/<tên>.html; phần tử có data-org="<khoá>"
 * được điền giá trị tương ứng; mọi {{khoá}} trong tài liệu được thay bằng giá trị (đã escape HTML).
 * Tài liệu có sẵn: privacy-policy, terms-of-service, acceptable-use-policy, messaging-terms,
 * call-recording-ai-notice, data-deletion, cookie-policy, eula.
 */
(function () {
  "use strict";
  var script = document.currentScript || document.querySelector('script[src*="terms.js"]');
  var base = script ? script.src.replace(/[^/?#]*([?#].*)?$/, "") : "";

  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function attrsConfig() {
    var out = {};
    if (!script) return out;
    Array.prototype.forEach.call(script.attributes, function (a) {
      if (a.name.indexOf("data-") === 0 && a.name !== "data-org-url") out[camel(a.name.slice(5))] = a.value;
    });
    return out;
  }
  function fill(html, org) {
    return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (m, k) {
      if (org[k] === undefined) return m;
      var v = esc(org[k]);
      return /TODO/.test(org[k]) ? '<mark class="terms-todo">' + v + "</mark>" : v;
    });
  }
  function getText(url) {
    return fetch(url, { credentials: "omit" }).then(function (r) {
      if (!r.ok) throw new Error(r.status + " " + url);
      return r.text();
    });
  }

  function render(org) {
    document.querySelectorAll("[data-org]").forEach(function (el) {
      var k = el.getAttribute("data-org");
      if (org[k] === undefined) return;
      el.textContent = org[k];
      if (el.tagName === "A" && /Email$/.test(k)) el.href = "mailto:" + org[k];
      if (el.tagName === "A" && k === "phone") el.href = "tel:" + org[k].replace(/\s/g, "");
      if (el.tagName === "A" && k === "website") el.href = org[k];
    });
    var docs = document.querySelectorAll("[data-terms-doc]");
    return Promise.all(Array.prototype.map.call(docs, function (el) {
      var name = el.getAttribute("data-terms-doc");
      if (el.getAttribute("data-terms-rendered")) { el.innerHTML = fill(el.innerHTML, org); return null; }
      return getText(base + "docs/" + name + ".html").then(function (html) {
        el.innerHTML = fill(html, org);
        el.setAttribute("data-terms-rendered", "1");
        el.classList.add("terms-doc");
      }).catch(function (e) { el.textContent = "Could not load " + name + " (" + e.message + ")"; });
    })).then(function () {
      var todo = Object.keys(org).filter(function (k) { return /TODO/.test(org[k]); });
      if (todo.length) console.warn("[terms] Missing organization fields:", todo.join(", "));
      document.dispatchEvent(new CustomEvent("terms:rendered", { detail: org }));
    });
  }

  var orgUrl = (script && script.getAttribute("data-org-url")) || base + "org.json";
  getText(orgUrl).then(JSON.parse).catch(function () { return {}; }).then(function (fileOrg) {
    var org = Object.assign({}, fileOrg, window.TERMS_ORG || {}, attrsConfig());
    window.TERMS_ORG_RESOLVED = org;
    var run = function () { render(org); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
  });
})();
