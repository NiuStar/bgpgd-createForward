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
  const log = document.getElementById('log');
  const status = document.getElementById('status');
  const successes = [];
  const failures = [];
  for (let port = start; port <= end; port++) {
    const url = `${baseUrl}&modop=custom&a=createForward`;
    const body = `protocol=3&ext_port=${port}&int_port=${port}&name=`;
    log.textContent += `Port ${port}\n`;
    log.textContent += `  URL: ${url}\n`;
    log.textContent += `  Cookie: ${cookie}\n`;
    log.textContent += `  Params: ${body}\n`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookie
        },
        body
      });
      const text = await res.text();
      log.textContent += `  Response: ${text}\n`;
      let data;
      try { data = JSON.parse(text); } catch {}
      if (data && data.status === 'success') {
        successes.push(port);
      } else {
        failures.push({ port, response: text });
      }
    } catch (e) {
      log.textContent += `  Error: ${e}\n`;
      failures.push({ port, response: e.toString() });
    }
  }
  log.textContent += `Success ports: ${successes.join(', ') || 'none'}\n`;
  if (failures.length) {
    log.textContent += 'Failed ports:\n';
    failures.forEach(f => {
      log.textContent += `  ${f.port}: ${f.response}\n`;
    });
  } else {
    log.textContent += 'Failed ports: none\n';
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
