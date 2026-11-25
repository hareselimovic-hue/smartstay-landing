/* SmartStay shared widgets (BS + EN by <html lang>):
 *   <div class="ssv" data-kind="APARTMENT|HOTEL|CHOOSE" [data-dark] [data-demo=url]></div> → "paste your link" form
 *       (CHOOSE = visitor picks apartment/hotel; data-demo adds a small "see the demo" link)
 *   <div class="ssc" data-calc="apartments|hotels"></div>             → one-plan price calculator
 *   <div class="ssr"></div>                                           → hotel ROI calculator
 * Prices must match guestio/src/lib/pricing.ts (apartments) and the hotel packages.
 */
(function () {
  var EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var API = window.SSV_API || 'https://app.smartstay.ba/api/guide-request';
  var REGISTER = 'https://app.smartstay.ba/register';
  // Apartments: the self-serve wizard (link → account → review → guide right away). Hotels keep the emailed guide.
  var START = window.SSV_START || 'https://app.smartstay.ba/start';
  function startUrl(link) { return START + '?' + (EN ? 'lang=en' : 'lang=bs') + (link ? '&link=' + encodeURIComponent(link) : ''); }

  var T = EN ? {
    urlPh: 'Link to your Airbnb or Booking listing', urlPhHotel: 'Your hotel on Booking.com, or your website',
    emailPh: 'your@email.com', btn: 'Make my guide →', sending: 'Sending…',
    platforms: 'Works with <b>Airbnb</b>, <b>Booking.com</b> or your own website',
    platformsHotel: 'Works with <b>Booking.com</b> or your hotel website',
    alt: 'No listing? <a href="{r}">Make it by hand →</a>',
    altHotel: 'No link? <a href="{r}">Set it up by hand →</a>',
    demo: '▶ See the demo',
    note: '✓ 30 days free · ✓ No credit card',
    kindApt: '🏠 Apartment', kindHotel: '🏨 Hotel', kindQ: 'What do you rent out?',
    subApt: 'Your guide is made from your Airbnb or Booking listing in a few minutes. You see it and edit it right away.',
    subHotel: 'Paste your hotel on Booking.com or your website. We prepare your hotel guide and send it to you by email.',
    okTitle: '✓ Thank you! We are making your guide.', okSub: 'We will send it to <b>{e}</b>. Can\'t wait? <a href="{r}">Create your account now →</a>',
    errUrl: 'Paste the link of your Airbnb or Booking listing (or your website).', errMail: 'Please enter a valid email.', errNet: 'Something went wrong. Please try again.',
    plan: 'All features included', qApt: 'How many apartments do you have?', qHotel: 'How many rooms does your hotel have?',
    month: '/ month', perApt: '{p} KM per apartment per month', perDay: 'That is {d} KM a day per apartment.',
    anchorNight: 'Less than one night\'s rent a month, for all your apartments.',
    pkg: '{n} package', custom: 'Custom offer', customSub: 'For hotels with more than 80 rooms we prepare an offer.',
    cta: 'Make your guide for free →', small: '30 days free, no credit card. Then it simply continues.',
    aptFeats: ['Digital guide for every apartment', 'AI assistant answers guests 24/7', '5 languages, translated automatically', 'Guests register themselves before arrival', 'Team access and analytics', 'Link, QR code, WhatsApp and Viber sharing'],
    hotelFeats: ['Requests to reception with status for the guest', 'Room service, extra services and bookings', 'Announcements to all guests in one click', 'AI assistant and 5 languages', 'Room-specific information', 'Unlimited staff accounts'],
    rRooms: 'Rooms', rOcc: 'Occupancy %', rTake: '% of stays that order something', rAvg: 'Average order (KM)',
    rRev: 'extra sales per month', rPrice: 'SmartStay per month', rX: 'pays for itself', rXcover: 'of the price covered',
    rFine: 'An estimate: average stay of 2 nights, 30 days a month. Enter your own numbers: breakfast to the room, airport transfer, late check-out, spa or a bottle of wine.',
    apt: ['apartment', 'apartments'], room: ['room', 'rooms']
  } : {
    urlPh: 'Link vašeg Airbnb ili Booking oglasa', urlPhHotel: 'Vaš hotel na Bookingu ili vaš sajt',
    emailPh: 'vas@email.com', btn: 'Napravi moj vodič →', sending: 'Šaljem…',
    platforms: 'Radi sa <b>Airbnb</b>, <b>Booking.com</b> ili vašim sajtom',
    platformsHotel: 'Radi s <b>Booking.com</b> ili sajtom vašeg hotela',
    alt: 'Nemate oglas? <a href="{r}">Napravite ručno →</a>',
    altHotel: 'Nemate link? <a href="{r}">Postavite ručno →</a>',
    demo: '▶ Pogledajte demo',
    note: '✓ 30 dana besplatno · ✓ Bez kreditne kartice',
    kindApt: '🏠 Apartman', kindHotel: '🏨 Hotel', kindQ: 'Šta izdajete?',
    subApt: 'Vodič se napravi iz vašeg Airbnb ili Booking oglasa za par minuta. Odmah ga vidite i uredite.',
    subHotel: 'Zalijepite link vašeg hotela na Bookingu ili vaš sajt. Pripremimo vodič za vaš hotel i pošaljemo ga na mail.',
    okTitle: '✓ Hvala! Pravimo vaš vodič.', okSub: 'Šaljemo ga na <b>{e}</b>. Ne želite čekati? <a href="{r}">Napravite nalog odmah →</a>',
    errUrl: 'Zalijepite link vašeg Airbnb ili Booking oglasa (ili vašeg sajta).', errMail: 'Upišite ispravan email.', errNet: 'Nešto nije u redu. Pokušajte ponovo.',
    plan: 'Sve funkcije uključene', qApt: 'Koliko apartmana imate?', qHotel: 'Koliko soba ima vaš hotel?',
    month: '/ mjesečno', perApt: '{p} KM po apartmanu mjesečno', perDay: 'To je {d} KM dnevno po apartmanu.',
    anchorNight: 'Manje od jednog noćenja mjesečno, za sve vaše apartmane.',
    pkg: 'Paket {n}', custom: 'Po dogovoru', customSub: 'Za hotele s više od 80 soba pravimo ponudu.',
    cta: 'Napravite vodič besplatno →', small: '30 dana besplatno, bez kreditne kartice. Nakon toga samo nastavite.',
    aptFeats: ['Digitalni vodič za svaki apartman', 'AI asistent odgovara gostima 24/7', '5 jezika, automatski prevod', 'Gosti se sami prijave prije dolaska', 'Tim pristup i analitika', 'Link, QR kod, WhatsApp i Viber dijeljenje'],
    hotelFeats: ['Zahtjevi recepciji sa statusom za gosta', 'Room service, dodatne usluge i rezervacije', 'Obavijesti svim gostima jednim klikom', 'AI asistent i 5 jezika', 'Posebne informacije po sobi', 'Neograničen broj članova osoblja'],
    rRooms: 'Broj soba', rOcc: 'Popunjenost %', rTake: '% boravaka s narudžbom', rAvg: 'Prosječna narudžba (KM)',
    rRev: 'dodatne prodaje mjesečno', rPrice: 'SmartStay mjesečno', rX: 'puta se isplati', rXcover: 'cijene pokriveno',
    rFine: 'Procjena: prosječan boravak 2 noćenja, 30 dana u mjesecu. Upišite svoje brojeve: doručak u sobu, transfer s aerodroma, kasni check-out, spa ili vino u sobi.',
    apt: ['apartman', 'apartmana'], room: ['soba', 'soba']
  };

  function fmt(n, dec) {
    var d = dec == null ? 2 : dec;
    // bs: 1.234,56 · en: 1,234.56
    return n.toLocaleString(EN ? 'en-US' : 'de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function registerUrl(kind) { return kind === 'HOTEL' ? REGISTER + '?type=hotel' : startUrl(''); }

  // ── "Vodič iz linka" form ──────────────────────────────────────────────────────────────────
  function linkForm(box) {
    var choose = box.getAttribute('data-kind') === 'CHOOSE';
    var kind = box.getAttribute('data-kind') === 'HOTEL' ? 'HOTEL' : 'APARTMENT';
    var demo = box.getAttribute('data-demo');
    if (box.hasAttribute('data-dark')) box.classList.add('on-dark');
    if (box.hasAttribute('data-center')) box.classList.add('center');
    box.innerHTML =
      (choose ? '<div class="ssv-kind" role="radiogroup" aria-label="' + esc(T.kindQ) + '">' +
        '<button type="button" role="radio" data-k="APARTMENT">' + esc(T.kindApt) + '</button>' +
        '<button type="button" role="radio" data-k="HOTEL">' + esc(T.kindHotel) + '</button></div>' : '') +
      '<div class="ssv-platforms"></div>' +
      '<form class="ssv-form" novalidate>' +
        '<input class="ssv-input ssv-url" type="url" inputmode="url" autocomplete="url" required>' +
        '<div class="ssv-row">' +
          '<input class="ssv-input ssv-email" type="email" autocomplete="email" required placeholder="' + esc(T.emailPh) + '" aria-label="Email">' +
          '<button class="ssv-btn" type="submit">' + esc(T.btn) + '</button>' +
        '</div>' +
      '</form>' +
      '<div class="ssv-foot"><div class="ssv-note">' + esc(T.note) + '</div>' +
        '<div class="ssv-alt"><span class="ssv-alt-txt"></span>' + (demo ? '<a class="ssv-demo" href="' + esc(demo) + '"' + (demo.charAt(0) === '#' ? '' : ' target="_blank" rel="noopener"') + '>' + esc(T.demo) + '</a>' : '') + '</div></div>';
    function setKind(k) {
      kind = k;
      var ph = kind === 'HOTEL' ? T.urlPhHotel : T.urlPh;
      var u = box.querySelector('.ssv-url'); u.placeholder = ph; u.setAttribute('aria-label', ph);
      box.querySelector('.ssv-platforms').innerHTML = kind === 'HOTEL' ? T.platformsHotel : T.platforms;
      box.querySelector('.ssv-alt-txt').innerHTML = (kind === 'HOTEL' ? T.altHotel : T.alt).replace('{r}', registerUrl(kind));
      // Apartments don't leave an email here: the wizard asks for it when they create the account
      box.querySelector('.ssv-email').hidden = kind !== 'HOTEL';
      // Home hero card: apartments see their guide right away, hotels get it by email
      var sub = box.closest('.hero-card') && box.closest('.hero-card').querySelector('.hc-sub');
      if (sub) sub.textContent = kind === 'HOTEL' ? T.subHotel : T.subApt;
      box.querySelectorAll('.ssv-kind button').forEach(function (b) {
        var on = b.getAttribute('data-k') === kind; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    box.querySelectorAll('.ssv-kind button').forEach(function (b) { b.addEventListener('click', function () { setKind(b.getAttribute('data-k')); }); });
    setKind(kind);
    var form = box.querySelector('form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = box.querySelector('.ssv-url').value.trim();
      var email = box.querySelector('.ssv-email').value.trim();
      var btn = box.querySelector('.ssv-btn');
      var old = box.querySelector('.ssv-err'); if (old) old.remove();
      function err(msg) { var d = document.createElement('div'); d.className = 'ssv-err'; d.textContent = msg; form.insertAdjacentElement('afterend', d); }
      if (url.length < 4 || url.indexOf('.') < 0) return err(T.errUrl);
      if (kind !== 'HOTEL') {
        try { if (window.gtag) window.gtag('event', 'generate_lead', { method: 'guide_wizard', kind: kind }); } catch (_) {}
        window.location.href = startUrl(url);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(T.errMail);
      btn.disabled = true; var label = btn.textContent; btn.textContent = T.sending;
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url, email: email, kind: kind, lang: EN ? 'en' : 'bs' }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok || r.status === 429, d: d }; }); })
        .then(function (res) {
          btn.disabled = false; btn.textContent = label;
          if (!res.ok) return err((res.d && res.d.error) || T.errNet);
          var reg = REGISTER + '?' + (kind === 'HOTEL' ? 'type=hotel&' : '') + 'email=' + encodeURIComponent(email);
          box.innerHTML = '<div class="ssv-ok"><div class="ssv-ok-title">' + esc(T.okTitle) + '</div><div class="ssv-ok-sub">' +
            T.okSub.replace('{e}', esc(email)).replace('{r}', reg) + '</div></div>';
          try { if (window.gtag) window.gtag('event', 'generate_lead', { method: 'guide_link', kind: kind }); } catch (_) {}
        })
        .catch(function () { btn.disabled = false; btn.textContent = label; err(T.errNet); });
    });
  }

  function scrollToForm(e) {
    var target = document.querySelector('#vodic .ssv, .ssv');
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { var i = target.querySelector('.ssv-url'); if (i) i.focus({ preventScroll: true }); }, 500);
  }

  // ── Price calculators ──────────────────────────────────────────────────────────────────────
  function aptPrice(n) { var p = n <= 3 ? 9.99 : n <= 10 ? 7.99 : 5.99; return { per: p, total: Math.round(p * n * 100) / 100 }; }
  // Same as guestio/src/lib/pricing.ts hotelPackage(): above 80 rooms 169 KM + 1,50 KM per extra room
  function hotelPkg(rooms) {
    if (rooms <= 7) return { name: 'Mini', price: 59 };
    if (rooms <= 15) return { name: EN ? 'Small' : 'Mali', price: 79 };
    if (rooms <= 40) return { name: EN ? 'Medium' : 'Srednji', price: 119 };
    if (rooms <= 80) return { name: EN ? 'Large' : 'Veliki', price: 169 };
    return { name: EN ? 'Large' : 'Veliki', price: Math.round((169 + (rooms - 80) * 1.5) * 100) / 100, extra: rooms - 80 };
  }
  function plural(n, w) { return n === 1 ? w[0] : w[1]; }

  function calc(box) {
    var hotel = box.getAttribute('data-calc') === 'hotels';
    var start = hotel ? 20 : 5, max = hotel ? 120 : 60;
    box.innerHTML =
      '<div class="ssc-l">' +
        '<div class="ssc-plan">' + esc(T.plan) + '</div>' +
        '<div class="ssc-q">' + esc(hotel ? T.qHotel : T.qApt) + '</div>' +
        '<div class="ssc-count"><button type="button" class="ssc-step" data-d="-1" aria-label="−">−</button>' +
          '<input class="ssc-num" type="number" min="1" max="999" value="' + start + '" inputmode="numeric" aria-label="' + esc(hotel ? T.qHotel : T.qApt) + '">' +
          '<button type="button" class="ssc-step" data-d="1" aria-label="+">+</button></div>' +
        '<input class="ssc-range" type="range" min="1" max="' + max + '" value="' + start + '" aria-hidden="true" tabindex="-1">' +
        '<div class="ssc-total"></div><div class="ssc-per"></div><div class="ssc-anchor"></div>' +
      '</div>' +
      '<div class="ssc-r"><div class="ssc-feats">' + (hotel ? T.hotelFeats : T.aptFeats).map(function (f) { return '<div>' + esc(f) + '</div>'; }).join('') + '</div>' +
        '<a class="ssc-cta" href="' + registerUrl(hotel ? 'HOTEL' : 'APARTMENT') + '">' + esc(T.cta) + '</a>' +
        '<div class="ssc-small">' + esc(T.small) + '</div></div>';
    var num = box.querySelector('.ssc-num'), range = box.querySelector('.ssc-range');
    var total = box.querySelector('.ssc-total'), per = box.querySelector('.ssc-per'), anchor = box.querySelector('.ssc-anchor');
    if (hotel) box.querySelector('.ssc-cta').addEventListener('click', scrollToForm);
    function render(n) {
      n = Math.max(1, Math.min(999, Math.round(n) || 1));
      num.value = n; range.value = Math.min(n, max);
      if (hotel) {
        var pk = hotelPkg(n);
        if (!pk) { total.innerHTML = esc(T.custom); per.textContent = T.customSub; anchor.style.display = 'none'; return; }
        total.innerHTML = fmt(pk.price, pk.price % 1 ? 2 : 0) + ' KM <small>' + esc(T.month) + '</small>';
        per.textContent = T.pkg.replace('{n}', pk.name) + ' · ' + n + ' ' + plural(n, T.room) + (pk.extra ? (EN ? ' (169 KM + ' + pk.extra + ' × 1.50 KM)' : ' (169 KM + ' + pk.extra + ' × 1,50 KM)') : '');
        anchor.style.display = '';
        anchor.textContent = EN ? 'That is ' + fmt(pk.price / n / 30, 2) + ' KM a day per room.' : 'To je ' + fmt(pk.price / n / 30, 2) + ' KM dnevno po sobi.';
      } else {
        var p = aptPrice(n);
        total.innerHTML = fmt(p.total) + ' KM <small>' + esc(T.month) + '</small>';
        per.textContent = n + ' ' + plural(n, T.apt) + ' · ' + T.perApt.replace('{p}', fmt(p.per));
        // The "one night" anchor is only true for small portfolios; otherwise show the daily price
        anchor.textContent = p.total <= 60 ? T.anchorNight : T.perDay.replace('{d}', fmt(p.per / 30, 2));
      }
    }
    num.addEventListener('input', function () { render(+num.value); });
    range.addEventListener('input', function () { render(+range.value); });
    box.querySelectorAll('.ssc-step').forEach(function (b) { b.addEventListener('click', function () { render(+num.value + (+b.getAttribute('data-d'))); }); });
    render(start);
  }

  // ── Hotel ROI ──────────────────────────────────────────────────────────────────────────────
  function roi(box) {
    function field(id, label, val) { return '<div><label for="' + id + '">' + esc(label) + '</label><input id="' + id + '" type="number" min="0" inputmode="decimal" value="' + val + '"></div>'; }
    box.innerHTML = '<div class="ssr-grid">' + field('ssr-rooms', T.rRooms, 20) + field('ssr-occ', T.rOcc, 60) + field('ssr-take', T.rTake, 10) + field('ssr-avg', T.rAvg, 25) + '</div>' +
      '<div class="ssr-out"><div class="ssr-box"><div class="ssr-v" id="ssr-rev"></div><div class="ssr-l">' + esc(T.rRev) + '</div></div>' +
      '<div class="ssr-box"><div class="ssr-v" id="ssr-price"></div><div class="ssr-l">' + esc(T.rPrice) + '</div></div>' +
      '<div class="ssr-box hi"><div class="ssr-v" id="ssr-x"></div><div class="ssr-l" id="ssr-xl"></div></div></div>' +
      '<p class="ssr-fine">' + esc(T.rFine) + '</p>';
    var g = function (id) { return Math.max(0, parseFloat(String(box.querySelector('#' + id).value).replace(',', '.')) || 0); };
    function render() {
      var rooms = Math.round(g('ssr-rooms')), occ = Math.min(g('ssr-occ'), 100) / 100, take = Math.min(g('ssr-take'), 100) / 100, avg = g('ssr-avg');
      var stays = rooms * occ * 30 / 2, rev = stays * take * avg;
      var pk = hotelPkg(Math.max(rooms, 1));
      box.querySelector('#ssr-rev').textContent = fmt(rev, 0) + ' KM';
      box.querySelector('#ssr-price').textContent = fmt(pk.price, pk.price % 1 ? 2 : 0) + ' KM';
      var x = pk && pk.price ? rev / pk.price : 0;
      box.querySelector('#ssr-x').textContent = !pk ? '—' : x >= 1 ? fmt(x, 1) + '×' : fmt(x * 100, 0) + '%';
      box.querySelector('#ssr-xl').textContent = x >= 1 ? T.rX : T.rXcover;
    }
    box.querySelectorAll('input').forEach(function (i) { i.addEventListener('input', render); });
    render();
  }

  function init() {
    document.querySelectorAll('.ssv[data-kind]').forEach(linkForm);
    document.querySelectorAll('.ssc[data-calc]').forEach(calc);
    document.querySelectorAll('.ssr').forEach(roi);
    // Every "Napravite vodič besplatno" button scrolls to the nearest link form
    document.querySelectorAll('[data-to-form]').forEach(function (a) { a.addEventListener('click', scrollToForm); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
