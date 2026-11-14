(() => {
  const $ = (s) => document.querySelector(s);
  const productGrid = $('#productGrid');
  const dots = $('#heroDots');
  const heroTitle = $('#heroTitle');
  const heroPhoto = $('#heroPhoto');
  const heroButton = $('#heroButton');
  let banners = [];
  let currentBannerIndex = 0;
  let slideTimer = null;
  let activeCategory = 'all';

  $('#year').textContent = new Date().getFullYear();
  $('#menuToggle').addEventListener('click', () => {
    const nav = $('#mainNav');
    const isOpen = nav.classList.toggle('open');
    $('#menuToggle').setAttribute('aria-expanded', String(isOpen));
  });
  document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', () => $('#mainNav').classList.remove('open')));
  $('#categoryTabs').addEventListener('click', e => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;
    activeCategory = btn.dataset.category;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === btn));
    loadProducts();
  });

  function showBanner(index) {
    if (!banners.length) return;
    currentBannerIndex = (index + banners.length) % banners.length;
    const banner = banners[currentBannerIndex];
    heroTitle.textContent = banner.title || 'Styles for little stars.';
    heroPhoto.style.backgroundImage = `url("${banner.image_url}")`;
    heroPhoto.setAttribute('aria-label', banner.title || 'London Stores kids fashion collection');
    dots.querySelectorAll('button').forEach((dot, i) => dot.classList.toggle('active', i === currentBannerIndex));
  }

  function startAutoplay() {
    clearInterval(slideTimer);
    if (banners.length > 1) slideTimer = setInterval(() => showBanner(currentBannerIndex + 1), 5500);
  }

  async function loadBanners() {
    if (!window.londonSupabase) return;
    const { data, error } = await londonSupabase
      .from('site_images')
      .select('id,title,image_url')
      .eq('kind', 'banner')
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (error || !data?.length) return;

    banners = data;
    dots.innerHTML = '';
    banners.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Show slide ${i + 1}`);
      dot.addEventListener('click', () => { showBanner(i); startAutoplay(); });
      dots.appendChild(dot);
    });
    showBanner(0);
    startAutoplay();
  }

  $('#slidePrev').addEventListener('click', () => { showBanner(currentBannerIndex - 1); startAutoplay(); });
  $('#slideNext').addEventListener('click', () => { showBanner(currentBannerIndex + 1); startAutoplay(); });
  $('#hero').addEventListener('mouseenter', () => clearInterval(slideTimer));
  $('#hero').addEventListener('mouseleave', startAutoplay);

  function renderProducts(items) {
    productGrid.innerHTML = '';
    if (!items.length) {
      productGrid.innerHTML = '<p class="empty-state">New collection images will be added soon. Please visit us in store.</p>';
      return;
    }
    items.forEach(item => {
      const card = document.createElement('article'); card.className = 'product-card';
      const img = document.createElement('img'); img.src = item.image_url; img.alt = item.title; img.loading = 'lazy';
      const h = document.createElement('h3'); h.textContent = item.title;
      const p = document.createElement('p'); p.textContent = item.category;
      card.append(img, h, p); productGrid.append(card);
    });
  }

  async function loadProducts() {
    if (!window.londonSupabase) {
      productGrid.innerHTML = '<p class="empty-state">Website gallery is being set up. Please check back soon.</p>';
      return;
    }
    let query = londonSupabase.from('site_images').select('id,title,category,image_url').eq('kind', 'product').eq('published', true).order('created_at', { ascending: false });
    if (activeCategory !== 'all') query = query.eq('category', activeCategory);
    const { data, error } = await query;
    if (error) { productGrid.innerHTML = '<p class="empty-state">We could not load the collection just now.</p>'; return; }
    renderProducts(data || []);
  }

  if (window.londonSupabase) { loadBanners(); loadProducts(); }
})();
