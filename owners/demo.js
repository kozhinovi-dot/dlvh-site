// In-memory demo backend for local previews only (localhost). Fictional data.
const qs = new URLSearchParams(location.search);
const staff = qs.has("staff");
const uid = staff ? "staff-1" : "owner-1";
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const ym = (offset) => { const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1)); return iso(d); };

const db = {
  profiles: [
    { id: "owner-1", full_name: "Demo Owner", email: "owner@example.com", role: "owner" },
    { id: "staff-1", full_name: "Diamond Line Team", email: "info@dlvh.ae", role: "staff" },
  ],
  properties: [
    { id: "p1", owner_id: "owner-1", name: "Demo Apartment 1204", address: "Dubai Marina, Dubai", area_sqm: 76.25, parking: "B-16", title_deed: "000000/2026", permit_no: "DEMO-HH-001", fee_rate: 0.10, agreement_date: ym(-2),
      photo_path: "../assets/images/dubai-marina-dusk.jpg", photo_credit: "Photo: Norlando Pobre, CC BY 2.0" },
    { id: "p2", owner_id: "owner-1", name: "Demo Apartment 804", address: "Business Bay, Dubai", area_sqm: 58.4, parking: "P2-031", title_deed: "000001/2026", permit_no: "DEMO-HH-002", fee_rate: 0.10, agreement_date: ym(-1),
      photo_path: "../assets/images/business-bay-canal.jpg", photo_credit: "Photo: Iwona Rege, CC BY-SA 4.0" },
  ],
  bookings: [], expenses: [], work_log: [], statements: [], documents: [], bank_accounts: [], bank_account_changes: [], activity: [],
};
let n = 0; const id = () => "id" + (++n);
const B = (ci, nights, channel, gross, comm, guest, pid = "p1") => db.bookings.push({ id: id(), property_id: pid, channel, guest_name: guest, check_in: ci, check_out: addDays(ci, nights), nights, gross, ota_commission: comm, net: +(gross - comm).toFixed(2), status: "confirmed" });
B(addDays(ym(-2), 2), 4, "Booking.com", 2480, 372, "M. Hassan");
B(addDays(ym(-2), 9), 6, "Airbnb", 3540, 531, "J. Smith");
B(addDays(ym(-2), 18), 5, "Booking.com", 3050, 457.5, "A. Petrova");
B(addDays(ym(-1), 1), 3, "Direct", 1890, 0, "K. Lee");
B(addDays(ym(-1), 6), 7, "Booking.com", 4410, 661.5, "S. Müller");
B(addDays(ym(-1), 15), 4, "Airbnb", 2600, 390, "R. Khan");
B(addDays(ym(-1), 22), 5, "Booking.com", 3350, 502.5, "L. Rossi");
B(addDays(ym(0), 2), 5, "Airbnb", 3400, 510, "D. Novak");
B(addDays(ym(0), 9), 4, "Booking.com", 2760, 414, "E. Brown");
B(addDays(ym(0), 16), 6, "Booking.com", 4200, 630, "T. Ahmed");
B(addDays(ym(-1), 3), 4, "Airbnb", 2240, 336, "N. Ivanova", "p2");
B(addDays(ym(-1), 12), 6, "Booking.com", 3480, 522, "P. Garcia", "p2");
B(addDays(ym(0), 5), 3, "Booking.com", 1710, 256.5, "H. Tanaka", "p2");
B(addDays(ym(0), 20), 5, "Direct", 2650, 0, "O. Smirnov", "p2");
db.bookings.push({ id: id(), property_id: "p1", channel: "Owner stay", guest_name: "Owner", check_in: addDays(ym(0), 24), check_out: addDays(ym(0), 27), nights: 3, gross: 0, ota_commission: 0, net: 0, status: "owner_stay" });

