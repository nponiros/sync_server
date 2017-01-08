(function () {
  const URL = 'ws://localhost:3000';
  const items = [];
  let list;
  let ws;
  let clientIdentity;
  let syncedRevision = 0;
  let requestId = 0;
  let baseRevision = 0;

  function getID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
  }

  function renderList() {
    list.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
  }

  function onMessage(event) {
    const resp = JSON.parse(event.data);

    if (resp.type === 'clientIdentity') {
      console.log('Client identity', resp.clientIdentity);

      // Subscribe here to make sure that we have received the clientIdentity
      console.log('Send subscribe');
      ws.send(JSON.stringify({
        type: 'subscribe',
        syncedRevision,
      }));
    } else if (resp.type === 'changes') {
      syncedRevision = resp.currentRevision;
      items.push(...resp.changes.map((change) => change.obj.item));
      renderList(list, items);
    } else if (resp.type === 'error') {
      console.error('Message:', resp.errorMessage, 'RequestId:', resp.requestId);
    } else if (resp.type === 'ack') {
      baseRevision++;
      console.log('ack', resp.requestId);
    }
  }

  function initConnection() {
    ws = new WebSocket(URL);
    ws.onopen = function () {
      console.log('Send clientIdentity');
      ws.send(JSON.stringify({
        type: 'clientIdentity',
      }));
    };

    ws.onclose = function () {
      console.log('Connection closed');
    };

    ws.onerror = function () {
      console.error('Connection error');
    };

    ws.onmessage = onMessage;
  }

  window.addEventListener('load', () => {
    list = document.getElementById('list');
    const btn = document.getElementById('addBtn');
    const input = document.getElementById('itemInput');

    btn.addEventListener('click', () => {
      items.push(input.value);
      ws.send(JSON.stringify({
        type: 'changes',
        baseRevision,
        requestId,
        changes: [{
          type: 1, // Create
          key: getID(),
          table: 'items',
          obj: {item: input.value},
        }]
      }));
      requestId++;
      renderList();
    });

    initConnection();
  });
})();
