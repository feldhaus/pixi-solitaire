const path = require('path');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = !IS_PRODUCTION;
const ROOT = __dirname;
const INCLUDE_PATHS = [path.resolve(ROOT, 'src')];
const EXCLUDE_PATHS = [path.resolve(ROOT, 'node_modules')];
const ENTRY_POINT = path.join(ROOT, 'src');
const OUTPUT_PATH = path.join(ROOT, 'dist');
const PUBLIC_PATH = '';

module.exports = {
  context: ROOT,
  entry: [ENTRY_POINT],
  output: {
    path: OUTPUT_PATH,
    publicPath: PUBLIC_PATH,
    filename: 'bundle.js',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: INCLUDE_PATHS,
        exclude: EXCLUDE_PATHS
      },
  ]
  },

  devServer: {
    historyApiFallback: false,
    noInfo: true,
    contentBase: path.join(__dirname, ''),
  },

  devtool: IS_DEVELOPMENT ? '#eval-source-map' : '#source-map',
}