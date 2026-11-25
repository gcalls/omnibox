const path = require('path');
const EncodingPlugin = require('webpack-encoding-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'gcallsSdk.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'var',
    library: 'Calllog',
    libraryExport: "default"
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          ecma: 6,
          output: { 
             ascii_only: true 
          },
        },
      }),
    ],
  },
};