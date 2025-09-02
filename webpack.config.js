const path = require("path");
const nodeExternals = require("webpack-node-externals");
const ShebangPlugin = require("webpack-shebang-plugin");

// Determine mode based on environment variables
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
    clean: isProduction, // Clean in production, keep in development
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
                declaration: isProduction, // Generate declarations in production
                declarationMap: isProduction, // Generate declaration maps in production
                sourceMap: true, // Always generate source maps
              },
              transpileOnly: isDevelopment, // In dev, transpile only, skip type check
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
  // Development-only configuration
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
  plugins: [new ShebangPlugin()],
};
