/* Diamond Line Vacation Homes Rental L.L.C. — dlvh.ae */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Contact form.

     Paste the Web3Forms access key below to have the form submit in the
     background. Get a free key at https://web3forms.com — enter
     info@dlvh.ae and the key arrives by email. No account required.

     While the key is empty, the form stays fully usable: submitting opens
     the visitor's mail client with the message pre-filled to info@dlvh.ae.
     ------------------------------------------------------------------ */
  var FORM_ACCESS_KEY = '';

  var CONTACT_EMAIL = 'info@dlvh.ae';

  var form = document.getElementById('enquiry-form');
  var status = document.getElementById('form-status');

  function setStatus(message, state) {
    if (!status) return;
    status.textContent = message;
    if (state) {
      status.setAttribute('data-state', state);
    } else {
      status.removeAttribute('data-state');
    }
  }

  function validate(fields) {
    var firstInvalid = null;

    Object.keys(fields).forEach(function (key) {
      var el = fields[key];
      var ok = el.value.trim() !== '';
      if (ok && el.type === 'email') {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
      }
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !firstInvalid) firstInvalid = el;
    });

    return firstInvalid;
  }

  var TOPICS = {
    guest: 'Guest',
    owner: 'Property owner',
    partner: 'Travel partner',
    other: 'Other'
  };

  function subjectFor(data) {
    return 'Website enquiry (' + (TOPICS[data.topic] || 'Other') + ') — ' + data.name;
  }

  function sendViaMailClient(data) {
    var subject = subjectFor(data);
    var body = 'Name: ' + data.name + '\n' +
               'Email: ' + data.email + '\n' +
               'Writing as: ' + (TOPICS[data.topic] || 'Other') + '\n\n' +
               data.message + '\n';
    window.location.href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    setStatus('Opening your email application…');
  }

  function sendViaWeb3Forms(data, button) {
    button.disabled = true;
    setStatus('Sending…');

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        access_key: FORM_ACCESS_KEY,
        subject: subjectFor(data),
        from_name: 'dlvh.ae',
        name: data.name,
        email: data.email,
        writing_as: TOPICS[data.topic] || 'Other',
        message: data.message
      })
    })
      .then(function (response) { return response.json(); })
      .then(function (result) {
        if (result && result.success) {
          form.reset();
          setStatus('Thank you. Your message has been sent — we will reply by email.', 'ok');
        } else {
          throw new Error(result && result.message ? result.message : 'Request failed');
        }
      })
      .catch(function () {
        setStatus('The message could not be sent. Please write to ' + CONTACT_EMAIL + ' directly.', 'error');
      })
      .then(function () {
        button.disabled = false;
      });
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var honeypot = form.elements.botcheck;
      if (honeypot && honeypot.value !== '') return;

      var fields = {
        name: form.elements.name,
        email: form.elements.email,
        message: form.elements.message
      };

      var invalid = validate(fields);
      if (invalid) {
        setStatus('Please complete the highlighted fields.', 'error');
        invalid.focus();
        return;
      }

      var data = {
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        topic: form.elements.topic ? form.elements.topic.value : 'other',
        message: fields.message.value.trim()
      };

      if (FORM_ACCESS_KEY) {
        sendViaWeb3Forms(data, form.querySelector('button[type="submit"]'));
      } else {
        sendViaMailClient(data);
      }
    });

    ['name', 'email', 'message'].forEach(function (key) {
      var el = form.elements[key];
      if (!el) return;
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') {
          el.setAttribute('aria-invalid', 'false');
        }
      });
    });
  }

  /* Links such as "Discuss your apartment" preselect the enquiry topic. */
  document.querySelectorAll('a[data-topic]').forEach(function (link) {
    link.addEventListener('click', function () {
      var select = form && form.elements.topic;
      if (select) select.value = link.getAttribute('data-topic');
    });
  });

  /* ---------- Mobile menu ---------- */

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  /* ---------- Scroll reveal ---------- */

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var blocks = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    blocks.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    blocks.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Footer year ---------- */

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
