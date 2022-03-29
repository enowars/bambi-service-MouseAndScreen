const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
    entry: "./src/app.ts",
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, '../MouseAndScreen/wwwroot'),
        filename: "./bundle.js"
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader"
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html"
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: './assets', to: 'assets' }
            ]
        }),
    ]
};
