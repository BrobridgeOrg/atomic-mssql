const events = require('events');
const util = require('util');
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
            connectionRetryInterval: 3000,
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
        this.timer = null;
        this.pool = new mssql.ConnectionPool(this.getConnectionConfigs());

        this.pool.on('error', (e) => {
            this.emit('error', e);
        })

    }

    getConnectionConfigs() {
        //console.log(this);
        // Preparing configurations
        let configs = {
            server: this.opts.server,
            port: this.opts.port,
            database: this.opts.database,
            pool: this.poolOpts,
            user: this.opts.auth.username || '',
            password: this.opts.auth.password || '',
            options: {
                requestTimeout: this.opts.requestTimeout,
                connectionTimeout: this.opts.connectionTimeout,
                connectionRetryInterval: this.opts.connectionRetryInterval,
                appName: this.opts.appName,
                maxRetriesOnTransientErrors: 0,
                encrypt: this.opts.encryption,
                trustServerCertificate: this.opts.trustServerCertificate
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
                this.timer = setTimeout(() => {

                    this.emit('reconnect')
                    this.connect();
                }, this.opts.connectionRetryInterval);
            });
    }

    disconnect() {
        clearTimeout(this.timer);
        this.pool.drain();
    }
};
