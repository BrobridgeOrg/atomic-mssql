const events = require('events');
const util = require('util');
const tedious = require('tedious');
const ConnectionPool = require('tedious-connection-pool');
const mssql = require('mssql');

module.exports = class Client extends events.EventEmitter {

	constructor(conn = null, opts = {}) {
		super();

		this.opts = Object.assign({
				server: '0.0.0.0',
				port: 1433,
				database: '',
				requestTimeout: 15000,
				connectionTimeout: 15000,
			}, opts.connection, {
				auth: Object.assign({
					type: 'default',
					username: '',
					password: '',
				}, opts.connection.auth || {})
			});

		this.poolOpts = Object({
			min: 1,
			max: 10,
			idleTimeoutMillis: 30000,
		}, opts.pool);

		this.status = 'disconnected';
		this.pool = new mssql.ConnectionPool(this.getConnectionConfigs());

		this.pool.on('error', (e) => {
			this.emit('error', e);
		})

	}

	getConnectionConfigs() {

		// Preparing configurations
		let configs = {
			server: this.opts.server,
			port: this.opts.port,
			database: this.opts.database,
			pool: this.poolOpts,
			user: this.opts.auth.username || '',
			password: this.opts.auth.password || '',
			requestTimeout: 15000,
			connectionTimeout: 15000,
			options: {
				trustServerCertificate: true,
				maxRetriesOnTransientErrors: 0
			}
		};

		return configs;
	}

	getPool() {
		return this.pool;
	}

	connect() {

		this.pool.connect()
			.then((pool) => {
				this.emit('connected');
			})
			.catch((e) => {

				// Reconnecting
				setTimeout(() => {
					this.connect();
				}, 3000);
			});
	}
};
