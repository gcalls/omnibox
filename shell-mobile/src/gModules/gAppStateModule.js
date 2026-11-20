// AppStateModule.
import { AppState } from 'react-native';
const AppStateModule = (appState, setAppStateVisible, webViewRef) => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App comes to the foreground
    }

    appState.current = nextAppState;
    setAppStateVisible(appState.current);
    // console.log('AppState', appState.current);

    if (appState.current === 'active') {

      const data = {
        type: 'handleChangeAgentStatus',
        code: 'online'
      };

      const jsCode = `window.postMessage(JSON.stringify(${JSON.stringify(data)}))`;
      webViewRef.current.injectJavaScript(jsCode);
      console.log('ONLINE')
    }

    if (appState.current === 'background') {

      const data = {
        type: 'handleChangeAgentStatus',
        code: 'offline'
      };
      console.log('OFFLINE')

      const jsCode = `window.postMessage(JSON.stringify(${JSON.stringify(data)}))`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  });

  return () => {
    subscription.remove();
  };
};

export default AppStateModule;
