
import { PermissionsAndroid} from 'react-native';


export const requestPhoneCallPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CALL_PHONE,
            {
                title: 'Phone Call Permission',
                message:
                    'Enable Phone Call Permission ',
                // buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('can use CALL_PHONE permisstion')
        } else {
            console.log('cant use CALL_PHONE permisstion')
        }
    } catch (err) {
        console.warn(err);
    }
};




export const requestReadCallLogPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
            {
                title: 'Read Call LOg Permission',
                message:
                    'Enable Read Call Log permission ',
                // buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('can use READ_CALL_LOG permisstion')
        } else {
            console.log('cant use READ_CALL_LOG permisstion')
        }
    } catch (err) {
        console.warn(err);
    }
};


export const requestWriteCallLogPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_CALL_LOG,
            {
                title: 'Write Call LOg Permission',
                message:
                    'Enable Write Call Log permission ',
                // buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('can use WRITE_CALL_LOG permisstion')
        } else {
            console.log('cant use WRITE_CALL_LOG permisstion')
        }
    } catch (err) {
        console.warn(err);
    }
};


export const requestUseSipPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.USE_SIP,
            {
                title: 'USE_SIPPermission',
                message:
                    'Enable USE_SIP permission ',
                // buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('can use USE_SIP permisstion')

        } else {
            console.log('cant use USE_SIP permisstion')

        }
    } catch (err) {
        console.warn(err);
    }
};


export const requestOutGoingCallPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS,
            {
                title: 'PROCESS_OUTGOING_CALLS permission',
                message:
                    'Enable PROCESS_OUTGOING_CALLS permission ',
                // buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('can use PROCESS_OUTGOING_CALLS permisstion')
            return true
        } else {
            console.log('cant use PROCESS_OUTGOING_CALLS permisstion')
            return false
        }
    } catch (err) {
        console.warn(err);
    }
    return false
};


export const requestSendSMSPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.SEND_SMS,
            {
                title: 'SEND_SMS permission',
                message:
                    'Enable SEND_SMS permission ',
                // buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('can use SEND_SMS permisstion')
        } else {
            console.log('cant use SEND_SMS permisstion')
        }
    } catch (err) {
        console.warn(err);
    }
};


export const requestReceiveSMSPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.SEND_SMS,
            {
                title: 'RECEIVE_SMS permission',
                message:
                    'Enable RECEIVE_SMS permission ',
                // buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('can use RECEIVE_SMS permisstion')
        } else {
            console.log('cant use RECEIVE_SMS permisstion')
        }
    } catch (err) {
        console.warn(err);
    }
};


export const requestAnswerPhoneCallPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
            {
                title: 'ANSWER_PHONE_CALLS permission',
                message:
                    'Enable ANSWER_PHONE_CALLS permission ',
                // buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('can use ANSWER_PHONE_CALLS permisstion')
        } else {
            console.log('cant use ANSWER_PHONE_CALLS permisstion')
        }
    } catch (err) {
        console.warn(err);
    }
};


export const requestReadPhoneNumberPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
            {
                title: 'READ_PHONE_NUMBERS permission',
                message:
                    'Enable READ_PHONE_NUMBERS permission ',
                // buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('can use ANSWER_PHONE_CALLS permisstion')
        } else {
            console.log('cant use ANSWER_PHONE_CALLS permisstion')
        }
    } catch (err) {
        console.warn(err);
    }
};


export const requestPostNotificationPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
                title: 'POST_NOTIFICATIONS permission',
                message:
                    'Enable POST_NOTIFICATIONS permission ',
                // buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('can use post notofication permisstion')
        } else {
            console.log('cant use post notofication permisstion')
        }
    } catch (err) {
        console.warn(err);
    }
};




export const requestCameraPermission = async () => {

    let granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
            title: "Camera Permission",
            message:
                "App needs access to your camera " +
                "so others can see you.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
        }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the camera");
    } else {
        console.log("Camera permission denied");
    }
}



export const requestAudioRecordPermission = async () => {
    let granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
            title: "Audio Permission",
            message:
                "App needs access to your audio / microphone",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
        }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the Microphone");
    } else {
        console.log("Microphone permission denied");
    }
}


export const requestModifyAudioSettingPermission = async () => {
    let granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
            title: "modifyAudioSetting Permission",
            message:
                "App needs access to your audio / microphone",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
        }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the Audio");
    } else {
        console.log("Microphone permission denied");
    }
}