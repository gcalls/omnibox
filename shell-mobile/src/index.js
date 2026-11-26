/**
 * @format
 */

import React from 'react';
import {AppRegistry} from 'react-native';
import App from './App';
import TermsGate from './components/TermsGate';
import {name as appName} from './app.json';

// Lần đầu mở app: đọc hết và đồng ý Điều khoản dịch vụ (components/TermsGate.tsx) rồi mới vào callbox
const Root = () => (
  <TermsGate>
    <App />
  </TermsGate>
);

// startNetworkLogging();
AppRegistry.registerComponent(appName, () => Root);
