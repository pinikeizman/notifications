const path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'static/[name].[contenthash].js',
        publicPath: '/'
    },
    optimization: {
        splitChunks: {
          chunks: 'all',
        },
      },
    resolve: {
        alias: { config: path.resolve(__dirname, './config') },
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.sass$/,
                use: [{
                        loader: MiniCssExtractPlugin.loader,
                        options: {},
                      }, 'css-loader', 'sass-loader']
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]',
                  outputPath: 'static/images'
                },                
            },
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false
                }
            },
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({ 
            template: 'public/index.html',
            hash: true,

        }),
        new MiniCssExtractPlugin({
            filename: 'static/[name].css',
            chunkFilename: 'static/[id].css'
          }),
        new webpack.EnvironmentPlugin({ APP_ENV: 'kubernetes' }),
        new CleanWebpackPlugin({verbose: true}),

    ],
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000,
        proxy: {
            '/api/ws': {
                target: 'ws://localhost:8080',
                pathRewrite: {'^/api' : ''},
                ws: true
             },
            '/api': {
                target: 'http://localhost:8080',
                pathRewrite: {'^/api' : ''}
            }
        }
    }
};
