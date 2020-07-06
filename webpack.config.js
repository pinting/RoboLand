const copyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    entry: {
        master: "./src/master.ts",
        slave: "./src/slave.ts"
    },
    output: {
        path: path.resolve(__dirname, "docs"),
        filename: "./[name].js"
    },
    mode: "development",
    devtool: "source-map",
    devServer: {
        disableHostCheck: true
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
                ignore: ["*.ts", "*.tsx"],
                context: path.resolve(__dirname, "src"),
                from: "**/*",
                to: "./"
            }
        ])
    ],
};