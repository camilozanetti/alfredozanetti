// SPA tab navigation over a single static index.html — no framework, no
// bundler. Panels are shown/hidden via the `hidden` attribute driven by
// location.hash, so back/forward and direct links (e.g. /#portfolio) work
// with zero server-side routing (Netlify's `/* /index.html 200` redirect
// already covers the initial load).
//
// data.json remains the single source of truth for content; this file only
// renders it and wires the tab router.

let siteData = null;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function waLink(number, message) {
  const digits = String(number || '').replace(/[^\d]/g, '');
  const text = encodeURIComponent(message || '');
  return `https://wa.me/${digits}${text ? `?text=${text}` : ''}`;
}

// ---------- Tab router ----------

function tabIds() {
  return ['home', ...siteData.nav.map((n) => n.id)];
}

function route() {
  const requested = (location.hash || '#home').slice(1);
  const targetId = tabIds().includes(requested) ? requested : 'home';

  document.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
    const active = panel.dataset.panel === targetId;
    panel.hidden = !active;
  });

  document.querySelectorAll('[role="tab"]').forEach((tab) => {
    const active = tab.dataset.tab === targetId;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  // IntersectionObserver never fires for elements inside a hidden panel, so
  // entrance animation is triggered directly on activation instead.
  const activePanel = document.querySelector(`[data-panel="${targetId}"]`);
  activePanel.querySelectorAll('.reveal').forEach((el) => el.classList.remove('visible'));
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      activePanel.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    });
  });

  window.scrollTo(0, 0);
}

function wireTabKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const active = document.activeElement;
    if (!active || active.getAttribute('role') !== 'tab') return;
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    let idx = tabs.indexOf(active);
    if (e.key === 'ArrowRight') idx = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') idx = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') idx = 0;
    else if (e.key === 'End') idx = tabs.length - 1;
    e.preventDefault();
    tabs[idx].focus();
    tabs[idx].click();
  });
}

// ---------- Rendering ----------

function renderNavTabs(data) {
  const homeTab = document.querySelector('a[data-tab="home"]');
  homeTab.id = 'tab-home';
  homeTab.setAttribute('role', 'tab');
  homeTab.setAttribute('aria-controls', 'panel-home');
  homeTab.setAttribute('aria-selected', 'false');

  const desktop = document.querySelector('[role="tablist"][aria-label="Secciones"]');
  const mobile = document.getElementById('mobile-tabs');
  desktop.innerHTML = '';
  mobile.innerHTML = '';

  data.nav.forEach((item) => {
    [{ container: desktop, prefix: 'tab' }, { container: mobile, prefix: 'tab-m' }].forEach(({ container, prefix }) => {
      const a = document.createElement('a');
      a.href = `#${item.id}`;
      a.dataset.tab = item.id;
      a.id = `${prefix}-${item.id}`;
      a.setAttribute('role', 'tab');
      a.setAttribute('aria-controls', `panel-${item.id}`);
      a.setAttribute('aria-selected', 'false');
      a.tabIndex = -1;
      a.className = 'text-dry-stone hover:text-aged-gold transition-colors';
      a.textContent = item.label;
      container.appendChild(a);
    });
  });
}

