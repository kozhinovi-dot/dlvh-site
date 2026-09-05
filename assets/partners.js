/* Diamond Line — логика B2B-форм на /partners.
   Отправка идёт на собственную функцию на pay.dlvh.ae: она валидирует, присваивает
   Request ID и кладёт заявку в долговременное хранилище. Никакого mailto: —
   на телефоне без настроенного почтовика заявка просто исчезала бы. */

(function () {
  'use strict';

  var ENDPOINT = 'https://pay.dlvh.ae/b2b/request';

  var TEXT = document.documentElement.lang === 'ru' ? {
    sending:  'Отправляем…',
    missing:  'Заполните отмеченные поля.',
    baddate:  'Дата выезда должна быть позже даты заезда.',
    failed:   'Не удалось отправить. Напишите нам на info@dlvh.ae — ответим так же быстро.',
    okTitle:  'Запрос принят',
    okBody:   'Номер запроса',
    okNext:   'Мы вернёмся с вариантами. Если запрос срочный — напишите на info@dlvh.ae и укажите номер.',
    ptrTitle: 'Заявка принята',
    ptrNext:  'Свяжемся с вами по указанной почте.'
  } : {
    sending:  'Sending…',
    missing:  'Please complete the highlighted fields.',
    baddate:  'The check-out date must be after the check-in date.',
    failed:   'The request could not be sent. Please write to info@dlvh.ae — we answer just as fast.',
    okTitle:  'Request received',
    okBody:   'Your request number',
    okNext:   'We will come back to you with options. If it is urgent, email info@dlvh.ae quoting the number.',
    ptrTitle: 'Application received',
    ptrNext:  'We will be in touch at the address you gave us.'
  };

  function utm() {
    var q = new URLSearchParams(window.location.search);
    var out = [];
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (q.get(k)) out.push(k + '=' + q.get(k));
    });
    return out.join('&');
  }

  function track(name, detail) {
    if (typeof window.gtag === 'function') window.gtag('event', name, detail || {});
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({ event: name }, detail || {}));
  }

  function setStatus(el, message, state) {
    if (!el) return;
    el.textContent = message || '';
    if (state) el.setAttribute('data-state', state); else el.removeAttribute('data-state');
  }

  function collect(form) {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === 'submit') return;
      data[el.name] = (el.value || '').trim();
    });
    data.page = window.location.pathname;
    data.referrer = document.referrer || '';
    data.utm = utm();
    var q = new URLSearchParams(window.location.search);
    if (q.get('utm_campaign')) data.campaign = q.get('utm_campaign');
    if (q.get('utm_source')) data.source = q.get('utm_source');
    return data;
  }

  function validate(form) {
    var firstBad = null;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
      var ok = (el.value || '').trim() !== '';
      if (ok && el.type === 'email') {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
      }
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !firstBad) firstBad = el;
    });
    return firstBad;
  }

  function showSuccess(form, requestId, isPartner) {
    var box = document.createElement('div');
    box.className = 'form-ok';
    box.setAttribute('role', 'status');
    var title = isPartner ? TEXT.ptrTitle : TEXT.okTitle;
    var next = isPartner ? TEXT.ptrNext : TEXT.okNext;
    box.innerHTML = '<h3></h3><p></p><p></p>';
    box.querySelector('h3').textContent = title;
    if (requestId) {
      box.querySelectorAll('p')[0].innerHTML = TEXT.okBody + ': <code></code>';
      box.querySelector('code').textContent = requestId;
    } else {
      box.querySelectorAll('p')[0].remove();
    }
    box.querySelectorAll('p')[box.querySelectorAll('p').length - 1].textContent = next;
    form.parentNode.replaceChild(box, form);
    box.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function wire(form) {
    if (!form) return;
    var isPartner = form.getAttribute('data-kind') === 'partner';
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var started = false;

    form.addEventListener('input', function () {
      if (!started) { started = true; track('b2b_form_start', { form: isPartner ? 'partner' : 'request' }); }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (form.elements.botcheck && form.elements.botcheck.value !== '') return;

      var bad = validate(form);
      if (bad) {
        setStatus(status, TEXT.missing, 'error');
        bad.focus();
        return;
      }

      var ci = form.elements.check_in, co = form.elements.check_out;
      if (ci && co && ci.value && co.value && co.value <= ci.value) {
        setStatus(status, TEXT.baddate, 'error');
        co.setAttribute('aria-invalid', 'true');
        co.focus();
        return;
      }

      var payload = collect(form);
      if (isPartner) payload.type = 'partner';

      button.disabled = true;
      setStatus(status, TEXT.sending);

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.error) || 'failed');
          track('b2b_form_submit', { form: isPartner ? 'partner' : 'request', request_id: res.requestId || '' });
          showSuccess(form, res.requestId, isPartner);
        })
        .catch(function () {
          setStatus(status, TEXT.failed, 'error');
          button.disabled = false;
        });
    });
  }

  wire(document.getElementById('b2b-request-form'));
  wire(document.getElementById('b2b-partner-form'));

  /* Клики по контактам — чтобы понимать, какой канал реально работает */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('mailto:') === 0) track('contact_email_click', { href: href });
    if (href.indexOf('wa.me') > -1 || href.indexOf('whatsapp') > -1) track('contact_whatsapp_click', {});
    if (a.classList.contains('js-cta-request')) track('cta_send_request_click', {});
  });

  /* Reveal и год в подвале — те же, что на остальном сайте */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var blocks = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    blocks.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    blocks.forEach(function (el) { io.observe(el); });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
