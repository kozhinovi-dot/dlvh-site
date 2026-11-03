// Data layer of the Owner Portal. One interface, two backends:
// Supabase (live) and an in-memory demo used when no project is configured or with ?demo.
const CFG = window.DL_PORTAL || {};
const LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
// Demo data is only ever served on a local preview, never on dlvh.ae.
export const IS_DEMO = LOCAL && (!CFG.supabaseUrl || new URLSearchParams(location.search).has("demo"));
export const NOT_CONFIGURED = !CFG.supabaseUrl && !LOCAL;

// Captured before the Supabase client consumes the URL fragment.
export const AUTH_LINK_TYPE = new URLSearchParams(location.hash.replace(/^#/, "")).get("type");

let sb = null;
const DEMO = IS_DEMO ? (await import("./demo.js?v=11")).DEMO : null;
if (!IS_DEMO && !NOT_CONFIGURED) {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm");
  sb = createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const monthRange = (period) => {
  const from = period.slice(0, 7) + "-01";
  const d = new Date(from + "T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + 1);
  return [from, d.toISOString().slice(0, 10)];
};

async function sha256(file) {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const safeName = (name) => name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");

const live = {
  onAuth: (cb) => sb.auth.onAuthStateChange((event, session) => cb(event, session)),
  session: async () => must(await sb.auth.getSession()).session,
  signIn: async (email, password) => must(await sb.auth.signInWithPassword({ email, password })),
  signOut: async () => { await sb.auth.signOut(); },
  sendReset: async (email) => must(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })),
  setPassword: async (password) => must(await sb.auth.updateUser({ password })),
  // One-time links from emails land on our own page and are used only when the person presses Continue.
  verifyLink: async (token_hash, type) => must(await sb.auth.verifyOtp({ token_hash, type })),

  me: async () => {
    const { data: { user } } = await sb.auth.getUser();
    return must(await sb.from("profiles").select("*").eq("id", user.id).single());
  },
  properties: async () => must(await sb.from("properties").select("*").order("name")),
  bookings: async (pid) => must(await sb.from("bookings").select("*").eq("property_id", pid).order("check_in")),
  statements: async (pid) => must(await sb.from("statements").select("*").eq("property_id", pid).order("period", { ascending: false })),
  statement: async (id) => must(await sb.from("statements").select("*, property:properties(*)").eq("id", id).single()),
  statementLines: async (st) => {
    const [from, to] = monthRange(st.period);
    const bookings = must(await sb.from("bookings").select("*").eq("property_id", st.property_id)
      .eq("status", "confirmed").gte("check_out", from).lt("check_out", to).order("check_in"));
    const expenses = must(await sb.from("expenses").select("*").eq("property_id", st.property_id)
      .gte("date", from).lt("date", to).order("date"));
    return { bookings, expenses };
  },
  expenses: async (pid) => must(await sb.from("expenses").select("*").eq("property_id", pid).order("date", { ascending: false })),
  work: async (pid) => must(await sb.from("work_log").select("*").eq("property_id", pid).order("date", { ascending: false })),
  documents: async () => must(await sb.from("documents").select("*").order("created_at", { ascending: false })),
  document: async (id) => must(await sb.from("documents").select("*").eq("id", id).single()),
  fileUrl: async (bucket, path) => must(await sb.storage.from(bucket).createSignedUrl(path, 600)).signedUrl,
  markViewed: async (id) => must(await sb.rpc("mark_document_viewed", { p_doc: id })),
  signDocument: async (id, name) => must(await sb.rpc("sign_document", { p_doc: id, p_name: name })),
  requestPayout: async (id) => must(await sb.rpc("request_payout", { p_statement: id })),
  queryStatement: async (id, note) => must(await sb.rpc("query_statement", { p_statement: id, p_note: note })),
  bank: async (ownerId) => must(await sb.from("bank_accounts").select("*").eq("owner_id", ownerId).maybeSingle()),
  bankHistory: async (ownerId) => must(await sb.from("bank_account_changes").select("*").eq("owner_id", ownerId).order("changed_at", { ascending: false })),
  saveBank: async (ownerId, row, letter) => {
    if (letter) {
      const path = `${ownerId}/bank-letter-${Date.now()}-${safeName(letter.name)}`;
      must(await sb.storage.from("bank").upload(path, letter));
      row.bank_letter_path = path;
    }
    return must(await sb.from("bank_accounts").upsert({ owner_id: ownerId, ...row }).select().single());
  },
  activity: async () => must(await sb.from("activity").select("*").order("at", { ascending: false }).limit(50)),

  // ---- staff ----
  owners: async () => must(await sb.from("profiles").select("*").order("full_name")),
  allProperties: async () => must(await sb.from("properties").select("*, owner:profiles(full_name,email)").order("name")),
  // Staff request an invitation; the mail relay creates the link and emails it from info@dlvh.ae (usually within a minute).
  inviteOwner: async (full_name, email) => {
    const row = must(await sb.from("invites").insert({ full_name, email }).select().single());
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const cur = must(await sb.from("invites").select("status, link, error").eq("id", row.id).single());
      if (cur.status === "sent") return { link: cur.link, emailed: true };
      if (cur.status === "failed") throw new Error(cur.error || "invitation failed");
    }
    return { link: null, emailed: false, queued: true };
  },
  saveProperty: async (row, photo) => {
    const saved = must(await sb.from("properties").upsert(row).select().single());
    if (!photo) return saved;
    const path = `${saved.owner_id}/${saved.id}-${Date.now()}-${safeName(photo.name)}`;
    must(await sb.storage.from("photos").upload(path, photo, { contentType: photo.type || "image/jpeg" }));
    return must(await sb.from("properties").update({ photo_path: path }).eq("id", saved.id).select().single());
  },
  addBooking: async (row) => must(await sb.from("bookings").insert(row).select().single()),
  deleteBooking: async (id) => must(await sb.from("bookings").delete().eq("id", id)),
  addExpense: async (row, file, ownerId) => {
    if (file) {
      const path = `${ownerId}/${row.property_id}/${Date.now()}-${safeName(file.name)}`;
      must(await sb.storage.from("receipts").upload(path, file));
      row.receipt_path = path;
    }
    return must(await sb.from("expenses").insert(row).select().single());
  },
  addWork: async (row, files, ownerId) => {
    row.photo_paths = [];
    for (const f of files || []) {
      const path = `${ownerId}/${row.property_id}/${Date.now()}-${safeName(f.name)}`;
      must(await sb.storage.from("worklog").upload(path, f));
      row.photo_paths.push(path);
    }
    return must(await sb.from("work_log").insert(row).select().single());
  },
  uploadDocument: async (row, file) => {
    const path = `${row.owner_id}/${Date.now()}-${safeName(file.name)}`;
    must(await sb.storage.from("documents").upload(path, file, { contentType: file.type || "application/pdf" }));
    row.file_path = path;
    row.sha256 = await sha256(file);
    row.status = row.requires_signature ? "awaiting_signature" : "available";
    return must(await sb.from("documents").insert(row).select().single());
  },
  publishStatement: async (pid, period) => must(await sb.rpc("publish_statement", { p_property: pid, p_period: period })),
  markPaid: async (id, ref) => must(await sb.rpc("mark_paid", { p_statement: id, p_reference: ref })),
  payoutQueue: async () => {
    const rows = must(await sb.from("statements").select("*, property:properties(name, owner_id, owner:profiles(full_name,email))")
      .eq("status", "payout_requested").order("payout_requested_at"));
    const ids = [...new Set(rows.map(r => r.property.owner_id))];
    const banks = ids.length ? must(await sb.from("bank_accounts").select("*").in("owner_id", ids)) : [];
    return rows.map(r => ({ ...r, bank: banks.find(b => b.owner_id === r.property.owner_id) || null }));
  },
};

export const api = IS_DEMO ? DEMO : live;
export { monthRange };
