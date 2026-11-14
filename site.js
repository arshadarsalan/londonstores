(() => {
  const $ = (s) => document.querySelector(s);
  const productGrid = $('#productGrid');
  const hero = $('#hero');
  const dots = $('#heroDots');
  let banners = [];
  let activeCategory = 'all';
  $('#year').textContent = new Date().getFullYear();
  $('#menuToggle').addEventListener('click', () => $('#mainNav').classList.toggle('open'));
  document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', () => $('#mainNav').classList.remove('open')));
  $('#categoryTabs').addEventListener('click', e => {
    const btn = e.target.closest('[data-category]'); if (!btn) return;
    activeCategory = btn.dataset.category;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === btn));
    loadProducts();
  });
  function showBanner(index) {
    if (!banners.length) return;
    currentBannerIndex = index;
    const b = banners[index];
    const heroPhoto = document.querySelector(".hero-photo-main");
    if (heroPhoto) heroPhoto.style.backgroundImage = `url("${b.image_url}")`;
    const title = b.title || 'Style for every generation.';
    const subtitle = b.subtitle || 'Discover thoughtfully curated fashion for every celebration and everyday moment.';
    hero.querySelector('h1').innerHTML = `${escapeHtml(title).replace(/\n/g,'<br>')}`;
    hero.querySelector('.hero-copy>p:not(.eyebrow)').textContent = subtitle;
    dots.querySelectorAll('button').forEach((d,i) => d.classList.toggle('active', i === index));
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  async function loadBanners() {
    if (!window.londonSupabase) return;
    const {data,error} = await londonSupabase.from('site_images').select('id,title,subtitle,image_url').eq('kind','banner').eq('published',true).order('created_at',{ascending:false});
    if (error || !data?.length) return;
    banners = data; dots.innerHTML = '';
    data.forEach((_,i) => { const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label',`Show banner ${i+1}`); b.addEventListener('click',()=>showBanner(i)); dots.appendChild(b); });
    showBanner(0);
    if (data.length > 1) setInterval(() => showBanner((currentBannerIndex + 1) % banners.length), 6500);
  }
  let currentBannerIndex = 0;
  function renderProducts(items) {
    productGrid.innerHTML = '';
    if (!items.length) { productGrid.innerHTML = '<p class="empty-state">New collection images will be added soon. Please visit us in store.</p>'; return; }
    items.forEach(item => {
      const card = document.createElement('article'); card.className='product-card';
      const img=document.createElement('img'); img.src=item.image_url; img.alt=item.title; img.loading='lazy';
      const h=document.createElement('h3'); h.textContent=item.title;
      const p=document.createElement('p'); p.textContent=item.category;
      card.append(img,h,p); productGrid.append(card);
    });
  }
  async function loadProducts() {
    if (!window.londonSupabase) { productGrid.innerHTML='<p class="empty-state">Website gallery is being set up. Please check back soon.</p>'; return; }
    let query=londonSupabase.from('site_images').select('id,title,category,image_url').eq('kind','product').eq('published',true).order('created_at',{ascending:false});
    if (activeCategory !== 'all') query=query.eq('category',activeCategory);
    const {data,error}=await query;
    if (error) { productGrid.innerHTML='<p class="empty-state">We could not load the collection just now.</p>'; return; }
    renderProducts(data || []);
  }
  if (window.londonSupabase) { loadBanners(); loadProducts(); }
})();
