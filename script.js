// ---- Hero: staggered word-by-word fade-up (Framer-Motion style, in vanilla JS) ----
document.addEventListener('DOMContentLoaded', () => {
  const heading = document.querySelector('.hero-heading');
  if (!heading) return;

  // Wrap each word of the heading in its own animated span.
  const text = (heading.getAttribute('aria-label') || heading.textContent).trim();
  heading.textContent = '';
  const words = text.split(/\s+/).map((word, i) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = word;
    // first word at 0.15s, each subsequent word +0.08s
    span.style.transitionDelay = (0.15 + i * 0.08) + 's';
    heading.appendChild(span);
    return span;
  });

  // Reveal words + any .fade-up element once it scrolls into view.
  const targets = [...words, ...document.querySelectorAll('.fade-up')];
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target); // once: true
      }
    });
  }, { threshold: 0.2 });

  targets.forEach((el) => observer.observe(el));
});

// ---- Compost checker: Google Gemini with an offline fallback list ----
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.hero-form');
  if (!form) return; // only on the home page
  const input = document.getElementById('inputer');
  const modal = document.getElementById('compostModal');
  const modalBody = document.getElementById('modalMessage');

  const GEMINI_MODEL = 'gemini-2.5-flash';
  const KEY_STORE = 'gemini_api_key';

  // Small offline fallback so the tool still works without a key / network.
  const OFFLINE_COMPOSTABLE = [
    'vegetable scraps', 'fruit peels', 'fruit scraps', 'vegetable peels',
    'fruits', 'eggshells', 'coffee grounds', 'tea bags', 'paper', 'leaves',
    'grass', 'branches', 'sawdust', 'napkins', 'hay', 'sticks', 'banana peel'
  ];

  const VERDICTS = {
    compostable:     { label: 'Compostable',  icon: '♻️', cls: 'v-yes' },
    not_compostable: { label: 'Keep it out',  icon: '⛔', cls: 'v-no' },
    conditional:     { label: 'It depends',   icon: '⚠️', cls: 'v-maybe' },
  };

  // --- tiny DOM helper (uses text nodes, so item/AI text is safely escaped) ---
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'onclick') node.addEventListener('click', v);
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  // --- API key storage ---
  const getKey   = () => localStorage.getItem(KEY_STORE) || '';
  const setKey   = (k) => localStorage.setItem(KEY_STORE, k.trim());
  const clearKey = () => localStorage.removeItem(KEY_STORE);

  // --- modal open/close ---
  function openModal() {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  modal.querySelector('.close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
  });

  // --- Gemini call (structured JSON output) ---
  async function askGemini(item, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const body = {
      systemInstruction: {
        parts: [{ text:
          "You are a friendly home-composting expert. Given a single household item, decide " +
          "whether it can go into a typical backyard compost pile. Use verdict 'compostable' " +
          "if it's generally fine, 'not_compostable' if it should be kept out (e.g. meat, dairy, " +
          "plastic, glass, metal, treated wood), and 'conditional' when it depends (needs " +
          "shredding, only if untreated/unbleached, remove stickers, etc.). Keep the summary to " +
          "one or two plain sentences and give 2-4 short, practical tips."
        }]
      },
      contents: [{ parts: [{ text: `Item to check: ${item}` }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            item:    { type: 'STRING' },
            verdict: { type: 'STRING', enum: ['compostable', 'not_compostable', 'conditional'] },
            summary: { type: 'STRING' },
            tips:    { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['item', 'verdict', 'summary', 'tips'],
        },
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json())?.error?.message || ''; } catch (_) {}
      const err = new Error(detail || `Gemini request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned an empty response.');
    const parsed = JSON.parse(text);
    if (!VERDICTS[parsed.verdict]) parsed.verdict = 'conditional';
    return parsed;
  }

  // --- offline fallback ---
  function offlineCheck(item) {
    const ok = OFFLINE_COMPOSTABLE.includes(item.toLowerCase().trim());
    return {
      item,
      verdict: ok ? 'compostable' : 'conditional',
      summary: ok
        ? `“${item}” is on our offline compost-friendly list.`
        : `We couldn't reach the AI, so we can't say for sure about “${item}”. When in doubt, keep meat, dairy, oils and anything plastic or synthetic out of the pile.`,
      tips: [],
      offline: true,
    };
  }

  // --- render states ---
  function render(...nodes) {
    modalBody.replaceChildren(...nodes);
  }

  function renderLoading(item) {
    render(
      el('div', { class: 'result-loading' },
        el('div', { class: 'spinner', 'aria-hidden': 'true' }),
        el('p', {}, `Asking Gemini about “${item}”…`)
      )
    );
  }

  function renderResult(r) {
    const v = VERDICTS[r.verdict] || VERDICTS.conditional;
    render(
      el('div', { class: `verdict-badge ${v.cls}` }, `${v.icon} ${v.label}`),
      el('h3', { class: 'result-item' }, r.item || ''),
      el('p', { class: 'result-summary' }, r.summary || ''),
      r.tips && r.tips.length
        ? el('ul', { class: 'result-tips' }, r.tips.map((t) => el('li', {}, t)))
        : null,
      el('div', { class: 'result-footer' },
        r.offline ? el('span', { class: 'offline-note' }, 'Offline mode — AI unavailable') : null,
        el('button', { class: 'ghost-btn', onclick: () => { closeModal(); input.select(); input.focus(); } }, 'Check another')
      )
    );
  }

  function renderError(item, err) {
    const badKey = err.status === 400 || err.status === 403;
    render(
      el('div', { class: 'verdict-badge v-no' }, '⚠️ Something went wrong'),
      el('p', { class: 'result-summary' }, err.message || 'Could not reach Gemini.'),
      el('div', { class: 'result-footer' },
        el('button', { class: 'primary-btn', onclick: () => runCheck(item) }, 'Try again'),
        badKey
          ? el('button', { class: 'ghost-btn', onclick: () => { clearKey(); renderKeyForm(item); } }, 'Re-enter API key')
          : el('button', { class: 'ghost-btn', onclick: () => renderResult(offlineCheck(item)) }, 'Use offline check')
      )
    );
  }

  function renderKeyForm(item) {
    const field = el('input', {
      type: 'password', class: 'key-input', placeholder: 'Paste your Gemini API key…',
      autocomplete: 'off', spellcheck: 'false',
    });
    const save = () => {
      if (!field.value.trim()) { field.focus(); return; }
      setKey(field.value);
      runCheck(item);
    };
    render(
      el('h3', { class: 'result-item' }, 'Connect Google Gemini'),
      el('p', { class: 'result-summary' },
        'Enter a free Gemini API key to get smart answers for any item. It’s stored only in this browser.'),
      field,
      el('div', { class: 'result-footer' },
        el('button', { class: 'primary-btn', onclick: save }, 'Save & check'),
        el('a', { class: 'link-btn', href: 'https://aistudio.google.com/app/apikey', target: '_blank', rel: 'noopener' }, 'Get a key')
      )
    );
    field.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
    setTimeout(() => field.focus(), 50);
  }

  // --- main flow ---
  async function runCheck(item) {
    const key = getKey();
    if (!key) { openModal(); renderKeyForm(item); return; }
    openModal();
    renderLoading(item);
    try {
      renderResult(await askGemini(item, key));
    } catch (err) {
      renderError(item, err);
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const item = input.value.trim();
    if (!item) { input.focus(); return; }
    runCheck(item);
  });

  // "reset key" link under the form
  const resetLink = document.getElementById('resetKey');
  if (resetLink) {
    resetLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearKey();
      openModal();
      renderKeyForm(input.value.trim() || 'banana peel');
    });
  }
});

  document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const item = urlParams.get('item');
    const message = urlParams.get('message');
    const resultEl = document.getElementById('resultMessage');
    if (resultEl) resultEl.textContent = `${item} ${message}`;
});

function goBack() {
    window.history.back();
}

