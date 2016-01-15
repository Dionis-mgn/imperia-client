var webpack = require("webpack");
var autoprefixer = require('autoprefixer');
var copyPlugin = require('copy-webpack-plugin');
var extractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: {
		bundle: './main.js',
		rtest: './main.jsx',
		csslist: './csslist.js'
	},
    resolve: {
        modulesDirectories: [
            '.',
			'./node_modules'
        ]
    },
    output: {
        path: __dirname + "/dist",
        filename: '[name].js'
    },
	module: {
		loaders : [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				loader: 'babel',
				query: {
					presets: ['react', 'es2015']
				}
			},
			{
				test: /\.css$/,
				exclude: /node_modules/,
				loader: extractTextPlugin.extract('style', 'css', 'postcss')
			},
			{
				test: /\.(png|jpg|jpeg)$/,
				exclude: /node_modules/,
				loader: 'file'
			}
		]
	},
	postcss: function () {
		return [autoprefixer];
	},
	plugins: [
		new copyPlugin([
				{
					from: './fonts',
					to : 'fonts'
				},
				{
					from: './ural.html' // Webpack way?
				}
			],
			{
				//ignore: "*/txt"
			}
		),
		new extractTextPlugin("styles.css")
	]
};

;
