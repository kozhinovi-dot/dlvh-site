// Diamond Line Owner Portal — single-page app (owner and staff views).
import { api, IS_DEMO, NOT_CONFIGURED, AUTH_LINK_TYPE, monthRange } from "./data.js?v=12";

const $ = (s, el = document) => el.querySelector(s);
const app = $("#app");
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const aed = (n) => "AED " + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtDate = (s) => { if (!s) return "—"; const [y, m, d] = s.slice(0, 10).split("-"); return `${+d} ${MONTHS[+m - 1]} ${y}`; };
const fmtRange = (a, b) => {
  const [y1, m1, d1] = a.split("-").map(Number), [y2, m2, d2] = b.split("-").map(Number);
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${MONTHS[m1 - 1]} ${y1}`;
  if (y1 === y2) return `${d1} ${MONTHS[m1 - 1]} – ${d2} ${MONTHS[m2 - 1]} ${y1}`;
  return `${fmtDate(a)} – ${fmtDate(b)}`;
};
const fmtDateTime = (s) => s ? new Date(s).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }) + " (Dubai)" : "—";
const monthLabel = (period) => { const [y, m] = period.split("-"); return `${MONTHS_LONG[+m - 1]} ${y}`; };
const todayIso = () => new Date().toISOString().slice(0, 10);
const addMonths = (period, k) => { const d = new Date(period.slice(0, 7) + "-01T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + k); return d.toISOString().slice(0, 10); };
const daysIn = (period) => { const [y, m] = period.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };

const state = { session: null, me: null, props: [], propId: localStorage.getItem("dl.prop") || null };
const prop = () => state.props.find(p => p.id === state.propId) || state.props[0];
const isStaff = () => state.me?.role === "staff";

function toast(msg) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
}
function modal(title, bodyHtml, actions) {
  const back = document.createElement("div"); back.className = "modal-back";
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="card-head"><h3>${esc(title)}</h3></div><div class="body">${bodyHtml}</div><div class="foot"></div></div>`;
  const foot = $(".foot", back);
  const close = () => back.remove();
  for (const a of actions) {
    const b = document.createElement("button"); b.className = "btn " + (a.cls || ""); b.textContent = a.label;
    b.onclick = async () => { if (a.onClick) { b.disabled = true; try { if (await a.onClick(back) !== false) close(); } catch (e) { b.disabled = false; showErr(back, e); } } else close(); };
    foot.appendChild(b);
  }
  back.addEventListener("click", e => { if (e.target === back) close(); });
  document.body.appendChild(back);
  return back;
}
function showErr(root, e) {
  let box = $(".form-error", root);
  if (!box) { box = document.createElement("div"); box.className = "notice err form-error"; (root.querySelector(".body") || root).prepend(box); }
  box.textContent = friendly(e);
}
const friendly = (e) => {
  const m = String(e?.message || e);
  if (/Invalid login credentials/i.test(m)) return "Email or password is incorrect.";
  if (/bank details first/i.test(m)) return "Please add your bank details first (Payout details).";
  return m.charAt(0).toUpperCase() + m.slice(1);
};

// ---------- Icons ----------
const I = {
  home: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  unit: '<svg viewBox="0 0 24 24"><path d="M6 21V4h9v17M15 9h3v12M9 8h3M9 12h3M9 16h3M3 21h18"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/></svg>',
  stmt: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
  exp: '<svg viewBox="0 0 24 24"><path d="M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 9h6M9 13h6"/></svg>',
  work: '<svg viewBox="0 0 24 24"><path d="M14 6l4 4-9 9H5v-4z"/><path d="M13 7l4 4"/></svg>',
  bank: '<svg viewBox="0 0 24 24"><path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  admin: '<svg viewBox="0 0 24 24"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/></svg>',
  pay: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
};

const STATUS = {
  published: ["Awaiting your approval", "p-brass"], payout_requested: ["Payout requested", "p-info"],
  paid: ["Paid", "p-ok"], queried: ["Under review", "p-warn"], draft: ["Draft", "p-grey"],
  awaiting_signature: ["Awaiting signature", "p-brass"], signed: ["Signed", "p-ok"], available: ["Available", "p-grey"],
};
const pill = (s, ownerView = true) => {
  let [label, cls] = STATUS[s] || [s, "p-grey"];
  if (!ownerView && s === "published") label = "Awaiting owner";
  return `<span class="pill ${cls}">${esc(label)}</span>`;
};

