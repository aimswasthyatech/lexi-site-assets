/* LEXI Protocol website v2: progressive enhancement only.
   Every fact on the site is present in raw HTML; this file adds motion,
   the mobile menu, the contact composer, and analytics hooks. */
(function () {
  'use strict';

  /* ---- Config: set formEndpoint to a Formspree/Basin URL to switch the
     contact page from the copy-composer to a real POST form. ---- */
  var CONFIG = {
    formEndpoint: 'https://formspree.io/f/mdaqqzje',
    email: 'info@lexiprotocol.com'
  };

  /* ---- Analytics hook: no-ops until an analytics provider is installed.
     Plausible: this forwards to window.plausible automatically. ---- */
  function track(name, props) {
    if (window.plausible) { window.plausible(name, { props: props || {} }); }
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-event]');
    if (el) track(el.getAttribute('data-event'), { page: location.pathname });
  });

  /* ---- Nav ---- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('on', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  var menuBtn = document.querySelector('.menu-btn');
  var navList = document.querySelector('.nl');
  if (menuBtn && navList) {
    menuBtn.addEventListener('click', function () {
      var open = navList.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---- One-shot reveals ---- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.14 });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Hero entrance (gate ring draw + specimen rise), one-shot ---- */
  var stage = document.getElementById('stage');
  if (stage && !reduced) { stage.classList.add('play'); }

  /* ---- Footer year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---- Contact intake ---- */
  var form = document.getElementById('intake');
  if (form) {
    var out = document.getElementById('compose-out');
    var copyBtn = document.getElementById('copy-request');
    var mailtoLink = document.getElementById('mailto-fallback');

    if (CONFIG.formEndpoint) {
      form.setAttribute('action', CONFIG.formEndpoint);
      form.setAttribute('method', 'POST');
      var composeRow = document.getElementById('compose-row');
      if (composeRow) composeRow.hidden = true;
      var submitRow = document.getElementById('submit-row');
      if (submitRow) submitRow.hidden = false;
    }

    function fieldVal(id) {
      var f = document.getElementById(id);
      return f ? f.value.trim() : '';
    }
    function validate() {
      var ok = true;
      ['f-name', 'f-email', 'f-detail'].forEach(function (id) {
        var f = document.getElementById(id);
        if (!f) return;
        var row = f.closest('.row');
        var bad = !f.value.trim() || (id === 'f-email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value.trim()));
        if (row) row.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      return ok;
    }
    function composed() {
      var path = fieldVal('f-path') || 'General';
      var subj = 'LEXI: ' + path + ' · ' + fieldVal('f-name');
      var body = 'Name: ' + fieldVal('f-name') + '\n' +
        'Email: ' + fieldVal('f-email') + '\n' +
        'Path: ' + path + '\n\n' + fieldVal('f-detail');
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
          mailtoLink.href = 'mailto:' + CONFIG.email +
            '?subject=' + encodeURIComponent(c.subject) +
            '&body=' + encodeURIComponent(c.body);
          mailtoLink.hidden = false;
        }
        track('intake-composed', { path: fieldVal('f-path') });
      });
    }
    /* AJAX submit: works on Formspree's free tier and keeps the visitor on
       our own /contact/thanks/ page. On failure, the composer + plain email
       reappear so no request is ever lost. */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!CONFIG.formEndpoint || !validate()) return;
      var btn = form.querySelector('#submit-row button');
      var oldLabel = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      function fail() {
        if (btn) { btn.disabled = false; btn.textContent = oldLabel; }
        var err = document.getElementById('submit-err');
        if (!err) {
          err = document.createElement('p');
          err.id = 'submit-err';
          err.style.cssText = 'color:#FF8A8A;font-size:13.5px;margin-top:10px';
          err.textContent = 'That did not go through. Use the composer below, or write to ' + CONFIG.email + ' directly.';
          document.getElementById('submit-row').appendChild(err);
        }
        var composeRow = document.getElementById('compose-row');
        if (composeRow) composeRow.hidden = false;
      }
      fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      }).then(function (res) {
        if (res.ok) {
          track('intake-submitted', { path: fieldVal('f-path') });
          window.location.href = '/contact/thanks/';
        } else { fail(); }
      }).catch(fail);
    });
  }
})();
