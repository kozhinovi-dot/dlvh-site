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

```bash
cd /Users/ilya/Booking/dlvh-site && git add -A && git commit -m "describe the change" && git push
```

GitHub Pages rebuilds within about a minute. Pushing uses the SSH key
`~/.ssh/github_ed25519`, already registered with the `kozhinovi-dot` account.

---

## Infrastructure

| Piece | Where | Cost |
|---|---|---|
| Domain registrar | AEserver | AED 145/year |
| DNS | AEserver panel (nameservers `ns1/ns2/ns3.rrpproxy.net`) | included |
| Hosting | GitHub Pages, repo `kozhinovi-dot/dlvh-site` | free |
| TLS certificate | GitHub, auto-issued and auto-renewed | free |
| Email | Google Workspace Business Starter, 2 users | €8.10/user/month |

Cloudflare is not used — AEserver's own DNS panel covers everything, so the
nameservers were left untouched.

### DNS records

| Host | Type | Value | Purpose |
|---|---|---|---|
| `@` | A | 185.199.108.153 | GitHub Pages |
| `@` | A | 185.199.109.153 | GitHub Pages |
| `@` | A | 185.199.110.153 | GitHub Pages |
| `@` | A | 185.199.111.153 | GitHub Pages |
| `www` | CNAME | kozhinovi-dot.github.io | GitHub Pages |
| `@` | MX (prio 1) | smtp.google.com | inbound mail to Google |
| `@` | TXT | `google-site-verification=…` | domain ownership |
| `@` | TXT | `v=spf1 include:_spf.google.com ~all` | SPF |
| `google._domainkey` | TXT | `v=DKIM1; k=rsa; p=…` (2048-bit) | DKIM |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:dlvh@dlvh.ae` | DMARC, monitoring only |

Do not delete the `CNAME` file from the repository — GitHub Pages reads the custom
domain from it, and removing it unsets the domain.

The AEserver panel labels TXT as "SPF (txt)", which is misleading: it stores a plain
TXT record. It handles the full 2048-bit DKIM key correctly, splitting it into two
strings of ≤255 characters as the standard requires. Its client-area session expires
after a few minutes of inactivity and has to be signed in again by hand.

---

## Email

Two mailboxes, both active:

- `info@dlvh.ae` — the address published on the site
- `dlvh@dlvh.ae` — Workspace administrator

Both are separate licensed users. If a second mailbox is not actually wanted,
`info@` could instead be a free alias on `dlvh@`, halving the bill — Google allows up
to 30 aliases per user at no cost.

Outgoing mail is DKIM-signed by `dlvh.ae` itself, so DMARC aligns and deliverability
does not depend on Gmail's reputation. DMARC is deliberately at `p=none` for now:
it collects reports without rejecting anything. Tighten to `p=quarantine` only after
the reports at `dlvh@dlvh.ae` come back clean for a few weeks.

### Setup history, in case it has to be redone

The first attempt signed up on a personal Gmail. Google refuses custom domains for
members of a **family group**, and that account is the family manager with a supervised
child account in it — the only escape Google offered was deleting the entire family
group, which would drop Family Link parental controls and impose a 12-month block on
joining any family group. Rejected; that trial was cancelled and its org deleted, with
no charge.

The correct route is *Create a new account* at signup, **not** *Continue with this
account*. Note that an abandoned signup holds the domain for up to 24 hours, which is
what caused a "this domain name is already in use" error in between.

Google also warns that a DKIM key cannot be generated until 24–72 hours after Gmail is
enabled. In practice it generated immediately — try it before waiting.

---

## Contact form — OUTSTANDING

The form has **no delivery key set**, so submitting it opens the visitor's own mail
application with the message pre-filled to `info@dlvh.ae`. Functional, but many
visitors have no mail client configured.

To finish:

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
