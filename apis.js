module.exports = {
	init: init 
};

function init(RED) {
	var prefix = '/nodes/atomic-mssql/apis';

	RED.httpAdmin.post(prefix + '/execute', RED.auth.needsPermission('flows.write'), function(req, res) {

		let connection = RED.nodes.getNode(req.body.connection);
		if (!connection) {
			res.end();
			return;
		}

		let pool = connection.getPool();
		if (!pool)
			return;


		(async () => {

			try {
				let rs = await request(pool, req.body.query);

				res.json({
					success: true,
					finished: rs.finished,
					results: rs.recordset || [],
					rowsAffected: rs.rowsAffected,
				});
			} catch(e) {
				console.error(e);

				res.json({
					success: false,
					error: {
						class: e.originalError.info.class,
						state: e.originalError.info.state,
						number: e.originalError.info.number,
						lineNumber: e.originalError.info.lineNumber,
						message: e.originalError.info.message
					}
				});
			}
		})();
	});
}

function request(pool, query) {

	return new Promise((resolve, reject) => {

		// Create request
		let request = pool.request();
		request.stream = true;
		request.query(query);

		request.on('error', err => {
			if (err.code == 'ECANCEL') {
				return;
			}
			reject(err);
		});

		let rows = [];
		request.on('row', row => {

			// Do not return results which are more than 1,000
			if (rows.length == 1000) {
				request.pause();
				resolve({
					finished: false,
					recordset: rows,
					rowsAffected: rowsAffected,
				});

				return;
			}

			rows.push(row);
		});

		let rowsAffected = []
		request.on('rowsaffected', rowCount => {
			rowsAffected.push(rowCount);
		});

		request.on('done', result => {
			resolve({
				finished: true,
				recordset: rows,
				rowsAffected: rowsAffected,
				output: result.output,
			});
		});
	});
}
