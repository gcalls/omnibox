/**
 * @format
 */

import {AppRegistry} from 'react-native';
import Boot from './components/Boot';
import {name as appName} from './app.json';

// Khởi động: màn khởi động → cấp quyền (lần đầu) → Điều khoản (lần đầu) → callbox (components/Boot.tsx)
AppRegistry.registerComponent(appName, () => Boot);
