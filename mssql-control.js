module.exports = function(RED) {

  function ControlNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.action = config.action || 'continue';

    // Target MS-SQL Execute Node ID
    node.selectMode = config.selectMode || 'auto';
    node.selectedNodes = config.selectedNodes || [];

    node.on('input', function(msg, send, done) {

      if (!(msg.sessions instanceof Array)) {
        if (done)
          done();

        return;
      }

      // Handling multiple sessions
      let selectedNodes = (msg.selectMode == 'auto') ? [] : node.selectedNodes;
      msg.sessions.forEach(sessionId => {
        handleSession(selectedNodes, node.action, sessionId);
      });

      if (done) {
        done();
      }
    });

    function handleSession(allowedNodes, action, sessionId) {

      // get first part of the sessionId as target node id
      let index = sessionId.indexOf('-');
      if (index === -1) {
        return null;
      }

      let targetNodeId = sessionId.substring(0, index);

      // Check if the target node is in the allowed nodes list
      if (allowedNodes.length > 0 && allowedNodes.indexOf(targetNodeId) === -1) {
        // disallowed
        return null;
      }

      // Getting the target node by id
      let targetNode = RED.nodes.getNode(targetNodeId);
      if (!targetNode) {
        return null;
      }

      // Check if the sessionId is valid for the target node
      let session = targetNode.sessions[sessionId];
      if (!session) {
        return null;
      }

      // Perform action based on the node's action property
      switch(action) {
        case 'continue':
          // call function to continue
          if (typeof targetNode.next === 'function') {
            targetNode.next(sessionId);
          }
          break;
        case 'break':
          // call function to close session
          if (typeof targetNode.close === 'function') {
            targetNode.close(sessionId);
          }
          break;
        default:
          node.error(`Unknown action ${node.action}`, msg);
      }
    }
  }

  RED.nodes.registerType('MSSQL Control', ControlNode);
}
