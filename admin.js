// CMS logic: authenticates against the login serverless function, loads
// data.json through get-data.js, renders an editable form from a small
// schema, and publishes edits back through update-data.js.

const SCHEMA = [
  { path: ['site'], label: 'Sitio', type: 'object', fields: [
    { key: 'brand', label: 'Marca', type: 'text' },
    { key: 'tagline', label: 'Tagline', type: 'text' },
    { key: 'location', label: 'Ubicación', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'whatsappUrl', label: 'Link directo de WhatsApp (ej: wa.me/qr/CODIGO). Si se llena, tiene prioridad sobre el número.', type: 'text' },
    { key: 'whatsappNumber', label: 'WhatsApp (solo números, con código de país) — se usa solo si el link directo está vacío', type: 'text' },
    { key: 'whatsappMessage', label: 'Mensaje predefinido de WhatsApp (solo aplica con el número, no con el link directo)', type: 'textarea' },
    { key: 'instagramUrl', label: 'URL de Instagram', type: 'text' },
    { key: 'ctaLabel', label: 'Texto del botón CTA (nav)', type: 'text' },
  ]},
  { path: ['tracking'], label: 'Analítica', type: 'object', fields: [
    { key: 'ga4Id', label: 'Google Analytics 4 ID', type: 'text' },
    { key: 'metaPixelId', label: 'Meta Pixel ID', type: 'text' },
    { key: 'gtmId', label: 'Google Tag Manager ID', type: 'text' },
  ]},
  { path: ['nav'], label: 'Tabs de navegación', type: 'objectList', itemLabel: 'Tab', fields: [
    { key: 'id', label: 'ID (sin espacios, ej: portfolio)', type: 'text' },
    { key: 'label', label: 'Texto visible', type: 'text' },
  ]},
  { path: ['hero'], label: 'Home / Hero', type: 'object', fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
    { key: 'titleLine1', label: 'Título línea 1', type: 'text' },
    { key: 'titleLine2', label: 'Título línea 2 (dorado)', type: 'text' },
    { key: 'titleLine2Suffix', label: 'Sufijo del título', type: 'text' },
    { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
    { key: 'ctaLabel', label: 'Texto CTA', type: 'text' },
    { key: 'backgroundImage', label: 'URL imagen de fondo', type: 'text' },
  ]},
  { path: ['about'], label: 'The Sociological Eye (Sobre mí)', type: 'object', fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
    { key: 'title', label: 'Título (admite <br>)', type: 'textarea' },
    { key: 'portraitImage', label: 'URL foto retrato', type: 'text' },
    { key: 'paragraphs', label: 'Párrafos', type: 'stringList' },
  ]},
  { path: ['services'], label: 'Services', type: 'objectList', itemLabel: 'Servicio', fields: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'priceFrom', label: 'Precio desde', type: 'text' },
    { key: 'icon', label: 'Icono (Phosphor, ej: ph-hanger)', type: 'text' },
  ]},
  { path: ['portfolio', 'intro'], label: 'Portfolio — imagen destacada', type: 'object', fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
    { key: 'title', label: 'Título (admite HTML simple)', type: 'textarea' },
    { key: 'paragraph', label: 'Párrafo', type: 'textarea' },
    { key: 'image', label: 'URL imagen', type: 'text' },
    { key: 'imageLabel', label: 'Etiqueta de la imagen', type: 'text' },
  ]},
  { path: ['portfolio', 'studio'], label: 'Portfolio — The Studio Collection', type: 'objectList', itemLabel: 'Foto', fields: [
    { key: 'image', label: 'URL imagen', type: 'text' },
    { key: 'alt', label: 'Texto alternativo', type: 'text' },
    { key: 'label', label: 'Etiqueta', type: 'text' },
    { key: 'tag', label: 'Tag', type: 'text' },
  ]},
  { path: ['portfolio', 'onLocation'], label: 'Portfolio — On-Location Study', type: 'objectList', itemLabel: 'Foto', fields: [
    { key: 'image', label: 'URL imagen', type: 'text' },
    { key: 'alt', label: 'Texto alternativo', type: 'text' },
    { key: 'label', label: 'Etiqueta', type: 'text' },
    { key: 'tag', label: 'Tag', type: 'text' },
  ]},
  { path: ['legal'], label: 'Legal & Permits', type: 'objectList', itemLabel: 'Item', fields: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'icon', label: 'Icono', type: 'text' },
  ]},
  { path: ['faq'], label: 'FAQ (en Contact)', type: 'objectList', itemLabel: 'Pregunta', fields: [
    { key: 'question', label: 'Pregunta', type: 'text' },
    { key: 'answer', label: 'Respuesta', type: 'textarea' },
  ]},
  { path: ['footer'], label: 'Footer', type: 'object', fields: [
    { key: 'text', label: 'Texto', type: 'text' },
  ]},
];

