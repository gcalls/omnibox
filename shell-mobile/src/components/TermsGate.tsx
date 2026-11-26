// Lần đầu mở app sau khi cài: bắt buộc đọc hết Điều khoản dịch vụ (cuộn tới cuối trang) rồi mới hiện nút
// "Đồng ý" – bấm một lần duy nhất (lưu vào bộ nhớ của app), sau đó vào callbox.gcalls.co.
// Trang: https://terms.gcalls.co/terms/terms-of-service (máy dùng tiếng Việt → bản /terms/vi/…).
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WebView from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getDataFromLocalStorage, saveDataToLocalStorage } from '../gModules/gNativeAndroidModule';
import { getDataFromStorageIos, saveDataToStorageIos } from '../gModules/gNativeIosModule';

// Đổi giá trị khi điều khoản thay đổi lớn và cần người dùng đồng ý lại
const TERMS_KEY = 'termsAcceptedVersion';
const TERMS_VERSION = '2026-11-25';
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

async function readAccepted(): Promise<string> {
  try {
    const v = Platform.OS === 'ios' ? await getDataFromStorageIos(TERMS_KEY) : await getDataFromLocalStorage(TERMS_KEY);
    return v || '';
  } catch (e) {
    return '';
  }
}

async function saveAccepted() {
  if (Platform.OS === 'ios') await saveDataToStorageIos(TERMS_KEY, TERMS_VERSION);
  else await saveDataToLocalStorage(TERMS_KEY, TERMS_VERSION);
}

export default function TermsGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'required' | 'accepted'>('checking');
  const [readToEnd, setReadToEnd] = useState(false);
  const [failed, setFailed] = useState(false);
  const webRef = useRef<any>(null);

  useEffect(() => {
    readAccepted().then(v => setState(v === TERMS_VERSION ? 'accepted' : 'required'));
  }, []);

  if (state === 'accepted') return <>{children}</>;
  if (state === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#673ab7" />
      </View>
    );
  }

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
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator color="#673ab7" />
          </View>
        )}
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
            onPress={async () => {
              await saveAccepted();
              setState('accepted');
            }}>
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