// ---------- Shell ----------
async function counts() {
  const [docs, sts] = await Promise.all([api.documents(), prop() ? api.statements(prop().id) : []]);
  return { sign: docs.filter(d => d.status === "awaiting_signature").length, approve: sts.filter(s => s.status === "published").length };
}
async function shell(active, title, bodyHtml) {
  const c = isStaff() ? { sign: 0, approve: 0 } : await counts();
  const link = (href, icon, label, badge) => `<a href="${href}" class="${active === href ? "active" : ""}">${I[icon]}<span>${label}</span>${badge ? `<span class="badge">${badge}</span>` : ""}</a>`;
  const p = prop();
  const nav = isStaff() ? `
      <div class="nav-label">Management</div>
      ${link("#/admin", "admin", "Owners & properties")}
      ${link("#/admin/payouts", "pay", "Payout queue")}
      <div class="nav-label">Owner view</div>
      ${link("#/", "home", "All properties")}
      ${p ? link("#/p/" + p.id, "unit", "Overview") : ""}
      ${link("#/calendar", "cal", "Calendar")}
      ${link("#/statements", "stmt", "Statements")}
      ${link("#/documents", "doc", "Documents")}` : `
      ${link("#/", "home", "My properties")}
      ${p ? `<div class="nav-label">${esc(p.name)}</div>${link("#/p/" + p.id, "unit", "Overview")}` : ""}
      ${link("#/calendar", "cal", "Calendar & occupancy")}
      ${link("#/statements", "stmt", "Statements & payouts", c.approve)}
      ${link("#/expenses", "exp", "Expenses")}
      ${link("#/work", "work", "Work log")}
      ${link("#/documents", "doc", "Documents", c.sign)}
      <div class="nav-label">Account</div>
      ${link("#/bank", "bank", "Payout details")}
      ${link("#/account", "user", "Profile & security")}`;
  const propSel = state.props.length > 1
    ? `<select id="prop-select">${state.props.map(p => `<option value="${p.id}" ${p.id === prop()?.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>`
    : `<strong>${esc(prop()?.name || "")}</strong>`;
  app.innerHTML = `
  ${IS_DEMO ? `<div class="demo-banner">Demo mode with fictional data — local preview only.</div>` : ""}
  <div class="shell">
    <aside class="side">
      <div class="brand"><span class="brand-mark">DL</span><span class="brand-text"><strong>Diamond Line</strong><em>Owner Portal</em></span></div>
      <nav class="nav">${nav}</nav>
      <div class="side-foot"><div class="who">${esc(state.me?.full_name || state.me?.email)}</div><div class="muted small">${esc(state.me?.email)}</div><div style="margin-top:8px"><a href="#" id="signout">Sign out</a></div></div>
    </aside>
    <div class="main">
      <div class="topbar"><div class="prop">${prop() ? `<span class="muted small">Property</span> ${propSel}` : ""}</div>
        <div class="btn-row"><a class="btn btn-ghost btn-sm" href="mailto:info@dlvh.ae">Contact us</a></div></div>
      <div class="content">${title ? `<div class="page-head"><div><h1>${title}</h1></div></div>` : ""}${bodyHtml}</div>
    </div>
  </div>`;
  $("#signout").onclick = async (e) => { e.preventDefault(); await api.signOut(); location.hash = "#/login"; location.reload(); };
  const sel = $("#prop-select");
  if (sel) sel.onchange = () => { state.propId = sel.value; localStorage.setItem("dl.prop", sel.value); route(); };
}

// ---------- Auth pages ----------
function authLayout(inner) {
  app.innerHTML = `<div class="auth">
    <div class="auth-art">
      <div class="brand" style="border:0"><span class="brand-mark">DL</span><span class="brand-text"><strong>Diamond Line</strong><em>Vacation Homes Rental</em></span></div>
      <div><h1>Your apartment, fully transparent.</h1><p>Bookings, occupancy, statements, expenses with receipts and documents — in one place. Approve your monthly statement and request your payout in one click.</p></div>
      <div class="small" style="color:#9aa1a8">Diamond Line Vacation Homes Rental L.L.C. · Dubai</div>
    </div>
    <div class="auth-form"><div class="auth-card">${inner}</div></div>
  </div>`;
}
function loginPage(msg, err) {
  authLayout(`<h2>Owner sign in</h2><p class="muted">Use the email and password for your owner account.</p>
    ${msg ? `<div class="notice ok" style="margin-top:14px">${esc(msg)}</div>` : ""}
    ${err ? `<div class="notice err" style="margin-top:14px">${esc(err)}</div>` : ""}
    <form class="form" id="f">
      <div class="field"><label>Email</label><input name="email" type="email" autocomplete="username" required></div>
      <div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required></div>
      <div id="err"></div>
      <button class="btn" type="submit">Sign in</button>
      <a href="#/reset" class="small">Forgot your password?</a>
    </form>
    <p class="small muted" style="margin-top:28px">Access is by invitation from Diamond Line. Questions: <a href="mailto:info@dlvh.ae">info@dlvh.ae</a></p>`);
  $("#f").onsubmit = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    try { await api.signIn(f.get("email").trim(), f.get("password")); await boot(); }
    catch (err) { $("#err").innerHTML = `<div class="notice err">${esc(friendly(err))}</div>`; }
  };
}
function resetPage() {
  authLayout(`<h2>Reset password</h2><p class="muted">We will email you a link to set a new password.</p>
    <form class="form" id="f"><div class="field"><label>Email</label><input name="email" type="email" required></div><div id="err"></div>
    <button class="btn" type="submit">Send link</button><a href="#/login" class="small">Back to sign in</a></form>`);
  $("#f").onsubmit = async (e) => {
    e.preventDefault();
    try { await api.sendReset(new FormData(e.target).get("email").trim()); loginPage("If the email is registered, a reset link is on its way."); }
    catch (err) { $("#err").innerHTML = `<div class="notice err">${esc(friendly(err))}</div>`; }
  };
}
// Landing page for links from emails and chats. Link previews (WhatsApp, Telegram, mail scanners)
// load the page but never press the button, so the one-time token survives until the person does.
function acceptPage(params) {
  const type = params.get("type") === "invite" ? "invite" : params.get("type") === "recovery" ? "recovery" : params.get("type") || "magiclink";
  const invite = type === "invite";
  authLayout(`<h2>${invite ? "Welcome to Diamond Line" : "Reset your password"}</h2>
    <p class="muted">${invite ? "Your Owner Portal account is ready. Continue to create your password." : "Continue to choose a new password for your account."}</p>
    <div id="err" style="margin-top:14px"></div>
    <div class="form"><button class="btn" id="go">Continue</button></div>`);
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      const r = await api.verifyLink(params.get("t"), type);
      state.session = r.session;
      state.mustSetPassword = type === "invite" ? "invite" : "recovery";
      history.replaceState(null, "", location.pathname + "#/");
      await boot();
    } catch (e) {
      $("#go").disabled = false;
      $("#err").innerHTML = `<div class="notice err">This link has expired or was already used. Ask Diamond Line for a new one, or use “Forgot your password?” on the sign-in page.</div><p style="margin-top:12px"><a href="#/login">Go to sign in</a></p>`;
    }
  };
}

function setPasswordPage(kind) {
  authLayout(`<h2>${kind === "invite" ? "Welcome to Diamond Line" : "Set a new password"}</h2>
    <p class="muted">${kind === "invite" ? "Create a password for your owner account. You will use it with your email to sign in." : "Choose a new password for your account."}</p>
    <form class="form" id="f">
      <div class="field"><label>New password</label><input name="p1" type="password" minlength="6" autocomplete="new-password" required><div class="hint">At least 6 characters.</div></div>
      <div class="field"><label>Repeat password</label><input name="p2" type="password" minlength="6" autocomplete="new-password" required></div>
      <div id="err"></div><button class="btn" type="submit">Save password</button></form>`);
  $("#f").onsubmit = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    if (f.get("p1") !== f.get("p2")) { $("#err").innerHTML = `<div class="notice err">Passwords do not match.</div>`; return; }
    try { await api.setPassword(f.get("p1")); state.mustSetPassword = null; history.replaceState(null, "", location.pathname + "#/"); await boot(); toast("Password saved"); }
    catch (err) { $("#err").innerHTML = `<div class="notice err">${esc(friendly(err))}</div>`; }
  };
}

// ---------- Owner pages ----------
function occupancy(bookings, period) {
  const [from, to] = monthRange(period); let nights = 0;
  for (const b of bookings) {
    if (b.status !== "confirmed") continue;
    const s = b.check_in > from ? b.check_in : from, e = b.check_out < to ? b.check_out : to;
    if (e > s) nights += (new Date(e) - new Date(s)) / 864e5;
  }
  return { nights, pct: Math.round(100 * nights / daysIn(period)) };
}

const photoUrl = (p) => p.photo_path ? api.fileUrl("photos", p.photo_path).catch(() => null) : Promise.resolve(null);

// iPhone Safari clears site data after 7 days without a visit; a home-screen app keeps the sign-in.
function homeScreenTip() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;
  let dismissed = false;
  try { dismissed = localStorage.getItem("dl.hstip") === "1"; } catch (e) {}
  if (!ios || standalone || dismissed) return "";
  setTimeout(() => { const x = $("#hstip-x"); if (x) x.onclick = () => { try { localStorage.setItem("dl.hstip", "1"); } catch (e) {} $("#hstip").remove(); }; }, 0);
  return `<div class="notice brass" id="hstip" style="margin-bottom:16px; display:flex; gap:10px; align-items:flex-start; justify-content:space-between">
    <span>Keep the portal one tap away and stay signed in: tap <b>Share</b> → <b>Add to Home Screen</b>.</span>
    <a href="#" id="hstip-x" aria-label="Dismiss" style="color:inherit; text-decoration:none">✕</a></div>`;
}

// Landing page: every unit the owner has with us, each opening its own card.
async function propertiesPage() {
  if (!state.props.length) return shell("#/", "My properties", `<div class="card empty">Your property will appear here once Diamond Line has set it up.</div>`);
  const thisM = todayIso().slice(0, 7) + "-01";
  const [from, to] = monthRange(thisM);
  const docs = await api.documents();
  const units = await Promise.all(state.props.map(async (p) => {
    const [bookings, sts, photo] = await Promise.all([api.bookings(p.id), api.statements(p.id), photoUrl(p)]);
    const occ = occupancy(bookings, thisM);
    const income = bookings.filter(b => b.status === "confirmed" && b.check_out >= from && b.check_out < to).reduce((s, b) => s + +b.net, 0);
    const latest = sts[0];
    const toSign = docs.filter(d => d.property_id === p.id && d.status === "awaiting_signature").length;
    const next = bookings.find(b => b.status === "confirmed" && b.check_in >= todayIso());
    return { p, occ, income, latest, toSign, next, photo, awaiting: sts.filter(s => s.status === "published").reduce((s, x) => s + +x.balance, 0) };
  }));
  const total = units.reduce((s, u) => s + u.income, 0);
  const awaiting = units.reduce((s, u) => s + u.awaiting, 0);
  const first = (state.me.full_name || "").split(" ")[0];
  await shell("#/", "", `
    ${homeScreenTip()}
    <div class="page-head"><div><h1>${first ? "Welcome, " + esc(first.charAt(0) + first.slice(1).toLowerCase()) : "My properties"}</h1><p>${units.length === 1 ? "Your property" : units.length + " properties"} managed by Diamond Line</p></div></div>
    <div class="grid g3 kpis" style="margin-bottom:20px">
      <div class="card card-pad kpi"><div class="label">Properties</div><div class="value">${units.length}</div><div class="sub">under management</div></div>
      <div class="card card-pad kpi"><div class="label">Rental income · ${MONTHS_LONG[+thisM.slice(5, 7) - 1]}</div><div class="value">${aed(total).replace("AED ", "")}</div><div class="sub">AED, all properties</div></div>
      <div class="card card-pad kpi"><div class="label">Awaiting your approval</div><div class="value">${awaiting ? aed(awaiting).replace("AED ", "") : "—"}</div><div class="sub">${awaiting ? "AED in published statements" : "nothing to approve"}</div></div>
    </div>
    <div class="units">${units.map(u => `
      <a class="unit card" href="#/p/${u.p.id}">
        <div class="unit-photo"${u.photo ? ` style="background-image:url('${esc(u.photo)}')"` : ""}>${u.photo ? "" : I.unit}
          ${u.toSign ? `<span class="unit-flag">Signature needed</span>` : u.latest?.status === "published" ? `<span class="unit-flag">Statement to approve</span>` : ""}
          ${u.p.photo_credit ? `<span class="unit-credit">${esc(u.p.photo_credit)}</span>` : ""}</div>
        <div class="unit-body">
          <h3>${esc(u.p.name)}</h3><p class="muted small">${esc(u.p.address || "")}</p>
          <div class="unit-stats">
            <div><span>Occupancy</span><b>${u.occ.pct}%</b></div>
            <div><span>Income this month</span><b>${aed(u.income)}</b></div>
            <div><span>Next stay</span><b>${u.next ? fmtDate(u.next.check_in) : "—"}</b></div>
          </div>
          <div class="unit-foot">${u.latest ? `${monthLabel(u.latest.period)} ${pill(u.latest.status)}` : `<span class="muted small">First statement on the 10th</span>`}<span class="unit-open">Open →</span></div>
        </div>
      </a>`).join("")}
    </div>`);
}

async function overview() {
  const p = prop();
  if (!p) return propertiesPage();
  const [bookings, sts, docs, bank, photo] = await Promise.all([api.bookings(p.id), api.statements(p.id), api.documents(), api.bank(state.me.id), photoUrl(p)]);
  const thisM = todayIso().slice(0, 7) + "-01";
  const occ = occupancy(bookings, thisM);
  const [from, to] = monthRange(thisM);
  const incomeM = bookings.filter(b => b.status === "confirmed" && b.check_out >= from && b.check_out < to).reduce((s, b) => s + +b.net, 0);
  const upcoming = bookings.filter(b => b.status === "confirmed" && b.check_in >= todayIso()).slice(0, 5);
  const lastPaid = sts.find(s => s.status === "paid");
  const pending = sts.find(s => s.status === "published");
  const toSign = docs.filter(d => d.status === "awaiting_signature" && (!d.property_id || d.property_id === p.id));
  await shell("#/p/" + p.id, "", `
    <a href="#/" class="small">← ${state.props.length > 1 ? "All properties" : "My properties"}</a>
    <div class="hero card"${photo ? ` style="background-image:linear-gradient(180deg, rgba(13,16,18,0) 35%, rgba(13,16,18,.78)), url('${esc(photo)}')"` : ""}>
      <div class="hero-text"><h1>${esc(p.name)}</h1><p>${esc(p.address || "")}${p.area_sqm ? ` · ${+p.area_sqm} sq m` : ""}${p.parking ? ` · parking ${esc(p.parking)}` : ""}</p></div>
      ${p.photo_credit ? `<span class="unit-credit">${esc(p.photo_credit)}</span>` : ""}
    </div>
    ${!bank ? `<div class="notice brass" style="margin-bottom:14px">Add your bank details so we can send your payouts. <a href="#/bank"><b>Add payout details →</b></a></div>` : ""}
    ${toSign.map(d => `<div class="cta" style="margin-bottom:12px"><div><b>${esc(d.title)}</b> is ready for your signature.</div><a class="btn btn-brass" href="#/documents/${d.id}">Review & sign</a></div>`).join("")}
    ${pending ? `<div class="cta" style="margin-bottom:16px"><div><b>Statement for ${monthLabel(pending.period)}</b> — balance due to you <b>${aed(pending.balance)}</b>. Review and request your payout.</div><a class="btn btn-brass" href="#/statements/${pending.id}">Review statement</a></div>` : ""}
    <div class="grid g4" style="margin-bottom:16px">
      <div class="card card-pad kpi"><div class="label">Occupancy · ${MONTHS_LONG[+thisM.slice(5, 7) - 1]}</div><div class="value">${occ.pct}%</div><div class="sub">${occ.nights} of ${daysIn(thisM)} nights booked</div></div>
      <div class="card card-pad kpi"><div class="label">Rental income this month</div><div class="value">${aed(incomeM).replace("AED ", "")}</div><div class="sub">AED, after platform commissions</div></div>
      <div class="card card-pad kpi"><div class="label">Next payout</div><div class="value">${pending ? aed(pending.balance).replace("AED ", "") : "—"}</div><div class="sub">${pending ? "by the 20th after approval" : "statement on the 10th"}</div></div>
      <div class="card card-pad kpi"><div class="label">Last payout</div><div class="value">${lastPaid ? aed(lastPaid.balance).replace("AED ", "") : "—"}</div><div class="sub">${lastPaid ? "paid " + fmtDate(lastPaid.paid_at) : "no payouts yet"}</div></div>
    </div>
    <div class="grid g2">
      <div class="card"><div class="card-head"><h3>Upcoming stays</h3><a href="#/calendar" class="small">Calendar →</a></div>
        ${upcoming.length ? `<table class="t"><thead><tr><th>Dates</th><th>Nights</th><th class="hide-sm">Channel</th><th class="r">Rental income</th></tr></thead><tbody>
        ${upcoming.map(b => `<tr><td class="nw">${fmtRange(b.check_in, b.check_out)}</td><td>${b.nights}</td><td class="hide-sm">${esc(b.channel)}</td><td class="r">${aed(b.net)}</td></tr>`).join("")}</tbody></table>`
        : `<div class="empty">No upcoming stays yet.</div>`}</div>
      <div class="card"><div class="card-head"><h3>Statements</h3><a href="#/statements" class="small">All →</a></div>
        ${sts.length ? `<table class="t"><tbody>${sts.slice(0, 5).map(s => `<tr class="click" data-href="#/statements/${s.id}"><td>${monthLabel(s.period)}</td><td>${pill(s.status)}</td><td class="r">${aed(s.balance)}</td></tr>`).join("")}</tbody></table>`
        : `<div class="empty">Your first statement will be published on the 10th of next month.</div>`}</div>
    </div>`);
  bindRows();
}

async function calendar(params) {
  const p = prop(); if (!p) return overview();
  const period = (params.get("m") || todayIso().slice(0, 7)) + "-01";
  const bookings = await api.bookings(p.id);
  const occ = occupancy(bookings, period);
  const first = new Date(period + "T00:00:00Z");
  const startDow = (first.getUTCDay() + 6) % 7;
  const cells = [];
  const start = new Date(first); start.setUTCDate(1 - startDow);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setUTCDate(start.getUTCDate() + i);
    const ds = d.toISOString().slice(0, 10);
    if (i >= 35 && ds.slice(0, 7) !== period.slice(0, 7)) break;
    const b = bookings.find(x => x.status !== "cancelled" && x.check_in <= ds && ds < x.check_out);
    const cls = b ? (b.status === "owner_stay" || b.status === "blocked" ? "c-owner" : /airbnb/i.test(b.channel) ? "c-airbnb" : /booking/i.test(b.channel) ? "c-booking" : "c-direct") : "";
    const label = b && (b.check_in === ds || (i % 7 === 0)) ? (b.status === "owner_stay" ? "Owner stay" : `${esc(b.channel)} · ${b.nights}n`) : "&nbsp;";
    cells.push(`<div class="day ${ds.slice(0, 7) !== period.slice(0, 7) ? "out" : ""} ${ds === todayIso() ? "today" : ""}"><div class="d">${d.getUTCDate()}</div>${b ? `<div class="bar ${cls}" title="${esc(b.channel)} ${fmtDate(b.check_in)}–${fmtDate(b.check_out)}">${label}</div>` : ""}</div>`);
  }
  const [from, to] = monthRange(period);
  const monthB = bookings.filter(b => b.status === "confirmed" && b.check_in < to && b.check_out > from);
  const income = monthB.filter(b => b.check_out >= from && b.check_out < to).reduce((s, b) => s + +b.net, 0);
  const adr = occ.nights ? monthB.reduce((s, b) => s + +b.net, 0) / monthB.reduce((s, b) => s + b.nights, 0) : 0;
  await shell("#/calendar", "Calendar & occupancy", `
    <div class="grid g3" style="margin-bottom:16px">
      <div class="card card-pad kpi"><div class="label">Occupancy</div><div class="value">${occ.pct}%</div><div class="sub">${occ.nights} of ${daysIn(period)} nights</div></div>
      <div class="card card-pad kpi"><div class="label">Average nightly income</div><div class="value">${adr ? aed(adr).replace("AED ", "") : "—"}</div><div class="sub">AED per night, after commissions</div></div>
      <div class="card card-pad kpi"><div class="label">Rental income (check-outs)</div><div class="value">${aed(income).replace("AED ", "")}</div><div class="sub">AED in ${MONTHS_LONG[+period.slice(5, 7) - 1]}</div></div>
    </div>
    <div class="card">
      <div class="cal-head"><a class="btn btn-ghost btn-sm" href="#/calendar?m=${addMonths(period, -1).slice(0, 7)}">←</a><h3>${monthLabel(period)}</h3><a class="btn btn-ghost btn-sm" href="#/calendar?m=${addMonths(period, 1).slice(0, 7)}">→</a></div>
      <div class="cal">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => `<div class="dow">${d}</div>`).join("")}${cells.join("")}</div>
      <div class="legend"><span class="l-booking">Booking.com</span><span class="l-airbnb">Airbnb</span><span class="l-direct">Direct</span><span class="l-owner">Owner stay / blocked</span></div>
    </div>`);
}

async function statementsList() {
  const p = prop(); if (!p) return overview();
  const sts = await api.statements(p.id);
  await shell("#/statements", "Statements & payouts", `
    <p class="muted" style="margin:-10px 0 18px">Each statement is published by the 10th for the previous month. Review it and press <b>Request payout</b> — we pay by the 20th.</p>
    <div class="card">${sts.length ? `<table class="t"><thead><tr><th>Month</th><th>Status</th><th class="r hide-sm">Rental income</th><th class="r hide-sm">Fee</th><th class="r hide-sm">Expenses</th><th class="r">Balance</th></tr></thead><tbody>
      ${sts.map(s => `<tr class="click" data-href="#/statements/${s.id}"><td>${monthLabel(s.period)}</td><td>${pill(s.status)}</td><td class="r hide-sm">${aed(s.rental_income)}</td><td class="r hide-sm">${aed(s.management_fee)}</td><td class="r hide-sm">${aed(s.expenses)}</td><td class="r"><b>${aed(s.balance)}</b></td></tr>`).join("")}
    </tbody></table>` : `<div class="empty">No statements yet. The first one will be published on the 10th of next month.</div>`}</div>`);
  bindRows();
}

async function statementPage(id) {
  const st = await api.statement(id);
  const { bookings, expenses } = await api.statementLines(st);
  const bank = await api.bank(st.property.owner_id);
  const steps = [
    ["Published", st.published_at, ["published", "payout_requested", "paid", "queried"].includes(st.status)],
    ["Payout requested", st.payout_requested_at, ["payout_requested", "paid"].includes(st.status)],
    ["Paid", st.paid_at, st.status === "paid"],
  ];
  const ratePct = Math.round((st.property.fee_rate || 0.1) * 100);
  await shell("#/statements", "", `
    <div class="page-head"><div><a href="#/statements" class="small no-print">← All statements</a><h1 style="margin-top:6px">Statement · ${monthLabel(st.period)}</h1><p>${esc(st.property.name)}</p></div>
      <div class="btn-row no-print">${pill(st.status, !isStaff())}<button class="btn btn-ghost btn-sm" onclick="window.print()">Download PDF</button></div></div>
    <div class="card card-pad" style="margin-bottom:16px"><div class="steps">${steps.map((s, i) => `<div class="step ${s[2] ? "done" : (i && steps[i - 1][2] ? "now" : "")}"><b>${s[0]}</b>${s[1] ? fmtDate(s[1]) : (i === 2 ? "by the 20th" : "")}</div>`).join("")}</div></div>
    ${st.status === "published" && !isStaff() ? `
      <div class="cta no-print" style="margin-bottom:16px"><div>If everything is in order, approve the statement and request your payout of <b>${aed(st.balance)}</b>.${!bank ? `<div class="small" style="margin-top:4px">First <a href="#/bank">add your bank details</a>.</div>` : ""}</div>
        <div class="btn-row"><button class="btn btn-ghost" id="ask">Ask a question</button><button class="btn btn-brass" id="req" ${bank ? "" : "disabled"}>Request payout</button></div></div>` : ""}
    ${st.status === "queried" ? `<div class="notice brass" style="margin-bottom:16px">Your question is with our team: “${esc(st.owner_note)}”. We will reply by email and update the statement.</div>` : ""}
    ${st.status === "paid" ? `<div class="notice ok" style="margin-bottom:16px">Paid on ${fmtDate(st.paid_at)}${st.payout_reference ? " · reference " + esc(st.payout_reference) : ""}.</div>` : ""}
    <div class="grid g-stmt">
      <div class="card"><div class="card-head"><h3>Stays (by check-out date)</h3></div>
        ${bookings.length ? `<table class="t"><thead><tr><th>Dates</th><th class="hide-sm">Channel</th><th class="r hide-sm">Guest paid</th><th class="r hide-sm">Commission</th><th class="r">Rental income</th></tr></thead><tbody>
        ${bookings.map(b => `<tr><td class="nw">${fmtRange(b.check_in, b.check_out)}<div class="small muted">${b.nights} nights</div></td><td class="hide-sm">${esc(b.channel)}</td><td class="r hide-sm">${aed(b.gross)}</td><td class="r hide-sm">${+b.ota_commission ? "−" + aed(b.ota_commission) : "—"}</td><td class="r">${aed(b.net)}</td></tr>`).join("")}
        </tbody></table>` : `<div class="empty">No stays ended this month.</div>`}
        ${expenses.length ? `<div class="card-head" style="border-top:1px solid var(--line-2)"><h3>Expenses</h3></div><table class="t"><tbody>
        ${expenses.map(e => `<tr><td>${fmtDate(e.date)}</td><td>${esc(e.description)}${e.receipt_path ? ` · <a href="#" data-file="receipts|${esc(e.receipt_path)}">receipt</a>` : ""}</td><td class="r">−${aed(e.amount)}</td></tr>`).join("")}</tbody></table>` : ""}
      </div>
      <div class="card card-pad sumcard"><h3 style="margin-bottom:14px">Summary</h3><div class="sum">
        <div class="row"><span>Rental income</span><span class="num">${aed(st.rental_income)}</span></div>
        <div class="row"><span>Management fee (${ratePct}%)</span><span class="num">−${aed(st.management_fee)}</span></div>
        <div class="row"><span>Expenses</span><span class="num">−${aed(st.expenses)}</span></div>
        ${+st.carried_forward ? `<div class="row"><span>Carried from previous month</span><span class="num">${aed(st.carried_forward)}</span></div>` : ""}
        <div class="row total"><span>Balance due to you</span><span class="num">${aed(st.balance)}</span></div></div>
        <p class="small muted" style="margin-top:14px">Rental income is what guests paid after booking platform commissions and refunds. Cleaning, linen, laundry, photography and insurance are included in our fee.</p>
        ${bank ? `<p class="small muted">Payout to ${esc(bank.account_name)} · IBAN ••••${esc(bank.iban.slice(-4))}</p>` : ""}
      </div>
    </div>`);
  bindFiles();
  const req = $("#req"), ask = $("#ask");
  if (req) req.onclick = () => modal("Request payout", `<p>You approve the statement for <b>${monthLabel(st.period)}</b> and request a payout of <b>${aed(st.balance)}</b> to ${bank ? `${esc(bank.account_name)}, IBAN ••••${esc(bank.iban.slice(-4))}` : "your account"}.</p><p class="small muted">Payouts are made by the 20th of the month.</p>`,
    [{ label: "Cancel", cls: "btn-ghost" }, { label: "Confirm and request payout", cls: "btn-brass", onClick: async () => { await api.requestPayout(st.id); toast("Payout requested"); route(); } }]);
  if (ask) ask.onclick = () => modal("Ask about this statement", `<div class="field"><label>Your question</label><textarea id="note" rows="4" placeholder="e.g. Please explain the repair on 12 Oct"></textarea></div>`,
    [{ label: "Cancel", cls: "btn-ghost" }, { label: "Send question", onClick: async (m) => { const v = $("#note", m).value.trim(); if (!v) throw new Error("Please type your question."); await api.queryStatement(st.id, v); toast("Question sent"); route(); } }]);
}

async function expensesPage() {
  const p = prop(); if (!p) return overview();
  const ex = await api.expenses(p.id);
  const CAT = { permit: "DET permit", repair: "Repair", replacement: "Replacement", utilities: "Utilities", service_charge: "Service charge", other: "Other" };
  const total = ex.reduce((s, e) => s + +e.amount, 0);
  await shell("#/expenses", "Expenses", `
    <p class="muted" style="margin:-10px 0 18px">Costs paid on your behalf and deducted in your statements. Cleaning, linen, laundry, photography and insurance are covered by our fee and never appear here.</p>
    <div class="card">${ex.length ? `<table class="t"><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Receipt</th><th class="r">Amount</th></tr></thead><tbody>
      ${ex.map(e => `<tr><td>${fmtDate(e.date)}</td><td>${esc(CAT[e.category] || e.category)}</td><td>${esc(e.description)}</td><td>${e.receipt_path ? `<a href="#" data-file="receipts|${esc(e.receipt_path)}">View</a>` : `<span class="muted">—</span>`}</td><td class="r">${aed(e.amount)}</td></tr>`).join("")}
      </tbody><tfoot><tr><td colspan="4">Total</td><td class="r">${aed(total)}</td></tr></tfoot></table>` : `<div class="empty">No expenses so far.</div>`}</div>`);
  bindFiles();
}

async function workPage() {
  const p = prop(); if (!p) return overview();
  const items = await api.work(p.id);
  const KIND = { cleaning: "Cleaning", maintenance: "Maintenance", repair: "Repair", inspection: "Inspection", photography: "Photography", other: "Other" };
  const urls = {};
  for (const w of items) for (const ph of w.photo_paths || []) urls[ph] = await api.fileUrl("worklog", ph).catch(() => "");
  await shell("#/work", "Work log", `
    <p class="muted" style="margin:-10px 0 18px">Everything we do at your apartment: cleaning, inspections, maintenance and repairs, with photos.</p>
    <div class="card">${items.length ? `<div class="tl">${items.map(w => `<div class="tl-item"><div class="small muted">${fmtDate(w.date)} · ${esc(KIND[w.kind] || w.kind)}</div><div>${esc(w.description)}</div>
      ${(w.photo_paths || []).length ? `<div class="photos">${w.photo_paths.map(ph => urls[ph] ? `<a href="${esc(urls[ph])}" target="_blank" rel="noopener"><img src="${esc(urls[ph])}" alt=""></a>` : "").join("")}</div>` : ""}</div>`).join("")}</div>`
      : `<div class="empty">No entries yet.</div>`}</div>`);
}

async function documentsPage() {
  const docs = await api.documents();
  await shell("#/documents", "Documents", `
    <div class="card">${docs.length ? `<table class="t"><thead><tr><th>Document</th><th>Status</th><th class="hide-sm">Added</th></tr></thead><tbody>
      ${docs.map(d => `<tr class="click" data-href="#/documents/${d.id}"><td><b>${esc(d.title)}</b></td><td>${pill(d.status)}</td><td class="hide-sm">${fmtDate(d.created_at)}</td></tr>`).join("")}
    </tbody></table>` : `<div class="empty">No documents yet.</div>`}</div>`);
  bindRows();
}

async function documentPage(id) {
  const d = await api.document(id);
  const url = await api.fileUrl("documents", d.file_path);
  if (!isStaff()) api.markViewed(d.id).catch(() => {});
  const canSign = d.status === "awaiting_signature" && !isStaff();
  await shell("#/documents", "", `
    <div class="page-head"><div><a href="#/documents" class="small">← Documents</a><h1 style="margin-top:6px">${esc(d.title)}</h1></div><div class="btn-row">${pill(d.status)}<a class="btn btn-ghost btn-sm" href="${esc(url)}" target="_blank" rel="noopener">Open in new tab</a></div></div>
    <div class="doc-view">
      <div class="doc-pages card" id="pages"><div class="empty">Loading document…</div></div>
      <div class="card card-pad doc-side">
        ${canSign ? `<h3>Sign electronically</h3><p class="small muted">Read the document, then confirm below. Your electronic signature has the same effect as a handwritten one (clause 9.3).</p>
          <form class="form" id="sf">
            <div class="field"><label>Full name</label><input name="name" value="${esc(state.me.full_name)}" required></div>
            <label class="check small"><input type="checkbox" name="agree" required><span>I have read “${esc(d.title)}” and agree to it.</span></label>
            <div id="err"></div><button class="btn btn-brass" type="submit">Sign document</button></form>`
        : d.status === "signed" ? `<h3>Signed</h3><div class="sig-box" style="margin-top:12px"><div class="sig-name">${esc(d.signed_name)}</div>
            <div class="small muted" style="margin-top:6px">Signed electronically on ${fmtDateTime(d.signed_at)}${d.signed_ip ? `<br>IP ${esc(d.signed_ip)}` : ""}${d.sha256 ? `<br>Document fingerprint (SHA-256) ${esc(d.sha256.slice(0, 16))}…` : ""}</div></div>`
        : `<h3>Information</h3><p class="small muted">Added ${fmtDate(d.created_at)}. No signature is needed.</p>`}
      </div>
    </div>`);
  renderPdf(url, $("#pages"));
  const sf = $("#sf");
  if (sf) sf.onsubmit = async (e) => {
    e.preventDefault();
    try { await api.signDocument(d.id, new FormData(sf).get("name")); toast("Document signed"); route(); }
    catch (err) { $("#err").innerHTML = `<div class="notice err">${esc(friendly(err))}</div>`; }
  };
}

// PDF.js renders every page as an image, so documents look the same on iPhone, Android and desktop.
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/";
async function renderPdf(url, box) {
  try {
    const pdfjs = await import(PDFJS + "pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.mjs";
    const pdf = await pdfjs.getDocument(url).promise;
    box.innerHTML = "";
    const width = Math.min(box.clientWidth - 32, 900);
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = width / base.width, dpr = window.devicePixelRatio || 1;
      const vp = page.getViewport({ scale: scale * dpr });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height; c.style.width = `${Math.round(vp.width / dpr)}px`;
      box.appendChild(c);
      await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    }
  } catch (e) {
    box.innerHTML = `<div class="empty">The document could not be shown here. <a href="${esc(url)}" target="_blank" rel="noopener">Open it in a new tab</a>.</div>`;
  }
}

function ibanOk(iban) {
  const s = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => c.charCodeAt(0) - 55);
  let m = 0; for (const ch of r) m = (m * 10 + +ch) % 97;
  return m === 1;
}
async function bankPage() {
  const [bank, hist] = await Promise.all([api.bank(state.me.id), api.bankHistory(state.me.id)]);
  const b = bank || {};
  await shell("#/bank", "Payout details", `
    <div class="grid g2">
      <div class="card card-pad">
        <p class="muted" style="margin-top:0">Payouts are sent to this account. Every change is confirmed to you by email and applies to payouts requested after the change (clause 5.10).</p>
        <form class="form cols" id="bf">
          <div class="field"><label>Account holder name</label><input name="account_name" value="${esc(b.account_name)}" required></div>
          <div class="field"><label>Bank</label><input name="bank_name" value="${esc(b.bank_name)}" required></div>
          <div class="field"><label>IBAN</label><input name="iban" value="${esc(b.iban)}" required placeholder="AE07 0331 2345 6789 0123 456"><div class="err hidden" id="iban-err">This IBAN does not look valid.</div></div>
          <div class="field"><label>SWIFT / BIC</label><input name="swift" value="${esc(b.swift)}" placeholder="optional"></div>
          <div class="field"><label>Currency</label><select name="currency">${["AED", "USD", "EUR", "GBP", "RUB"].map(c => `<option ${c === (b.currency || "AED") ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>Bank letter (optional)</label><input name="letter" type="file" accept=".pdf,image/*"><div class="hint">${b.bank_letter_path ? "A letter is on file." : "PDF or photo of a bank letter confirming the account."}</div></div>
          <div style="grid-column:1/-1" id="err"></div>
          <div style="grid-column:1/-1"><button class="btn" type="submit">${bank ? "Update details" : "Save details"}</button></div>
        </form>
      </div>
      <div class="card"><div class="card-head"><h3>Change history</h3></div>
        ${hist.length ? `<table class="t"><tbody>${hist.map(h => `<tr><td>${fmtDateTime(h.changed_at)}</td><td class="r small">IBAN ••••${esc(String(h.snapshot.iban || "").slice(-4))}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">No changes yet.</div>`}
      </div>
    </div>`);
  $("#bf").onsubmit = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    const iban = String(f.get("iban")).replace(/\s+/g, "").toUpperCase();
    $("#iban-err").classList.toggle("hidden", ibanOk(iban));
    if (!ibanOk(iban)) return;
    const letter = f.get("letter");
    try {
      await api.saveBank(state.me.id, { account_name: f.get("account_name").trim(), bank_name: f.get("bank_name").trim(), iban, swift: f.get("swift").trim() || null, currency: f.get("currency") }, letter && letter.size ? letter : null);
      toast("Payout details saved — a confirmation email is on its way"); route();
    } catch (err) { $("#err").innerHTML = `<div class="notice err">${esc(friendly(err))}</div>`; }
  };
}

async function accountPage() {
  await shell("#/account", "Profile & security", `
    <div class="grid g2">
      <div class="card card-pad"><h3>Profile</h3><div class="sum" style="margin-top:12px">
        <div class="row"><span class="muted">Name</span><span>${esc(state.me.full_name)}</span></div>
        <div class="row"><span class="muted">Email</span><span>${esc(state.me.email)}</span></div></div>
        <p class="small muted" style="margin-top:14px">To change your name or email, write to <a href="mailto:info@dlvh.ae">info@dlvh.ae</a>.</p></div>
      <div class="card card-pad"><h3>Change password</h3>
        <form class="form" id="pf"><div class="field"><label>New password</label><input name="p1" type="password" minlength="6" autocomplete="new-password" required></div>
        <div class="field"><label>Repeat password</label><input name="p2" type="password" minlength="6" autocomplete="new-password" required></div><div id="err"></div>
        <button class="btn" type="submit">Update password</button></form></div>
    </div>`);
  $("#pf").onsubmit = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    if (f.get("p1") !== f.get("p2")) { $("#err").innerHTML = `<div class="notice err">Passwords do not match.</div>`; return; }
    try { await api.setPassword(f.get("p1")); e.target.reset(); toast("Password updated"); }
    catch (err) { $("#err").innerHTML = `<div class="notice err">${esc(friendly(err))}</div>`; }
  };
}

// ---------- Staff pages ----------
async function adminHome() {
  const [owners, props] = await Promise.all([api.owners(), api.allProperties()]);
  const ownersOnly = owners.filter(o => o.role === "owner");
  await shell("#/admin", "Owners & properties", `
    <div class="btn-row" style="margin:-8px 0 18px"><button class="btn" id="new-owner">Invite owner</button><button class="btn btn-ghost" id="new-prop">Add property</button></div>
    <div class="grid g2">
      <div class="card"><div class="card-head"><h3>Properties</h3></div>
        ${props.length ? `<table class="t"><thead><tr><th>Property</th><th>Owner</th><th class="r">Fee</th></tr></thead><tbody>
        ${props.map(p => `<tr class="click" data-href="#/admin/p/${p.id}"><td><b>${esc(p.name)}</b><div class="small muted">${esc(p.address || "")}</div></td><td>${esc(p.owner?.full_name || "")}</td><td class="r">${Math.round(p.fee_rate * 100)}%</td></tr>`).join("")}</tbody></table>` : `<div class="empty">No properties yet.</div>`}</div>
      <div class="card"><div class="card-head"><h3>Owners</h3></div>
        ${ownersOnly.length ? `<table class="t"><tbody>${ownersOnly.map(o => `<tr><td><b>${esc(o.full_name)}</b><div class="small muted">${esc(o.email)}</div></td><td class="r"><button class="btn btn-ghost btn-sm" data-resend="${esc(o.email)}" data-name="${esc(o.full_name)}">Access link</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty">No owners yet.</div>`}</div>
    </div>`);
  bindRows();
  const invite = (name = "", email = "") => modal("Invite owner", `
    <div class="form"><div class="field"><label>Full name (as in passport)</label><input id="iv-name" value="${esc(name)}"></div>
    <div class="field"><label>Email</label><input id="iv-email" type="email" value="${esc(email)}"></div>
    <p class="small muted">We email the owner a personal link from info@dlvh.ae. It opens the portal and asks them to create a password.</p></div>`,
    [{ label: "Cancel", cls: "btn-ghost" }, { label: "Send invitation", onClick: async (m) => {
      const email = $("#iv-email", m).value.trim();
      $(".body", m).insertAdjacentHTML("beforeend", `<div class="notice info" id="iv-wait">Sending the invitation from info@dlvh.ae…</div>`);
      const r = await api.inviteOwner($("#iv-name", m).value.trim(), email);
      $(".body", m).innerHTML = r.emailed
        ? `<div class="notice ok">Invitation emailed to <b>${esc(email)}</b> from info@dlvh.ae.</div><p class="small muted" style="margin-top:12px">You can also send this personal link yourself (WhatsApp). It works once, within 24 hours.</p><div class="field"><input id="lnk" readonly value="${esc(r.link)}"></div><button class="btn btn-ghost btn-sm" id="cp" style="margin-top:8px">Copy link</button>`
        : `<div class="notice brass">The invitation is queued and will be emailed to <b>${esc(email)}</b> shortly.</div>`;
      const cp = $("#cp", m);
      if (cp) cp.onclick = () => { navigator.clipboard.writeText(r.link).then(() => toast("Link copied"), () => $("#lnk", m).select()); };
      $(".foot", m).innerHTML = ""; const done = document.createElement("button"); done.className = "btn"; done.textContent = "Done"; done.onclick = () => { m.remove(); route(); }; $(".foot", m).appendChild(done);
      return false;
    } }]);
  $("#new-owner").onclick = () => invite();
  document.querySelectorAll("[data-resend]").forEach(b => b.onclick = () => invite(b.dataset.name, b.dataset.resend));
  $("#new-prop").onclick = () => propertyForm(ownersOnly);
}

function propertyForm(owners, p = {}) {
  modal(p.id ? "Edit property" : "Add property", `<div class="form">
    <div class="field"><label>Owner</label><select id="pp-owner">${owners.map(o => `<option value="${o.id}" ${o.id === p.owner_id ? "selected" : ""}>${esc(o.full_name)} · ${esc(o.email)}</option>`).join("")}</select></div>
    <div class="field"><label>Name</label><input id="pp-name" value="${esc(p.name)}" placeholder="LIV Waterside 1503"></div>
    <div class="field"><label>Address</label><input id="pp-addr" value="${esc(p.address)}"></div>
    <div class="form cols"><div class="field"><label>Area, sq m</label><input id="pp-area" value="${esc(p.area_sqm)}"></div><div class="field"><label>Parking</label><input id="pp-park" value="${esc(p.parking)}"></div>
    <div class="field"><label>Title deed No.</label><input id="pp-deed" value="${esc(p.title_deed)}"></div><div class="field"><label>DET permit No.</label><input id="pp-permit" value="${esc(p.permit_no)}"></div>
    <div class="field"><label>Fee, %</label><input id="pp-fee" value="${p.fee_rate ? Math.round(p.fee_rate * 100) : 10}"></div><div class="field"><label>Agreement date</label><input id="pp-date" type="date" value="${esc(p.agreement_date)}"></div>
    <div class="field"><label>Building photo</label><input id="pp-photo" type="file" accept="image/*"><div class="hint">${p.photo_path ? "A photo is set. Choose a file to replace it." : "Exterior of the building, seen from a distance."}</div></div><div class="field"><label>Photo credit</label><input id="pp-credit" value="${esc(p.photo_credit)}" placeholder="© Diamond Line"></div></div></div>`,
    [{ label: "Cancel", cls: "btn-ghost" }, { label: "Save", onClick: async (m) => {
      const v = (s) => $(s, m).value.trim();
      await api.saveProperty({ ...(p.id ? { id: p.id } : {}), owner_id: v("#pp-owner"), name: v("#pp-name"), address: v("#pp-addr") || null, area_sqm: v("#pp-area") || null,
        parking: v("#pp-park") || null, title_deed: v("#pp-deed") || null, permit_no: v("#pp-permit") || null, fee_rate: (+v("#pp-fee") || 10) / 100, agreement_date: v("#pp-date") || null,
        photo_credit: v("#pp-credit") || null }, $("#pp-photo", m).files[0] || null);
      toast("Property saved"); route();
    } }]);
}

async function adminProperty(id, params) {
  const props = await api.allProperties();
  const p = props.find(x => x.id === id);
  const tab = params.get("tab") || "bookings";
  const tabs = [["bookings", "Bookings"], ["expenses", "Expenses"], ["work", "Work log"], ["documents", "Documents"], ["statements", "Statements"]];
  let body = "";
  if (tab === "bookings") {
    const bs = await api.bookings(id);
    body = `<div class="card card-pad" style="margin-bottom:16px"><form class="form cols" id="bk">
      <div class="field"><label>Channel</label><select name="channel"><option>Booking.com</option><option>Airbnb</option><option>Direct</option></select></div>
      <div class="field"><label>Status</label><select name="status"><option value="confirmed">Guest stay</option><option value="owner_stay">Owner stay</option><option value="blocked">Blocked</option></select></div>
      <div class="field"><label>Check-in</label><input name="check_in" type="date" required></div><div class="field"><label>Check-out</label><input name="check_out" type="date" required></div>
      <div class="field"><label>Guest paid, AED</label><input name="gross" inputmode="decimal" value="0"></div><div class="field"><label>Platform commission, AED</label><input name="ota_commission" inputmode="decimal" value="0"></div>
      <div class="field"><label>Guest (initials ok)</label><input name="guest_name"></div><div class="field"><label>Reference</label><input name="reference"></div>
      <div style="grid-column:1/-1"><button class="btn" type="submit">Add booking</button></div></form></div>
      <div class="card"><table class="t"><thead><tr><th>Dates</th><th>Channel</th><th class="r">Paid</th><th class="r">Commission</th><th class="r">Net</th><th></th></tr></thead><tbody>
      ${bs.map(b => `<tr><td class="nw">${fmtRange(b.check_in, b.check_out)}<div class="small muted">${b.nights}n · ${esc(b.status)}</div></td><td>${esc(b.channel)}</td><td class="r">${aed(b.gross)}</td><td class="r">${aed(b.ota_commission)}</td><td class="r">${aed(b.net)}</td><td class="r"><button class="btn btn-ghost btn-sm" data-del="${b.id}">Delete</button></td></tr>`).join("") || `<tr><td colspan="6" class="empty">No bookings.</td></tr>`}
      </tbody></table></div>`;
  } else if (tab === "expenses") {
    const ex = await api.expenses(id);
    body = `<div class="card card-pad" style="margin-bottom:16px"><form class="form cols" id="ex">
      <div class="field"><label>Date</label><input name="date" type="date" required value="${todayIso()}"></div>
      <div class="field"><label>Category</label><select name="category"><option value="permit">DET permit</option><option value="repair">Repair</option><option value="replacement">Replacement</option><option value="utilities">Utilities</option><option value="service_charge">Service charge</option><option value="other">Other</option></select></div>
      <div class="field"><label>Description</label><input name="description" required></div><div class="field"><label>Amount, AED</label><input name="amount" inputmode="decimal" required></div>
      <div class="field"><label>Receipt</label><input name="file" type="file" accept=".pdf,image/*"></div>
      <div style="grid-column:1/-1"><button class="btn" type="submit">Add expense</button></div></form></div>
      <div class="card"><table class="t"><tbody>${ex.map(e => `<tr><td>${fmtDate(e.date)}</td><td>${esc(e.description)}</td><td>${e.receipt_path ? "receipt ✓" : ""}</td><td class="r">${aed(e.amount)}</td></tr>`).join("") || `<tr><td class="empty">No expenses.</td></tr>`}</tbody></table></div>`;
  } else if (tab === "work") {
    const w = await api.work(id);
    body = `<div class="card card-pad" style="margin-bottom:16px"><form class="form cols" id="wk">
      <div class="field"><label>Date</label><input name="date" type="date" required value="${todayIso()}"></div>
      <div class="field"><label>Type</label><select name="kind"><option value="cleaning">Cleaning</option><option value="inspection">Inspection</option><option value="maintenance">Maintenance</option><option value="repair">Repair</option><option value="photography">Photography</option><option value="other">Other</option></select></div>
      <div class="field" style="grid-column:1/-1"><label>What was done</label><input name="description" required></div>
      <div class="field"><label>Photos</label><input name="photos" type="file" accept="image/*" multiple></div>
      <div style="grid-column:1/-1"><button class="btn" type="submit">Add entry</button></div></form></div>
      <div class="card"><table class="t"><tbody>${w.map(x => `<tr><td>${fmtDate(x.date)}</td><td>${esc(x.kind)}</td><td>${esc(x.description)}</td><td class="r small">${(x.photo_paths || []).length} photos</td></tr>`).join("") || `<tr><td class="empty">No entries.</td></tr>`}</tbody></table></div>`;
  } else if (tab === "documents") {
    const docs = (await api.documents()).filter(d => d.owner_id === p.owner_id);
    body = `<div class="card card-pad" style="margin-bottom:16px"><form class="form cols" id="dc">
      <div class="field"><label>Title</label><input name="title" required placeholder="Property Management Agreement"></div>
      <div class="field"><label>Type</label><select name="kind"><option value="agreement">Agreement</option><option value="noc">DET NOC</option><option value="inventory">Inventory</option><option value="other">Other</option></select></div>
      <div class="field"><label>PDF</label><input name="file" type="file" accept="application/pdf" required></div>
      <label class="check" style="align-self:end"><input type="checkbox" name="sign" checked><span>Owner must sign</span></label>
      <div style="grid-column:1/-1"><button class="btn" type="submit">Upload for owner</button></div></form></div>
      <div class="card"><table class="t"><tbody>${docs.map(d => `<tr class="click" data-href="#/documents/${d.id}"><td>${esc(d.title)}</td><td>${pill(d.status)}</td><td class="small muted">${d.signed_at ? "signed " + fmtDateTime(d.signed_at) : d.viewed_at ? "opened " + fmtDateTime(d.viewed_at) : "not opened yet"}</td></tr>`).join("") || `<tr><td class="empty">No documents.</td></tr>`}</tbody></table></div>`;
  } else {
    const sts = await api.statements(id);
    const prev = addMonths(todayIso().slice(0, 7) + "-01", -1).slice(0, 7);
    body = `<div class="card card-pad" style="margin-bottom:16px"><form class="btn-row" id="ps"><div class="field"><label>Month</label><input name="m" type="month" value="${prev}" required></div>
      <button class="btn" type="submit" style="align-self:end">Publish statement and notify owner</button></form>
      <p class="small muted" style="margin-bottom:0">Totals are calculated from bookings (by check-out date) and expenses of that month. Publishing again recalculates it.</p></div>
      <div class="card"><table class="t"><thead><tr><th>Month</th><th>Status</th><th class="r">Balance</th><th></th></tr></thead><tbody>
      ${sts.map(s => `<tr><td><a href="#/statements/${s.id}">${monthLabel(s.period)}</a></td><td>${pill(s.status, false)}</td><td class="r">${aed(s.balance)}</td><td class="r">${["payout_requested", "published"].includes(s.status) ? `<button class="btn btn-ghost btn-sm" data-paid="${s.id}">Mark paid</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="4" class="empty">No statements.</td></tr>`}
      </tbody></table></div>`;
  }
  await shell("#/admin", "", `
    <div class="page-head"><div><a href="#/admin" class="small">← Owners & properties</a><h1 style="margin-top:6px">${esc(p.name)}</h1><p>${esc(p.owner?.full_name || "")} · ${esc(p.owner?.email || "")} · fee ${Math.round(p.fee_rate * 100)}%</p></div><button class="btn btn-ghost btn-sm" id="edit-prop">Edit property</button></div>
    <div class="btn-row" style="margin-bottom:16px">${tabs.map(([k, l]) => `<a class="btn btn-sm ${k === tab ? "" : "btn-ghost"}" href="#/admin/p/${id}?tab=${k}">${l}</a>`).join("")}</div>
    ${body}`);
  bindRows();
  $("#edit-prop").onclick = async () => propertyForm((await api.owners()).filter(o => o.role === "owner"), p);
  const num = (v) => Number(String(v || "0").replace(/,/g, ""));
  const form = (sel, fn) => { const f = $(sel); if (f) f.onsubmit = async (e) => { e.preventDefault(); const btn = $("button[type=submit]", f); btn.disabled = true; try { await fn(new FormData(f)); toast("Saved"); route(); } catch (err) { btn.disabled = false; toast(friendly(err)); } }; };
  form("#bk", (f) => api.addBooking({ property_id: id, channel: f.get("status") === "confirmed" ? f.get("channel") : "Owner", status: f.get("status"), check_in: f.get("check_in"), check_out: f.get("check_out"), gross: num(f.get("gross")), ota_commission: num(f.get("ota_commission")), guest_name: f.get("guest_name") || null, reference: f.get("reference") || null }));
  form("#ex", (f) => { const file = f.get("file"); return api.addExpense({ property_id: id, date: f.get("date"), category: f.get("category"), description: f.get("description"), amount: num(f.get("amount")) }, file && file.size ? file : null, p.owner_id); });
  form("#wk", (f) => api.addWork({ property_id: id, date: f.get("date"), kind: f.get("kind"), description: f.get("description") }, f.getAll("photos").filter(x => x.size), p.owner_id));
  form("#dc", (f) => api.uploadDocument({ owner_id: p.owner_id, property_id: id, title: f.get("title"), kind: f.get("kind"), requires_signature: f.get("sign") === "on" }, f.get("file")));
  form("#ps", (f) => api.publishStatement(id, f.get("m") + "-01"));
  document.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => { if (confirm("Delete this booking?")) { await api.deleteBooking(b.dataset.del); route(); } });
  document.querySelectorAll("[data-paid]").forEach(b => b.onclick = () => markPaidDialog(b.dataset.paid));
}

function markPaidDialog(sid) {
  modal("Mark payout as sent", `<div class="field"><label>Bank transfer reference</label><input id="ref"></div><p class="small muted">The owner gets an email that the payout was sent.</p>`,
    [{ label: "Cancel", cls: "btn-ghost" }, { label: "Mark paid", onClick: async (m) => { await api.markPaid(sid, $("#ref", m).value.trim()); toast("Marked as paid"); route(); } }]);
}

async function adminPayouts() {
  const q = await api.payoutQueue();
  const total = q.reduce((s, r) => s + +r.balance, 0);
  await shell("#/admin/payouts", "Payout queue", `
    <p class="muted" style="margin:-10px 0 18px">Statements approved by owners. Export a bulk-payment file for the bank, send it, then mark each payout as paid.</p>
    <div class="btn-row" style="margin-bottom:16px"><button class="btn" id="csv" ${q.length ? "" : "disabled"}>Export bulk payment CSV</button><span class="muted">${q.length} payouts · ${aed(total)}</span></div>
    <div class="card">${q.length ? `<table class="t"><thead><tr><th>Owner</th><th>Property · month</th><th>Bank</th><th class="r">Amount</th><th></th></tr></thead><tbody>
      ${q.map(r => `<tr><td><b>${esc(r.property.owner?.full_name)}</b><div class="small muted">requested ${fmtDateTime(r.payout_requested_at)}</div></td><td>${esc(r.property.name)}<div class="small muted">${monthLabel(r.period)}</div></td>
        <td>${r.bank ? `${esc(r.bank.account_name)}<div class="small muted">${esc(r.bank.bank_name)} · ${esc(r.bank.iban)}${r.bank.swift ? " · " + esc(r.bank.swift) : ""}</div>` : `<span class="pill p-warn">No bank details</span>`}</td>
        <td class="r"><b>${aed(r.balance)}</b></td><td class="r"><button class="btn btn-ghost btn-sm" data-paid="${r.id}">Mark paid</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty">No payouts waiting.</div>`}</div>`);
  document.querySelectorAll("[data-paid]").forEach(b => b.onclick = () => markPaidDialog(b.dataset.paid));
  const csv = $("#csv");
  if (csv) csv.onclick = () => {
    const rows = [["Beneficiary name", "IBAN", "SWIFT", "Bank", "Amount", "Currency", "Reference"]];
    for (const r of q) if (r.bank) rows.push([r.bank.account_name, r.bank.iban, r.bank.swift || "", r.bank.bank_name, Number(r.balance).toFixed(2), r.bank.currency || "AED", `DL ${r.property.name} ${r.period.slice(0, 7)}`]);
    const text = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    a.download = `diamond-line-payouts-${todayIso()}.csv`; a.click();
  };
}

// ---------- Helpers ----------
function bindRows() { document.querySelectorAll("tr[data-href]").forEach(tr => tr.onclick = (e) => { if (!e.target.closest("a,button")) location.hash = tr.dataset.href; }); }
function bindFiles() {
  document.querySelectorAll("[data-file]").forEach(a => a.onclick = async (e) => {
    e.preventDefault(); const [bucket, path] = a.dataset.file.split("|");
    window.open(await api.fileUrl(bucket, path), "_blank", "noopener");
  });
}

// ---------- Router ----------
async function route() {
  const raw = location.hash.replace(/^#/, "") || "/";
  if (/error_description/.test(raw)) {
    history.replaceState(null, "", location.pathname);
    return loginPage(null, "This link has expired or was already used. Use “Forgot your password?” to get a new one.");
  }
  const [path, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  if (path === "/reset") return resetPage();
  if (path === "/accept") return acceptPage(params);
  if (!state.session) return loginPage();
  if (state.mustSetPassword) return setPasswordPage(state.mustSetPassword);
  if (path === "/set-password") return setPasswordPage(params.get("kind") || "recovery");
  try {
    const m = (re) => path.match(re);
    let r;
    if (path === "/") return isStaff() && !state.props.length ? adminHome() : propertiesPage();
    if ((r = m(/^\/p\/(.+)$/))) { if (state.props.find(x => x.id === r[1])) { state.propId = r[1]; localStorage.setItem("dl.prop", r[1]); } return overview(); }
    if (path === "/calendar") return calendar(params);
    if (path === "/statements") return statementsList();
    if ((r = m(/^\/statements\/(.+)$/))) return statementPage(r[1]);
    if (path === "/expenses") return expensesPage();
    if (path === "/work") return workPage();
    if (path === "/documents") return documentsPage();
    if ((r = m(/^\/documents\/(.+)$/))) return documentPage(r[1]);
    if (path === "/bank") return bankPage();
    if (path === "/account") return accountPage();
    if (isStaff() && path === "/admin") return adminHome();
    if (isStaff() && path === "/admin/payouts") return adminPayouts();
    if (isStaff() && (r = m(/^\/admin\/p\/(.+)$/))) return adminProperty(r[1], params);
    location.hash = "#/";
  } catch (e) {
    app.innerHTML = `<div class="content"><div class="notice err">Something went wrong: ${esc(friendly(e))}. <a href="#/">Back to my properties</a></div></div>`;
  }
}

async function boot() {
  if (NOT_CONFIGURED) { app.innerHTML = `<div class="content"><h1>Owner Portal</h1><p class="muted">The portal is being set up. Please contact <a href="mailto:info@dlvh.ae">info@dlvh.ae</a>.</p></div>`; return; }
  state.session = await api.session();
  // Tokens from an email link have been read by the client by now; drop them from the address bar.
  if (/access_token/.test(location.hash)) history.replaceState(null, "", location.pathname + "#/");
  if (state.session) {
    state.me = await api.me();
    state.props = await api.properties();
    if (!state.props.find(p => p.id === state.propId)) state.propId = state.props[0]?.id || null;
  }
  route();
}

window.addEventListener("hashchange", route);
// An invite or password-reset link signs the user in; ask for a password once, right after it.
state.mustSetPassword = AUTH_LINK_TYPE === "invite" || AUTH_LINK_TYPE === "recovery" ? AUTH_LINK_TYPE : null;
if (!IS_DEMO && !NOT_CONFIGURED) {
  // Supabase runs this inside its auth lock: no awaited Supabase calls here, only state updates.
  // (It also reports SIGNED_IN every time the tab becomes visible again, so that event is ignored.)
  api.onAuth((event, session) => {
    if (event === "PASSWORD_RECOVERY") { state.session = session; state.mustSetPassword = "recovery"; setTimeout(route, 0); }
    else if (event === "SIGNED_OUT") { state.session = null; state.me = null; setTimeout(route, 0); }
    else if (session) state.session = session;
  });
}
boot();
