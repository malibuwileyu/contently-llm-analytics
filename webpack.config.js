const path = require('path');
let nodeExternals;
try {
  nodeExternals = require('webpack-node-externals');
} catch (e) {
  console.warn('webpack-node-externals not found, falling back to empty externals');
  nodeExternals = () => ({});
}

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
}; 