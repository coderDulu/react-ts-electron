const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");  // 复制
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin"); // react热更新
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')  // 压缩css

const isProduction = process.env.NODE_ENV === 'production'
// 处理css的loader
const handleCssLoaders = (loader) => {
  return [
    isProduction ? MiniCssExtractPlugin.loader : "style-loader",
    "css-loader", {
      // 配合package.json中的browserslist 
      // 处理兼容性
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          plugin: ['postcss-preset-env']  // 解决大多数样式兼容性问题
        }
      }
    },
    loader
  ].filter(Boolean)
}

module.exports = {
  target: 'web',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
  entry: './src/index.tsx',
  output: {
    path: isProduction ? path.resolve(__dirname, 'dist') : undefined,
    // 出口文件
    filename: isProduction ? 'static/js/[name].[contenthash:10].js' : 'static/js/[name].js',
    // chunk文件
    chunkFilename: isProduction ? 'static/js/[name].[contenthash:10].chunk.js' : 'static/js/[name].chunk.js',
    // 资源文件
    assetModuleFilename: 'static/media/[hash:10][ext][query]',
    clean: true,
    // 解决路由跳转，资源路径问题
    publicPath: isProduction ? undefined : '/'
  },
  module: {
    rules: [{
      oneOf: [
        {
          test: /\.(tsx|ts)$/,
          include: path.resolve(__dirname, './src'),
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react',
              '@babel/preset-typescript'
            ],
            // 开启缓存
            cacheDirectory: true,
            // 关闭压缩
            cacheCompression: false,
            plugins: [
              !isProduction && "react-refresh/babel", // 开启js的HMR功能
            ].filter(Boolean),
          }
        },
        {
          test: /\.css$/,
          use: handleCssLoaders()
        },
        {
          test: /\.less$/,
          use: handleCssLoaders('less-loader')
        },
        // 处理图片
        {
          test: /\.(jpe?g|png|gif|webp|svg)$/,
          type: "asset",
          parser: {
            // 将图片资源转为base64
            dataUrlCondition: {
              maxSize: 10 * 1024
            }
          }
        },
        // 处理其他资源
        {
          test: /\.(woff2?|ttf)$/,
          type: "asset/resource"
        }
      ]
    }]
  },
  devServer: {
    host: 'localhost',
    port: 3000,
    open: false,
    historyApiFallback: true, // 解决前端路由刷新404问题
   /*  static: {
      directory: path.resolve(__dirname, 'static'),
      publicPath: '/'
    }, */
    compress: false,
    hot: true,
  /*   proxy: {
      '/api': {
        target: 'http://172.16.3.178/cgi-bin/web.fcgi',
        pathRewrite: {'^/api': ''}
      }
    } */
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, './src'),
    },
    extensions: ['.js', '.tsx', '.ts'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'), // 模板取定义root节点的模板
      inject: true, // 自动注入静态资源
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "./public"),
          to: path.resolve(__dirname, "./dist"),
          toType: "dir",
          noErrorOnMissing: true, // 不生成错误
          globOptions: {
            // 忽略文件
            ignore: ["**/index.html"],
          },
          info: {
            // 跳过terser压缩js
            minimized: true,
          },
        },
      ],
    }),
    !isProduction && new ReactRefreshWebpackPlugin(), // 解决js的HMR功能运行时全局变量的问题
    new MiniCssExtractPlugin(),
  ].filter(Boolean),
  optimization: {
    minimize: isProduction,
    minimizer: [
      isProduction && new TerserPlugin({
        parallel: true,
      }),
      isProduction && new CssMinimizerPlugin()
    ].filter(Boolean),
    // 将公共的依赖模块提取到已有的入口 chunk 中，或者提取到一个新生成的 chunk
    splitChunks: {
      chunks: 'all'
    }
  },
  // cache: {
  //   type: 'filesystem',
  //   buildDependencies: {
  //     // 推荐在 webpack 配置中设置 cache.buildDependencies.config: [__filename] 来获取最新配置以及所有依赖项
  //     config: [__filename]
  //   }
  // }
}
