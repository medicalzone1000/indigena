/* ================================================================
   INDIGENA — site.js  v3.0  (Homepage v2)
   الأقسام الخمسة: أخبار | الشعوب | الثقافة | الحقوق | الأطلس
   ================================================================ */

(function () {
  'use strict';

  /* ─── الأقسام الخمسة ─────────────────────────────────── */
  const SECTIONS = [
    { key: 'أخبار',    icon: 'fa-newspaper',     color: '#4a7c59', label: 'أخبار' },
    { key: 'الشعوب',  icon: 'fa-globe-africa',   color: '#7c5a2a', label: 'الشعوب' },
    { key: 'الثقافة', icon: 'fa-palette',         color: '#5a3e7c', label: 'الثقافة' },
    { key: 'الحقوق',  icon: 'fa-gavel',           color: '#7c2a2a', label: 'الحقوق' },
    { key: 'الأطلس',  icon: 'fa-map-marked-alt',  color: '#2a5a7c', label: 'الأطلس' },
  ];

  /* ─── State ──────────────────────────────────────────── */
  let allPosts     = [];
  let isLoading    = false;
  let activeSection = 'all';
  let displayedCount = 6;
  const PAGE_SIZE    = 6;

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
    return `${mins} دقيقة`;
  }
  function thumb(url) {
    return url && url.trim() !== ''
      ? url
      : 'https://placehold.co/600x400/1a3a28/c8a45a?text=Indigena';
  }
  function getSection(post) {
    return post.section || (post.categories || [])[0] || 'أخبار';
  }
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

  /* ─── Data ───────────────────────────────────────────── */
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
    const el    = document.getElementById('heroPostCount');
    const catEl = document.getElementById('heroCatCount');
    if (el)    el.textContent    = allPosts.length + '+';
    if (catEl) catEl.textContent = SECTIONS.length;

    const statPosts = document.getElementById('statPosts');
    if (statPosts) statPosts.textContent = allPosts.length + '+';
  }

  /* ─── Ticker ─────────────────────────────────────────── */
  function renderTicker() {
    const el = document.getElementById('tickerContent');
    if (!el || !allPosts.length) return;
    const titles = allPosts.slice(0, 8).map(p => excerpt(p.title, 70));
    // Duplicate for seamless loop
    const items  = [...titles, ...titles];
    el.innerHTML = items.map(t => `<span>${t}</span>`).join('');
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
          <h3>${excerpt(large.title, 100)}</h3>
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
              <h4>${excerpt(post.title, 70)}</h4>
              <div class="post-meta">
                <span><i class="far fa-calendar-alt"></i> ${formatDate(post.published)}</span>
                <span><i class="far fa-clock"></i> ${readingTime(post.content)}</span>
              </div>
            </div>
          </div>`).join('')}
      </div>`;

    grid.innerHTML = largeHtml + sideHtml;
    grid.querySelectorAll('[data-id]').forEach(card => {
      const nav = () => window.location.href = `article.html?id=${card.dataset.id}`;
      card.addEventListener('click', nav);
      card.addEventListener('keydown', e => e.key === 'Enter' && nav());
    });
  }

  /* ─── Trending Row ───────────────────────────────────── */
  function renderTrendingRow() {
    const el = document.getElementById('trendingList');
    if (!el || !allPosts.length) return;
    const posts = allPosts.slice(3, 8);
    el.innerHTML = posts.map((post, i) => `
      <div class="trending-item" data-id="${post.id}" tabindex="0" role="button">
        <div class="trending-rank">${i + 1}</div>
        <div class="trending-item-body">
          <span class="post-category" style="position:static;display:block;margin-bottom:4px">${getSection(post)}</span>
          <h4>${excerpt(post.title, 75)}</h4>
          <div class="trending-item-meta">
            <span><i class="far fa-calendar-alt"></i> ${formatDate(post.published)}</span>
            <span><i class="far fa-clock"></i> ${readingTime(post.content)}</span>
          </div>
        </div>
        <div class="trending-thumb" style="background-image:url('${thumb(post.thumbnail)}')"></div>
      </div>`).join('');

    el.querySelectorAll('.trending-item').forEach(item => {
      const nav = () => window.location.href = `article.html?id=${item.dataset.id}`;
      item.addEventListener('click', nav);
      item.addEventListener('keydown', e => e.key === 'Enter' && nav());
    });
  }

  /* ─── Sections Grid ──────────────────────────────────── */
  function renderSectionsGrid() {
    const grid = dom.categoriesGrid;
    if (!grid) return;
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
      const nav = () => window.location.href = `category.html?cat=${encodeURIComponent(card.dataset.cat)}`;
      card.addEventListener('click', nav);
      card.addEventListener('keydown', e => e.key === 'Enter' && nav());
    });
  }

  /* ─── Filter Bar (replaces Quick Categories strip) ───── */
  function renderFilterBar() {
    const container = document.getElementById('quickCategories');
    if (!container) return;
    const FILTERS = [
      { key: 'all',     label: 'جميع المقالات', icon: 'fa-th' },
      { key: 'أخبار',   label: 'أخبار', icon: 'fa-newspaper' },
      { key: 'الشعوب',  label: 'الشعوب', icon: 'fa-globe-africa' },
      { key: 'الثقافة', label: 'الثقافة', icon: 'fa-palette' },
      { key: 'الحقوق',  label: 'الحقوق', icon: 'fa-gavel' },
      { key: 'الأطلس',  label: 'الأطلس', icon: 'fa-map-marked-alt' },
    ];
    container.innerHTML = FILTERS.map((f, i) =>
      `<span class="cat-chip${i === 0 ? ' active' : ''}" data-section="${f.key}">
        <i class="fas ${f.icon}"></i> ${f.label}
      </span>`
    ).join('');
    container.querySelectorAll('.cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeSection   = chip.dataset.section;
        displayedCount  = PAGE_SIZE;
        renderLatestPosts();
        updateLoadMore();
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
  function renderLatestPosts() {
    const grid = dom.postsGrid;
    if (!grid) return;
    const filtered = filterBySection(allPosts, activeSection);
    const posts    = filtered.slice(0, displayedCount);

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
          <h3 class="post-title">${excerpt(post.title, 90)}</h3>
          <p class="post-excerpt">${excerpt(stripHtml(post.content_preview || post.content || ''), 120)}</p>
          <div class="post-meta">
            <span><i class="far fa-calendar-alt"></i> ${formatDate(post.published)}</span>
            <span><i class="far fa-clock"></i> ${readingTime(post.content)}</span>
          </div>
        </div>
      </div>`).join('');

    grid.querySelectorAll('.post-card').forEach(card => {
      const nav = () => window.location.href = `article.html?id=${card.dataset.id}`;
      card.addEventListener('click', nav);
      card.addEventListener('keydown', e => e.key === 'Enter' && nav());
    });
  }

  /* ─── Load More ──────────────────────────────────────── */
  function updateLoadMore() {
    const btn      = document.getElementById('loadMoreBtn');
    if (!btn) return;
    const filtered = filterBySection(allPosts, activeSection);
    const hasMore  = displayedCount < filtered.length;
    btn.disabled   = !hasMore;
    btn.innerHTML  = hasMore
      ? '<i class="fas fa-plus-circle"></i> تحميل المزيد'
      : '<i class="fas fa-check-circle"></i> جميع المقالات محملة';
  }
  function setupLoadMore() {
    const btn = document.getElementById('loadMoreBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      displayedCount += PAGE_SIZE;
      renderLatestPosts();
      updateLoadMore();
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
        item.addEventListener('click', () => window.location.href = `article.html?id=${item.dataset.id}`);
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
    const btn     = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.mobile-nav-overlay');
    const closeBtn= document.querySelector('.mobile-nav-close');
    if (!btn || !overlay) return;
    btn.addEventListener('click', () => overlay.classList.add('open'));
    if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', () => overlay.classList.remove('open')));
  }

  /* ─── Newsletter ─────────────────────────────────────── */
  function setupNewsletters() {
    ['newsletterForm', 'newsletterFormBanner'].forEach(id => {
      const form = document.getElementById(id);
      if (!form) return;
      form.addEventListener('submit', e => {
        e.preventDefault();
        const btn  = form.querySelector('button');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> شكراً!';
        btn.style.background = '#2c5a3e';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; form.reset(); }, 2500);
      });
    });
  }

  /* ─── AOS ────────────────────────────────────────────── */
  function initAOS() {
    if (typeof AOS !== 'undefined') AOS.init({ duration: 700, once: true, offset: 60 });
  }

  /* ─── Main Entry ─────────────────────────────────────── */
  async function init() {
    if (isLoading) return;
    isLoading = true;

    dom = {
      featuredGrid:   document.getElementById('featuredGrid'),
      categoriesGrid: document.getElementById('categoriesGrid'),
      postsGrid:      document.getElementById('postsGrid'),
      searchOverlay:  document.getElementById('searchOverlay'),
      searchInput:    document.getElementById('searchInput'),
      searchResults:  document.getElementById('searchResults'),
    };

    showSkeletons(dom.postsGrid, 6);

    initScrollProgress();
    setupSearch();
    setupHeroButtons();
    setupMobileMenu();
    setupNewsletters();
    setupLoadMore();
    initAOS();

    try {
      await fetchPosts();
      renderHeroStats();
      renderTicker();
      renderFeaturedPosts();
      renderTrendingRow();
      renderSectionsGrid();
      renderFilterBar();
      renderFooterCategories();
      renderLatestPosts();
      updateLoadMore();
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

  /* ─── Public API ─────────────────────────────────────── */
  window.IndigenaApp = {
    fetchPosts, filterBySection, getSection, formatDate,
    excerpt, stripHtml, thumb, readingTime, SECTIONS,
  };

})();
