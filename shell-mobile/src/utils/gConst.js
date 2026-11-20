

const REACT_NATIVE = {
    REACT_NATIVE_ALERT : 'reactNativeAlert',
    REACT_NATIVE_LOCAL_PUSH : 'reactNativeLocalPush'
}

const COMMON = {
    LOGIN : 'LOGIN',
    KEEP_APP_AWAKE : 'KEEP_APP_AWAKE',
    DEACTIVE_KEEP_APP_AWAKE: 'DEACTIVE_KEEP_APP_AWAKE',
    SAVE_MOBILE_LOCAL_STORAGE : 'SAVE_MOBILE_LOCAL_STORAGE',
    GET_MOBILE_LOCAL_STORAGE : 'GET_MOBILE_LOCAL_STORAGE',
    CONSOLE_LOG : 'CONSOLE_LOG', // to get console log from webview ( if you want to debug )
    DEEPLINK_SCHEMA : 'gcalls://',
    PHONE_NUMBER : 'phoneNumber'
}


const ANDROID = {
    SETUP_ANDROID_SPEAKER_ON : 'SETUP_ANDROID_SPEAKER_ON',
    SETUP_ANDROID_SPEAKER_OFF : 'SETUP_ANDROID_SPEAKER_OFF',
    HARDWARE_BACK_PRESS : 'hardwareBackPress'
    
}


const PLATFORM = {
    ANDROID : 'android',
    IOS : 'ios'
}



// Integration type
const INTEGRATION_TYPE = {
    HUBSPOT : "hubspot",
    SALESFORCE : "salesforce",
    NHANH_V1 : "nhanhv1",
    DEFAULT : "default",
    MOBILE_INTEGRATOR : 'MOBILE_INTEGRATOR'

}


export const gConst = {
    
    ...REACT_NATIVE,
    ...INTEGRATION_TYPE,
    ...COMMON,
    ...ANDROID,
    ...PLATFORM
}
