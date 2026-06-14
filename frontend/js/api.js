/* ============================================================
   api.js — Mock data store (in-memory + localStorage)
   Mensimulasikan API. Semua mutasi CRUD dipersist agar demo
   konsisten antar halaman. Reset via Kas.api.reset().
   ============================================================ */
(function (Kas) {
  const KEY = "kaspetani_db_v1";

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const fresh = JSON.parse(JSON.stringify(window.SEED_DATA));
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }

  let db = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));
  const nextId = (arr) => (arr.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1);

  const api = {
    reset() { localStorage.removeItem(KEY); db = load(); return db; },
    raw: () => db,

    // generic
    all: (t) => (db[t] || []).slice(),
    get: (t, id) => (db[t] || []).find((x) => x.id === Number(id)),
    add(t, obj) { obj.id = nextId(db[t]); obj.created_at = obj.created_at || Kas.util.todayISO(); db[t].push(obj); save(); return obj; },
    update(t, id, patch) { const x = db[t].find((r) => r.id === Number(id)); if (x) { Object.assign(x, patch); save(); } return x; },
    remove(t, id) { db[t] = db[t].filter((r) => r.id !== Number(id)); save(); },

    // joins / helpers
    userById: (id) => db.users.find((u) => u.id === Number(id)),
    adminById: (id) => db.admins.find((a) => a.id === Number(id)),
    adminByUserId: (uid) => db.admins.find((a) => a.user_id === Number(uid)),
    workerByUserId: (uid) => db.workers.find((w) => w.user_id === Number(uid)),
    adminName: (adminId) => { const a = db.admins.find((x) => x.id === Number(adminId)); return a ? a.full_name : "-"; },
    workerName: (wid) => { const w = db.workers.find((x) => x.id === Number(wid)); return w ? w.name : "-"; },

    // workers visible to an admin (by admin record id)
    workersForAdmin: (adminId) => db.workers.filter((w) => w.admin_id === Number(adminId)),
    membersForAdmin: (creatorUserId) => db.users.filter((u) => u.role === "user" && u.created_by === Number(creatorUserId)),

    // kas filtered
    kasForWorker: (wid) => db.daily_kas.filter((k) => k.worker_id === Number(wid)),
    kasForAdmin(adminId) {
      const wids = new Set(db.workers.filter((w) => w.admin_id === Number(adminId)).map((w) => w.id));
      return db.daily_kas.filter((k) => wids.has(k.worker_id));
    },

    // registrations
    regsForJob: (jobId) => db.job_registrations.filter((r) => r.job_id === Number(jobId)),
    regsForUser: (uid) => db.job_registrations.filter((r) => r.user_id === Number(uid)),
    jobsForAdmin: (adminId) => db.jobs.filter((j) => j.admin_id === Number(adminId)),

    notifsForUser: (uid) => db.notifications.filter((n) => n.user_id === Number(uid)),

    // performance for a worker
    performance(workerId) {
      const kas = api.kasForWorker(workerId);
      const days = new Set(kas.map((k) => k.work_date)).size;
      const totalKas = kas.reduce((s, k) => s + Number(k.total_kas || 0), 0);
      const masuk = kas.reduce((s, k) => s + Number(k.kas_masuk || 0), 0);
      const keluar = kas.reduce((s, k) => s + Number(k.kas_keluar || 0), 0);
      const loans = db.loans.filter((l) => l.worker_id === Number(workerId));
      const totalLoan = loans.reduce((s, l) => s + Number(l.amount || 0), 0);
      const paid = loans.reduce((s, l) => s + Number(l.paid_amount || 0), 0);
      let loanStatus = "Lunas";
      if (loans.some((l) => l.status === "active")) loanStatus = "Belum Bayar";
      else if (loans.some((l) => l.status === "installment")) loanStatus = "Cicil";
      if (loans.length === 0) loanStatus = "-";
      const due = loans.filter((l) => l.status !== "paid").map((l) => l.due_date).sort()[0] || null;
      return { days, totalKas, masuk, keluar, avg: days ? Math.round(totalKas / days) : 0, totalLoan, paidLoan: paid, outstanding: totalLoan - paid, loanStatus, dueDate: due, history: kas.sort((a, b) => b.work_date.localeCompare(a.work_date)) };
    },

    // monthly aggregation of kas (last 6 months) -> {labels, kas, masuk}
    kasMonthly(list) {
      const src = list || db.daily_kas;
      const now = new Date();
      const labels = [], kas = [], masuk = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        labels.push(Kas.util.monthNames[d.getMonth()]);
        const inMonth = src.filter((k) => (k.work_date || "").startsWith(key));
        kas.push(inMonth.reduce((s, k) => s + Number(k.total_kas || 0), 0));
        masuk.push(inMonth.reduce((s, k) => s + Number(k.kas_masuk || 0), 0));
      }
      return { labels, kas, masuk };
    },

    // last 7 days kas trend
    kasWeekly(list) {
      const src = list || db.daily_kas;
      const labels = [], data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        labels.push(Kas.util.monthNames[d.getMonth()] + " " + d.getDate());
        data.push(src.filter((k) => k.work_date === key).reduce((s, k) => s + Number(k.total_kas || 0), 0));
      }
      return { labels, data };
    },

    publicStats() {
      const activeWorkers = db.workers.filter((w) => w.is_active).length;
      const now = new Date();
      const key = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      const monthKas = db.daily_kas.filter((k) => (k.work_date || "").startsWith(key));
      const workDays = monthKas.length;
      const places = new Set(db.daily_kas.map((k) => k.workplace)).size;
      const hours = workDays * 8;
      return { activeWorkers, workDays, hours, places };
    },
  };

  Kas.api = api;
})(window.Kas);
