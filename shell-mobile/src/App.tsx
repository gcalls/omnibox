import React, { useEffect, useRef, useState } from 'react';
import { Button, Linking } from 'react-native';
import { NativeEventEmitter, NativeModules,  } from 'react-native';
import { View, TouchableOpacity, PanResponder, AppState } from 'react-native';
import { SafeAreaView } from 'react-native';



const { UserActivityModule } = NativeModules;

// Gcalls IOS
const eventEmitter = new NativeEventEmitter(UserActivityModule);

import {
  StyleSheet,
  Platform,
  BackHandler,
  Alert,
} from 'react-native';


import Spinner from 'react-native-loading-spinner-overlay/lib';
import WebView from 'react-native-webview';
import Contact from './components/contact';
import { requestAudioRecordPermission } from './gModules/gAndroidPermission';
import { gConst } from './utils/gConst';
import pushNotificationService from './services/pushNotification';
import { getDataFromLocalStorage, saveDataToLocalStorage, setupAndroidSpeakerOff, setupAndroidSpeakerOn } from './gModules/gNativeAndroidModule';
import { getDataFromStorageIos, saveDataToStorageIos } from './gModules/gNativeIosModule';
import GestureRecognizer from 'react-native-swipe-gestures';
import gScreenSetting from './utils/gScreenSetting';
import { handleWebViewMessage } from './gModules/gWebViewMessage';
import AppStateModule from './gModules/gAppStateModule';
import {BASE_URL} from '@env'


