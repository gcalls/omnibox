// Quyền thiết bị Omnibox cần, kèm lý do hiển thị ở màn hình cấp quyền lần đầu (components/Boot.tsx).
// Mọi yêu cầu quyền đi qua requestWithOverlay(): trong lúc hộp thoại hệ thống hiện, app phủ lớp tím mờ có mũi tên
// chỉ vào nút cho phép (components/PermissionOverlay.tsx). Chỉ xin quyền app thật sự dùng.
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

export type PermissionKey = 'microphone' | 'notifications' | 'nearby';
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionItem {
  key: PermissionKey;
  icon: string;
  title: string;
  reason: string;
}

const vi = (() => {
  try {
    return /^vi/i.test(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch (e) {
    return false;
  }
})();

const TEXT: Record<PermissionKey, { icon: string; title: string; reason: string }> = vi
  ? {
      microphone: { icon: '🎙️', title: 'Micro', reason: 'Để bạn nói chuyện khi gọi và nghe máy qua tổng đài Gcalls.' },
      notifications: { icon: '🔔', title: 'Thông báo', reason: 'Để báo cuộc gọi đến, cuộc gọi nhỡ và tin nhắn ngay cả khi bạn không mở ứng dụng.' },
      nearby: { icon: '🎧', title: 'Thiết bị lân cận (Bluetooth)', reason: 'Để kết nối tai nghe Bluetooth trong cuộc gọi. Omnibox không dò tìm vị trí của bạn.' },
    }
  : {
      microphone: { icon: '🎙️', title: 'Microphone', reason: 'So you can talk on calls through the Gcalls call center.' },
      notifications: { icon: '🔔', title: 'Notifications', reason: 'To alert you about incoming calls, missed calls and messages even when the app is closed.' },
      nearby: { icon: '🎧', title: 'Nearby devices (Bluetooth)', reason: 'To use your Bluetooth headset during calls. Omnibox does not use your location.' },
    };

const { LocalStorageIosModule } = NativeModules;
const apiLevel = Platform.OS === 'android' ? Number(Platform.Version) : 0;

/** Quyền áp dụng cho nền tảng/phiên bản hệ điều hành hiện tại. */
function applicable(): PermissionKey[] {
  if (Platform.OS === 'ios') return ['microphone', 'notifications'];
  const keys: PermissionKey[] = ['microphone'];
  if (apiLevel >= 33) keys.push('notifications');
  if (apiLevel >= 31) keys.push('nearby');
  return keys;
}

const ANDROID_PERMISSION: Record<PermissionKey, string> = {
  microphone: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  notifications: PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  nearby: PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
};

export async function status(key: PermissionKey): Promise<PermissionStatus> {
  try {
    if (Platform.OS === 'android') {
      return (await PermissionsAndroid.check(ANDROID_PERMISSION[key] as any)) ? 'granted' : 'undetermined';
    }
    if (key === 'microphone') return await LocalStorageIosModule.microphonePermission();
    const s = (await notifee.getNotificationSettings()).authorizationStatus;
    if (s === AuthorizationStatus.AUTHORIZED || s === AuthorizationStatus.PROVISIONAL) return 'granted';
    return s === AuthorizationStatus.DENIED ? 'denied' : 'undetermined';
  } catch (e) {
    return 'undetermined';
  }
}

/** Quyền còn thiếu và còn hỏi được (iOS: đã từ chối thì hệ thống không hỏi lại – bỏ qua). */
export async function missing(): Promise<PermissionItem[]> {
  const out: PermissionItem[] = [];
  for (const key of applicable()) {
    if ((await status(key)) !== 'granted' && !(Platform.OS === 'ios' && (await status(key)) === 'denied')) {
      out.push({ key, ...TEXT[key] });
    }
  }
  return out;
}

// ---- Lớp phủ khi hộp thoại hệ thống hiện -------------------------------------------------------
type Listener = (visible: boolean) => void;
const listeners = new Set<Listener>();
export function onOverlayChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function setOverlay(v: boolean) {
  listeners.forEach(fn => fn(v));
}

/** Chạy một yêu cầu quyền, hiện lớp phủ tím + mũi tên trong lúc hộp thoại hệ thống mở. */
export async function requestWithOverlay<T>(fn: () => Promise<T>): Promise<T> {
  setOverlay(true);
  try {
    return await fn();
  } finally {
    setOverlay(false);
  }
}

async function requestOne(key: PermissionKey): Promise<PermissionStatus> {
  if (Platform.OS === 'android') {
    const r = await PermissionsAndroid.request(ANDROID_PERMISSION[key] as any);
    return r === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
  }
  if (key === 'microphone') return await LocalStorageIosModule.requestMicrophone();
  const s = (await notifee.requestPermission()).authorizationStatus;
  return s === AuthorizationStatus.AUTHORIZED || s === AuthorizationStatus.PROVISIONAL ? 'granted' : 'denied';
}

/** Xin lần lượt từng quyền (không chồng hộp thoại), mỗi quyền có lớp phủ. Lỗi một quyền không chặn quyền sau. */
export async function requestAll(items: PermissionItem[], onEach?: (key: PermissionKey, s: PermissionStatus) => void) {
  for (const it of items) {
    let s: PermissionStatus = 'denied';
    try {
      s = await requestWithOverlay(() => requestOne(it.key));
    } catch (e) {
      // bỏ qua, xin quyền tiếp theo
    }
    onEach?.(it.key, s);
  }
}
