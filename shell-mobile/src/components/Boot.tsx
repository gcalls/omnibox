// Điều phối khởi động app (UAT-01, UAT-02). Thứ tự:
//   1. Màn khởi động (nền tím, logo, phiên bản) – giữ cho tới khi màn kế tiếp SẴN SÀNG (trang đã tải xong)
//   2. Màn cấp quyền – chỉ lần đầu, giải thích lý do từng quyền rồi mới xin (UAT-02)
//   3. Điều khoản dịch vụ (terms.gcalls.co) – chỉ lần đầu, phải cuộn hết mới Đồng ý
//   4. Màn chính callbox.gcalls.co
// Màn 3 và 4 được dựng NGẦM dưới màn khởi động; màn khởi động chỉ tắt khi trang báo onReady (hoặc quá thời gian
// chờ) → không còn màn đen/trắng hay "nháy" khi mở app hoặc mở lại từ đa nhiệm.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import App from '../App';
import TermsScreen, { TERMS_KEY, TERMS_VERSION } from './TermsScreen';
import PermissionOverlay from './PermissionOverlay';
import { missing, requestAll, PermissionItem } from '../services/permissions';
import { getItem, setItem } from '../services/storage';
import { formatVersion, getAppInfo } from '../services/appUpdate';

const PERMS_KEY = 'permissionsOnboarded';
const MIN_SPLASH_MS = 700; // tránh nháy khi mọi thứ có sẵn
const READY_TIMEOUT_MS = 20000; // trang chưa tải xong sau 20s → vẫn hiện (trang tự báo lỗi / thử lại)

