module.exports = function(RED) {

  function ControlNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.action = config.action || 'continue';

    // Target MS-SQL Execute Node ID
    node.targetNodeId = config.targetNodeId;

    node.on('input', function(msg, send, done) {

      if (!(msg.sessions instanceof Array)) {
        if (done)
          done();

        return;
      }

      let targetNode = node.targetNodeId ? RED.nodes.getNode(node.targetNodeId) : null;
      let sessionId = null;
      let targetSession = null;
      if (targetNode) {

        // Find session from target node
        targetSession = msg.sessions.find(session => {
          sessionId = session;
          return targetNode.sessions[session];
        });

      } else {

        // Find the target node by session
        targetSession = msg.sessions.find(session => {
          targetNode = findNodeBySessionId(session);
          if (!targetNode) {
            return false;
          }

          sessionId = session;
          return targetNode.sessions[session];
        })
      }

      if (!targetSession) {
        node.warn(`No available session`);
        if (done)
          done();

        return;
      }

      // Check if the stream is already completed
      if (targetSession.isCompleted) {
        node.warn(`The session ${sessionId} is already completed, no need to continue`);

        if (done)
          done();

        return;
      }

      switch(node.action) {
      case 'continue':
        // call function to continue
        if (typeof targetNode.next === 'function') {
          targetNode.next(sessionId);

          if (done)
            done();
        }
        break;
      case 'break':
        // call function to close session
        if (typeof targetNode.close === 'function') {
          targetNode.close(sessionId);

          if (done)
            done();
        }
        break;
      default:
        node.error(`Unknown action ${node.action}`, msg);
        if (done)
          done();

        return;
      }

    });

    function findNodeBySessionId(sessionId) {
      let targetNode = null;

      // Traverse all nodes to find the MS-SQL Execute node with the given sessionId
      RED.nodes.eachNode(function(eachNode) {
        const node = RED.nodes.getNode(eachNode.id);
        if (node && node.sessions && node.sessions[sessionId]) {
          targetNode = node;
          return false; // Stop traversing
        }
      });

      return targetNode;
    }
  }

  RED.nodes.registerType('MSSQL Control', ControlNode);
}
