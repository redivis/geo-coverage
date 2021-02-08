const http = require('http');
const path = require('path');

const express = require('express');
const webpackMiddleware = require('webpack-dev-middleware');
const webpack = require('webpack');

const webpackConfigurator = require('../webpack.config');

const port = 8080;

const app = express();
const server = http.createServer(app);

const webpackConfig = webpackConfigurator({
	env: 'development',
});

const compiler = webpack(webpackConfig);

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	return next();
});

app.use(
	webpackMiddleware(compiler, {
		publicPath: `/geo-coverage/dist`,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
		},
	}),
);

app.use('/geo-coverage/assets', express.static(path.join(__dirname, '../assets')));

app.use(`/geo-coverage/authCallback`, (req, res, next) => {
	res.sendFile(path.join(__dirname, '../authCallback.html'));
});
app.use(`/geo-coverage`, (req, res, next) => {
	res.sendFile(path.join(__dirname, '../index.html'));
});

app.use('/', (req, res) => {
	res.redirect('/geo-coverage');
});
app.use(`/*`, (req, res, next) => {
	res.sendFile(path.join(__dirname, '../404.html'));
});

server.listen(port);

console.log(`Working... compiled assets will be available at http://localhost:${port}`);
