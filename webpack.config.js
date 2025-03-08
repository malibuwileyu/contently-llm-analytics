const path = require('path');

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  mode: 'production',
  externals: {
    '@nestjs/common': 'commonjs @nestjs/common',
    '@nestjs/core': 'commonjs @nestjs/core',
    '@nestjs/platform-express': 'commonjs @nestjs/platform-express',
    '@nestjs/typeorm': 'commonjs @nestjs/typeorm',
    '@nestjs/testing': 'commonjs @nestjs/testing',
    '@nestjs/config': 'commonjs @nestjs/config',
    '@supabase/supabase-js': 'commonjs @supabase/supabase-js',
    'typeorm': 'commonjs typeorm',
    'cache-manager': 'commonjs cache-manager',
    'class-transformer': 'commonjs class-transformer',
    'class-validator': 'commonjs class-validator',
    'express': 'commonjs express',
    'reflect-metadata': 'commonjs reflect-metadata'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.resolve(__dirname, 'tsconfig.json')
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
    modules: [
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ]
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
}; 