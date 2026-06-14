/* ============================================================
   components/table.js — DataTable + generic CRUD
   ============================================================ */
(function (Kas) {
  const { el, qs } = Kas.dom;

  /* ---------- DataTable: search + sort + pagination ---------- */
  function dataTable(opts) {
    const {
      columns, getData, searchKeys = [], pageSize = 8,
      emptyText = "Belum ada data.", toolbarExtra,
    } = opts;
    let page = 1, term = "";

    const wrap = el("div");
    const toolbar = el("div", { class: "table-toolbar" });
    const search = el("input", { type: "search", class: "input search", placeholder: "Cari..." });
    search.addEventListener("input", Kas.util.debounce(() => { term = search.value.toLowerCase(); page = 1; render(); }, 180));
    const left = el("div", { class: "flex items-center gap" }, [search]);
    toolbar.appendChild(left);
    if (toolbarExtra) toolbar.appendChild(toolbarExtra);
    wrap.appendChild(toolbar);

    const tableWrap = el("div", { class: "table-wrap" });
    wrap.appendChild(tableWrap);
    const pager = el("div", { class: "pagination" });
    wrap.appendChild(pager);

    function filtered() {
      let rows = getData();
      if (term && searchKeys.length) {
        rows = rows.filter((r) => searchKeys.some((k) => String(r[k] == null ? "" : r[k]).toLowerCase().includes(term)));
      }
      return rows;
    }

    function render() {
      const rows = filtered();
      const pages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (page > pages) page = pages;
      const slice = rows.slice((page - 1) * pageSize, page * pageSize);
      Kas.dom.clear(tableWrap);
      if (!rows.length) {
        tableWrap.appendChild(el("div", { class: "empty-state", text: emptyText }));
        Kas.dom.clear(pager); return;
      }
      const table = el("table", { class: "data" });
      const thead = el("thead");
      const trh = el("tr");
      columns.forEach((c) => trh.appendChild(el("th", { text: c.label })));
      thead.appendChild(trh); table.appendChild(thead);
      const tbody = el("tbody");
      slice.forEach((row, idx) => {
        const tr = el("tr");
        columns.forEach((c) => {
          const td = el("td");
          const val = c.render ? c.render(row, (page - 1) * pageSize + idx + 1) : row[c.key];
          if (val instanceof Node) td.appendChild(val);
          else td.innerHTML = (val == null ? "-" : val);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody); tableWrap.appendChild(table);

      // pager
      Kas.dom.clear(pager);
      pager.appendChild(el("span", { class: "page-info", text: `${rows.length} data \u2022 hal ${page}/${pages}` }));
      const prev = el("button", { class: "btn btn-ghost btn-sm", text: "\u2039", disabled: page === 1 || null });
      const next = el("button", { class: "btn btn-ghost btn-sm", text: "\u203A", disabled: page === pages || null });
      prev.addEventListener("click", () => { if (page > 1) { page--; render(); } });
      next.addEventListener("click", () => { if (page < pages) { page++; render(); } });
      pager.appendChild(prev); pager.appendChild(next);
    }

    render();
    return { element: wrap, refresh: render };
  }

  /* ---------- Form builder (for modals) ---------- */
  function buildForm(fields, values = {}) {
    const form = el("form", { class: "modal-form" });
    const grid = el("div");
    fields.forEach((f) => {
      const group = el("div", { class: "form-group" + (f.half ? " half" : "") });
      if (f.type !== "hidden") {
        const lbl = el("label");
        lbl.innerHTML = Kas.util.escape(f.label) + (f.required ? ' <span class="req">*</span>' : "");
        group.appendChild(lbl);
      }
      let input;
      const v = values[f.name] != null ? values[f.name] : (f.default != null ? f.default : "");
      if (f.type === "select") {
        input = el("select", { name: f.name });
        (f.options || []).forEach((o) => {
          const opt = el("option", { value: o.value, text: o.label });
          if (String(o.value) === String(v)) opt.selected = true;
          input.appendChild(opt);
        });
      } else if (f.type === "textarea") {
        input = el("textarea", { name: f.name, rows: f.rows || 3 }); input.value = v;
      } else {
        input = el("input", { name: f.name, type: f.type || "text" }); input.value = v;
        if (f.type === "hidden") group.style.display = "none";
        if (f.step) input.step = f.step;
        if (f.placeholder) input.placeholder = f.placeholder;
      }
      input.classList.add("input");
      if (f.readonly) input.readOnly = true;
      group.appendChild(input);
      if (f.hint) group.appendChild(el("div", { class: "field-hint", text: f.hint }));
      group.appendChild(el("div", { class: "field-error" }));
      grid.appendChild(group);
    });
    form.appendChild(grid);
    return form;
  }

  function applyFormLayout(form) {
    // group consecutive .half into rows
    const halves = Kas.dom.qsa(".form-group.half", form);
    for (let i = 0; i < halves.length; i += 2) {
      const row = el("div", { class: "form-row" });
      halves[i].parentNode.insertBefore(row, halves[i]);
      row.appendChild(halves[i]);
      if (halves[i + 1]) row.appendChild(halves[i + 1]);
    }
  }

  /* ---------- Generic CRUD ---------- */
  function crud(opts) {
    const {
      singular = "Data", table, getData, columns, fields,
      searchKeys = [], canCreate = true, canEdit = true, canDelete = true,
      beforeSave, onChange, rowActions, readOnly = false, pageSize,
    } = opts;

    let dt;
    function refresh() { dt.refresh(); onChange && onChange(); }

    function openForm(row) {
      const isNew = !row;
      const form = buildForm(fields, row || {});
      applyFormLayout(form);
      const save = el("button", { class: "btn btn-primary", text: "Simpan", type: "submit" });
      const cancel = el("button", { class: "btn btn-ghost", text: "Batal", type: "button" });
      const m = Kas.modal.open({ title: (isNew ? "Tambah " : "Edit ") + singular, body: form, footer: [cancel, save] });
      cancel.addEventListener("click", m.close);
      const submit = (e) => {
        e && e.preventDefault();
        const schema = {};
        fields.forEach((f) => { if (f.required) { schema[f.name] = [Kas.validate.rules.required]; } if (f.validate) { schema[f.name] = (schema[f.name] || []).concat(f.validate); } });
        if (!Kas.validate.validateForm(form, schema)) return;
        const obj = {};
        fields.forEach((f) => {
          let val = form.elements[f.name].value;
          if (f.type === "number") val = val === "" ? 0 : Number(val);
          if (f.type === "checkbox") val = form.elements[f.name].checked;
          obj[f.name] = val;
        });
        let finalObj = obj;
        if (beforeSave) finalObj = beforeSave(obj, isNew, row) || obj;
        if (isNew) Kas.api.add(table, finalObj);
        else Kas.api.update(table, row.id, finalObj);
        m.close();
        Kas.toast((isNew ? "Ditambahkan" : "Diperbarui") + ": " + singular, "success");
        refresh();
      };
      form.addEventListener("submit", submit);
      save.addEventListener("click", submit);
    }

    function del(row) {
      Kas.modal.confirm({
        title: "Hapus " + singular, danger: true, okText: "Hapus",
        message: `Yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan (demo).`,
        onOk: () => { Kas.api.remove(table, row.id); Kas.toast(singular + " dihapus", "success"); refresh(); },
      });
    }

    // action column
    const cols = columns.slice();
    if (!readOnly && (canEdit || canDelete || rowActions)) {
      cols.push({
        label: "Aksi", render: (row) => {
          const box = el("div", { class: "row-actions" });
          if (rowActions) rowActions(row).forEach((b) => box.appendChild(b));
          if (canEdit) { const b = el("button", { class: "btn btn-ghost btn-sm", title: "Edit", html: "\u270E" }); b.addEventListener("click", () => openForm(row)); box.appendChild(b); }
          if (canDelete) { const b = el("button", { class: "btn btn-ghost btn-sm", title: "Hapus", html: "\uD83D\uDDD1" }); b.addEventListener("click", () => del(row)); box.appendChild(b); }
          return box;
        },
      });
    }

    let toolbarExtra;
    if (!readOnly && canCreate) {
      toolbarExtra = el("button", { class: "btn btn-primary", html: "+ Tambah " + singular });
      toolbarExtra.addEventListener("click", () => openForm(null));
    }

    dt = dataTable({ columns: cols, getData, searchKeys, toolbarExtra, pageSize });
    return { element: dt.element, refresh, openForm };
  }

  Kas.components = Kas.components || {};
  Kas.components.dataTable = dataTable;
  Kas.components.crud = crud;
  Kas.components.buildForm = buildForm;
  Kas.components.applyFormLayout = applyFormLayout;
})(window.Kas);
