module.exports = function(RED) {

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

		if (!this.connection) {
			node.status({
				fill: 'red',
				shape: 'ring',
				text: 'disconnected'
			});
			return;
		}

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
				} catch(e) {
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

			try {
				node.status({
					fill: 'blue',
					shape: 'dot',
					text: 'requesting'
				});

				let request = pool.request();
				let rs = await request.query.apply(request, genQueryCmdParameters(tpl, msg));

				node.status({
					fill: 'green',
					shape: 'dot',
					text: 'done'
				});

				// Preparing result
				if (node.config.outputPropType == 'msg') {
					msg[node.config.outputProp] = {
						results: rs.recordset || [],
						rowsAffected: rs.rowsAffected,
					}
				}

				node.send(msg);

				done();
			} catch(e) {
				console.error('[MSSQL Query Error Stack]', e.stack);
				
				node.status({
					fill: 'red',
					shape: 'ring',
					text: e.toString()
				});

				msg.error = {
					code: e.code,
					lineNumber: e.lineNumber,
					message: e.message,
					name: e.name,
					number: e.number,
				};
				
				node.send(msg);

				done(e);
			}
		});

		node.on('close', async () => {
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
