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
  externals: {
    '@nestjs/common': 'commonjs @nestjs/common',
    '@nestjs/core': 'commonjs @nestjs/core',
    '@nestjs/testing': 'commonjs @nestjs/testing',
    '@nestjs/platform-express': 'commonjs @nestjs/platform-express',
    '@nestjs/config': 'commonjs @nestjs/config',
    '@nestjs/typeorm': 'commonjs @nestjs/typeorm',
    '@supabase/supabase-js': 'commonjs @supabase/supabase-js',
    'typeorm': 'commonjs typeorm',
    'cache-manager': 'commonjs cache-manager',
    'class-transformer': 'commonjs class-transformer',
    'class-validator': 'commonjs class-validator',
    'express': 'commonjs express',
    'reflect-metadata': 'commonjs reflect-metadata',
    'webpack-node-externals': 'commonjs webpack-node-externals',
    'fs': 'commonjs fs',
    'path': 'commonjs path',
    'os': 'commonjs os',
    'crypto': 'commonjs crypto',
    'stream': 'commonjs stream',
    'zlib': 'commonjs zlib',
    'http': 'commonjs http',
    'https': 'commonjs https',
    'net': 'commonjs net',
    'tls': 'commonjs tls',
    'child_process': 'commonjs child_process'
  }
} 