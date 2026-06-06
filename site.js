/* ================================================================
   INDIGENA — site.js  v2.0
   الأقسام الخمسة: أخبار | الشعوب | الثقافة | الحقوق | الأطلس
   ================================================================ */

(function () {
  'use strict';

  /* ─── الأقسام الخمسة ─────────────────────────────────── */
  const SECTIONS = [
    { key: 'أخبار',    icon: 'fa-newspaper',  color: '#4a7c59', label: 'أخبار' },
    { key: 'الشعوب',  icon: 'fa-globe-africa',color: '#7c5a2a', label: 'الشعوب' },
    { key: 'الثقافة', icon: 'fa-palette',     color: '#5a3e7c', label: 'الثقافة' },
    { key: 'الحقوق',  icon: 'fa-gavel',       color: '#7c2a2a', label: 'الحقوق' },
    { key: 'الأطلس',  icon: 'fa-map-marked-alt', color: '#2a5a7c', label: 'الأطلس' },
  ];

  /* ─── State ──────────────────────────────────────────── */
  let allPosts  = [];
  let isLoading = false;
  let activeSection = 'all';

  /* ─── DOM refs ───────────────────────────────────────── */
  let dom = {};

  /* ─── Utilities ──────────────────────────────────────── */

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (_) { return dateStr; }
  }

  function excerpt(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  }

  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  function readingTime(content) {
    const words = stripHtml(content || '').trim().split(/\s+/).length;
    const mins  = Math.max(1, Math.ceil(words / 150));
    return `${mins} دقيقة قراءة`;
  }

  function thumb(url) {
    return url && url.trim() !== ''
      ? url
      : 'https://placehold.co/600x400/1a3a28/c8a45a?text=Indigena';
  }

  /** الحصول على القسم من المقال */
  function getSection(post) {
    return post.section || (post.categories || [])[0] || 'أخبار';
  }

  /** فلترة المقالات حسب القسم */
  function filterBySection(posts, section) {
    if (!section || section === 'all') return posts;
    return posts.filter(p => getSection(p) === section);
  }

  /* ─── Skeleton ───────────────────────────────────────── */

  function skeletonCard() {
    return `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line" style="width:80%"></div>
          <div class="skeleton skeleton-line" style="width:65%"></div>
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line shorter" style="margin-top:1.5rem"></div>
        </div>
      </div>`;
  }

  function showSkeletons(container, count = 6) {
    if (!container) return;
    container.innerHTML = Array(count).fill(skeletonCard()).join('');
  }

  /* ─── Data Fetching ──────────────────────────────────── */

  async function fetchPosts() {
    if (allPosts.length) return allPosts;
    const res  = await fetch('posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allPosts   = (data.posts || []).sort(
      (a, b) => new Date(b.published) - new Date(a.published)
    );
    return allPosts;
  }

  /* ─── Scroll Progress & Back to Top ─────────────────── */

  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    const top = document.getElementById('back-to-top');
    if (!bar && !top) return;
    window.addEventListener('scroll', () => {
      const scrolled  = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct       = docHeight > 0 ? scrolled / docHeight : 0;
      if (bar) bar.style.transform = `scaleX(${pct})`;
      if (top) top.classList.toggle('visible', scrolled > 400);
    }, { passive: true });
    if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ─── Hero Stats ─────────────────────────────────────── */

  function renderHeroStats() {
    const el = document.getElementById('heroPostCount');
    if (el) el.textContent = allPosts.length + '+';
    const catEl = document.getElementById('heroCatCount');
    if (catEl) catEl.textContent = SECTIONS.length;
  }

  /* ─── Featured Posts ─────────────────────────────────── */

  function renderFeaturedPosts() {
    const grid = dom.featuredGrid;
    if (!grid || allPosts.length < 3) return;

    const [large, ...sides] = allPosts.slice(0, 3);
    const sec = getSection(large);

    const largeHtml = `
      <div class="featured-card-large" data-id="${large.id}" tabindex="0" role="button" aria-label="${large.title}">
        <div class="post-img" style="background-image:url('${thumb(large.thumbnail)}')">
          <span class="post-category">${sec}</span>
        </div>
        <div class="post-content">
          <h3>${excerpt(large.title, 90)}</h3>
          <div class="post-meta">
            <span><i class="far fa-calendar-alt"></i> ${formatDate(large.published)}</span>
            <span class="reading-time"><i class="far fa-clock"></i> ${readingTime(large.content)}</span>
          </div>
        </div>
      </div>`;

    const sideHtml = `
      <div class="featured-side">
        ${sides.slice(0, 2).map(post => `
          <div class="featured-card-small" data-id="${post.id}" tabindex="0" role="button" aria-label="${post.title}">
            <div class="post-img" style="background-image:url('${thumb(post.thumbnail)}')"></div>
            <div class="post-content">
              <span class="post-category" style="position:static;margin-bottom:0.5rem;display:inline-block">${getSection(post)}</span>
              <h4>${excerpt(post.title, 65)}</h4>
              <div class="post-meta">
                <span><i class="far fa-calendar-alt"></i> ${formatDate(post.published)}</span>
              </div>
            </div>
          </div>`).join('')}
      </div>`;

    grid.innerHTML = largeHtml + sideHtml;

    grid.querySelectorAll('[data-id]').forEach(card => {
      const nav = () => { window.location.href = `article.html?id=${card.dataset.id}`; };
      card.addEventListener('click', nav);
      card.addEventListener('keydown', e => e.key === 'Enter' && nav());
    });
  }

  /* ─── Sections Grid (الأقسام الخمسة) ───────────────── */

  function renderSectionsGrid() {
    const grid = dom.categoriesGrid;
    if (!grid) return;

    // عدد المقالات لكل قسم
    const counts = {};
    allPosts.forEach(p => {
      const s = getSection(p);
      counts[s] = (counts[s] || 0) + 1;
    });

    grid.innerHTML = SECTIONS.map(({ key, icon, color }) => `
      <div class="category-card" data-cat="${key}" tabindex="0" role="button"
           style="--section-color:${color}">
        <i class="fas ${icon}"></i>
        <h3>${key}</h3>
        <p>${counts[key] ?? 0} مقال</p>
      </div>`).join('');

    grid.querySelectorAll('.category-card').forEach(card => {
      const nav = () => { window.location.href = `category.html?cat=${encodeURIComponent(card.dataset.cat)}`; };
      card.addEventListener('click', nav);
      card.addEventListener('keydown', e => e.key === 'Enter' && nav());
    });
  }

  /* ─── Quick Filter Strip (شريط فلترة المقالات) ──────── */

  function renderQuickCategories() {
    const container = dom.quickCategories;
    if (!container) return;

    // فلاتر مفيدة بدلاً من تكرار روابط الأقسام
    const FILTERS = [
      { key: 'all',     label: 'جميع المقالات', icon: 'fa-th' },
      { key: 'أخبار',   label: 'أخبار', icon: 'fa-newspaper' },
      { key: 'الشعوب',  label: 'الشعوب', icon: 'fa-globe-africa' },
      { key: 'الثقافة', label: 'الثقافة', icon: 'fa-palette' },
      { key: 'الحقوق',  label: 'الحقوق', icon: 'fa-gavel' },
      { key: 'الأطلس',  label: 'الأطلس', icon: 'fa-map-marked-alt' },
    ];

    container.innerHTML = FILTERS.map((f, i) =>
      `<span class="cat-chip${i===0?' active':''}" data-section="${f.key}">
        <i class="fas ${f.icon}"></i> ${f.label}
      </span>`
    ).join('');

    container.querySelectorAll('.cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const section = chip.dataset.section;
        activeSection = section;
        const filtered = filterBySection(allPosts, section);
        renderLatestPosts(filtered.slice(0, 6));
        // تمرير لقسم المقالات
        document.getElementById('mainPosts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ─── Footer Sections ────────────────────────────────── */

  function renderFooterCategories() {
    const list = document.querySelector('#footerCategories ul');
    if (!list) return;
    list.innerHTML = SECTIONS.map(s =>
      `<li><a href="category.html?cat=${encodeURIComponent(s.key)}">
        <i class="fas ${s.icon}"></i> ${s.key}
      </a></li>`
    ).join('');
  }

  /* ─── Latest Posts Grid ──────────────────────────────── */

  function renderLatestPosts(posts = allPosts.slice(0, 6)) {
    const grid = dom.postsGrid;
    if (!grid) return;

    if (!posts.length) {
      grid.innerHTML = '<p style="text-align:center;color:var(--clr-text-muted);grid-column:1/-1;padding:3rem">لا توجد مقالات في هذا القسم</p>';
      return;
    }

    grid.innerHTML = posts.map(post => `
      <div class="post-card" data-id="${post.id}" tabindex="0" role="button" aria-label="${post.title}">
        <div class="post-img">
          <div class="post-img-inner" style="background-image:url('${thumb(post.thumbnail)}')"></div>
          <span class="post-category">${getSection(post)}</span>
        </div>
        <div class="post-content">
          <h3 class="post-title">${excerpt(post.title, 85)}</h3>
          <p class="post-excerpt">${excerpt(stripHtml(post.content_preview || post.content || ''), 110)}</p>
          <div class="post-meta">
            <span><i class="far fa-calendar-alt"></i> ${formatDate(post.published)}</span>
            <span><i class="far fa-clock"></i> ${readingTime(post.content)}</span>
          </div>
        </div>
      </div>`).join('');

    grid.querySelectorAll('.post-card').forEach(card => {
      const nav = () => { window.location.href = `article.html?id=${card.dataset.id}`; };
      card.addEventListener('click', nav);
      card.addEventListener('keydown', e => e.key === 'Enter' && nav());
    });
  }

  /* ─── Search ─────────────────────────────────────────── */

  function setupSearch() {
    const overlay  = dom.searchOverlay;
    const input    = dom.searchInput;
    const results  = dom.searchResults;
    const openBtn  = document.getElementById('searchIconNav');
    const closeBtn = document.getElementById('closeSearch');
    if (!overlay || !input) return;

    const open  = () => { overlay.classList.add('open'); setTimeout(() => input.focus(), 60); };
    const close = () => { overlay.classList.remove('open'); input.value = ''; results.innerHTML = ''; };

    if (openBtn) openBtn.addEventListener('click', e => { e.preventDefault(); open(); });
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    const doSearch = debounce((q) => {
      if (q.length < 2) { results.innerHTML = ''; return; }
      const filtered = allPosts.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.categories || []).some(c => c.toLowerCase().includes(q)) ||
        (p.section || '').toLowerCase().includes(q)
      );
      if (!filtered.length) {
        results.innerHTML = '<p style="color:rgba(240,224,200,0.5);text-align:center;padding:2rem">لا توجد نتائج</p>';
        return;
      }
      results.innerHTML = filtered.slice(0, 8).map(p => `
        <div class="search-result-item" data-id="${p.id}">
          <strong>${excerpt(p.title, 65)}</strong>
          <span>${getSection(p)} · ${formatDate(p.published)}</span>
        </div>`).join('');
      results.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => { window.location.href = `article.html?id=${item.dataset.id}`; });
      });
    }, 280);

    input.addEventListener('input', e => doSearch(e.target.value.trim().toLowerCase()));
  }

  /* ─── Hero Buttons ───────────────────────────────────── */

  function setupHeroButtons() {
    const exploreBtn = document.getElementById('exploreBtn');
    const latestBtn  = document.getElementById('latestBtn');
    if (exploreBtn) exploreBtn.addEventListener('click', () =>
      window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' }));
    if (latestBtn)  latestBtn.addEventListener('click', () =>
      document.getElementById('mainPosts')?.scrollIntoView({ behavior: 'smooth' }));
  }

  /* ─── Mobile Menu ────────────────────────────────────── */

  function setupMobileMenu() {
    const btn      = document.querySelector('.mobile-menu-btn');
    const overlay  = document.querySelector('.mobile-nav-overlay');
    const closeBtn = document.querySelector('.mobile-nav-close');
    if (!btn || !overlay) return;
    btn.addEventListener('click', () => overlay.classList.add('open'));
    if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', () => overlay.classList.remove('open')));
  }

  /* ─── Newsletter ─────────────────────────────────────── */

  function setupNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> شكراً!';
      btn.style.background = '#2c5a3e';
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; form.reset(); }, 2500);
    });
  }

  /* ─── AOS ────────────────────────────────────────────── */

  function initAOS() {
    if (typeof AOS !== 'undefined') AOS.init({ duration: 700, once: true, offset: 60 });
  }

  /* ─── Active Nav Link ────────────────────────────────── */

  function markActiveNavLink() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    if (!cat) return;
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(a => {
      if (a.getAttribute('href') && decodeURIComponent(a.getAttribute('href')).includes(cat)) {
        a.classList.add('active');
      }
    });
  }

  /* ─── Main Entry ─────────────────────────────────────── */

  async function init() {
    if (isLoading) return;
    isLoading = true;

    dom = {
      featuredGrid:    document.getElementById('featuredGrid'),
      categoriesGrid:  document.getElementById('categoriesGrid'),
      quickCategories: document.getElementById('quickCategories'),
      postsGrid:       document.getElementById('postsGrid'),
      searchOverlay:   document.getElementById('searchOverlay'),
      searchInput:     document.getElementById('searchInput'),
      searchResults:   document.getElementById('searchResults'),
    };

    showSkeletons(dom.postsGrid, 6);

    initScrollProgress();
    setupSearch();
    setupHeroButtons();
    setupMobileMenu();
    setupNewsletter();
    initAOS();
    markActiveNavLink();

    try {
      await fetchPosts();
      renderHeroStats();
      renderFeaturedPosts();
      renderSectionsGrid();
      renderQuickCategories();
      renderFooterCategories();
      renderLatestPosts();
    } catch (err) {
      console.error('[Indigena] Failed to load posts:', err);
      if (dom.postsGrid) {
        dom.postsGrid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--clr-text-muted)">
            <i class="fas fa-exclamation-circle" style="font-size:2.5rem;color:var(--clr-gold);display:block;margin-bottom:1rem"></i>
            <p style="font-size:1.1rem;margin-bottom:0.5rem">تعذّر تحميل المقالات</p>
            <p style="font-size:0.85rem">تأكد من وجود ملف posts.json في نفس المجلد.</p>
          </div>`;
      }
    } finally {
      isLoading = false;
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  /* ─── Public API (للاستخدام من صفحات أخرى) ─────────── */
  window.IndigenaApp = {
    fetchPosts,
    filterBySection,
    getSection,
    formatDate,
    excerpt,
    stripHtml,
    thumb,
    readingTime,
    SECTIONS,
  };

})();
