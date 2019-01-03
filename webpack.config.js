const path = require('path');
const merge = require('webpack-merge');

const ROOT = __dirname;
const INCLUDE_PATHS = [path.resolve(ROOT, 'src')];
const EXCLUDE_PATHS = [path.resolve(ROOT, 'node_modules')];
const ENTRY_POINT = path.join(ROOT, 'src');
const OUTPUT_PATH = path.join(ROOT, 'dist');
const PUBLIC_PATH = '';

const COMMON = {
  context: ROOT,
  entry: [ENTRY_POINT],
  output: {
    path: OUTPUT_PATH,
    publicPath: PUBLIC_PATH,
    filename: 'bundle.js',
    library: 'Bundle'
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
}

module.exports = (env, argv) => {

  if (argv.mode === 'development') {
    return merge(COMMON, {
      mode: 'development',
      devServer: {
        historyApiFallback: false,
        noInfo: true,
        contentBase: path.join(ROOT, ''),
      }
    });
  } else {
    return merge(COMMON, {
      mode: 'production',
      performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
      }
    });
  }
}