const copyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    entry: "./src/index.ts",
    mode: "development",
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, "docs"),
        filename: "index.js"
    },
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
            }
        ]
    },
    plugins: [
        new copyWebpackPlugin([
            {
                from: path.resolve(__dirname, "src/res"),
                to: "res",
                toType: "dir"
            },
            {
                from: path.resolve(__dirname, "src/index.html"),
                to: "index.html",
                toType: "file"
            }
        ])
    ],
};