function App(): JSX.Element {

  const [isVisible, setVisible] = useState(false)


  const [uri, setUri] = useState(BASE_URL)


  const [phoneNumber, setPhoneNumber] = useState('')
  const [contacts, setContacts] = useState([])
  const [vietNamesePhoneLst, setVietNamesePhoneLst] = useState(['032', '033', '034', '035', '036', '037', '038', '039', '070', '079', '077', '076', '078', '083', '084', '085', '081', '082', '059'])


  const webViewRef: any = useRef();

  const customHeaders = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Android SDK built for x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.185 Mobile Safari/537.36',
  };

  const appState = useRef(AppState.currentState);
  const setAppStateVisible = useState(appState.current)[1];

  useEffect(() => {
    const cleanupFunction = AppStateModule(appState, setAppStateVisible, webViewRef);

    return () => {
      cleanupFunction();
    };
  }, [appState, setAppStateVisible, webViewRef]);
  // -----------------------------------------------------------------------------------

  useEffect(() => {

    initPhoneNumber();
    pushNotificationService.configure();

    let channelObj = {
      channelId: "Gcalls",
      channelName: "Gcalls",
      channelDescription: "",
    }
    pushNotificationService.createLocalNotiChannel(channelObj);


    if (Platform.OS === gConst.IOS) {
      // code for iOS
    } else if (Platform.OS === gConst.ANDROID) {
      // code for Android
      requestPermistion()
    }

  }, []);

  // -----------------------------------------------------------------------------------

  useEffect(() => {
    // Add a listener to handle receive phone number from native ( IOS )

    eventEmitter.addListener('continueUserActivity', (event: any) => {

      if (event?.phoneNumber) {
        setPhoneNumber(event.phoneNumber);

      }
    });

    updatePhoneNumToCallbox()
  }, [phoneNumber]);

  // -----------------------------------------------------------------------------------

  useEffect(() => {

    // Add a listener to handle incoming deep links

    Linking.getInitialURL().then((url: any) => {


      console.log('Initial url is: ' + url);
      if (url) {
        let phoneNumber = url.replace(gConst.DEEPLINK_SCHEMA, '')
        setPhoneNumber(phoneNumber);
      }
    }).catch(err => console.error('An error occurred', err));

    Linking.addEventListener('url', (event) => {
      // console.log('Linking.addEventListener', event);
      if (event.url) {
        // get phone number from tel: link
        let phoneNumber = event.url.replace(gConst.DEEPLINK_SCHEMA, '');
        setPhoneNumber('');
        setPhoneNumber(phoneNumber);
        saveDataToLocalStorage(gConst.PHONE_NUMBER, phoneNumber)
      }
    });
    
          return () => {
            Linking.removeAllListeners('url');
          };
    
  }, []);


  // -----------------------------------------------------------------------------------


  useEffect(() => {


    if (Platform.OS === gConst.ANDROID) {
      BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onAndroidBackPress);
      };
    }


  }, []);
  // -----------------------------------------------------------------------------------

  function requestPermistion() {
    requestAudioRecordPermission();
  }

  function doShowSpinner() {
    setVisible(true)
  }

  function doHideSpinner() {
    setVisible(false)
    updatePhoneNumToCallbox();
  }

  // -----------------------------------------------------------------------------------

  const onAndroidBackPress = () => {

    // Handle problem at fogot password page from keycloak 
    if (webViewRef.current.canGoBack) {
      webViewRef.current.goBack();
      return true

    } else {

      webViewRef.current.injectJavaScript(`window.location.href = '${uri}';`);
      return true

    }
  };
  // -----------------------------------------------------------------------------------

  const updatePhoneNumToCallbox = () => {
    let phoneNum = String(phoneNumber)

    if (phoneNum) {
      const firstThreeNumbers = phoneNum.substring(0, 3);
      if (!firstThreeNumbers) return
      if (vietNamesePhoneLst.includes(firstThreeNumbers)) {
        // phoneNumber = "+2" + phoneNumber.substring(1);
        setPhoneNumber('+84' + phoneNumber.substring(1));
        saveDataToLocalStorage('phoneNumber', phoneNumber)
      }


      let data = { phoneNumber: phoneNumber }
      webViewRef.current.injectJavaScript(doSendDatatoWebView(data));
    }

    
  };

  // -----------------------------------------------------------------------------------

  async function initPhoneNumber() {

    let result = ""

    if (Platform.OS === 'ios') {
      // code for iOS
      result = await getDataFromStorageIos(gConst.PHONE_NUMBER)
    } else if (Platform.OS === 'android') {
      // code for Android
      result = await getDataFromLocalStorage(gConst.PHONE_NUMBER)
      requestPermistion()
    }

    if (result) {
      setPhoneNumber(result)
    }
  }

  // -----------------------------------------------------------------------------------

  const doSendDatatoWebView = (pData: any) => {

    pData.isCallBoxFromMobile = true
    pData.os = Platform.OS
    let data = JSON.stringify(pData)


    let string = `window.postMessage(JSON.stringify(${data}))`

    return string
  }

  // -----------------------------------------------------------------------------------

  const setKeycloakAutoFill = async (url: any) => {
    if (url.startsWith('https://auth.gcalls')) {


      let userName = ''
      let password = ''

      if (Platform.OS == gConst.ANDROID) {

        userName = await getDataFromLocalStorage("username");
        password = await getDataFromLocalStorage("password")
      }


      if (Platform.OS == gConst.IOS) {
        userName = await getDataFromStorageIos("username");
        password = await getDataFromStorageIos("password")
      }

      if (!userName && !password) {
        userName = ''
        password = ''

      }
      const injectScript = `
        (function() {
          const userName = document.getElementById('username');
          if (userName) {
            userName.value = '${userName}'; // Replace 'YourValue' with the desired value
          }


          const password = document.getElementById('password');
          if (password) {
            password.value = '${password}'; // Replace 'YourValue' with the desired value
          }
        })();
      `;

      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(injectScript);
      }

      return false; // Prevent the WebView from navigating to urls
    }

    return true; // Allow navigation to other URLs
  };


  // -----------------------------------------------------------------------------------

  const handleKeyloakOnClick = (url: any) => {

    // Note : get field value by inject Js code to html then send back to reactnative and save info to local storage

    if (url.startsWith('https://auth.gcalls')) {

      const injectScript = `
        (function() {
          const loginButton = document.getElementById('kc-login');
  
          if (loginButton) {
            // Perform your action when the user clicks on the kc-login button
            loginButton.addEventListener('click', function() {
              const username = document.getElementById('username');
              const password = document.getElementById('password');

              if (username && password) {
                const usernameValue = username.value;
                const passwordValue = password.value;

                // Save username and password to local storage
                // Save username and password to local storage using React Native function
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'LOGIN', key: 'username', value: usernameValue }));
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'LOGIN',key: 'password', value: passwordValue }));
              }
            });
          }

 
          const hrefElement = document.querySelector('#gcalls-header > a');
    
          // Check if the anchor element exists
          if (hrefElement) {
            // Remove the href attribute
            hrefElement.removeAttribute('href');
          }

        })();
        `
        ;

      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(injectScript);
      }
    }
  }
  // -----------------------------------------------------------------------------------


  const handleOpenCallButton = (url : any) => {
    if (url.startsWith('https://gcalls')) {
      const injectScript = `
        (function() {
          const targetElement = document.querySelector('body > div.smart-gcalls.bottom-right > span');
          
          if (targetElement) {
            // Modify the target element as needed
            // targetElement.style.backgroundColor = 'blue';
            targetElement.classList.add('smart-gcalls-tooltip', 'active-gcalls-toooltip');
            
            // Example: Add a click event listener to the target element
            // targetElement.addEventListener('click', function() {
            //   const className = targetElement.className;
            //   alert('Element Clicked. Class Name: ' + className);
            // });
          }
        })();
      `;

      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(injectScript);
      }
    }
  };


  // -----------------------------------------------------------------------------------

  function onNavigationStateChange(webViewState: any) {
    // url change from webview
    // Auto fill at keyloak page
    let url = webViewState?.url
    handleKeyloakOnClick(url);
    setKeycloakAutoFill(url);
    handleOpenCallButton(url);
  }


  const onSwipeLeft = () => {
    // console.log('left')
  };

  const onSwipeRight = () => {
    // console.log('right')
    webViewRef.current.injectJavaScript(`window.location.href = '${uri}';`);


  };

  // -----------------------------------------------------------------------------------

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: '#673ab7',
    }}>


      <GestureRecognizer
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        config={{
          velocityThreshold: 0.3,
          directionalOffsetThreshold: 80,
        }}
        style={{
          flex: 1,
  
        }}>




        <Spinner
          visible={isVisible}
          textContent={'Loading...'}
          textStyle={{ color: '#FFF' }}
        />

        <WebView
          // injectedJavaScriptBeforeContentLoaded={`
          //   window.onerror = function(message, sourcefile, lineno, colno, error) {
          //     alert("Message: " + message + " - Source: " + sourcefile + " Line: " + lineno + ":" + colno);
          //     return true;
          //   };
          //   true;
          // `}
          ref={(ref: any) => webViewRef.current = ref}
          style={{
            flex: 1,
        
          }}

          headers={customHeaders}
          javaScriptCanOpenWindowsAutomatically={true}
          injectedJavaScript={doSendDatatoWebView({ phoneNumber: phoneNumber }).toString()}
          onMessage={handleWebViewMessage}
          sharedCookiesEnabled={true}
          scrollEnabled={false}
          source={{
            uri:
              uri,
          }}
          onLoadStart={() => (doShowSpinner())}
          onLoad={() => (doHideSpinner())}
          onNavigationStateChange={onNavigationStateChange}
          useWebKit={true}
          scalesPageToFit={true}
          originWhitelist={['*']}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          injectedJavaScriptForMainFrameOnly={false}
          thirdPartyCookiesEnabled={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccess={true}
          mixedContentMode={'compatibility'}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          cacheEnabled={true}
          onRenderProcessGone={syntheticEvent => {
            const { nativeEvent } = syntheticEvent;
            console.warn(
              'WebView Crashed: ',
              nativeEvent.didCrash,
            );
          }}
        />
      </GestureRecognizer>
    </SafeAreaView>);
}


const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});


export default App;
