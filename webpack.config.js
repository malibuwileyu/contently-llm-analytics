const path = require('path');

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  externals: [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/testing',
    '@nestjs/platform-express',
    '@supabase/supabase-js',
    'cache-manager',
    'class-transformer',
    'class-validator'
  ]
} 