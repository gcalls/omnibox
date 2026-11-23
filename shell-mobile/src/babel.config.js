module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // BASE_URL từ src/.env (do 1config/cp.sh tạo): import { BASE_URL } from '@env'
    ['module:react-native-dotenv', {
      envName: 'APP_ENV',
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true,
      verbose: false,
    }],
  ],
};
