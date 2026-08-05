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

### Decision: Google Workspace (5 Aug 2026)

Chosen over free forwarding so that outgoing mail is DKIM-signed by `dlvh.ae` and DMARC
aligns. Two false starts so far, both now understood:

1. **Signed up on the personal Gmail** (`kozhinov.i@gmail.com`) — Google refuses custom
   domains for members of a **family group**. That account is the family *manager*, with a
   supervised child account in the group, so the only offered escape was deleting the whole
   family group. That would drop Family Link parental controls and impose a 12-month block
   on joining any family group — not an acceptable trade for an email address. Rejected.
   The Business Standard trial from that attempt was cancelled and its org deleted; no
   charge was made.
2. **Fresh corporate signup** (the correct route: *Create a new account*, not *Continue with
   this account*) — reached the username/password step, then Google began reporting
   **"this domain name is already in use"** for `dlvh.ae`. The claim most likely comes from
   the incomplete signup itself or the just-deleted org. Google holds a released domain for
   up to 24 hours (7 days if bought through a reseller) before it can be attached elsewhere.

**Next step:** retry the signup after ~24 hours at
https://workspace.google.com/business/signup/welcome → *Create a new account* → existing
domain `dlvh.ae` → username `info` → **Business Starter**, not Standard (the first attempt
defaulted to Standard at €16.20/user/month; Starter is roughly half).

If it is still blocked after 24 hours: reset the password of the stranded account — recovery
goes to `kozhinov.i@gmail.com` — and remove the domain from it, or use Google's contact form
(48-hour response). See https://support.google.com/a/answer/80610

Once the account exists, remaining work is DNS only: verification TXT, MX to Google, SPF,
DKIM, and DMARC at `p=none`.

**Unresolved risk:** AEserver's DNS panel offers TXT only as "SPF (txt)", and Google's DKIM
key runs to roughly 400 characters. Whether the field accepts it is untested — the AEserver
session expired before the test could run twice. If it does not fit, move the nameservers to
Cloudflare: free, and the site's A/CNAME records move across with it.

Note: the AEserver client-area session expires after a few minutes of inactivity and has to
be signed in again by hand.

### Why the registrar's own forwarding was abandoned

AEserver's built-in **Email Forwarding** (domain → Email Forwarding in the client
area) silently discards the record: the form accepts `info` → destination address,
reports nothing on save, and the field is empty again after a reload. Tried three
times, including plain keyboard entry rather than scripted input. No MX record is
created for the domain (`dig dlvh.ae MX` returns nothing). The underlying DNS
platform does support forwarding — it creates the MX automatically via an internal
X-SMTP pseudo-record — so this is a fault in AEserver's panel, not a
misconfiguration.

A support ticket to AEserver would be the free route, since the bug is theirs. It was not
pursued because Google Workspace was chosen instead — forwarding would still leave outgoing
mail signed by `gmail.com` rather than `dlvh.ae`.

Fallback if Workspace stays blocked: **Cloudflare Email Routing** — free, unlimited
addresses, reliable. Needs a Cloudflare account and the nameservers moved from AEserver;
the site's A/CNAME records move across with it. Receiving would work, but sending from
Gmail as an alias would still be DKIM-signed by `gmail.com`, so DMARC would not align —
keep DMARC unset or at `p=none` in that case.

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
