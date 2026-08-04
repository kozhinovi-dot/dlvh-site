# dlvh.ae — Diamond Line Vacation Homes Rental L.L.C.

Static one-page corporate site. No build step, no dependencies, no framework.
Plain HTML + CSS + a single vanilla JS file.

**Live:** https://dlvh.ae — deployed from this repository via GitHub Pages.

```
dlvh-site/
├── index.html            one-pager: hero, about, services, contact
├── privacy.html          privacy policy
├── CNAME                 custom domain for GitHub Pages (dlvh.ae)
├── robots.txt
├── sitemap.xml
├── IMAGE_SOURCES.md      photo attribution (Unsplash)
└── assets/
    ├── styles.css
    ├── main.js           form handling + scroll reveal
    ├── favicon.svg
    └── images/           2 photographs
```

## Local preview

```bash
cd /Users/ilya/Booking/dlvh-site && python3 -m http.server 8823
```

Then open http://127.0.0.1:8823

## Publishing changes

Edit files, then:

```bash
cd /Users/ilya/Booking/dlvh-site && git add -A && git commit -m "describe the change" && git push
```

GitHub Pages rebuilds within about a minute. Pushing uses the SSH key
`~/.ssh/github_ed25519`, already registered with the `kozhinovi-dot` account.

---

## Current infrastructure (as deployed)

| Piece | Where | Cost |
|---|---|---|
| Domain registrar | AEserver | paid annually (AED 145) |
| DNS | AEserver panel (nameservers `ns1/ns2/ns3.rrpproxy.net`) | included |
| Hosting | GitHub Pages, repo `kozhinovi-dot/dlvh-site` | free |
| TLS certificate | GitHub, auto-issued and auto-renewed | free |
| Email | **not yet working** — see below | — |

Cloudflare is not used. It was the original plan, but AEserver's own DNS panel
covers what the site needs, so the nameservers were left untouched.

### DNS records currently set

| Host | Type | Value |
|---|---|---|
| `@` | A | 185.199.108.153 |
| `@` | A | 185.199.109.153 |
| `@` | A | 185.199.110.153 |
| `@` | A | 185.199.111.153 |
| `www` | CNAME | kozhinovi-dot.github.io |

The four A records are GitHub Pages' anycast addresses. Do not delete the `CNAME`
file from the repository — GitHub Pages reads the custom domain from it, and
removing it unsets the domain.

---

## Email: info@dlvh.ae — OUTSTANDING

**Status: not working.** Nothing sent to `info@dlvh.ae` is delivered anywhere.

AEserver's built-in **Email Forwarding** (domain → Email Forwarding in the client
area) silently discards the record: the form accepts `info` → destination address,
reports nothing on save, and the field is empty again after a reload. Tried three
times, including plain keyboard entry rather than scripted input. No MX record is
created for the domain (`dig dlvh.ae MX` returns nothing). The underlying DNS
platform does support forwarding — it creates the MX automatically via an internal
X-SMTP pseudo-record — so this is a fault in AEserver's panel, not a
misconfiguration.

Two ways forward:

**A. Support ticket to AEserver.** Their feature, their bug. Ask them to enable
email forwarding for `dlvh.ae` to the destination mailbox. Costs nothing, but
depends on their response time.

**B. Cloudflare Email Routing.** Free, unlimited addresses, reliable. Requires a
Cloudflare account and moving the domain's nameservers from AEserver to Cloudflare
— the site's A/CNAME records would move across with it. About 15 minutes of work
once an account exists, plus nameserver propagation.

Either way, **sending** is then set up the same:

1. Gmail → Settings → Accounts and Import → Send mail as → Add another email address.
2. Name `Diamond Line Vacation Homes Rental`, address `info@dlvh.ae`, keep
   "Treat as an alias" ticked.
3. Send through Gmail's servers (no SMTP credentials).
4. Google mails a confirmation code to `info@dlvh.ae`; it arrives once receiving works.

Note on deliverability: sending via Gmail's servers means outgoing mail is
DKIM-signed by `gmail.com`, not `dlvh.ae`, so DMARC does not align. Delivery to
Gmail and most providers is fine; Outlook and Yahoo are occasionally strict. Do not
publish a strict DMARC policy while sending this way — leave it unset, or use
`v=DMARC1; p=none`. If spam filtering becomes a problem, route outgoing mail through
a free SMTP relay that signs with `dlvh.ae` (Brevo, 300 messages/day) and point
Gmail's "Send mail as" at that relay.

---

## Contact form — OUTSTANDING

The form has **no delivery key set**, so submitting it opens the visitor's own mail
application with the message pre-filled to `info@dlvh.ae`. Functional, but many
visitors have no mail client configured.

To finish (do this after email receiving works, since the key arrives by email):

1. https://web3forms.com → enter `info@dlvh.ae` → request an access key. Free,
   unlimited submissions, no account.
2. In `assets/main.js`: `var FORM_ACCESS_KEY = 'your-key-here';`
3. Commit and push.

The key is a public submission token — it only permits sending to the address that
registered it, so it is safe in frontend code. The form already has a honeypot field.

---

## Editorial note

The copy is deliberately plain: what the company is, what it does, where it is, how
to reach it. No claims about standards, licensing or quality, no selling. If anything
is added later, keep it to verifiable facts — the point of the site is that someone
who receives an email from `info@dlvh.ae` can check that the company exists.

No phone number appears anywhere on the site, by request. Do not add one — or a
WhatsApp button — without asking.

Optional, if wanted: the office unit number in Opus by Omniyat.
