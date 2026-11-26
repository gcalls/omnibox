// Lần đầu mở app (sau màn cấp quyền): bắt buộc đọc hết Điều khoản dịch vụ (cuộn tới cuối trang) rồi mới hiện nút
// "Đồng ý" – bấm một lần duy nhất (Boot lưu cờ), sau đó vào callbox.gcalls.co. Điều phối: components/Boot.tsx.
// Trang: https://terms.gcalls.co/terms/terms-of-service (máy dùng tiếng Việt → bản /terms/vi/…).
import React, { useRef, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WebView from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Đổi giá trị khi điều khoản thay đổi lớn và cần người dùng đồng ý lại
export const TERMS_KEY = 'termsAcceptedVersion';
export const TERMS_VERSION = '2026-11-25';
const TERMS_HOST = 'https://terms.gcalls.co';

const vi = (() => {
  try {
    return /^vi/i.test(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch (e) {
    return false;
  }
})();
const TERMS_URL = `${TERMS_HOST}/terms/${vi ? 'vi/' : ''}terms-of-service`;
const T = vi
  ? { scroll: 'Vui lòng cuộn xuống đọc hết Điều khoản dịch vụ', agree: 'Đồng ý', error: 'Không tải được điều khoản. Kiểm tra kết nối mạng rồi thử lại.', retry: 'Thử lại' }
  : { scroll: 'Please scroll down to read the entire Terms of Service', agree: 'Agree', error: 'Could not load the terms. Check your connection and try again.', retry: 'Retry' };

// Báo về app khi đã cuộn tới cuối trang (hoặc trang ngắn không cần cuộn). Chừa 40px cho sai số làm tròn.
const DETECT_BOTTOM = `
(function () {
  var sent = false;
  function check() {
    if (sent) return;
    var doc = document.documentElement, body = document.body;
    var height = Math.max(body.scrollHeight, doc.scrollHeight);
    var bottom = (window.scrollY || doc.scrollTop) + window.innerHeight;
    if (height > 0 && bottom >= height - 40) {
      sent = true;
      window.ReactNativeWebView.postMessage('terms-read');
    }
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  setTimeout(check, 800);
})();
true;
`;

/** Màn Điều khoản dịch vụ (Boot hiển thị ở lần mở đầu tiên). onReady: trang đã tải xong / lỗi → Boot bỏ màn
 *  khởi động; onAccepted: người dùng bấm Đồng ý (Boot lưu cờ TERMS_KEY = TERMS_VERSION). */
export default function TermsScreen({ onReady, onAccepted }: { onReady: () => void; onAccepted: () => void }) {
  const [readToEnd, setReadToEnd] = useState(false);
  const [failed, setFailed] = useState(false);
  const webRef = useRef<any>(null);

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      {failed ? (
        <View style={styles.center}>
          <Text style={styles.error}>{T.error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setFailed(false);
              webRef.current?.reload();
            }}>
            <Text style={styles.buttonText}>{T.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <WebView
        ref={webRef}
        style={[styles.web, failed && styles.hidden]}
        source={{ uri: TERMS_URL }}
        injectedJavaScript={DETECT_BOTTOM}
        onMessage={e => e.nativeEvent.data === 'terms-read' && setReadToEnd(true)}
        onLoadEnd={onReady}
        onError={() => {
          setFailed(true);
          onReady();
        }}
        onHttpError={() => {
          setFailed(true);
          onReady();
        }}
        // iOS: tiến trình nội dung WebView bị hệ thống dừng (thiếu RAM / nền lâu) → tải lại, tránh màn trống
        onContentProcessDidTerminate={() => webRef.current?.reload()}
        onRenderProcessGone={() => setFailed(true)}
        // Chỉ xem trong trang điều khoản; link ra ngoài (email, gcalls.co…) mở bằng trình duyệt/ứng dụng của máy
        onShouldStartLoadWithRequest={req => {
          if (req.url.startsWith(TERMS_HOST) || req.url === 'about:blank') return true;
          Linking.openURL(req.url).catch(() => {});
          return false;
        }}
      />
      <View style={styles.footer}>
        {readToEnd ? (
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.button}
            onPress={onAccepted}>
            <Text style={styles.buttonText}>{T.agree}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hint}>↓ {T.scroll}</Text>
        )}
      </View>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  web: { flex: 1 },
  hidden: { height: 0, flex: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  footer: {
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e6e0f2',
    backgroundColor: '#f6f2fc',
    alignItems: 'center',
  },
  hint: { color: '#4527a0', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  button: { backgroundColor: '#673ab7', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 48, minWidth: 200, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { color: '#1f1b2e', fontSize: 15, textAlign: 'center', marginBottom: 16 },
});