function resolvePath(data, path) {
  return path.reduce((obj, key) => obj[key], data);
}

const state = { token: null, displayName: null, data: null, sha: null };

const loginView = document.getElementById('login-view');
const cmsView = document.getElementById('cms-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const editorRoot = document.getElementById('editor-root');
const cmsStatus = document.getElementById('cms-status');

function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

function setStatus(text, isError) {
  cmsStatus.textContent = text;
  cmsStatus.className = isError ? 'text-xs text-red-400 mt-0.5' : 'text-xs text-dry-stone mt-0.5';
}

function showCms() {
  loginView.classList.add('hidden');
  cmsView.classList.remove('hidden');
  document.getElementById('cms-display-name').textContent = state.displayName || '';
}

function showLogin(message) {
  loginView.classList.remove('hidden');
  cmsView.classList.add('hidden');
  if (message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
  }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${state.token}` },
  });
  if (res.status === 401) {
    sessionStorage.removeItem('cms_token');
    sessionStorage.removeItem('cms_display_name');
    showLogin('Tu sesión expiró. Vuelve a iniciar sesión.');
    throw new Error('Unauthorized');
  }
  return res;
}

async function loadData() {
  setStatus('Cargando contenido…');
  const res = await apiFetch('/.netlify/functions/get-data');
  if (!res.ok) {
    setStatus('No se pudo cargar el contenido.', true);
    return;
  }
  const { content, sha } = await res.json();
  state.data = JSON.parse(b64DecodeUnicode(content));
  state.sha = sha;
  renderEditor();
  setStatus('Contenido cargado.');
}

function inputRow(label, value, onChange, multiline) {
  const wrap = document.createElement('div');
  wrap.className = 'space-y-1.5';
  const lbl = document.createElement('label');
  lbl.className = 'block text-xs uppercase tracking-widest';
  lbl.textContent = label;
  const field = document.createElement(multiline ? 'textarea' : 'input');
  if (!multiline) field.type = 'text';
  else field.rows = 3;
  field.className = 'w-full rounded-lg px-3 py-2 text-sm';
  field.value = value ?? '';
  field.addEventListener('input', () => onChange(field.value));
  wrap.appendChild(lbl);
  wrap.appendChild(field);
  return wrap;
}

function renderObjectFields(container, obj, fields) {
  fields.forEach((f) => {
    container.appendChild(inputRow(f.label, obj[f.key], (v) => { obj[f.key] = v; }, f.type === 'textarea'));
  });
}

function renderStringList(container, arr, label) {
  const listWrap = document.createElement('div');
  listWrap.className = 'space-y-3';

  function redraw() {
    listWrap.innerHTML = '';
    arr.forEach((val, i) => {
      const row = document.createElement('div');
      row.className = 'flex gap-2 items-start';
      const ta = document.createElement('textarea');
      ta.rows = 2;
      ta.className = 'flex-1 rounded-lg px-3 py-2 text-sm';
      ta.value = val;
      ta.addEventListener('input', () => { arr[i] = ta.value; });
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'text-red-400 text-xs px-2 py-1 hover:text-red-300';
      del.textContent = 'Eliminar';
      del.addEventListener('click', () => { arr.splice(i, 1); redraw(); });
      row.appendChild(ta);
      row.appendChild(del);
      listWrap.appendChild(row);
    });
  }
  redraw();

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'text-xs text-aged-gold hover:opacity-80 mt-2';
  addBtn.textContent = `+ Añadir ${label.toLowerCase()}`;
  addBtn.addEventListener('click', () => { arr.push(''); redraw(); });

  container.appendChild(listWrap);
  container.appendChild(addBtn);
}

function renderObjectList(container, arr, fields, itemLabel) {
  const listWrap = document.createElement('div');
  listWrap.className = 'space-y-4';

  function redraw() {
    listWrap.innerHTML = '';
    arr.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'border border-white/10 rounded-xl p-4 space-y-3 bg-white/[0.02]';
      const header = document.createElement('div');
      header.className = 'flex justify-between items-center';
      const title = document.createElement('span');
      title.className = 'text-xs uppercase tracking-widest text-dry-stone';
      title.textContent = `${itemLabel} ${i + 1}`;
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'text-red-400 text-xs hover:text-red-300';
      del.textContent = 'Eliminar';
      del.addEventListener('click', () => { arr.splice(i, 1); redraw(); });
      header.appendChild(title);
      header.appendChild(del);
      card.appendChild(header);
      fields.forEach((f) => {
        card.appendChild(inputRow(f.label, item[f.key], (v) => { item[f.key] = v; }, f.type === 'textarea'));
      });
      listWrap.appendChild(card);
    });
  }
  redraw();

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'text-xs text-aged-gold hover:opacity-80';
  addBtn.textContent = `+ Añadir ${itemLabel.toLowerCase()}`;
  addBtn.addEventListener('click', () => {
    const empty = {};
    fields.forEach((f) => { empty[f.key] = ''; });
    arr.push(empty);
    redraw();
  });

  container.appendChild(listWrap);
  container.appendChild(addBtn);
}

function renderEditor() {
  editorRoot.innerHTML = '';
  SCHEMA.forEach((section) => {
    const wrap = document.createElement('section');
    wrap.className = 'space-y-4';
    const h = document.createElement('h2');
    h.className = 'text-lg font-semibold text-bone-white border-b border-white/10 pb-2';
    h.textContent = section.label;
    wrap.appendChild(h);

    const target = resolvePath(state.data, section.path);

    if (section.type === 'object') {
      const fieldsWrap = document.createElement('div');
      fieldsWrap.className = 'space-y-4';
      renderObjectFields(fieldsWrap, target, section.fields);
      wrap.appendChild(fieldsWrap);
    } else if (section.type === 'stringList') {
      renderStringList(wrap, target, section.label);
    } else if (section.type === 'objectList') {
      renderObjectList(wrap, target, section.fields, section.itemLabel);
    }

    editorRoot.appendChild(wrap);
  });
}

async function save() {
  setStatus('Publicando cambios…');
  const jsonStr = JSON.stringify(state.data, null, 2);
  const encoded = b64EncodeUnicode(jsonStr);
  try {
    const res = await apiFetch('/.netlify/functions/update-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Update site content via CMS', content: encoded, sha: state.sha }),
    });
    const body = await res.json();
    if (!res.ok) {
      setStatus(`Error al publicar: ${body.error || body.message || res.status}`, true);
      return;
    }
    state.sha = body.content ? body.content.sha : state.sha;
    setStatus('Cambios publicados. Netlify desplegará el sitio en unos minutos.');
  } catch (err) {
    if (err.message !== 'Unauthorized') setStatus('Error de red al publicar.', true);
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;
  try {
    const res = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass }),
    });
    const body = await res.json();
    if (!res.ok) {
      loginError.textContent = body.error || 'Credenciales inválidas.';
      loginError.classList.remove('hidden');
      return;
    }
    state.token = body.token;
    state.displayName = body.displayName;
    sessionStorage.setItem('cms_token', body.token);
    sessionStorage.setItem('cms_display_name', body.displayName || '');
    showCms();
    await loadData();
  } catch {
    loginError.textContent = 'No se pudo conectar con el servidor.';
    loginError.classList.remove('hidden');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('cms_token');
  sessionStorage.removeItem('cms_display_name');
  state.token = null;
  showLogin();
});

document.getElementById('save-btn').addEventListener('click', save);

(function init() {
  const token = sessionStorage.getItem('cms_token');
  const displayName = sessionStorage.getItem('cms_display_name');
  if (token) {
    state.token = token;
    state.displayName = displayName;
    showCms();
    loadData();
  }
})();
