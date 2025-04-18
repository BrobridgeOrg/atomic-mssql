module.exports = function (RED) {

    function genQueryCmd() {
        return Array.from(arguments);
    }

    function genQueryCmdParameters(tpl, msg) {
        return eval('genQueryCmd`' + tpl + '`');
    }

    function sanitizedCmd(raw) {
        return raw.replaceAll('\`', '\\\`');
    }


    function ExecuteNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        this.connection = RED.nodes.getNode(config.connection)
        this.config = config;
        this.config.outputPropType = config.outputPropType || 'msg';
        this.config.outputProp = config.outputProp || 'payload';
        this.tpl = sanitizedCmd(node.config.command) || '';

        this.config.maxbatchrecords = parseInt(config.maxbatchrecords) || 100;
        this.config.stream = (config.deliveryMethod == 'streaming') ? true : false;

        if (!this.connection) {
            node.status({
                fill: 'red',
                shape: 'ring',
                text: 'disconnected'
            });
            return;
        }

        this.sessionCounter = 0;
        this.sessions = {};
        this.next = (sessionId) => {
            let session = this.sessions[sessionId];
            if (!session) {
                this.error(`Session ${sessionId} not found`);
                return;
            }

            session.resume();
        };

        this.close = (sessionId) => {
            let session = this.sessions[sessionId];
            if (!session) {
                return;
            }

            session.cancel();

            delete this.sessions[sessionId];
        };

        node.on('input', async (msg, send, done) => {

            if (node.config.querySource === 'dynamic' && !msg.query)
                return;

            let pool = node.connection.getPool();
            if (!pool)
                return;

            if (!pool.connected) {
                node.status({ fill: 'yellow', shape: 'ring', text: 'connecting...' });
                try {
                    await pool.connect();
                } catch (e) {
                    console.error('[MSSQL Connect Error]', e.stack);
                    node.status({ fill: 'red', shape: 'ring', text: e.toString() });
                    done(e);
                    return;
                }
            }

            let tpl = node.tpl;
            if (msg.query) {
                // higher priority for msg.query
                tpl = sanitizedCmd(msg.query);
            }

            node.status({
                fill: 'blue',
                shape: 'dot',
                text: 'requesting'
            });

            // Prparing request
            let err = null;
            let rows = [];
            let request = pool.request();
            request.stream = true

            // Register session
            let sessionId = node.id + '-' + Date.now() + '-' + ++this.sessionCounter;
            this.sessions[sessionId] = request;

            request.on('row', (row) => {

                rows.push(row);

                // not streaming
                if (!node.config.stream)
                    return;

                if (rows.length < node.config.maxbatchrecords)
                    return;

                request.pause();

                if (node.config.outputPropType == 'msg') {
                    let m = Object.assign({}, msg);
                    if (m.sessions instanceof Array) {
                        m.sessions.push(sessionId);
                    } else {
                        m.sessions = [sessionId];
                    }

                    m[node.config.outputProp] = {
                        results: rows,
                        rowsAffected: rows.length,
                        complete: false,
                    }

                    node.status({
                        fill: 'blue',
                        shape: 'dot',
                        text: 'streaming'
                    });

                    node.send(m);

                    // Reset buffer
                    rows = [];
                }
            });

            request.on('done', (returnedValue) => {

                if (err) {
                    done(err);
                    return;
                }

                node.status({
                    fill: 'green',
                    shape: 'dot',
                    text: 'done'
                });

                // Preparing result
                if (node.config.outputPropType == 'msg') {
                    msg[node.config.outputProp] = {
                        results: rows,
                        rowsAffected: returnedValue.rowsAffected,
                        complete: true,
                    }
                }

                node.send(msg);

                // Find session to remove from msg.sessions
                let index = -1;
                if (msg.sessions instanceof Array) {
                    index = msg.sessions.indexOf(sessionId);
                }

                if (index > -1) {
                    msg.sessions.splice(index, 1);
                }

                // Reset buffer
                rows = [];

                done();

                delete this.sessions[sessionId];
            });

            request.on('error', (e) => {

                console.error('[MSSQL Query Error Stack]', e.stack);

                // Find session to remove from msg.sessions
                let index = -1;
                if (msg.sessions instanceof Array) {
                    deliveryMethod
                    index = msg.sessions.indexOf(sessionId);
                }

                if (index > -1) {
                    msg.sessions.splice(index, 1);
                }

                // Reset buffer
                rows = [];

                if (e.code == 'ECANCEL') {
                    return;
                }

                err = e;

                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: err.toString()
                });

                msg.error = {
                    code: err.code,
                    lineNumber: err.lineNumber,
                    message: err.message,
                    name: err.name,
                    number: err.number,
                };
                
                node.send(msg);

                delete this.sessions[sessionId];
            });

            let sql = null;
            try {
                sql = genQueryCmdParameters(tpl, msg);
            } catch (e) {
                node.error(e);
                done();
                return
            }

            // Execute SQL command
            request.query.apply(request, sql);
        });

        node.on('close', async () => {

            for (let sessionId in this.sessions) {
                let session = this.sessions[sessionId];
                session.cancel();
            }

            this.sessions = {};
        });
    }

    // Admin API
    const api = require('./apis');
    api.init(RED);

    RED.nodes.registerType('MSSQL Execute', ExecuteNode, {
        credentials: {
        }
    });
}
