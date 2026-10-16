/* LEXI Protocol website v3: progressive enhancement only.
   Every fact on the site is present in raw HTML. This file adds the nav
   state and mobile menu, one-shot reveals, the hero entrance, the credential
   card tilt, the footer year, the data-event analytics hook (Plausible) and
   the contact form submit (Formspree, with a plain-email composer fallback).
   The page reads completely with this file absent or blocked. */
(function () {
  'use strict';

  var d = document, h = d.documentElement;
  var CONFIG = {
    formEndpoint: 'https://formspree.io/f/mdaqqzje',
    thanks: '/contact/thanks/',
    email: 'info@lexiprotocol.com'
  };
  var rm = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  /* ---- Analytics hook: every [data-event] click forwards to Plausible when present ---- */
  function track(name, props) {
    if (window.plausible) { window.plausible(name, { props: props || {} }); }
  }
  d.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-event]') : null;
    if (el) track(el.getAttribute('data-event'), { page: location.pathname });
  });

  /* ---- Nav: scrolled state, active item, mobile menu ---- */
  var top = d.getElementById('top');
  if (top) {
    var onS = function () { top.classList.toggle('on', window.scrollY > 12); };
    window.addEventListener('scroll', onS, { passive: true });
    onS();
  }
  var nl = d.getElementById('nav-list');
  if (nl && !nl.querySelector('[aria-current="page"]')) {
    var seg = '/' + (location.pathname.split('/')[1] || '') + '/';
    if (seg !== '//') {
      var links = nl.querySelectorAll('a');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href') || '';
        if (href === seg || (href !== '/' && seg.indexOf(href) === 0)) { links[i].setAttribute('aria-current', 'page'); break; }
      }
    }
  }
  var mb = d.querySelector('.menu');
  if (mb && nl) {
    var setOpen = function (o) { nl.classList.toggle('open', o); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); mb.textContent = o ? 'Close' : 'Menu'; };
    mb.addEventListener('click', function () { setOpen(!nl.classList.contains('open')); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nl.classList.contains('open')) { setOpen(false); mb.focus(); } });
    d.addEventListener('click', function (e) { if (nl.classList.contains('open') && !nl.contains(e.target) && e.target !== mb) setOpen(false); });
  }

  /* ---- One-shot reveals: synchronous pass for anything already in view, then the observer,
          then a timed fallback so nothing ever stays hidden ---- */
  var els = d.querySelectorAll('.rv');
  function showAll() { for (var i = 0; i < els.length; i++) els[i].classList.add('in'); }
  var vh = window.innerHeight || h.clientHeight;
  for (var k = 0; k < els.length; k++) {
    var rb = els[k].getBoundingClientRect();
    if (rb.top < vh && rb.bottom > 0) els[k].classList.add('in');
  }
  var io = null;
  if (!rm.matches && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    for (var j = 0; j < els.length; j++) { if (!els[j].classList.contains('in')) io.observe(els[j]); }
    setTimeout(showAll, 2600);
  } else { showAll(); }

  /* ---- Hero entrance (card rise, node fade; 400 ms, one shot) ---- */
  var stage = d.getElementById('stage');
  if (stage && !rm.matches) stage.classList.add('play');

  /* ---- Credential card tilt: capped at 3 degrees, transform only, desktop only, unbound under reduced motion ---- */
  var card = d.getElementById('card');
  function tilt(e) {
    var r = stage.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--rx', (-y * 3).toFixed(2) + 'deg');
    card.style.setProperty('--ry', (x * 3).toFixed(2) + 'deg');
  }
  function reset() { if (card) { card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); } }
  function bind() { if (!card || !stage || window.innerWidth < 1000) return; stage.addEventListener('pointermove', tilt); stage.addEventListener('pointerleave', reset); }
  function unbind() { if (!card || !stage) return; stage.removeEventListener('pointermove', tilt); stage.removeEventListener('pointerleave', reset); reset(); }
  if (!rm.matches) bind();
  var onRM = function (ev) {
    if (ev.matches) { unbind(); showAll(); if (io) io.disconnect(); if (stage) stage.classList.remove('play'); }
    else { bind(); }
  };
  if (rm.addEventListener) rm.addEventListener('change', onRM); else if (rm.addListener) rm.addListener(onRM);

  /* ---- Footer year ---- */
  var yr = d.querySelectorAll('[data-year]');
  for (var y = 0; y < yr.length; y++) yr[y].textContent = String(new Date().getFullYear());

  /* ---- Contact intake: Formspree AJAX submit with our own thanks page; composer fallback ---- */
  var form = d.getElementById('intake');
  if (form) {
    var out = d.getElementById('compose-out');
    var copyBtn = d.getElementById('copy-request');
    var mailtoLink = d.getElementById('mailto-fallback');
    var composeRow = d.getElementById('compose-row');
    var submitRow = d.getElementById('submit-row');

    /* Preselect "You are" from ?you= (progressive enhancement) */
    var sel = d.getElementById('f-you');
    try {
      var p = new URLSearchParams(location.search).get('you');
      if (p && sel) {
        for (var o = 0; o < sel.options.length; o++) {
          if (sel.options[o].value.toLowerCase().indexOf(p.toLowerCase()) === 0) { sel.selectedIndex = o; break; }
        }
      }
    } catch (err) { /* no URLSearchParams; the default option stands */ }

    if (CONFIG.formEndpoint) {
      form.setAttribute('action', CONFIG.formEndpoint);
      form.setAttribute('method', 'POST');
      if (composeRow) composeRow.hidden = true;
      if (submitRow) submitRow.hidden = false;
    }
    function fieldVal(id) { var f = d.getElementById(id); return f ? f.value.trim() : ''; }
    function validate() {
      var ok = true;
      var email = d.getElementById('f-email');
      if (email) {
        var bad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim());
        var row = email.closest('.row'); if (row) row.classList.toggle('invalid', bad);
        if (bad) ok = false;
      }
      if (sel) {
        var badSel = !sel.value;
        var row2 = sel.closest('.row'); if (row2) row2.classList.toggle('invalid', badSel);
        if (badSel) ok = false;
      }
      return ok;
    }
    function composed() {
      var you = fieldVal('f-you') || 'Something else';
      var subj = 'LEXI: ' + you;
      var body = 'You are: ' + you + '\n' +
        'Email: ' + fieldVal('f-email') + '\n' +
        'Organisation: ' + (fieldVal('f-org') || '(not given)') + '\n\n' +
        (fieldVal('f-detail') || '(no message)');
      return { subject: subj, body: body };
    }
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        if (!validate()) return;
        var c = composed();
        var text = 'To: ' + CONFIG.email + '\nSubject: ' + c.subject + '\n\n' + c.body;
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
          .then(function () { copyBtn.textContent = 'Copied. Paste it into any email client.'; })
          .catch(function () { /* clipboard unavailable; the visible text below still works */ });
        if (out) { out.style.display = 'block'; out.textContent = text; }
        if (mailtoLink) {
          mailtoLink.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(c.subject) + '&body=' + encodeURIComponent(c.body);
          mailtoLink.hidden = false;
        }
        track('intake-composed', { you: fieldVal('f-you') });
      });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!CONFIG.formEndpoint || !validate()) return;
      var btn = form.querySelector('#submit-row button');
      var oldLabel = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending'; }
      function fail() {
        if (btn) { btn.disabled = false; btn.textContent = oldLabel; }
        var err = d.getElementById('submit-err');
        if (!err && submitRow) {
          err = d.createElement('p');
          err.id = 'submit-err';
          err.className = 'submit-err';
          err.textContent = 'That did not go through. Use the composer below, or write to ' + CONFIG.email + ' directly.';
          submitRow.appendChild(err);
        }
        if (composeRow) composeRow.hidden = false;
      }
      fetch(CONFIG.formEndpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
        .then(function (res) {
          if (res.ok) { track('intake-submitted', { you: fieldVal('f-you') }); window.location.href = CONFIG.thanks; }
          else { fail(); }
        }).catch(fail);
    });
  }
})();
