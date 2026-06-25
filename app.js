const state = {
  module: 'clientes',
  editId: null,
  data: { clientes: [], autos: [], accesorios: [], matriculas: [] },
  apiBase: localStorage.getItem('apiBase') || 'http://localhost:8080'
};

document.getElementById('apiBase').value = state.apiBase;

const modules = {
  clientes: {
    title: 'cliente', endpoint: '/api/clientes',
    fields: [
      ['cedula', 'Cédula', 'text', true], ['nombre', 'Nombre', 'text', true],
      ['apellido', 'Apellido', 'text', true], ['telefono', 'Teléfono', 'text', true],
      ['correo', 'Correo', 'email', true], ['direccion', 'Dirección', 'textarea', true]
    ],
    columns: ['id', 'cedula', 'nombre', 'apellido', 'telefono', 'correo', 'direccion']
  },
  accesorios: {
    title: 'accesorio', endpoint: '/api/accesorios',
    fields: [
      ['nombre', 'Nombre', 'text', true], ['descripcion', 'Descripción', 'textarea', true],
      ['marca', 'Marca', 'text', true], ['precio', 'Precio', 'number', true],
      ['stock', 'Stock', 'number', true], ['garantia', 'Garantía', 'text', true]
    ],
    columns: ['id', 'nombre', 'descripcion', 'marca', 'precio', 'stock', 'garantia']
  },
  autos: {
    title: 'auto', endpoint: '/api/autos',
    fields: [
      ['marca', 'Marca', 'text', true], ['modelo', 'Modelo', 'text', true],
      ['anio', 'Año', 'number', true], ['color', 'Color', 'text', true],
      ['precio', 'Precio', 'number', true], ['numeroChasis', 'Número de chasis', 'text', true],
      ['estado', 'Estado', 'selectEstadoAuto', true], ['cliente', 'Cliente', 'selectCliente', true],
      ['accesorios', 'Accesorios', 'multiAccesorios', false]
    ],
    columns: ['id', 'marca', 'modelo', 'anio', 'color', 'precio', 'numeroChasis', 'estado', 'cliente', 'accesorios']
  },
  matriculas: {
    title: 'matrícula', endpoint: '/api/matriculas',
    fields: [
      ['numeroMatricula', 'Número matrícula', 'text', true],
      ['fechaEmision', 'Fecha emisión', 'date', true],
      ['fechaCaducidad', 'Fecha caducidad', 'date', true],
      ['provincia', 'Provincia', 'text', true], ['estado', 'Estado', 'selectEstadoMatricula', true],
      ['auto', 'Auto', 'selectAuto', true]
    ],
    columns: ['id', 'numeroMatricula', 'fechaEmision', 'fechaCaducidad', 'provincia', 'estado', 'auto']
  }
};

const api = async (path, options = {}) => {
  const res = await fetch(state.apiBase + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw body || { error: 'Error en la petición' };
  return body;
};

function showAlert(msg, type = 'ok') {
  const box = document.getElementById('alert');
  box.className = `alert ${type}`;
  box.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg);
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 4500);
}

function labelOf(item, type) {
  if (!item) return '';
  if (type === 'cliente') return `${item.id} - ${item.nombre || ''} ${item.apellido || ''}`;
  if (type === 'auto') return `${item.id} - ${item.marca || ''} ${item.modelo || ''} (${item.numeroChasis || ''})`;
  if (type === 'accesorio') return `${item.id} - ${item.nombre || ''} ${item.marca ? '(' + item.marca + ')' : ''}`;
  return item.id;
}

async function loadAll() {
  for (const key of Object.keys(modules)) {
    try { state.data[key] = await api(modules[key].endpoint); }
    catch { state.data[key] = []; }
  }
}

function renderForm(item = {}) {
  const config = modules[state.module];
  document.getElementById('formTitle').textContent = `${state.editId ? 'Editar' : 'Nuevo'} ${config.title}`;
  document.getElementById('listTitle').textContent = `Listado de ${state.module}`;
  const form = document.getElementById('entityForm');
  form.innerHTML = '';

  config.fields.forEach(([name, label, type, required]) => {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.innerHTML = `<label for="${name}">${label}</label>`;
    let input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
      input.value = item[name] || '';
    } else if (type === 'selectCliente') {
      input = selectFrom('clientes', item.cliente?.id, true);
    } else if (type === 'selectAuto') {
      input = selectFrom('autos', item.auto?.id, true);
    } else if (type === 'multiAccesorios') {
      input = selectFrom('accesorios', (item.accesorios || []).map(a => a.id), false);
      input.multiple = true; input.size = 5;
    } else if (type === 'selectEstadoAuto') {
      input = selectOptions(['Disponible', 'Vendido', 'En mantenimiento'], item[name]);
    } else if (type === 'selectEstadoMatricula') {
      input = selectOptions(['Activa', 'Vencida', 'Anulada'], item[name]);
    } else {
      input = document.createElement('input');
      input.type = type;
      input.value = item[name] ?? '';
      if (type === 'number') input.step = name === 'anio' || name === 'stock' ? '1' : '0.01';
    }
    input.id = name; input.name = name; input.required = required;
    wrap.appendChild(input); form.appendChild(wrap);
  });

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = `<button class="primary" type="submit">${state.editId ? 'Actualizar' : 'Guardar'}</button>`;
  form.appendChild(actions);
}

