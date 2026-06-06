/* ================================================================
   INDIGENA — site.js
   Main script for index.html
   Clean module pattern, single data fetch, debounced search,
   skeleton loading, scroll progress, back-to-top.
   ================================================================ */

(function () {
  'use strict';

  /* ─── State ───────────────────────────────────────────── */
  let allPosts  = [];
  let isLoading = false;

  /* ─── DOM references (resolved once on DOMContentLoaded) ─ */
  let dom = {};

  /* ─── Utilities ───────────────────────────────────────── */

  /** Debounce: delays fn execution until after `wait` ms of silence */
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /** Format a date string to Arabic locale */
  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (_) { return dateStr; }
  }

  /** Safe substring with ellipsis */
  function excerpt(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  }

  /** Strip HTML tags to get plain text */
  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /** Calculate estimated reading time (Arabic avg ~150 wpm) */
  function readingTime(content) {
    const words = stripHtml(content || '').trim().split(/\s+/).length;
    const mins  = Math.max(1, Math.ceil(words / 150));
    return `${mins} دقيقة قراءة`;
  }

  /** Build a placeholder thumbnail URL */
  function thumb(url) {
    return url && url.trim() !== ''
      ? url
      : 'https://placehold.co/600x400/2c1f12/e8a830?text=Indigena';
  }

  /* ─── Skeleton Templates ──────────────────────────────── */

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

  /* ─── Data Fetching (single fetch, cached) ────────────── */

  async function fetchPosts() {
    if (allPosts.length) return allPosts;          // already loaded
    const res  = await fetch('posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allPosts   = (data.posts || []).sort(
      (a, b) => new Date(b.published) - new Date(a.published)
    );
    return allPosts;
  }

  /* ─── Render: Scroll Progress ─────────────────────────── */

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

  /* ─── Render: Hero Stats ──────────────────────────────── */

  function renderHeroStats() {
    const el = document.getElementById('heroPostCount');
    if (el) el.textContent = allPosts.length + '+';

    const catEl = document.getElementById('heroCatCount');
    if (catEl) {
      const cats = new Set(allPosts.flatMap(p => p.categories || []));
      catEl.textContent = cats.size;
    }
  }

  /* ─── Render: Featured Posts ──────────────────────────── */

  function renderFeaturedPosts() {
    const grid = dom.featuredGrid;
    if (!grid || allPosts.length < 3) return;

    const [large, ...sides] = allPosts.slice(0, 3);

    const largeHtml = `
      <div class="featured-card-large" data-id="${large.id}" tabindex="0" role="button" aria-label="${large.title}">
        <div class="post-img" style="background-image:url('${thumb(large.thumbnail)}')">
          <span class="post-category">${large.categories?.[0] ?? 'عام'}</span>
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
              <span class="post-category" style="position:static;margin-bottom:0.5rem;display:inline-block">${post.categories?.[0] ?? 'عام'}</span>
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

  /* ─── Render: Categories Grid ─────────────────────────── */

  function renderCategoriesGrid() {
    const grid = dom.categoriesGrid;
    if (!grid) return;

    const config = [
      { cat: 'تراث وفنون',              icon: 'fa-palette'    },
      { cat: 'أخبار',                   icon: 'fa-newspaper'  },
      { cat: 'حراس الغابات',            icon: 'fa-tree'       },
      { cat: 'ذاكرة الشعوب الأصلية',   icon: 'fa-history'    },
      { cat: 'شعوب وقبائل',            icon: 'fa-users'      },
      { cat: 'قضايا وحقوق',            icon: 'fa-gavel'      },
    ];

    // Count posts per category from actual data
    const counts = {};
    allPosts.forEach(p => (p.categories || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; }));

    grid.innerHTML = config.map(({ cat, icon }) => `
      <div class="category-card" data-cat="${cat}" tabindex="0" role="button">
        <i class="fas ${icon}"></i>
        <h3>${cat}</h3>
        <p>${counts[cat] ?? 0} مقال</p>
      </div>`).join('');

    grid.querySelectorAll('.category-card').forEach(card => {
      const nav = () => { window.location.href = `category.html?cat=${encodeURIComponent(card.dataset.cat)}`; };
      card.addEventListener('click', nav);
      card.addEventListener('keydown', e => e.key === 'Enter' && nav());
    });
  }

  /* ─── Render: Quick Categories Strip ─────────────────── */

  function renderQuickCategories() {
    const container = dom.quickCategories;
    if (!container) return;

    const cats = [...new Set(allPosts.flatMap(p => p.categories || []))].slice(0, 14);

    container.innerHTML =
      `<span class="cat-chip active" data-cat="all">الكل</span>` +
      cats.map(c => `<span class="cat-chip" data-cat="${c}">${c}</span>`).join('');

    container.querySelectorAll('.cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (chip.dataset.cat === 'all') {
          renderLatestPosts();
        } else {
          window.location.href = `category.html?cat=${encodeURIComponent(chip.dataset.cat)}`;
        }
      });
    });
  }

  /* ─── Render: Footer Categories ──────────────────────── */

  function renderFooterCategories() {
    const list = document.querySelector('#footerCategories ul');
    if (!list) return;
    const cats = [...new Set(allPosts.flatMap(p => p.categories || []))].slice(0, 8);
    list.innerHTML = cats.map(c =>
      `<li><a href="category.html?cat=${encodeURIComponent(c)}">${c}</a></li>`
    ).join('');
  }

  /* ─── Render: Latest Posts (main grid, latest 6) ──────── */

  function renderLatestPosts(posts = allPosts.slice(0, 6)) {
    const grid = dom.postsGrid;
    if (!grid) return;

    if (!posts.length) {
      grid.innerHTML = '<p style="text-align:center;color:var(--clr-text-muted)">لا توجد مقالات</p>';
      return;
    }

    grid.innerHTML = posts.map(post => `
      <div class="post-card" data-id="${post.id}" tabindex="0" role="button" aria-label="${post.title}">
        <div class="post-img">
          <div class="post-img-inner" style="background-image:url('${thumb(post.thumbnail)}')"></div>
          <span class="post-category">${post.categories?.[0] ?? 'عام'}</span>
        </div>
        <div class="post-content">
          <h3 class="post-title">${excerpt(post.title, 85)}</h3>
          <p class="post-excerpt">${excerpt(stripHtml(post.content_preview || post.content || ''), 110)}</p>
          <div class="post-meta">
            <span><i class="far fa-calendar-alt"></i> ${formatDate(post.published)}</span>
            <span><i class="far fa-images"></i> ${post.image_count || 0} صورة</span>
          </div>
        </div>
      </div>`).join('');

    grid.querySelectorAll('.post-card').forEach(card => {
      const nav = () => { window.location.href = `article.html?id=${card.dataset.id}`; };
      card.addEventListener('click', nav);
      card.addEventListener('keydown', e => e.key === 'Enter' && nav());
    });
  }

  /* ─── Search ──────────────────────────────────────────── */

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
        p.title.toLowerCase().includes(q) ||
        (p.categories || []).some(c => c.toLowerCase().includes(q))
      );
      if (!filtered.length) {
        results.innerHTML = '<p style="color:rgba(240,224,200,0.5);text-align:center;padding:2rem">لا توجد نتائج</p>';
        return;
      }
      results.innerHTML = filtered.slice(0, 8).map(p => `
        <div class="search-result-item" data-id="${p.id}">
          <strong>${excerpt(p.title, 65)}</strong>
          <span>${p.categories?.[0] ?? 'عام'} · ${formatDate(p.published)}</span>
        </div>`).join('');
      results.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => { window.location.href = `article.html?id=${item.dataset.id}`; });
      });
    }, 280);

    input.addEventListener('input', e => doSearch(e.target.value.trim().toLowerCase()));
  }

  /* ─── Hero Buttons ────────────────────────────────────── */

  function setupHeroButtons() {
    const exploreBtn = document.getElementById('exploreBtn');
    const latestBtn  = document.getElementById('latestBtn');
    if (exploreBtn) exploreBtn.addEventListener('click', () =>
      window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' }));
    if (latestBtn)  latestBtn.addEventListener('click', () =>
      document.getElementById('mainPosts')?.scrollIntoView({ behavior: 'smooth' }));
  }

  /* ─── Mobile Menu ─────────────────────────────────────── */

  function setupMobileMenu() {
    const btn     = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.mobile-nav-overlay');
    const closeBtn = document.querySelector('.mobile-nav-close');
    if (!btn || !overlay) return;
    btn.addEventListener('click', () => overlay.classList.add('open'));
    if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', () => overlay.classList.remove('open')));
  }

  /* ─── Newsletter ──────────────────────────────────────── */

  function setupNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      btn.style.background = '#2c5a3e';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '';
        form.reset();
      }, 2500);
    });
  }

  /* ─── AOS (Animate on Scroll) ─────────────────────────── */

  function initAOS() {
    if (typeof AOS !== 'undefined') AOS.init({ duration: 700, once: true, offset: 60 });
  }

  /* ─── Main Entry Point ────────────────────────────────── */

  async function init() {
    if (isLoading) return;
    isLoading = true;

    // Cache DOM refs
    dom = {
      featuredGrid:    document.getElementById('featuredGrid'),
      categoriesGrid:  document.getElementById('categoriesGrid'),
      quickCategories: document.getElementById('quickCategories'),
      postsGrid:       document.getElementById('postsGrid'),
      searchOverlay:   document.getElementById('searchOverlay'),
      searchInput:     document.getElementById('searchInput'),
      searchResults:   document.getElementById('searchResults'),
    };

    // Show skeletons while loading
    showSkeletons(dom.postsGrid, 6);

    // Setup non-data-dependent features immediately
    initScrollProgress();
    setupSearch();
    setupHeroButtons();
    setupMobileMenu();
    setupNewsletter();
    initAOS();

    try {
      await fetchPosts();

      renderHeroStats();
      renderFeaturedPosts();
      renderCategoriesGrid();
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

})();
