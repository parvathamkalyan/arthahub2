// Floating "Guide" chat widget — asks /api/chat, which uses the free
// Gemini API if configured, or canned setup answers otherwise.
(function () {
  const bubble = document.createElement('div');
  bubble.id = 'guide-bubble';
  bubble.textContent = 'A';
  document.body.appendChild(bubble);

  const panel = document.createElement('div');
  panel.id = 'guide-panel';
  panel.innerHTML = `
    <div id="guide-header">Guide — ask me about setup</div>
    <div id="guide-messages"></div>
    <div id="guide-input-row">
      <input id="guide-input" placeholder="e.g. Amazon account ela?" />
      <button id="guide-send">Go</button>
    </div>`;
  document.body.appendChild(panel);

  const messages = panel.querySelector('#guide-messages');
  const input = panel.querySelector('#guide-input');

  function addMsg(text, who) {
    const div = document.createElement('div');
    div.className = 'msg ' + who;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  addMsg('Hi! Setup గురించి ఏదైనా అడుగు — Amazon, Flipkart, dashboard, deploy...', 'bot');

  bubble.addEventListener('click', () => panel.classList.toggle('open'));

  async function send() {
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await r.json();
      addMsg(data.reply, 'bot');
    } catch (e) {
      addMsg('Connection error — server run అవుతోందో చూడు.', 'bot');
    }
  }

  panel.querySelector('#guide-send').addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
})();
