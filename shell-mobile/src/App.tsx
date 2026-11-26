import React, { useEffect, useRef, useState } from 'react';
import { Button, Linking } from 'react-native';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { View, Text, TouchableOpacity, PanResponder, AppState } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';



const { UserActivityModule } = NativeModules;

// Gcalls IOS
// Chỉ iOS có UserActivityModule (Android: undefined → không tạo emitter)
const eventEmitter = Platform.OS === 'ios' && UserActivityModule ? new NativeEventEmitter(UserActivityModule) : null;

import {
  StyleSheet,
  BackHandler,
  Alert,
} from 'react-native';


import Spinner from 'react-native-loading-spinner-overlay';
import WebView from 'react-native-webview';
import Contact from './components/contact';
import { gConst } from './utils/gConst';
import pushNotificationService from './services/pushNotification';
import { getDataFromLocalStorage, saveDataToLocalStorage, setupAndroidSpeakerOff, setupAndroidSpeakerOn } from './gModules/gNativeAndroidModule';
import { getDataFromStorageIos, saveDataToStorageIos } from './gModules/gNativeIosModule';
import GestureRecognizer from 'react-native-swipe-gestures';
import gScreenSetting from './utils/gScreenSetting';
import { handleWebViewMessage } from './gModules/gWebViewMessage';
import AppStateModule from './gModules/gAppStateModule';
import {BASE_URL} from '@env'
import { checkForUpdate, formatVersion, getAppInfo } from './services/appUpdate';


