import { Platform } from 'react-native';
import { gConst } from '../utils/gConst';
import gScreenSetting from '../utils/gScreenSetting'; 
import { getDataFromLocalStorage, saveDataToLocalStorage, setupAndroidSpeakerOff, setupAndroidSpeakerOn } from './gNativeAndroidModule';
import { getDataFromStorageIos, saveDataToStorageIos } from './gNativeIosModule';
import pushNotificationService from '../services/pushNotification';


export const handleWebViewMessage = (payload) => {
  try {
    const dataPayload = JSON.parse(payload.nativeEvent.data);
    console.log(gConst.REACT_NATIVE_LOCAL_PUSH)
    switch (dataPayload.type) {
      case gConst.REACT_NATIVE_ALERT:
        break;

      case gConst.REACT_NATIVE_LOCAL_PUSH:
        pushNotificationService.localNotification({
          channelId: 'Gcalls',
          title: dataPayload.title,
          message: dataPayload.message,
        });
        break;

      case gConst.MOBILE_INTEGRATOR:
        // Handle MOBILE_INTEGRATOR
        break;

      case gConst.SETUP_ANDROID_SPEAKER_ON:

        setupAndroidSpeakerOn();

        break;

      case gConst.SETUP_ANDROID_SPEAKER_OFF:
        setupAndroidSpeakerOff();
        break;

      case gConst.KEEP_APP_AWAKE:
        gScreenSetting.activeKeepAwake();
        break;

      case gConst.DEACTIVE_KEEP_APP_AWAKE:
        gScreenSetting.deactiveKeepAwake();
        break;

      case gConst.LOGIN:
             // for native android and ios
             if (dataPayload.key) {
                if(Platform.OS == gConst.ANDROID){
      
                  saveDataToLocalStorage(dataPayload.key, dataPayload.value)
                }
                if(Platform.OS == gConst.IOS){
      
                  saveDataToStorageIos(dataPayload.key, dataPayload.value)
                }
              }
        break;

      case gConst.SAVE_MOBILE_LOCAL_STORAGE:
        if (dataPayload.key) {
            if(Platform.OS == gConst.ANDROID){
  
              saveDataToLocalStorage(dataPayload.key, dataPayload.value)
            }
            if(Platform.OS == gConst.IOS){
  
              saveDataToStorageIos(dataPayload.key, dataPayload.value)
            }
          }
        break;

      case gConst.CONSOLE_LOG:
        console.log('LOG FROM WEBVIEW: ', dataPayload.value);
        break;

      default:
        break;
    }
  } catch (e) {
    console.log(e);
  }
};