function renderHome(data) {
  const hero = data.hero;
  const link = waLink(data.site.whatsappNumber, data.site.whatsappMessage);
  const section = document.getElementById('panel-home');
  section.innerHTML = `
    <img src="${escapeHtml(hero.backgroundImage)}" alt="" class="absolute inset-0 w-full h-full object-cover" style="opacity:0.35;">
    <div class="absolute inset-0" style="background:linear-gradient(160deg,rgba(10,10,10,0.25) 0%,rgba(10,10,10,0.92) 70%,rgba(10,10,10,1) 100%)"></div>
    <div class="relative z-10 max-w-[780px]">
      <div class="reveal flex items-center gap-2.5 mb-8 w-fit bg-white/[0.06] border border-white/[0.12] backdrop-blur-sm px-4 py-2 rounded-full">
        <span class="pulse-dot w-2 h-2 bg-aged-gold rounded-full flex-shrink-0"></span>
        <span class="font-sans text-[9px] sm:text-[10px] text-dry-stone uppercase tracking-[0.28em] font-bold">${escapeHtml(hero.eyebrow)}</span>
      </div>
      <h1 class="reveal reveal-delay-1 font-playfair italic text-bone-white mb-8 f-hero">
        ${escapeHtml(hero.titleLine1)}<br>
        <span class="gold-text">${escapeHtml(hero.titleLine2)}</span> ${escapeHtml(hero.titleLine2Suffix)}
      </h1>
      <p class="reveal reveal-delay-2 font-cormorant text-xl sm:text-2xl italic text-dry-stone leading-relaxed mb-10 max-w-[520px]">
        ${escapeHtml(hero.subtitle)}
      </p>
      <div class="reveal reveal-delay-3">
        <a href="${link}" target="_blank" rel="noopener" class="group inline-flex items-center gap-3 bg-[#25D366] text-white px-10 py-5 rounded-full font-bold text-[11px] sm:text-[12px] uppercase tracking-widest hover:bg-[#20ba58] transition-all shadow-2xl hover:shadow-[0_0_0_6px_rgba(37,211,102,0.2)]">
          ${escapeHtml(hero.ctaLabel)} <i class="ph ph-whatsapp-logo group-hover:translate-x-1 transition-transform"></i>
        </a>
      </div>
    </div>
  `;
}

