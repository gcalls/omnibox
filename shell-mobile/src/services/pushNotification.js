import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { Alert } from "react-native";
import PushNotification from "react-native-push-notification";

//FCM WORK
const PushNotificationService = {
  configure: () => {
    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token) {
        // Alert.alert("TOKEN: " + JSON.stringify(token));
        console.log(token)
        // do save token
      },

      // (required) Called when a remote is received or opened, or local notification is opened
      onNotification: function (notification) {
        // Alert.alert("NOTIFICATION:", JSON.stringify(notification));

        // process the notification

        // (required) Called when a remote is received or opened, or local notification is opened
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },

      // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
      onAction: function (notification) {
        Alert.alert("ACTION:", notification.action);
        Alert.alert("NOTIFICATION:", notification);

        // process the action
      },

      // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
      onRegistrationError: function (err) {
        console.error(err.message, err);
      },

      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      // default: true
      popInitialNotification: true,

      /**
       * (optional) default: true
       * - Specified if permissions (ios) and token (android and ios) will requested or not,
       * - if not, you must call PushNotificationsHandler.requestPermissions() later
       * - if you are not using remote notification or do not have Firebase installed, use this:
       *     requestPermissions: Platform.OS === 'ios'
       */
      requestPermissions: true,
    });
  },
  createLocalNotiChannel(pObj){
    PushNotification.createChannel(
        {
          channelId: pObj.channelId, // (required)
          channelName: pObj.channelName, // (required)
          channelDescription: pObj.channelDescription, // (optional) default: undefined.
          importance: 4, // (optional) default: 4. Int value of the Android notification importance
          vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
        },
        (created) => console.log(`createChannel returned '${created}'`) // (optional) callback returns whether the channel was created, false means it already existed.
      );
  },

  localNotification(pObj){
    
    PushNotification.localNotification({
        channelId: pObj.channelId, 
        title: pObj.title,
        message: pObj.message,
        // userInfo: pObj.userInfo

      },(result) => console.log(`${result}`));

    // PushNotification.addEventListener("localNotification", (notification) => {
    //     Alert.alert(notification)
    // })


  },
  localNotificationSchedule(){

  },
};

const pushNotificationService = PushNotificationService;
export default pushNotificationService;
