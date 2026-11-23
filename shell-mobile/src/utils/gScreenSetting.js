// Giữ màn hình sáng trong cuộc gọi – @sayem314/react-native-keep-awake
// (thay cho react-native-keep-awake, ngừng phát triển từ 2022)
import {activateKeepAwake, deactivateKeepAwake} from '@sayem314/react-native-keep-awake';

const gScreenSetting = {
  activeKeepAwake() {
    activateKeepAwake();
  },
  deactiveKeepAwake() {
    deactivateKeepAwake();
  },
};

export default gScreenSetting;
