// Dynamic rendering — data.json is the single source of truth for content.
// Everything on the page is built from it, so editing data.json (via the
// CMS or directly) is enough to update the live site with no code changes.

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

function renderNav(data) {
  const link = waLink(data.site.whatsappNumber, data.site.whatsappMessage);
  document.getElementById('nav-cta').textContent = data.site.ctaLabel;
  document.getElementById('nav-cta').href = link;
  document.getElementById('whatsapp-float').href = link;
  document.getElementById('sticky-cta-link').href = link;
}

function renderHero(data) {
  const hero = data.hero;
  const link = waLink(data.site.whatsappNumber, data.site.whatsappMessage);
  const section = document.getElementById('hero-section');
  section.innerHTML = `
    <img src="${escapeHtml(hero.backgroundImage)}" alt="" class="absolute inset-0 w-full h-full object-cover" style="opacity:0.4;">
    <div class="absolute inset-0" style="background:linear-gradient(160deg,rgba(10,10,10,0.2) 0%,rgba(10,10,10,0.92) 70%,rgba(10,10,10,1) 100%)"></div>
    <div class="relative z-10 max-w-[780px] pt-28 sm:pt-32 md:pt-36">
      <div class="a1 flex items-center gap-2.5 mb-8 w-fit bg-white/[0.06] border border-white/[0.12] backdrop-blur-sm px-4 py-2 rounded-full">
        <span class="pulse-dot w-2 h-2 bg-aged-gold rounded-full flex-shrink-0"></span>
        <span class="font-mono text-[9px] sm:text-[10px] text-dry-stone uppercase tracking-[0.28em] font-bold">${escapeHtml(hero.eyebrow)}</span>
      </div>
      <h1 class="a2 font-serif italic text-bone-white mb-8 f-hero">
        ${escapeHtml(hero.titleLine1)}<br>
        <span class="gold-text">${escapeHtml(hero.titleLine2)}</span> ${escapeHtml(hero.titleLine2Suffix)}
      </h1>
      <p class="a3 font-light leading-[1.75] mb-10 max-w-[480px] text-[15px] sm:text-[17px] text-dry-stone">
        ${escapeHtml(hero.subtitle)}
      </p>
      <div class="a4">
        <a href="${link}" target="_blank" rel="noopener" class="group inline-flex items-center gap-3 bg-[#25D366] text-white px-10 py-5 rounded-full font-bold text-[11px] sm:text-[12px] uppercase tracking-widest hover:bg-[#20ba58] transition-all shadow-2xl hover:shadow-[0_0_0_6px_rgba(37,211,102,0.2)]">
          ${escapeHtml(hero.ctaLabel)} <i class="ph ph-whatsapp-logo group-hover:translate-x-1 transition-transform"></i>
        </a>
      </div>
    </div>
  `;
}

function renderAbout(data) {
  const about = data.about;
  const section = document.getElementById('about');
  section.innerHTML = `
    <div class="grid md:grid-cols-12 gap-10 items-center">
      <div class="md:col-span-7 space-y-6">
        <div class="reveal flex items-center gap-3 mb-1">
          <div class="w-6 h-px bg-aged-gold/50"></div>
          <span class="font-mono text-[10px] text-aged-gold uppercase tracking-[0.3em] font-bold">${escapeHtml(about.eyebrow)}</span>
        </div>
        <h2 class="reveal font-serif italic f-section text-bone-white">${about.title}</h2>
        ${about.paragraphs.map((p, i) => `<p class="reveal reveal-delay-${Math.min(i + 1, 3)} font-light leading-[1.8] text-[15px] sm:text-[16px] text-dry-stone">${escapeHtml(p)}</p>`).join('')}
      </div>
      <div class="md:col-span-5 reveal reveal-delay-2 aspect-[3/4] rounded-3xl overflow-hidden border border-white/10">
        <img src="${escapeHtml(about.portraitImage)}" alt="Photography by Alfredo Zanetti" class="w-full h-full object-cover">
      </div>
    </div>
  `;
}

