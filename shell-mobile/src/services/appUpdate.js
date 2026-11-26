// Phiên bản đang cài + yêu cầu cập nhật khi store có bản mới hơn (không dùng Firebase/Google Cloud).
//
// Chính sách: bản mới đổi major hoặc minor (1.0.x → 1.1.0, 2.0.0) → BẮT BUỘC cập nhật;
//             chỉ đổi patch (1.0.1 → 1.0.2) → nhắc, cho phép bỏ qua (nhắc lại ở lần mở app sau).
//
// Android: Google Play In-App Updates (AppUpdateModule). Play chỉ trả versionCode của bản mới, nên CI đặt
//   versionCode = major*10000000 + minor*100000 + patch*1000 + (số build % 1000)   (minor, patch < 100)
//   (xem .github/workflows/shell-mobile.yml) để giải mã ngược ra major/minor.
// iOS: so với phiên bản trên App Store (iTunes Lookup API), mở trang App Store để cập nhật.
import { Alert, Linking, NativeModules, Platform } from 'react-native';

const { AppUpdateModule, LocalStorageIosModule } = NativeModules;
const CODE_SCHEME_MIN = 10000000;

let cachedInfo = null;
let alertOpen = false;
let optionalShown = false; // nhắc bản patch tối đa 1 lần mỗi lần mở app

const vi = (() => {
  try {
    return /^vi/i.test(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch (e) {
    return false;
  }
})();
const T = vi
  ? {
      title: 'Có phiên bản mới',
      required: v => `Omnibox ${v} đã có trên App Store. Vui lòng cập nhật để tiếp tục sử dụng.`,
      optional: v => `Omnibox ${v} đã có trên App Store. Bạn có muốn cập nhật ngay?`,
      update: 'Cập nhật',
      later: 'Để sau',
    }
  : {
      title: 'Update available',
      required: v => `Omnibox ${v} is available on the App Store. Please update to continue.`,
      optional: v => `Omnibox ${v} is available on the App Store. Update now?`,
      update: 'Update',
      later: 'Later',
    };

function parse(v) {
  const [major = 0, minor = 0, patch = 0] = String(v || '')
    .split('.')
    .map(n => parseInt(n, 10) || 0);
  return { major, minor, patch };
}
function cmp(a, b) {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}
function isMandatory(store, current) {
  return store.major > current.major || (store.major === current.major && store.minor > current.minor);
}
function decodeVersionCode(code) {
  return {
    major: Math.floor(code / 10000000),
    minor: Math.floor(code / 100000) % 100,
    patch: Math.floor(code / 1000) % 100,
  };
}

/** {version, build, bundleId} – build: số build CI (iOS CFBundleVersion, Android versionCode % 1000). */
export async function getAppInfo() {
  if (cachedInfo) return cachedInfo;
  try {
    if (Platform.OS === 'android') {
      const i = await AppUpdateModule.getAppInfo();
      const code = Number(i.versionCode);
      cachedInfo = { version: i.version, build: String(code >= CODE_SCHEME_MIN ? code % 1000 : code), bundleId: i.bundleId };
    } else {
      cachedInfo = await LocalStorageIosModule.getAppInfo();
    }
  } catch (e) {
    cachedInfo = { version: '', build: '', bundleId: '' };
  }
  return cachedInfo;
}

export function formatVersion(info) {
  return info && info.version ? `Omnibox ${info.version} (${info.build})` : '';
}

async function checkAndroid(current) {
  const u = await AppUpdateModule.checkUpdate();
  if (!u) return; // không cài từ Google Play hoặc không hỏi được Play
  if (u.inProgress) {
    await AppUpdateModule.startUpdate(true); // bản bắt buộc đang cập nhật dở → mở lại màn hình cập nhật
    return;
  }
  if (!u.available) return;
  const code = Number(u.availableVersionCode);
  const mandatory = code >= CODE_SCHEME_MIN && isMandatory(decodeVersionCode(code), current);
  if (mandatory && u.immediateAllowed) {
    await AppUpdateModule.startUpdate(true);
  } else if (u.flexibleAllowed && !optionalShown) {
    optionalShown = true;
    await AppUpdateModule.startUpdate(false); // hộp thoại của Google Play, người dùng có thể từ chối
  }
}

async function lookupAppStore(bundleId) {
  for (const country of ['vn', '']) {
    try {
      const q = `bundleId=${encodeURIComponent(bundleId)}${country ? `&country=${country}` : ''}&t=${Date.now()}`;
      const r = await fetch(`https://itunes.apple.com/lookup?${q}`, { headers: { 'Cache-Control': 'no-cache' } });
      const app = (await r.json())?.results?.[0];
      if (app?.version) return app;
    } catch (e) {
      // thử quốc gia khác / bỏ qua khi mất mạng
    }
  }
  return null;
}

async function checkIos(info, current) {
  const app = await lookupAppStore(info.bundleId);
  if (!app) return;
  const store = parse(app.version);
  if (cmp(store, current) <= 0) return;
  const mandatory = isMandatory(store, current);
  if (!mandatory && optionalShown) return;
  optionalShown = optionalShown || !mandatory;
  const url = app.trackId ? `itms-apps://apps.apple.com/app/id${app.trackId}` : app.trackViewUrl;
  const open = () => {
    alertOpen = false;
    Linking.openURL(url).catch(() => app.trackViewUrl && Linking.openURL(app.trackViewUrl));
  };
  alertOpen = true;
  Alert.alert(
    T.title,
    mandatory ? T.required(app.version) : T.optional(app.version),
    mandatory
      ? [{ text: T.update, onPress: open }]
      : [{ text: T.later, style: 'cancel', onPress: () => (alertOpen = false) }, { text: T.update, onPress: open }],
    { cancelable: !mandatory, onDismiss: () => (alertOpen = false) },
  );
}

/** Gọi khi khởi động và mỗi khi app quay lại foreground (bản bắt buộc sẽ hiện lại cho tới khi cập nhật). */
export async function checkForUpdate() {
  if (alertOpen) return;
  try {
    const info = await getAppInfo();
    if (!info.version) return;
    const current = parse(info.version);
    if (Platform.OS === 'android') await checkAndroid(current);
    else await checkIos(info, current);
  } catch (e) {
    console.warn('[appUpdate]', e?.message || e);
  }
}
