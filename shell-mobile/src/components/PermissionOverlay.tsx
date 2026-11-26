// Lớp phủ tím mờ + mũi tên ngoằn ngoèo chỉ vào nút cho phép, hiện mỗi khi hộp thoại xin quyền của hệ thống mở
// (services/permissions.ts → requestWithOverlay). Hộp thoại hệ thống luôn nằm trên app, nên mũi tên đặt ngay dưới
// vị trí nút cho phép:
//   iOS     – hộp thoại giữa màn hình, nút "Cho phép"/"OK" ở nửa phải đáy hộp thoại → mũi tên từ góc dưới phải lên.
//   Android – các nút xếp dọc, nút cho phép ở trên → mũi tên từ giữa đáy màn hình đi lên.
import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { onOverlayChange } from '../services/permissions';

const vi = (() => {
  try {
    return /^vi/i.test(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch (e) {
    return false;
  }
})();
const HINT = vi ? 'Bấm “Cho phép” để Omnibox hoạt động đầy đủ' : 'Tap “Allow” so Omnibox works fully';

export default function PermissionOverlay() {
  const [visible, setVisible] = useState(false);
  useEffect(() => onOverlayChange(setVisible), []);
  if (!visible) return null;
  const ios = Platform.OS === 'ios';
  return (
    <View pointerEvents="none" style={styles.fill}>
      <Image source={require('../assets/permission-arrow.png')} style={[styles.arrow, ios ? styles.arrowIos : styles.arrowAndroid]} resizeMode="contain" />
      <Text style={[styles.hint, ios ? styles.hintIos : styles.hintAndroid]}>{HINT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(103, 58, 183, 0.62)', zIndex: 1000, elevation: 1000 },
  arrow: { position: 'absolute', width: 96, height: 208 },
  // đầu mũi tên ~ ngay dưới nút cho phép
  arrowIos: { right: '14%', top: '60%', transform: [{ rotate: '-28deg' }] },
  arrowAndroid: { left: '50%', marginLeft: -48, top: '64%' },
  hint: { position: 'absolute', color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: 24, left: 0, right: 0 },
  hintIos: { bottom: '5%' },
  hintAndroid: { bottom: '5%' },
});