function renderServices(data) {
  const section = document.getElementById('services');
  section.innerHTML = `
    <div class="reveal flex items-center gap-3 mb-5">
      <div class="w-6 h-px bg-jet-black/40"></div>
      <span class="font-mono text-[10px] text-jet-black/70 uppercase tracking-[0.3em] font-bold">Services</span>
    </div>
    <h2 class="reveal font-serif italic f-section text-jet-black mb-10">What I shoot</h2>
    <div class="grid md:grid-cols-3 gap-6">
      ${data.services.map((s, i) => `
        <div class="reveal reveal-delay-${Math.min(i + 1, 3)} card-lift bg-jet-black/[0.03] border border-jet-black/10 rounded-3xl p-8 space-y-4">
          <i class="ph ${escapeHtml(s.icon)} text-3xl text-aged-gold"></i>
          <h3 class="font-serif italic text-xl text-jet-black">${escapeHtml(s.title)}</h3>
          <p class="text-sm text-jet-black/70 leading-relaxed">${escapeHtml(s.description)}</p>
          <p class="font-mono text-[11px] uppercase tracking-widest text-aged-gold font-bold">${escapeHtml(s.priceFrom)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPortfolio(data) {
  const section = document.getElementById('portfolio');
  section.innerHTML = `
    <div class="px-4 sm:px-6 mb-6 flex justify-between items-end">
      <h2 class="reveal font-serif italic f-section text-bone-white">Portfolio</h2>
      <span class="font-mono text-[9px] text-dry-stone tracking-widest uppercase">Perth, WA</span>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
      ${data.portfolio.map((p, i) => `
        <div class="reveal reveal-delay-${Math.min((i % 3) + 1, 3)} aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-surface-card group relative">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.alt)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <p class="font-mono text-[8px] tracking-widest text-aged-gold">${escapeHtml(p.label)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCredentials(data) {
  const section = document.getElementById('credentials');
  section.innerHTML = `
    <div class="reveal flex items-center gap-3 mb-5">
      <div class="w-6 h-px bg-aged-gold/50"></div>
      <span class="font-mono text-[10px] text-aged-gold uppercase tracking-[0.3em] font-bold">Working Together</span>
    </div>
    <h2 class="reveal font-serif italic f-section text-bone-white mb-10">Shoot-ready, every time</h2>
    <div class="grid md:grid-cols-3 gap-6">
      ${data.credentials.map((c, i) => `
        <div class="reveal reveal-delay-${Math.min(i + 1, 3)} flex gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
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

function renderFaq(data) {
  const section = document.getElementById('faq');
  section.innerHTML = `
    <div class="reveal flex items-center gap-3 mb-5">
      <div class="w-6 h-px bg-jet-black/40"></div>
      <span class="font-mono text-[10px] text-jet-black/70 uppercase tracking-[0.3em] font-bold">FAQ</span>
    </div>
    <h2 class="reveal font-serif italic f-section text-jet-black mb-10">Good to know</h2>
    <div class="space-y-3">
      ${data.faq.map((f, i) => `
        <details class="reveal reveal-delay-${Math.min(i + 1, 3)} bg-jet-black/[0.03] border border-jet-black/10 rounded-2xl p-5">
          <summary class="flex justify-between items-center font-serif italic text-lg text-jet-black">
            ${escapeHtml(f.question)}
            <i class="ph ph-plus faq-icon text-aged-gold"></i>
          </summary>
          <p class="text-sm text-jet-black/70 leading-relaxed">${escapeHtml(f.answer)}</p>
        </details>
      `).join('')}
    </div>
  `;
}

function renderContact(data) {
  const link = waLink(data.site.whatsappNumber, data.site.whatsappMessage);
  const section = document.getElementById('contacto');
  section.innerHTML = `
    <div class="reveal max-w-[560px] mx-auto space-y-6">
      <h2 class="font-serif italic f-section text-bone-white">Let's shoot <span class="gold-text">something.</span></h2>
      <p class="font-light text-dry-stone">${escapeHtml(data.site.tagline)} — ${escapeHtml(data.site.location)}.</p>
      <a href="${link}" target="_blank" rel="noopener" class="inline-flex items-center gap-3 bg-[#25D366] text-white px-10 py-5 rounded-full font-bold text-[11px] sm:text-[12px] uppercase tracking-widest hover:bg-[#20ba58] transition-all shadow-2xl">
        ${escapeHtml(data.site.ctaLabel)} <i class="ph ph-whatsapp-logo"></i>
      </a>
      <p class="font-mono text-[10px] text-dry-stone uppercase tracking-widest">${escapeHtml(data.site.email)}</p>
    </div>
  `;
}

function renderFooter(data) {
  const footer = document.getElementById('site-footer');
  footer.innerHTML = `
    <div class="max-w-2xl mx-auto px-6 space-y-4">
      <span class="font-serif italic text-3xl block text-bone-white">${escapeHtml(data.site.brand)}<span class="text-aged-gold">.</span></span>
      <div class="w-12 h-px bg-aged-gold mx-auto"></div>
      <p class="font-mono text-[9px] text-dry-stone uppercase tracking-[0.3em]">${escapeHtml(data.footer.text)}</p>
      <a href="${escapeHtml(data.site.instagramUrl)}" target="_blank" rel="noopener" class="inline-block text-dry-stone hover:text-aged-gold transition-colors">
        <i class="ph ph-instagram-logo text-xl"></i>
      </a>
    </div>
  `;
}

fetch('/data.json')
  .then((res) => res.json())
  .then((data) => {
    document.title = `${data.site.brand} ${data.site.brandSuffix} — ${data.hero.eyebrow}`;
    renderNav(data);
    renderHero(data);
    renderAbout(data);
    renderServices(data);
    renderPortfolio(data);
    renderCredentials(data);
    renderFaq(data);
    renderContact(data);
    renderFooter(data);
    document.dispatchEvent(new CustomEvent('content:rendered'));
  })
  .catch((err) => {
    console.error('Could not load site content from data.json', err);
  });
