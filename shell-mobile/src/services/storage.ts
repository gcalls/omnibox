// Lưu cặp key/value nhỏ (cờ đã đồng ý điều khoản, đã qua màn cấp quyền…) bằng module native sẵn có:
// Android SharedPreferences (LocalStorageModule), iOS NSUserDefaults (LocalStorageIosModule).
import { Platform } from 'react-native';
import { getDataFromLocalStorage, saveDataToLocalStorage } from '../gModules/gNativeAndroidModule';
import { getDataFromStorageIos, saveDataToStorageIos } from '../gModules/gNativeIosModule';

export async function getItem(key: string): Promise<string> {
  try {
    const v = Platform.OS === 'ios' ? await getDataFromStorageIos(key) : await getDataFromLocalStorage(key);
    return v || '';
  } catch (e) {
    return '';
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'ios') await saveDataToStorageIos(key, value);
    else await saveDataToLocalStorage(key, value);
  } catch (e) {
    // không chặn luồng khởi động nếu lưu lỗi
  }
}
