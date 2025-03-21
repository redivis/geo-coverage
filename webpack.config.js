/* eslint-disable import/no-commonjs*/
/* eslint-disable import/no-nodejs-modules*/
/* eslint-disable import/unambiguous*/
const path = require('path');
const webpack = require('webpack');

module.exports = function ({ env } = {}) {
	const output = {
		context: __dirname,
		entry: './src/index.jsx',
		output: {
			path: `${__dirname}/dist`,
			filename: '[name].js',
		},
		target: 'web',
		mode: env === 'development' ? 'development' : 'production',
		plugins: [
			new webpack.DefinePlugin({
				'process.env.ROOT_PATH': JSON.stringify('/geo-coverage'),
			}),
		],
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'babel-loader',
							options: {
								cacheDirectory: env === 'development',
								sourceType: 'unambiguous',
								presets: [
									[require.resolve('@babel/preset-react'), { useSpread: true }],
									[
										require.resolve('@babel/preset-env'),
										{
											targets: ['safari 14.0', 'firefox 84', 'chrome 88'],
											modules: false,
											bugfixes: true, // Note: will be default in Babel 8
											useBuiltIns: 'usage',
											corejs: { version: 3, proposals: true },
										},
									],
								],
								plugins: [require.resolve('@babel/plugin-proposal-export-default-from')],
							},
						},
					],
				},
				{
					test: /\.css$/,
					exclude: /node_modules/,
					use: [
						{ loader: 'style-loader' },
						{
							loader: 'css-loader',
							options: {
								modules: {
									localIdentName: '[name]_[local]-[hash:base64:4]',
									exportLocalsConvention: 'as-is',
									namedExport: false,
								},
								importLoaders: 1,
							},
						},
						'postcss-loader',
					],
				},
				{
					test: /\.css$/,
					include: /node_modules/,
					sideEffects: true,
					use: [
						{
							loader: 'style-loader',
						},
						{ loader: 'css-loader' },
					],
				},
			],
		},
		resolve: {
			modules: [`${__dirname}/src`, `node_modules`],
			extensions: ['*', '.js', '.jsx'],
		},
	};

	if (env === 'development') {
		output.devtool = 'eval-cheap-module-source-map';
	}

	return output;
};
