const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// 根据环境变量确定模式
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment =
  process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

module.exports = {
  target: "web",
  mode: isProduction ? "production" : "development",
  entry: "./src/frontend/index.tsx",
  output: {
    path: path.resolve(__dirname, "src/public/dist"),
    filename: isProduction ? "[name].[contenthash].js" : "[name].js",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-env", { targets: "defaults" }],
                ["@babel/preset-react", { runtime: "automatic" }],
                [
                  "@babel/preset-typescript",
                  {
                    isTSX: true,
                    allExtensions: true,
                    jsxPragma: "React",
                    jsxPragmaFrag: "React.Fragment",
                  },
                ],
              ],
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [require("tailwindcss"), require("autoprefixer")],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/frontend/index.html",
      filename: "../index.html",
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
  devtool: isProduction ? "source-map" : "eval-source-map",
  devServer: {
    static: {
      directory: path.join(__dirname, "src/public"),
    },
    compress: true,
    port: 3000,
    hot: true,
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    ],
  },
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
};
