const path = require("path");
const nodeExternals = require("webpack-node-externals");

// 根据环境变量确定模式
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment =
  process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

module.exports = {
  target: "node",
  mode: isProduction ? "production" : "development",
  entry: {
    index: "./src/index.ts",
    server: "./src/server.ts",
    "cli/generate-mock": "./src/cli/generate-mock.ts",
    "mock-generator": "./src/mock-generator.ts",
    "status-manager": "./src/status-manager.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    libraryTarget: "commonjs2",
    clean: isProduction, // 生产环境清理，开发环境不清理
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.json",
              compilerOptions: {
                declaration: isProduction, // 生产环境生成声明文件
                declarationMap: isProduction, // 生产环境生成声明映射
                sourceMap: true, // 都生成源码映射
              },
              transpileOnly: isDevelopment, // 开发环境只转译，不类型检查
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.json$/,
        type: "json",
      },
    ],
  },
  externals: [nodeExternals()],
  optimization: {
    minimize: false,
    splitChunks: false,
  },
  devtool: isProduction ? "source-map" : "eval-source-map",
  // 开发环境特有的配置
  ...(isDevelopment && {
    watch: true,
    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: 1000,
    },
  }),
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
};
