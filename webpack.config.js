const path = require('path');
const webpack = require('webpack');

const ROOT_PATH = '/geo-coverage';

module.exports = function (env = {}) {
	const isDevelopment = !!env.development;

	return {
		context: __dirname,
		entry: './src/index.jsx',
		output: {
			path: path.join(__dirname, 'dist'),
			publicPath: `${ROOT_PATH}/dist/`,
			filename: '[name].js',
			chunkFilename: '[name].[contenthash].js',
		},
		target: 'web',
		mode: isDevelopment ? 'development' : 'production',
		devtool: isDevelopment ? 'eval-cheap-module-source-map' : false,
		plugins: [
			new webpack.DefinePlugin({
				'process.env.ROOT_PATH': JSON.stringify(ROOT_PATH),
			}),
		],
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							cacheDirectory: isDevelopment,
							presets: ['@babel/preset-react', '@babel/preset-env'],
						},
					},
				},
				{
					test: /\.css$/,
					exclude: /node_modules/,
					use: [
						'style-loader',
						{
							loader: 'css-loader',
							options: {
								modules: {
									// The top-level stylesheet styles the page itself (e.g. #root), so isn't scoped
									mode: (resourcePath) =>
										resourcePath === path.join(__dirname, 'src', 'styles.css') ? 'global' : 'local',
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
					use: ['style-loader', 'css-loader'],
				},
			],
		},
		resolve: {
			modules: [path.join(__dirname, 'src'), 'node_modules'],
			extensions: ['.js', '.jsx'],
		},
		performance: {
			// The app is a single, large page; don't warn about its bundle size
			hints: false,
		},
		devServer: {
			port: 8080,
			static: {
				directory: path.join(__dirname, 'assets'),
				publicPath: `${ROOT_PATH}/assets`,
			},
			setupMiddlewares(middlewares, devServer) {
				devServer.app.get('/', (req, res) => res.redirect(ROOT_PATH));
				devServer.app.get([ROOT_PATH, `${ROOT_PATH}/`], (req, res) =>
					res.sendFile(path.join(__dirname, 'index.html')),
				);
				return middlewares;
			},
		},
	};
};
