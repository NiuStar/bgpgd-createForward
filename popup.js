async function getCookieString(url) {
  return new Promise(resolve => {
    chrome.cookies.getAll({ url }, cookies => {
      const str = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      resolve(str);
    });
  });
}

async function createForward(id, start, end) {
  const baseUrl = `https://bgp.gd/clientarea.php?action=productdetails&id=${id}`;
  const cookie = await getCookieString(baseUrl);
  const status = document.getElementById('status');
  for (let port = start; port <= end; port++) {
    const body = `protocol=3&ext_port=${port}&int_port=${port}&name=`;
    try {
      const res = await fetch(`${baseUrl}&modop=custom&a=createForward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookie
        },
        body
      });
      if (!res.ok) {
        status.textContent = `Error on port ${port}: ${res.status}`;
        return;
      }
    } catch (e) {
      status.textContent = `Request failed on port ${port}`;
      return;
    }
  }
  status.textContent = 'Done';
}

document.getElementById('submit').addEventListener('click', async () => {
  const start = parseInt(document.getElementById('start').value, 10);
  const end = parseInt(document.getElementById('end').value, 10);
  if (isNaN(start) || isNaN(end) || start > end) {
    document.getElementById('status').textContent = 'Invalid ports';
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  const id = url.searchParams.get('id');
  if (!id) {
    document.getElementById('status').textContent = 'Cannot find id parameter';
    return;
  }
  createForward(id, start, end);
});