function selectOptions(values, selected) {
  const select = document.createElement('select');
  select.innerHTML = '<option value="">Seleccione...</option>' + values.map(v => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`).join('');
  return select;
}

function selectFrom(key, selected, single) {
  const select = document.createElement('select');
  if (single) select.innerHTML = '<option value="">Seleccione...</option>';
  state.data[key].forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = labelOf(item, key.slice(0, -1));
    const ids = Array.isArray(selected) ? selected.map(String) : [String(selected || '')];
    option.selected = ids.includes(String(item.id));
    select.appendChild(option);
  });
  return select;
}

function buildPayload(form) {
  const fd = new FormData(form);
  const payload = {};
  modules[state.module].fields.forEach(([name, , type]) => {
    if (type === 'selectCliente') payload.cliente = { id: Number(fd.get(name)) };
    else if (type === 'selectAuto') payload.auto = { id: Number(fd.get(name)) };
    else if (type === 'multiAccesorios') payload.accesorios = Array.from(form.elements[name].selectedOptions).map(o => ({ id: Number(o.value) }));
    else if (type === 'number') payload[name] = fd.get(name) === '' ? null : Number(fd.get(name));
    else payload[name] = fd.get(name);
  });
  if (state.editId) payload.id = state.editId;
  return payload;
}

function valueFor(row, col) {
  const v = row[col];
  if (col === 'cliente') return labelOf(row.cliente, 'cliente');
  if (col === 'auto') return labelOf(row.auto, 'auto');
  if (col === 'accesorios') return (row.accesorios || []).map(a => `<span class="badge">${a.nombre}</span>`).join(' ');
  return v ?? '';
}

function renderTable() {
  const config = modules[state.module];
  const rows = state.data[state.module] || [];
  const thead = config.columns.map(c => `<th>${c}</th>`).join('') + '<th>Acciones</th>';
  const tbody = rows.map(row => `
    <tr>
      ${config.columns.map(c => `<td>${valueFor(row, c)}</td>`).join('')}
      <td><div class="row-actions">
        <button class="edit" onclick="editItem(${row.id})">Editar</button>
        <button class="danger" onclick="deleteItem(${row.id})">Eliminar</button>
      </div></td>
    </tr>`).join('');
  document.getElementById('tableWrap').innerHTML = `<table><thead><tr>${thead}</tr></thead><tbody>${tbody || '<tr><td colspan="99">Sin registros</td></tr>'}</tbody></table>`;
}

async function refresh() {
  await loadAll();
  renderForm();
  renderTable();
}

async function editItem(id) {
  const config = modules[state.module];
  try {
    const item = await api(`${config.endpoint}/${id}`);
    state.editId = id;
    renderForm(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) { showAlert(e, 'error'); }
}

async function deleteItem(id) {
  if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
  const config = modules[state.module];
  try {
    await api(`${config.endpoint}/${id}`, { method: 'DELETE' });
    showAlert('Registro eliminado correctamente');
    state.editId = null;
    await refresh();
  } catch (e) { showAlert(e, 'error'); }
}

window.editItem = editItem;
window.deleteItem = deleteItem;

document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', async () => {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.module = btn.dataset.module;
  state.editId = null;
  renderForm(); renderTable();
}));

document.getElementById('entityForm').addEventListener('submit', async e => {
  e.preventDefault();
  const config = modules[state.module];
  const payload = buildPayload(e.target);
  try {
    await api(state.editId ? `${config.endpoint}/${state.editId}` : config.endpoint, {
      method: state.editId ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    showAlert(state.editId ? 'Registro actualizado correctamente' : 'Registro creado correctamente');
    state.editId = null;
    e.target.reset();
    await refresh();
  } catch (err) { showAlert(err, 'error'); }
});

document.getElementById('resetForm').addEventListener('click', () => { state.editId = null; renderForm(); });
document.getElementById('reloadBtn').addEventListener('click', refresh);
document.getElementById('saveApi').addEventListener('click', async () => {
  state.apiBase = document.getElementById('apiBase').value.replace(/\/$/, '');
  localStorage.setItem('apiBase', state.apiBase);
  showAlert('URL de API guardada');
  await refresh();
});

refresh().catch(err => showAlert(err, 'error'));
