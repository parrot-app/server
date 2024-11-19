import path from 'path';
import webpack from 'webpack';
import 'webpack-dev-server';

const config: webpack.Configuration = {
  context: __dirname,
  target: 'node',
  mode: 'production',
  entry: `./src/index.ts`,
  // Fix blessed not working when bundled https://github.com/vercel/pkg/issues/530
  externals: {
    blessed: 'commonjs blessed',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  // Ignore two problematic dependencies to fix a build issue
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /pty.js/,
      contextRegExp: /blessed\/lib\/widgets$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /term.js/,
      contextRegExp: /blessed\/lib\/widgets$/,
    }),
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
    })
  ],
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
  },
  devtool: 'inline-source-map',
};

export default config;
