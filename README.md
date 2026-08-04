# dlvh.ae — Diamond Line Vacation Homes Rental L.L.C.

Static one-page corporate site. No build step, no dependencies, no framework.
Plain HTML + CSS + a single vanilla JS file.

```
dlvh-site/
├── index.html            one-pager: hero, about, services, contact
├── privacy.html          privacy policy
├── robots.txt
├── sitemap.xml
├── IMAGE_SOURCES.md      photo attribution (Unsplash)
└── assets/
    ├── styles.css
    ├── main.js           form handling + scroll reveal
    ├── favicon.svg
    └── images/           4 photographs
```

## Local preview

```bash
cd /Users/ilya/Booking/dlvh-site && python3 -m http.server 8823
```

Then open http://127.0.0.1:8823

---

## 1. Deploy to Cloudflare Pages (free)

The site is static, so upload is enough — no Git repository required.

1. Sign in at https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Project name: `dlvh`. Drag the **contents** of `dlvh-site/` into the upload area
   (the folder contents, not the folder itself — `index.html` must sit at the root).
3. Deploy. You get a working `dlvh.pages.dev` URL immediately.

To publish an update later, open the project → **Create deployment** → upload the changed files again.

## 2. Move the domain's DNS to Cloudflare

`dlvh.ae` currently uses AEserver's nameservers (`ns1/ns2/ns3.rrpproxy.net`) and its
A record points at a parking page. Moving DNS to Cloudflare puts the site and the
email records in one place.

1. In Cloudflare: **Add a domain** → `dlvh.ae` → choose the **Free** plan.
2. Cloudflare gives you two nameservers, e.g. `xxx.ns.cloudflare.com`.
3. In the AEserver control panel, open the domain and replace the existing
   nameservers with the two from Cloudflare. Save.
4. Propagation usually takes 15 minutes to a few hours. Check with:

```bash
dig +short dlvh.ae NS
```

The domain stays registered with AEserver — only DNS hosting moves.

## 3. Point the domain at the site

In the Pages project → **Custom domains** → **Set up a domain**:

- add `dlvh.ae`
- add `www.dlvh.ae`

Cloudflare creates the DNS records and issues the TLS certificate automatically.

---

## 4. Email: info@dlvh.ae (free)

**Receiving** — Cloudflare Email Routing, free, unlimited addresses.

1. Cloudflare dashboard → the `dlvh.ae` zone → **Email** → **Email Routing** → **Get started**.
2. Let it add the required MX and SPF records automatically.
3. Add a destination address (your personal Gmail) and confirm it from the verification email.
4. Create the route: `info@dlvh.ae` → your Gmail.

Test by sending a message to `info@dlvh.ae` from any other address.
More addresses later (`booking@`, `accounts@`) are just extra routes — no extra cost.

**Sending** — Gmail "Send mail as".

1. Gmail → **Settings** → **Accounts and Import** → **Send mail as** → **Add another email address**.
2. Name: `Diamond Line Vacation Homes Rental`, address: `info@dlvh.ae`.
   Leave **Treat as an alias** ticked.
3. Choose to send through Gmail's servers (no SMTP credentials needed).
4. Google emails a confirmation code to `info@dlvh.ae`; it arrives in your Gmail via
   the route from the previous step. Enter the code.
5. Set `info@dlvh.ae` as the default sending address if you want replies to come from it.

You can now read and send from `info@dlvh.ae` in Gmail on desktop and on the phone.

### Deliverability note

Sending through Gmail's own servers means outgoing mail is DKIM-signed by `gmail.com`,
not by `dlvh.ae`, so DMARC alignment for the domain does not pass. In practice mail is
delivered normally to Gmail and most providers; Outlook and Yahoo are the ones that
occasionally treat it as suspicious.

Do **not** publish a strict DMARC policy while sending this way. Either publish nothing,
or a monitoring-only record — add a TXT record in Cloudflare:

| Name | Type | Content |
|------|------|---------|
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:info@dlvh.ae` |

If mail to Outlook or Yahoo starts landing in spam, the fix is to route outgoing mail
through a free SMTP relay that signs with `dlvh.ae` (Brevo, 300 messages/day, free) and
point Gmail's "Send mail as" at that relay instead of Gmail's servers. Nothing else changes.

---

## 5. Contact form

The form currently has **no delivery key set**, so submitting it opens the visitor's own
mail application with the message pre-filled to `info@dlvh.ae`. That works, but many
visitors have no mail client configured, so finish this step once email is live:

1. Go to https://web3forms.com, enter `info@dlvh.ae`, and request an access key.
   The key arrives by email. No account, free, unlimited submissions.
2. Open `assets/main.js` and paste it:

```js
var FORM_ACCESS_KEY = 'your-key-here';
```

3. Re-upload to Cloudflare Pages.

The key is a public submission token — it only allows sending to the address that
registered it, so it is safe in frontend code. The form already includes a honeypot
field against bots.

---

## Editorial note

The copy is deliberately plain: what the company is, what it does, where it is, how to
reach it. No claims about standards, licensing or quality, no selling. If anything is
added later, keep it to verifiable facts — the point of the site is that someone who
receives an email from `info@dlvh.ae` can check that the company exists.

Optional, if wanted: the office unit number in Opus by Omniyat.
