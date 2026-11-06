// SmartStay — Resursi: kopiranje/printanje šablona, opcije, checkliste

function tplText(lang) {
  const tpl = document.getElementById('tpl');
  const out = [];
  const titles = (tpl.dataset.title || 'Šablon / Template').split(' / ');
  out.push((lang === 'en' ? titles[1] || titles[0] : lang === 'bs' ? titles[0] : titles.join(' / ')).toUpperCase(), '');

  tpl.querySelectorAll('.tpl-sec').forEach(sec => {
    const hBs = sec.dataset.hBs || '', hEn = sec.dataset.hEn || '';
    const h = lang === 'en' ? (hEn || hBs) : lang === 'bs' || !hEn ? hBs : hBs + ' / ' + hEn;
    out.push(h.toUpperCase());

    sec.querySelectorAll('.chk').forEach(c => {
      out.push((c.querySelector('input').checked ? '☑ ' : '☐ ') + c.querySelector('span').textContent.trim());
    });

    sec.querySelectorAll('.tpl-row:not(.off)').forEach(row => {
      const bs = row.querySelector('.bs').textContent.trim();
      const en = row.querySelector('.en') ? row.querySelector('.en').textContent.trim() : '';
      if (lang !== 'en') out.push('• ' + bs);
      if (lang === 'both' && en) out.push('  ' + en);
      if (lang === 'en') out.push('• ' + en);
    });
    out.push('');
  });
  return out.join('\n').trim();
}

function toast(msg) {
  const t = document.getElementById('copyToast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

function copyTpl(lang) {
  const text = tplText(lang || 'both');
  const done = () => toast('Kopirano ✓');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast('Kopiranje nije uspjelo, označite tekst ručno.'); }
  ta.remove();
}

function printTpl() {
  document.body.classList.add('print-tpl');
  window.print();
  setTimeout(() => document.body.classList.remove('print-tpl'), 500);
}

// Izbor između dvije varijante pravila (npr. ljubimci dozvoljeni / nisu)
document.querySelectorAll('.opt-switch').forEach(sw => {
  const sec = sw.closest('.tpl-sec');
  sw.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      sw.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
      sec.querySelectorAll('.tpl-row[data-opt]').forEach(r => r.classList.toggle('off', r.dataset.opt !== btn.dataset.opt));
    });
  });
});

// Checklista: pamti označeno u browseru
(function () {
  const tpl = document.getElementById('tpl');
  if (!tpl || !tpl.querySelector('.chk')) return;
  const key = 'smartstay-check-' + location.pathname;
  const boxes = [...tpl.querySelectorAll('.chk input')];
  const progress = document.getElementById('chkProgress');
  const update = () => {
    const done = boxes.filter(b => b.checked).length;
    if (progress) progress.textContent = done + ' / ' + boxes.length;
    try { localStorage.setItem(key, JSON.stringify(boxes.map(b => b.checked))); } catch (e) {}
  };
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    boxes.forEach((b, i) => { b.checked = !!saved[i]; });
  } catch (e) {}
  boxes.forEach(b => b.addEventListener('change', update));
  window.resetChecklist = () => { boxes.forEach(b => { b.checked = false; }); update(); };
  update();
})();