function renderPortfolio(data) {
  const p = data.portfolio;
  const section = document.getElementById('panel-portfolio');
  section.innerHTML = `
    <div class="grid md:grid-cols-12 gap-12 items-center">
      <div class="md:col-span-5 space-y-6">
        <p class="reveal font-sans text-[9px] text-aged-gold tracking-[0.4em] uppercase">${escapeHtml(p.intro.eyebrow)}</p>
        <h2 class="reveal reveal-delay-1 font-playfair text-3xl md:text-5xl text-bone-white leading-tight">${p.intro.title}</h2>
        <p class="reveal reveal-delay-2 font-cormorant text-xl text-dry-stone leading-relaxed">${escapeHtml(p.intro.paragraph)}</p>
      </div>
      <div class="reveal reveal-delay-2 md:col-span-7 aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 bg-surface-card relative">
        <img src="${escapeHtml(p.intro.image)}" class="w-full h-full object-cover" alt="${escapeHtml(p.intro.imageLabel)}">
        <div class="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-3 py-1 rounded border border-white/10">
          <p class="font-sans text-[8px] tracking-widest text-aged-gold">${escapeHtml(p.intro.imageLabel)}</p>
        </div>
      </div>
    </div>

    <div class="space-y-8">
      <div class="flex justify-between items-end border-b border-white/5 pb-4">
        <h3 class="reveal font-playfair text-2xl italic text-bone-white">The Studio Collection</h3>
        <span class="reveal font-sans text-[9px] text-dry-stone tracking-widest uppercase">${p.studio.length} selected shots</span>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        ${p.studio.map((s, i) => `
          <div class="reveal reveal-delay-${Math.min(i + 1, 3)} space-y-4">
            <div class="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-surface-card">
              <img src="${escapeHtml(s.image)}" class="w-full h-full object-cover" alt="${escapeHtml(s.alt)}">
            </div>
            <div class="flex justify-between text-[8px] font-sans text-dry-stone tracking-widest uppercase">
              <span>${escapeHtml(s.label)}</span>
              <span>${escapeHtml(s.tag)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="space-y-8">
      <div class="flex justify-between items-end border-b border-white/5 pb-4">
        <h3 class="reveal font-playfair text-2xl italic text-bone-white">On-Location Study</h3>
        <span class="reveal font-sans text-[9px] text-dry-stone tracking-widest uppercase">Natural light in Perth</span>
      </div>
      <div class="grid md:grid-cols-2 gap-8">
        ${p.onLocation.map((s, i) => `
          <div class="reveal reveal-delay-${Math.min(i + 1, 3)} space-y-4">
            <div class="aspect-[16/10] rounded-2xl overflow-hidden border border-white/5 bg-surface-card">
              <img src="${escapeHtml(s.image)}" class="w-full h-full object-cover" alt="${escapeHtml(s.alt)}">
            </div>
            <div class="flex justify-between text-[8px] font-sans text-dry-stone tracking-widest uppercase">
              <span>${escapeHtml(s.label)}</span>
              <span>${escapeHtml(s.tag)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAbout(data) {
  const about = data.about;
  const section = document.getElementById('panel-about');
  section.innerHTML = `
    <div class="text-[9px] font-sans text-aged-gold uppercase tracking-[0.3em] mb-4 reveal">${escapeHtml(about.eyebrow)}</div>
    <div class="border-b border-white/5 pb-6 mb-12">
      <h2 class="reveal reveal-delay-1 font-playfair text-3xl md:text-5xl uppercase tracking-widest text-bone-white">${about.title}</h2>
    </div>
    <div class="grid md:grid-cols-12 gap-12 items-center">
      <div class="md:col-span-7 space-y-6 font-cormorant text-xl text-dry-stone leading-relaxed">
        ${about.paragraphs.map((p, i) => `<p class="reveal reveal-delay-${Math.min(i + 2, 3)}">${escapeHtml(p)}</p>`).join('')}
      </div>
      <div class="reveal reveal-delay-2 md:col-span-5 relative w-full aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-jet-black">
        <img src="${escapeHtml(about.portraitImage)}" class="w-full h-full object-cover" alt="Photography by Alfredo Zanetti">
        <div class="absolute inset-0 bg-gradient-to-t from-jet-black via-transparent to-transparent"></div>
      </div>
    </div>
  `;
}

function renderServices(data) {
  const section = document.getElementById('panel-services');
  section.innerHTML = `
    <div class="text-[9px] font-sans text-aged-gold uppercase tracking-[0.3em] mb-4 reveal">Services</div>
    <div class="border-b border-white/5 pb-6 mb-12">
      <h2 class="reveal reveal-delay-1 font-playfair text-3xl md:text-5xl uppercase tracking-widest text-bone-white">What I <span class="italic text-aged-gold font-normal">Shoot</span></h2>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      ${data.services.map((s, i) => `
        <div class="reveal reveal-delay-${Math.min(i + 1, 3)} glass-panel p-8 space-y-4">
          <div class="w-8 h-8 rounded-full bg-aged-gold text-jet-black flex items-center justify-center font-sans font-bold text-xs">${i + 1}</div>
          <h3 class="font-playfair text-xl text-bone-white italic">${escapeHtml(s.title)}</h3>
          <p class="font-cormorant text-lg text-dry-stone leading-relaxed">${escapeHtml(s.description)}</p>
          <p class="font-sans text-[11px] uppercase tracking-widest text-aged-gold font-bold">${escapeHtml(s.priceFrom)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLegal(data) {
  const section = document.getElementById('panel-legal');
  section.innerHTML = `
    <div class="text-[9px] font-sans text-aged-gold uppercase tracking-[0.3em] mb-4 reveal">Legal & Permits</div>
    <div class="border-b border-white/5 pb-6 mb-12">
      <h2 class="reveal reveal-delay-1 font-playfair text-3xl md:text-5xl uppercase tracking-widest text-bone-white">Shoot-Ready, <span class="italic text-aged-gold font-normal">Every Time</span></h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      ${data.legal.map((c, i) => `
        <div class="reveal reveal-delay-${Math.min(i + 1, 3)} flex gap-4 p-5 bg-white/[0.01] border border-white/5 rounded-xl">
          <i class="ph ${escapeHtml(c.icon)} text-2xl text-aged-gold shrink-0"></i>
          <div>
            <strong class="text-bone-white block mb-1 text-sm">${escapeHtml(c.title)}</strong>
            <p class="text-xs text-dry-stone leading-relaxed">${escapeHtml(c.description)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderContact(data) {
  const link = waLink(data.site.whatsappNumber, data.site.whatsappMessage);
  const section = document.getElementById('panel-contact');
  section.innerHTML = `
    <div class="text-[9px] font-sans text-aged-gold uppercase tracking-[0.3em] mb-4 reveal">Contact</div>
    <div class="border-b border-white/5 pb-6 mb-12">
      <h2 class="reveal reveal-delay-1 font-playfair text-3xl md:text-5xl uppercase tracking-widest text-bone-white">Let's Shoot <span class="italic text-aged-gold font-normal">Something</span></h2>
    </div>
    <div class="grid md:grid-cols-12 gap-12">
      <div class="md:col-span-5 space-y-6 reveal reveal-delay-1">
        <p class="font-cormorant text-xl text-dry-stone leading-relaxed">${escapeHtml(data.site.tagline)} Based in ${escapeHtml(data.site.location)}.</p>
        <a href="${link}" target="_blank" rel="noopener" class="inline-flex items-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-[#20ba58] transition-all shadow-2xl">
          ${escapeHtml(data.site.ctaLabel)} <i class="ph ph-whatsapp-logo"></i>
        </a>
        <p class="font-sans text-[10px] text-dry-stone uppercase tracking-widest">${escapeHtml(data.site.email)}</p>
      </div>
      <div class="md:col-span-7 space-y-3">
        ${data.faq.map((f, i) => `
          <details class="reveal reveal-delay-${Math.min(i + 1, 3)} bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <summary class="flex justify-between items-center font-playfair italic text-lg text-bone-white">
              ${escapeHtml(f.question)}
              <i class="ph ph-plus faq-icon text-aged-gold"></i>
            </summary>
            <p class="text-sm text-dry-stone leading-relaxed">${escapeHtml(f.answer)}</p>
          </details>
        `).join('')}
      </div>
    </div>
  `;
}

function renderFooter(data) {
  const footer = document.getElementById('site-footer');
  footer.innerHTML = `
    <div class="max-w-2xl mx-auto px-6 space-y-4">
      <span class="font-playfair italic text-3xl block text-bone-white">${escapeHtml(data.site.brand)}<span class="text-aged-gold">.</span></span>
      <div class="w-12 h-px bg-aged-gold mx-auto"></div>
      <p class="font-sans text-[9px] text-dry-stone uppercase tracking-[0.4em]">${escapeHtml(data.footer.text)}</p>
      <a href="${escapeHtml(data.site.instagramUrl)}" target="_blank" rel="noopener" class="inline-block text-dry-stone hover:text-aged-gold transition-colors">
        <i class="ph ph-instagram-logo text-xl"></i>
      </a>
    </div>
  `;
}

function wireGlobalCtas(data) {
  const link = waLink(data.site.whatsappNumber, data.site.whatsappMessage);
  document.getElementById('whatsapp-float').href = link;
}

fetch('/data.json')
  .then((res) => res.json())
  .then((data) => {
    siteData = data;
    document.title = `${data.site.brand} — ${data.hero.eyebrow}`;

    renderNavTabs(data);
    renderHome(data);
    renderPortfolio(data);
    renderAbout(data);
    renderServices(data);
    renderLegal(data);
    renderContact(data);
    renderFooter(data);
    wireGlobalCtas(data);

    route();
    window.addEventListener('hashchange', route);
    wireTabKeyboardNav();
  })
  .catch((err) => {
    console.error('Could not load site content from data.json', err);
  });

// Nav background on scroll + reading progress bar (scoped to the active,
// scrollable panel rather than the whole document, since panels swap in
// and out instead of one continuous page).
const progressBar = document.getElementById('progress-bar');
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
  if (progressBar) {
    const max = document.body.scrollHeight - window.innerHeight;
    progressBar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  }
});
