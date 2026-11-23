// Thông báo local (không dùng push từ server) – @notifee/react-native
// Thay cho react-native-push-notification (ngừng phát triển từ 2022).
import notifee, {AndroidImportance} from '@notifee/react-native';

const PushNotificationService = {
  // Xin quyền hiện thông báo (Android 13+: POST_NOTIFICATIONS, iOS: alert/badge/sound)
  configure: () => {
    notifee.requestPermission().catch(err => console.error(err?.message, err));
  },
  createLocalNotiChannel(pObj) {
    notifee
      .createChannel({
        id: pObj.channelId,
        name: pObj.channelName,
        description: pObj.channelDescription,
        importance: AndroidImportance.HIGH,
        vibration: true,
      })
      .then(id => console.log(`createChannel '${id}'`))
      .catch(err => console.error(err?.message, err));
  },
  localNotification(pObj) {
    notifee
      .displayNotification({
        title: pObj.title,
        body: pObj.message,
        android: {channelId: pObj.channelId, pressAction: {id: 'default'}},
      })
      .catch(err => console.error(err?.message, err));
  },
  localNotificationSchedule() {},
};

export default PushNotificationService;
