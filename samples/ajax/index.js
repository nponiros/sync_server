(function () {
  const URL = 'http://localhost:3000';
  const items = [];
  const changes = [];
  let list;
  let clientIdentity;
  let syncedRevision = 0;
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

  function sync() {
    const dataToSend = {
      baseRevision,
      changes,
      clientIdentity,
      syncedRevision,
    };
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    fetch(URL, {
      headers,
      method: 'POST',
      body: JSON.stringify(dataToSend),
      mode: 'cors',
    })
    .then((resp) => resp.json())
    .then((data) => {
      if (data.success) {
        syncedRevision = data.currentRevision;
        clientIdentity = data.clientIdentity;
        baseRevision++;
        items.push(...data.changes.map((change) => change.obj.item));
        renderList();
      } else {
        console.error('Error:', data.errorMessage, data);
      }
    })
    .catch((e) => {
      console.error(e);
    });
  }

  window.addEventListener('load', () => {
    list = document.getElementById('list');
    const btn = document.getElementById('addBtn');
    const input = document.getElementById('itemInput');

    btn.addEventListener('click', () => {
      items.push(input.value);
      changes.push({
        type: 1, // Create
        key: getID(),
        table: 'items',
        obj: {item: input.value},
      });
      renderList();
    });

    sync();
    setInterval(sync, 2000);
  });
})();