const vi = (() => {
  try {
    return /^vi/i.test(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch (e) {
    return false;
  }
})();
const T = vi
  ? {
      starting: 'Đang khởi động…',
      loadingTerms: 'Đang tải Điều khoản dịch vụ…',
      loadingMain: 'Đang kết nối tổng đài…',
      permTitle: 'Omnibox cần một vài quyền',
      permIntro: 'Để gọi điện qua tổng đài Gcalls ổn định, Omnibox sẽ xin các quyền dưới đây. Bạn có thể thay đổi bất cứ lúc nào trong Cài đặt.',
      permContinue: 'Tiếp tục',
    }
  : {
      starting: 'Starting…',
      loadingTerms: 'Loading Terms of Service…',
      loadingMain: 'Connecting to the call center…',
      permTitle: 'Omnibox needs a few permissions',
      permIntro: 'To make calls reliably through the Gcalls call center, Omnibox will ask for the permissions below. You can change them any time in Settings.',
      permContinue: 'Continue',
    };

type Stage = 'splash' | 'permissions' | 'terms' | 'main';

function Splash({ status, version }: { status: string; version: string }) {
  return (
    <View style={styles.splash}>
      <Image source={require('../assets/omnibox-logo.png')} style={styles.logo} />
      <Text style={styles.brand}>Omnibox</Text>
      <ActivityIndicator color="#fff" style={styles.spinner} />
      <Text style={styles.status}>{status}</Text>
      {version ? <Text style={styles.version}>{version}</Text> : null}
    </View>
  );
}

function PermissionScreen({ items, onDone }: { items: PermissionItem[]; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <SafeAreaView style={styles.permWrap}>
      <ScrollView contentContainerStyle={styles.permBody}>
        <Image source={require('../assets/omnibox-logo.png')} style={styles.permLogo} />
        <Text style={styles.permTitle}>{T.permTitle}</Text>
        <Text style={styles.permIntro}>{T.permIntro}</Text>
        {items.map(it => (
          <View key={it.key} style={styles.permItem}>
            <Text style={styles.permIcon}>{it.icon}</Text>
            <View style={styles.permText}>
              <Text style={styles.permName}>{it.title}</Text>
              <Text style={styles.permReason}>{it.reason}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.permFooter}>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={busy}
          style={[styles.button, busy && styles.buttonBusy]}
          onPress={async () => {
            setBusy(true);
            await requestAll(items);
            onDone();
          }}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{T.permContinue}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function Boot() {
  const [stage, setStage] = useState<Stage>('splash');
  const [splash, setSplash] = useState(true);
  const [status, setStatus] = useState(T.starting);
  const [version, setVersion] = useState('');
  const [perms, setPerms] = useState<PermissionItem[]>([]);
  const termsAccepted = useRef(false);
  const fade = useRef(new Animated.Value(1)).current;
  const readyTimer = useRef<any>(null);

  // Ẩn màn khởi động (mờ dần) khi màn hiện tại đã sẵn sàng
  const ready = useCallback(() => {
    clearTimeout(readyTimer.current);
    Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setSplash(false));
  }, [fade]);

  // Hiện lại màn khởi động trong lúc màn kế tiếp tải ngầm; quá READY_TIMEOUT_MS thì vẫn hiện màn đó
  const showSplashUntilReady = useCallback(
    (text: string) => {
      fade.setValue(1);
      setSplash(true);
      setStatus(text);
      clearTimeout(readyTimer.current);
      readyTimer.current = setTimeout(ready, READY_TIMEOUT_MS);
    },
    [fade, ready],
  );

  const goTerms = useCallback(() => {
    if (termsAccepted.current) {
      showSplashUntilReady(T.loadingMain);
      setStage('main');
    } else {
      showSplashUntilReady(T.loadingTerms);
      setStage('terms');
    }
  }, [showSplashUntilReady]);

  useEffect(() => {
    (async () => {
      const started = Date.now();
      const [info, onboarded, terms] = await Promise.all([getAppInfo(), getItem(PERMS_KEY), getItem(TERMS_KEY)]);
      setVersion(formatVersion(info));
      termsAccepted.current = terms === TERMS_VERSION;
      const need = onboarded ? [] : await missing();
      await new Promise<void>(r => setTimeout(() => r(), Math.max(0, MIN_SPLASH_MS - (Date.now() - started))));
      if (need.length) {
        setPerms(need);
        setStage('permissions');
        ready();
      } else {
        if (!onboarded) setItem(PERMS_KEY, '1');
        goTerms();
      }
    })();
    return () => clearTimeout(readyTimer.current);
  }, [goTerms, ready]);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {stage === 'permissions' ? (
          <PermissionScreen
            items={perms}
            onDone={() => {
              setItem(PERMS_KEY, '1');
              goTerms();
            }}
          />
        ) : null}
        {stage === 'terms' ? (
          <TermsScreen
            onReady={ready}
            onAccepted={async () => {
              await setItem(TERMS_KEY, TERMS_VERSION);
              termsAccepted.current = true;
              showSplashUntilReady(T.loadingMain);
              setStage('main');
            }}
          />
        ) : null}
        {stage === 'main' ? <App onReady={ready} /> : null}
        {splash ? (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
            <Splash status={status} version={version} />
          </Animated.View>
        ) : null}
        <PermissionOverlay />
      </View>
    </SafeAreaProvider>
  );
}

const PURPLE = '#673ab7';
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PURPLE },
  splash: { flex: 1, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 112, height: 112, borderRadius: 26 },
  brand: { color: '#fff', fontSize: 30, fontWeight: '700', marginTop: 16, letterSpacing: 0.3 },
  spinner: { marginTop: 28 },
  status: { color: '#ede7f6', fontSize: 15, marginTop: 12, textAlign: 'center' },
  version: { position: 'absolute', bottom: 28, color: '#d1c4e9', fontSize: 12 },
  permWrap: { flex: 1, backgroundColor: '#fff' },
  permBody: { padding: 24, paddingTop: 32 },
  permLogo: { width: 64, height: 64, borderRadius: 16, alignSelf: 'center' },
  permTitle: { fontSize: 22, fontWeight: '700', color: '#1f1b2e', textAlign: 'center', marginTop: 16 },
  permIntro: { fontSize: 15, color: '#615b73', textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 21 },
  permItem: { flexDirection: 'row', padding: 14, marginBottom: 12, borderRadius: 14, backgroundColor: '#f6f2fc', borderWidth: 1, borderColor: '#e6e0f2' },
  permIcon: { fontSize: 26, marginRight: 14 },
  permText: { flex: 1 },
  permName: { fontSize: 16, fontWeight: '700', color: '#4527a0' },
  permReason: { fontSize: 14, color: '#1f1b2e', marginTop: 4, lineHeight: 20 },
  permFooter: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e6e0f2' },
  button: { backgroundColor: PURPLE, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