db.expenses.push(
  { id: id(), property_id: "p1", date: addDays(ym(-2), 1), category: "permit", description: "DET holiday home permit", amount: 1590, receipt_path: null },
  { id: id(), property_id: "p1", date: addDays(ym(-1), 12), category: "repair", description: "AC thermostat replaced", amount: 420, receipt_path: null },
);
db.work_log.push(
  { id: id(), property_id: "p1", date: addDays(ym(-2), 0), kind: "photography", description: "Professional photo shoot for listings", photo_paths: [] },
  { id: id(), property_id: "p1", date: addDays(ym(-1), 12), kind: "repair", description: "AC thermostat replaced in the bedroom (receipt in Expenses)", photo_paths: [] },
  { id: id(), property_id: "p1", date: addDays(ym(-1), 13), kind: "cleaning", description: "Deep clean and linen change after a 7-night stay", photo_paths: [] },
  { id: id(), property_id: "p1", date: addDays(ym(0), 1), kind: "inspection", description: "Monthly inspection: all appliances working, no damage", photo_paths: [] },
);
const stmt = (period, status, pid = "p1") => {
  const from = period; const d = new Date(period + "T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + 1); const to = iso(d);
  const inc = db.bookings.filter(b => b.property_id === pid && b.status === "confirmed" && b.check_out >= from && b.check_out < to).reduce((s, b) => s + b.net, 0);
  const exp = db.expenses.filter(e => e.property_id === pid && e.date >= from && e.date < to).reduce((s, e) => s + e.amount, 0);
  const fee = +(inc * 0.10).toFixed(2);
  db.statements.push({ id: id(), property_id: pid, period, rental_income: +inc.toFixed(2), management_fee: fee, expenses: exp, carried_forward: 0,
    balance: +(inc - fee - exp).toFixed(2), status, published_at: addDays(to, 9) + "T09:00:00Z",
    payout_requested_at: status !== "published" ? addDays(to, 10) + "T12:00:00Z" : null, paid_at: status === "paid" ? addDays(to, 18) + "T10:00:00Z" : null, payout_reference: status === "paid" ? "DL-PAYOUT-0001" : null });
};
stmt(ym(-2), "paid");
stmt(ym(-1), "published");
stmt(ym(-1), "payout_requested", "p2");
db.documents.push(
  { id: "d1", owner_id: "owner-1", property_id: "p1", title: "Property Management Agreement", kind: "agreement", file_path: "demo-document.pdf", sha256: "9f2c4e0b7d1a5c3e8b6f0a2d4c6e8f1a3b5c7d9e0f2a4b6c8d0e2f4a6b8c0d2e", requires_signature: true, status: "awaiting_signature", created_at: today.toISOString() },
  { id: "d2", owner_id: "owner-1", property_id: "p1", title: "Photo inventory", kind: "inventory", file_path: "demo-document.pdf", sha256: null, requires_signature: false, status: "available", created_at: today.toISOString() },
);

const wait = (v) => new Promise(r => setTimeout(() => r(structuredClone(v)), 120));
const mine = (pid) => db.properties.find(p => p.id === pid && (staff || p.owner_id === uid));
let listeners = [];

export const DEMO = {
  onAuth: (cb) => { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
  session: async () => ({ user: { id: uid, email: db.profiles.find(p => p.id === uid).email } }),
  signIn: async () => ({}), signOut: async () => { alert("Demo: sign-out is disabled."); },
  sendReset: async () => ({}), setPassword: async () => ({}),
  me: async () => wait(db.profiles.find(p => p.id === uid)),
  properties: async () => wait(db.properties.filter(p => staff || p.owner_id === uid)),
  bookings: async (pid) => wait(mine(pid) ? db.bookings.filter(b => b.property_id === pid) : []),
  statements: async (pid) => wait(db.statements.filter(s => s.property_id === pid).sort((a, b) => b.period.localeCompare(a.period))),
  statement: async (sid) => { const s = db.statements.find(x => x.id === sid); return wait({ ...s, property: db.properties.find(p => p.id === s.property_id) }); },
  statementLines: async (st) => {
    const from = st.period; const d = new Date(from + "T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + 1); const to = iso(d);
    return wait({ bookings: db.bookings.filter(b => b.property_id === st.property_id && b.status === "confirmed" && b.check_out >= from && b.check_out < to),
                  expenses: db.expenses.filter(e => e.property_id === st.property_id && e.date >= from && e.date < to) });
  },
  expenses: async (pid) => wait(db.expenses.filter(e => e.property_id === pid)),
  work: async (pid) => wait(db.work_log.filter(w => w.property_id === pid).sort((a, b) => b.date.localeCompare(a.date))),
  documents: async () => wait(db.documents.filter(d => staff || d.owner_id === uid)),
  document: async (did) => wait(db.documents.find(d => d.id === did)),
  fileUrl: async (_bucket, path) => path,
  markViewed: async (did) => { const d = db.documents.find(x => x.id === did); d.viewed_at ||= new Date().toISOString(); },
  signDocument: async (did, name) => { const d = db.documents.find(x => x.id === did); Object.assign(d, { status: "signed", signed_at: new Date().toISOString(), signed_name: name, signed_ip: "127.0.0.1", signed_user_agent: navigator.userAgent }); return wait(d); },
  requestPayout: async (sid) => {
    if (!db.bank_accounts.find(b => b.owner_id === uid)) throw new Error("please add your bank details first");
    const s = db.statements.find(x => x.id === sid); s.status = "payout_requested"; s.payout_requested_at = new Date().toISOString(); return wait(s);
  },
  queryStatement: async (sid, note) => { const s = db.statements.find(x => x.id === sid); s.status = "queried"; s.owner_note = note; return wait(s); },
  bank: async (oid) => wait(db.bank_accounts.find(b => b.owner_id === oid) || null),
  bankHistory: async (oid) => wait(db.bank_account_changes.filter(c => c.owner_id === oid)),
  saveBank: async (oid, row) => {
    const rec = { owner_id: oid, ...row, updated_at: new Date().toISOString() };
    db.bank_accounts = db.bank_accounts.filter(b => b.owner_id !== oid).concat(rec);
    db.bank_account_changes.unshift({ id: id(), owner_id: oid, snapshot: rec, changed_at: rec.updated_at });
    return wait(rec);
  },
  activity: async () => wait(db.activity),
  owners: async () => wait(db.profiles),
  allProperties: async () => wait(db.properties.map(p => ({ ...p, owner: db.profiles.find(o => o.id === p.owner_id) }))),
  inviteOwner: async (full_name, email) => { db.profiles.push({ id: id(), full_name, email, role: "owner" }); return { link: "https://dlvh.ae/owners/#demo-invite-link" }; },
  saveProperty: async (row) => { row.id ||= id(); db.properties = db.properties.filter(p => p.id !== row.id).concat(row); return wait(row); },
  addBooking: async (row) => { const nights = (new Date(row.check_out) - new Date(row.check_in)) / 864e5; const b = { id: id(), nights, net: row.gross - row.ota_commission, status: "confirmed", ...row }; db.bookings.push(b); return wait(b); },
  deleteBooking: async (bid) => { db.bookings = db.bookings.filter(b => b.id !== bid); },
  addExpense: async (row) => { const e = { id: id(), ...row }; db.expenses.push(e); return wait(e); },
  addWork: async (row) => { const w = { id: id(), photo_paths: [], ...row }; db.work_log.push(w); return wait(w); },
  uploadDocument: async (row, file) => { const d = { id: id(), ...row, file_path: URL.createObjectURL(file), status: row.requires_signature ? "awaiting_signature" : "available", created_at: new Date().toISOString() }; db.documents.push(d); return wait(d); },
  publishStatement: async (pid, period) => { stmt(period, "published"); return wait(db.statements.at(-1)); },
  markPaid: async (sid, ref) => { const s = db.statements.find(x => x.id === sid); Object.assign(s, { status: "paid", paid_at: new Date().toISOString(), payout_reference: ref }); return wait(s); },
  payoutQueue: async () => wait(db.statements.filter(s => s.status === "payout_requested").map(s => {
    const p = db.properties.find(x => x.id === s.property_id);
    return { ...s, property: { ...p, owner: db.profiles.find(o => o.id === p.owner_id) }, bank: db.bank_accounts.find(b => b.owner_id === p.owner_id) || null };
  })),
};
