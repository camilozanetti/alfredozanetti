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

function waLink(site) {
  if (site.whatsappUrl) return site.whatsappUrl;
  const digits = String(site.whatsappNumber || '').replace(/[^\d]/g, '');
  const text = encodeURIComponent(site.whatsappMessage || '');
  return `https://wa.me/${digits}${text ? `?text=${text}` : ''}`;
}

// ---------- Tab router ----------

function tabIds() {
  return ['home', ...siteData.nav.map((n) => n.id)];
}

const PANEL_TRANSITION_MS = 180;

function playEntrance(panel) {
  panel.querySelectorAll('.reveal').forEach((el) => el.classList.remove('visible'));
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panel.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    });
  });
}

function route() {
  const requested = (location.hash || '#home').slice(1);
  const targetId = tabIds().includes(requested) ? requested : 'home';
  const nextPanel = document.querySelector(`[data-panel="${targetId}"]`);
  const currentPanel = document.querySelector('[role="tabpanel"]:not([hidden])');

  document.querySelectorAll('[role="tab"]').forEach((tab) => {
    const active = tab.dataset.tab === targetId;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  const whatsappFloat = document.getElementById('whatsapp-float');
  if (whatsappFloat) {
    const showFloat = targetId !== 'home';
    whatsappFloat.classList.toggle('opacity-0', !showFloat);
    whatsappFloat.classList.toggle('scale-75', !showFloat);
    whatsappFloat.classList.toggle('pointer-events-none', !showFloat);
    whatsappFloat.classList.toggle('opacity-100', showFloat);
    whatsappFloat.classList.toggle('scale-100', showFloat);
    whatsappFloat.classList.toggle('pointer-events-auto', showFloat);
  }

  setMobileMenuOpen(false);
  window.scrollTo(0, 0);

  if (!currentPanel || currentPanel === nextPanel) {
    nextPanel.hidden = false;
    playEntrance(nextPanel);
    return;
  }

  // Cross-fade: fade the outgoing panel out, then swap `hidden` (which is
  // what actually removes it from layout/a11y tree), then fade the new one
  // in — avoids the abrupt cut of a plain hidden-attribute toggle.
  currentPanel.classList.add('panel-leaving');
  setTimeout(() => {
    currentPanel.hidden = true;
    currentPanel.classList.remove('panel-leaving');

    nextPanel.classList.add('panel-entering');
    nextPanel.hidden = false;
    requestAnimationFrame(() => {
      nextPanel.classList.remove('panel-entering');
      playEntrance(nextPanel);
    });
  }, PANEL_TRANSITION_MS);
}

function setMobileMenuOpen(open) {
  const menu = document.getElementById('mobile-menu');
  const toggle = document.getElementById('menu-toggle');
  if (!menu || !toggle) return;
  menu.classList.toggle('opacity-0', !open);
  menu.classList.toggle('pointer-events-none', !open);
  menu.setAttribute('aria-hidden', String(!open));
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  toggle.querySelector('i').className = open ? 'ph ph-x text-2xl' : 'ph ph-list text-2xl';
  document.body.classList.toggle('overflow-hidden', open);
}

function wireMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  toggle.addEventListener('click', () => {
    setMobileMenuOpen(menu.classList.contains('opacity-0'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMobileMenuOpen(false);
  });
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
    [{ container: desktop, prefix: 'tab', cls: 'font-sans text-[11px] uppercase tracking-widest' },
     { container: mobile, prefix: 'tab-m', cls: '' }].forEach(({ container, prefix, cls }) => {
      const a = document.createElement('a');
      a.href = `#${item.id}`;
      a.dataset.tab = item.id;
      a.id = `${prefix}-${item.id}`;
      a.setAttribute('role', 'tab');
      a.setAttribute('aria-controls', `panel-${item.id}`);
      a.setAttribute('aria-selected', 'false');
      a.tabIndex = -1;
      if (cls) a.className = cls;
      a.textContent = item.label;
      container.appendChild(a);
    });
  });
}

function renderHome(data) {
  const hero = data.hero;
  const link = waLink(data.site);
  const section = document.getElementById('panel-home');
  section.innerHTML = `
    <div class="hero-media absolute inset-0 overflow-hidden">
      <img src="${escapeHtml(hero.backgroundImage)}" alt="" class="w-full h-full object-cover">
    </div>
    <div class="absolute inset-0" style="background:linear-gradient(0deg, rgba(6,6,5,.88) 0%, rgba(6,6,5,.32) 46%, rgba(6,6,5,0) 68%)"></div>
    <div class="hidden md:block absolute right-6 lg:right-10 z-10" style="top:7rem; writing-mode:vertical-rl; letter-spacing:.18em;" aria-hidden="true">
      <span class="font-sans text-[11px] text-white/60">${escapeHtml(data.site.location.toUpperCase())}</span>
    </div>
    <div class="relative z-10 min-h-screen flex flex-col justify-end px-6 md:px-16 pt-28 md:pt-32 pb-16 md:pb-24">
      <div class="reveal flex items-center gap-2.5 mb-6 font-sans text-[11px] sm:text-xs text-white/75 uppercase tracking-[0.22em]">
        <span class="pulse-dot w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></span>
        ${escapeHtml(hero.eyebrow)}
      </div>
      <h1 class="reveal reveal-delay-1 font-serif text-white f-hero max-w-[16ch]">
        ${escapeHtml(hero.titleLine1)}<br>
        <em class="font-medium">${escapeHtml(hero.titleLine2)}</em> ${escapeHtml(hero.titleLine2Suffix)}
      </h1>
      <p class="reveal reveal-delay-2 font-sans text-base sm:text-lg text-white/80 leading-relaxed mt-6 mb-9 max-w-[36ch]">
        ${escapeHtml(hero.subtitle)}
      </p>
      <div class="reveal reveal-delay-3">
        <a href="${link}" target="_blank" rel="noopener" class="group inline-flex items-center gap-3 border border-white text-white px-8 py-4 font-sans text-[11px] font-medium uppercase tracking-widest hover:bg-white hover:text-ink transition-colors">
          ${escapeHtml(hero.ctaLabel)} <i class="ph ph-whatsapp-logo"></i>
        </a>
      </div>
    </div>
  `;
}

function renderPortfolio(data) {
  const p = data.portfolio;
  const section = document.getElementById('panel-portfolio');
  section.innerHTML = `
    <div class="grid md:grid-cols-2 gap-10 md:gap-14 items-end mb-20 md:mb-28">
      <div class="plate reveal aspect-[4/5]">
        <img src="${escapeHtml(p.intro.image)}" alt="${escapeHtml(p.intro.imageLabel)}">
        <span class="plate__folio">${escapeHtml(p.intro.imageLabel)}</span>
      </div>
      <div>
        <p class="reveal font-sans text-[11px] font-medium text-ink-faint uppercase tracking-[0.2em] mb-4">${escapeHtml(p.intro.eyebrow)}</p>
        <h2 class="reveal reveal-delay-1 font-serif f-section mb-5">${p.intro.title}</h2>
        <p class="reveal reveal-delay-2 text-ink-soft leading-relaxed max-w-[46ch]">${escapeHtml(p.intro.paragraph)}</p>
      </div>
    </div>

    <div class="mb-20 md:mb-24">
      <div class="reveal flex justify-between items-baseline border-b border-line pb-4 mb-8">
        <h3 class="font-serif italic text-2xl">The Studio Collection</h3>
        <span class="font-sans text-[11px] text-ink-faint uppercase tracking-widest">Controlled Light</span>
      </div>
      <div class="grid md:grid-cols-[2fr_1.3fr_1.3fr] gap-5">
        ${p.studio.map((s, i) => `
          <figure class="reveal reveal-delay-${Math.min(i + 1, 3)}">
            <div class="plate" style="aspect-ratio:3/4;">
              <img src="${escapeHtml(s.image)}" alt="${escapeHtml(s.alt)}">
              <span class="plate__folio">0${i + 1}/05</span>
            </div>
            <figcaption class="figcap"><em>${escapeHtml(s.label.split(' Study')[0] || s.label)}</em><span>${escapeHtml(s.tag)}</span></figcaption>
          </figure>
        `).join('')}
      </div>
    </div>

    <div>
      <div class="reveal flex justify-between items-baseline border-b border-line pb-4 mb-8">
        <h3 class="font-serif italic text-2xl">On-Location Study</h3>
        <span class="font-sans text-[11px] text-ink-faint uppercase tracking-widest">Perth Streets</span>
      </div>
      <div class="grid md:grid-cols-[1.5fr_1fr] gap-5">
        ${p.onLocation.map((s, i) => `
          <figure class="reveal reveal-delay-${Math.min(i + 1, 3)}">
            <div class="plate" style="aspect-ratio:${i === 0 ? '4/5' : '3/5'};">
              <img src="${escapeHtml(s.image)}" alt="${escapeHtml(s.alt)}">
              <span class="plate__folio">0${i + 4}/05</span>
            </div>
            <figcaption class="figcap"><em>${escapeHtml(s.label.split(' //')[0] || s.label)}</em><span>${escapeHtml(s.tag)}</span></figcaption>
          </figure>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAbout(data) {
  const about = data.about;
  const section = document.getElementById('panel-about');
  section.innerHTML = `
    <div class="grid md:grid-cols-[.9fr_1.3fr] gap-10 md:gap-0 items-start">
      <div class="plate reveal aspect-[4/5]">
        <img src="${escapeHtml(about.portraitImage)}" alt="Photography by Alfredo Zanetti">
      </div>
      <div class="md:pl-14 md:-ml-8">
        <p class="reveal font-sans text-[11px] font-medium text-ink-faint uppercase tracking-[0.2em] mb-3">${escapeHtml(about.eyebrow)}</p>
        <p class="reveal reveal-delay-1 font-serif italic font-medium f-quote mb-8">${about.title}</p>
        <div class="space-y-5 max-w-[48ch]">
          ${about.paragraphs.map((p, i) => `<p class="reveal reveal-delay-${Math.min(i + 2, 3)} text-ink-soft leading-relaxed">${escapeHtml(p)}</p>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderServices(data) {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const section = document.getElementById('panel-services');
  section.innerHTML = `
    <p class="reveal font-sans text-[11px] font-medium text-ink-faint uppercase tracking-[0.2em] mb-3">Services</p>
    <h2 class="reveal reveal-delay-1 font-serif f-section mb-2">Day rates.</h2>
    <div class="mt-10">
      ${data.services.map((s, i) => `
        <div class="reveal reveal-delay-${Math.min(i + 1, 3)} grid grid-cols-[2.4rem_1fr] sm:grid-cols-[3.2rem_1fr_auto] gap-x-6 gap-y-3 items-baseline py-7 border-t border-line ${i === data.services.length - 1 ? 'border-b' : ''}">
          <div class="font-serif italic text-2xl text-ink-faint">${romanNumerals[i] || i + 1}</div>
          <div>
            <div class="font-serif text-xl md:text-2xl mb-1.5">${escapeHtml(s.title)}</div>
            <p class="text-ink-soft text-[0.95rem] max-w-[52ch]">${escapeHtml(s.description)}</p>
          </div>
          <div class="col-span-2 sm:col-span-1 font-sans text-[0.95rem] whitespace-nowrap sm:text-right">
            ${escapeHtml(s.priceFrom)}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLegal(data) {
  const section = document.getElementById('panel-legal');
  section.innerHTML = `
    <p class="reveal font-sans text-[11px] font-medium text-ink-faint uppercase tracking-[0.2em] mb-3">Legal &amp; Permits</p>
    <h2 class="reveal reveal-delay-1 font-serif f-section mb-12">Shoot-ready, every time.</h2>
    <div class="max-w-[68ch]">
      ${data.legal.map((c, i) => `
        <div class="reveal reveal-delay-${Math.min(i + 1, 3)} flex gap-5 py-6 border-t border-line ${i === data.legal.length - 1 ? 'border-b' : ''}">
          <i class="ph ${escapeHtml(c.icon)} text-xl text-ink-faint shrink-0 mt-0.5"></i>
          <div>
            <div class="font-serif text-lg mb-1">${escapeHtml(c.title)}</div>
            <p class="text-ink-soft text-[0.95rem] leading-relaxed">${escapeHtml(c.description)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderContact(data) {
  const link = waLink(data.site);
  const section = document.getElementById('panel-contact');
  section.innerHTML = `
    <div class="max-w-[1400px] mx-auto px-6 md:px-16 pt-32 md:pt-40 pb-24">
      <p class="reveal font-sans text-[11px] font-medium text-paper/50 uppercase tracking-[0.2em] mb-3">Contact</p>
      <h2 class="reveal reveal-delay-1 font-serif f-hero mb-10 max-w-[14ch]">Open a file.</h2>
      <div class="reveal reveal-delay-2 flex flex-wrap items-center gap-x-8 gap-y-4 mb-16">
        <a href="mailto:${escapeHtml(data.site.email)}" class="font-sans text-lg border-b border-paper pb-0.5">${escapeHtml(data.site.email)}</a>
        <a href="${link}" target="_blank" rel="noopener" class="inline-flex items-center gap-2.5 font-sans text-sm text-paper/70 hover:text-paper transition-colors">
          <span class="w-2.5 h-2.5 rounded-full bg-wa"></span> Message on WhatsApp
        </a>
      </div>

      <div class="max-w-[68ch] border-t border-paper/15 pt-10">
        ${data.faq.map((f, i) => `
          <details class="reveal reveal-delay-${Math.min(i + 1, 3)} border-b border-paper/15 py-5">
            <summary class="flex justify-between items-center gap-4 font-serif italic text-lg md:text-xl">
              ${escapeHtml(f.question)}
              <i class="ph ph-plus faq-icon text-paper/60 shrink-0"></i>
            </summary>
            <p class="text-sm text-paper/65 leading-relaxed max-w-[56ch]">${escapeHtml(f.answer)}</p>
          </details>
        `).join('')}
      </div>

      <p class="mt-16 font-sans text-[11px] text-paper/50 uppercase tracking-[0.2em]">${escapeHtml(data.site.location)}</p>
    </div>
  `;
}

function renderFooter(data) {
  const footer = document.getElementById('site-footer');
  footer.innerHTML = `
    <div class="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-3 font-sans text-[10px] text-ink-faint uppercase tracking-[0.15em]">
      <span>${escapeHtml(data.site.brand)}</span>
      <span>${escapeHtml(data.footer.text)}</span>
      <a href="${escapeHtml(data.site.instagramUrl)}" target="_blank" rel="noopener" class="hover:text-ink transition-colors">
        <i class="ph ph-instagram-logo text-base"></i>
      </a>
    </div>
  `;
}

function wireGlobalCtas(data) {
  const link = waLink(data.site);
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
    wireMobileMenu();
  })
  .catch((err) => {
    console.error('Could not load site content from data.json', err);
  });