// onReady: trang callbox tải xong lần đầu (hoặc lỗi) → Boot tắt màn khởi động
function App({ onReady }: { onReady?: () => void }): React.JSX.Element {
  const readySent = useRef(false)
  const markReady = () => {
    if (!readySent.current) {
      readySent.current = true
      onReady?.()
    }
  }
  // Lỗi tải trang / tiến trình WebView bị hệ thống dừng → hiện màn lỗi có nút thử lại (không để màn đen)
  const [loadError, setLoadError] = useState(false)
  const [webKey, setWebKey] = useState(0)


  const [isVisible, setVisible] = useState(false)
  // Phiên bản đang cài, vd. "Omnibox 1.0.2 (42)" – hiện dưới vòng xoay khi tải trang và luôn ở góc dưới trái
  const [versionLabel, setVersionLabel] = useState('')
  const appInfoRef = useRef<any>(null)


  const [uri, setUri] = useState(BASE_URL)


  const [phoneNumber, setPhoneNumber] = useState('')
  const [contacts, setContacts] = useState([])
  const [vietNamesePhoneLst, setVietNamesePhoneLst] = useState(['032', '033', '034', '035', '036', '037', '038', '039', '070', '079', '077', '076', '078', '083', '084', '085', '081', '082', '059'])


  const webViewRef: any = useRef(null);

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

  // Phiên bản + yêu cầu cập nhật khi store có bản mới (khởi động và mỗi lần quay lại foreground)
  useEffect(() => {
    getAppInfo().then(info => {
      appInfoRef.current = info;
      setVersionLabel(formatVersion(info));
    });
    checkForUpdate();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkForUpdate();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {

    initPhoneNumber();
    // Quyền thông báo/micro/Bluetooth: xin ở màn cấp quyền (components/Boot.tsx), không xin chồng lúc khởi động

    let channelObj = {
      channelId: "Gcalls",
      channelName: "Gcalls",
      channelDescription: "",
    }
    pushNotificationService.createLocalNotiChannel(channelObj);


    if (Platform.OS === gConst.IOS) {
      // code for iOS
    }

  }, []);

  // -----------------------------------------------------------------------------------

  useEffect(() => {
    // Add a listener to handle receive phone number from native ( IOS )

    const sub = eventEmitter?.addListener('continueUserActivity', (event: any) => {
      if (event?.phoneNumber) {
        setPhoneNumber(event.phoneNumber);
      }
    });

    updatePhoneNumToCallbox()
    return () => sub?.remove();
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

    const linkSub = Linking.addEventListener('url', (event) => {
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
            linkSub.remove();
          };
    
  }, []);


  // -----------------------------------------------------------------------------------


  useEffect(() => {


    if (Platform.OS === gConst.ANDROID) {
      // RN 0.77+: BackHandler.removeEventListener đã bị gỡ – dùng subscription.remove()
      const backSub = BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress);
      return () => backSub.remove();
    }


  }, []);
  // -----------------------------------------------------------------------------------

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
    if (!webViewRef.current) return false
    if (webViewRef.current.canGoBack) {
      webViewRef.current.goBack();
      return true

    } else {

      webViewRef.current?.injectJavaScript(`window.location.href = '${uri}';`);
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
      webViewRef.current?.injectJavaScript(doSendDatatoWebView(data));
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
    }

    if (result) {
      setPhoneNumber(result)
    }
  }

  // -----------------------------------------------------------------------------------

  const doSendDatatoWebView = (pData: any) => {

    pData.isCallBoxFromMobile = true
    pData.os = Platform.OS
    if (appInfoRef.current?.version) {
      pData.appVersion = appInfoRef.current.version
      pData.appBuild = appInfoRef.current.build
    }
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
        webViewRef.current?.injectJavaScript(injectScript);
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
        webViewRef.current?.injectJavaScript(injectScript);
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
        webViewRef.current?.injectJavaScript(injectScript);
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
    webViewRef.current?.injectJavaScript(`window.location.href = '${uri}';`);


  };

  // -----------------------------------------------------------------------------------

  return (
    <SafeAreaProvider>
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
          textContent={versionLabel ? `Loading...\n${versionLabel}` : 'Loading...'}
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
          key={webKey}
          onLoadStart={() => (readySent.current ? doShowSpinner() : null)}
          onLoad={() => (doHideSpinner())}
          onLoadEnd={() => markReady()}
          onError={() => {
            setVisible(false)
            setLoadError(true)
            markReady()
          }}
          // iOS: tiến trình nội dung WKWebView bị dừng (nền lâu / thiếu RAM) → tải lại thay vì để màn trống
          onContentProcessDidTerminate={() => webViewRef.current?.reload()}
          // iOS: micro đã cấp ở màn cấp quyền → WKWebView không hỏi lại theo từng trang
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
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
          // Android: tiến trình render của WebView bị hệ thống dừng (thiếu RAM khi app nằm nền) → dựng lại WebView.
          // Không xử lý thì WebView chết để lại màn đen; trên một số máy hệ thống còn dừng luôn app.
          onRenderProcessGone={syntheticEvent => {
            console.warn('WebView render process gone, didCrash=', syntheticEvent.nativeEvent.didCrash);
            setVisible(false)
            setWebKey(k => k + 1)
          }}
        />
        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>{vi ? 'Không kết nối được tổng đài' : 'Could not reach the call center'}</Text>
            <Text style={styles.errorText}>{vi ? 'Kiểm tra kết nối mạng rồi thử lại.' : 'Check your connection and try again.'}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.retryButton}
              onPress={() => {
                setLoadError(false)
                setWebKey(k => k + 1)
              }}>
              <Text style={styles.retryText}>{vi ? 'Thử lại' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {/* Nhãn phiên bản luôn hiện, đè lên callbox ở góc dưới trái (góc dưới phải là nút gọi của callbox);
            pointerEvents="none" để không chặn thao tác trên trang */}
        {versionLabel ? (
          <View pointerEvents="none" style={styles.versionBadge}>
            <Text style={styles.versionText}>{versionLabel.replace('Omnibox ', 'v')}</Text>
          </View>
        ) : null}
      </GestureRecognizer>
    </SafeAreaView>
    </SafeAreaProvider>);
}


const vi = (() => {
  try {
    return /^vi/i.test(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch (e) {
    return false;
  }
})();

const styles = StyleSheet.create({
  errorBox: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#1f1b2e', textAlign: 'center' },
  errorText: { fontSize: 15, color: '#615b73', textAlign: 'center', marginTop: 8, marginBottom: 20 },
  retryButton: { backgroundColor: '#673ab7', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 40 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  versionBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 20, 60, 0.45)',
  },
  versionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
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
