const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'form-builder.min.js',
      library: 'FormBuilder',
      libraryTarget: 'umd',
      libraryExport: 'default',
      umdNamedDefine: true,
      globalObject: 'this'
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'examples'),
      },
      compress: true,
      port: 9000,
      hot: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './examples/index.html',
        filename: 'index.html',
        inject: 'head',
        scriptLoading: 'blocking'
      }),
      ...(isProduction ? [new MiniCssExtractPlugin({
        filename: 'form-builder.min.css'
      })] : [])
    ],
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
};