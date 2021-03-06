var path = require('path')
var webpack = require('webpack');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.js',
    index: './src/client/index.js',
    options: './src/client/options.js'
  },
  output: {
    publicPath: "/",
    path: path.join(__dirname, "extension/dist"),
    filename: "[name].bundle.js"
  },
  devServer: {
    historyApiFallback: true,
  },
  module: {
    loaders: [
      {
        loader: 'babel',
        test: /\.js$/,
        exclude: [path.resolve(__dirname, 'node_modules')]
      },
      {
        test: /\.(css)$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader'),
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('style.css')
  ]
};
