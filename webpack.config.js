const copyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    entry: "./src/index.ts",
    output: {
        path: path.resolve(__dirname, "docs"),
        filename: "./index.js"
    },
    mode: "development",
    devtool: "source-map",
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
        modules: [
            path.resolve(__dirname, "node_modules")
        ]
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: "ts-loader"
            },
            {
                test: /\.css$/,
                loader: ["style-loader", "css-loader"]
            }
        ]
    },
    plugins: [
        new copyWebpackPlugin([
            {
                ignore: ["*.js", "*.ts", "*.tsx"],
                context: path.resolve(__dirname, "src"),
                from: "**/*",
                to: "./"
            }
        ])
    ],
};