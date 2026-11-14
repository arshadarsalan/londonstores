(() => {
  const $ = s => document.querySelector(s);
  const setup = $('#setupNotice'), loginPanel = $('#loginPanel'), dashboard = $('#dashboard');
  const MAX_FILE = 5 * 1024 * 1024;
  const BUCKET = 'london-store-images';
  if (!window.londonSupabase) {
    setup.classList.remove('hidden');
    setup.textContent = 'Setup required: add your Supabase Project URL and anon public key in js/config.js, then complete the database and Storage setup in README.md.';
  }
  function message(id,text,isError=true) { const el=$(id); el.textContent=text; el.style.color=isError?'#9a4938':'#34724a'; }
  function showSignedIn(user) { loginPanel.classList.toggle('hidden',!!user); dashboard.classList.toggle('hidden',!user); if(user) refreshLists(); }
  async function checkSession() {
    if (!window.londonSupabase) return;
    const {data}=await londonSupabase.auth.getSession(); showSignedIn(data.session?.user || null);
    londonSupabase.auth.onAuthStateChange((_event,session)=>showSignedIn(session?.user || null));
  }
  $('#loginForm').addEventListener('submit',async e=>{
    e.preventDefault(); if(!window.londonSupabase) return;
    message('#loginMessage','Signing in…',false);
    const {error}=await londonSupabase.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});
    if(error) message('#loginMessage',error.message); else message('#loginMessage','Signed in successfully.',false);
  });
  $('#logoutButton').addEventListener('click',async()=>{await londonSupabase.auth.signOut();showSignedIn(null);});
  document.querySelectorAll('.admin-tab').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.admin-tab').forEach(b=>b.classList.toggle('active',b===btn));
    document.querySelectorAll('.admin-panel').forEach(p=>p.classList.toggle('hidden',p.id!==btn.dataset.panel));
  }));
  function validFile(file) {
    if(!file) throw new Error('Choose an image first.');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Please use a JPG, PNG or WebP image.');
    if(file.size>MAX_FILE) throw new Error('Image must be 5 MB or smaller.');
    return file;
  }
  async function upload(kind,file) {
    validFile(file);
    const user=(await londonSupabase.auth.getUser()).data.user;
    if(!user) throw new Error('Please sign in again.');
    const ext=file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
    const path=`${kind}/${user.id}/${crypto.randomUUID()}.${ext}`;
    const {error:uploadError}=await londonSupabase.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
    if(uploadError) throw uploadError;
    const {data:{publicUrl}}=londonSupabase.storage.from(BUCKET).getPublicUrl(path);
    return {path,image_url:publicUrl};
  }
  async function saveImage(payload,file,kind) {
    const stored=await upload(kind,file);
    const {error}=await londonSupabase.from('site_images').insert({...payload,...stored,kind,published:false});
    if(error) { await londonSupabase.storage.from(BUCKET).remove([stored.path]); throw error; }
  }
  $('#productForm').addEventListener('submit',async e=>{
    e.preventDefault(); const btn=e.submitter; btn.disabled=true; message('#productMessage','Uploading…',false);
    try {
      const file=$('#productFile').files[0];
      await saveImage({title:$('#productName').value.trim(),category:$('#productCategory').value},file,'product');
      e.target.reset(); message('#productMessage','Image uploaded as unpublished. Publish it when ready.',false); await refreshLists();
    } catch(err) { message('#productMessage',err.message || 'Upload failed.'); } finally { btn.disabled=false; }
  });
  $('#bannerForm').addEventListener('submit',async e=>{
    e.preventDefault(); const btn=e.submitter; btn.disabled=true; message('#bannerMessage','Uploading…',false);
    try {
      await saveImage({title:$('#bannerTitle').value.trim(),subtitle:$('#bannerSubtitle').value.trim(),category:null},$('#bannerFile').files[0],'banner');
      e.target.reset(); message('#bannerMessage','Banner uploaded as unpublished. Publish it when ready.',false); await refreshLists();
    } catch(err) { message('#bannerMessage',err.message || 'Upload failed.'); } finally { btn.disabled=false; }
  });
  async function refreshLists() { await Promise.all([renderList('product','#productList'),renderList('banner','#bannerList')]); }
  async function renderList(kind,target) {
    const root=$(target); root.innerHTML='<p class="empty-state">Loading images…</p>';
    const {data,error}=await londonSupabase.from('site_images').select('*').eq('kind',kind).order('created_at',{ascending:false});
    if(error) {root.textContent=error.message;return;}
    root.innerHTML='';
    if(!data?.length){root.innerHTML='<p class="empty-state">No images uploaded yet.</p>';return;}
    data.forEach(item=>{
      const card=document.createElement('article');card.className='admin-image-card';
      const img=document.createElement('img');img.src=item.image_url;img.alt=item.title || 'Uploaded image';
      const info=document.createElement('div');info.className='admin-image-info';
      const title=document.createElement('h3');title.textContent=item.title || 'Untitled banner';
      const detail=document.createElement('p');detail.textContent=kind==='product'?item.category:'Homepage banner';
      const actions=document.createElement('div');actions.className='card-actions';
      const status=document.createElement('span');status.className='status'+(item.published?' live':'');status.textContent=item.published?'PUBLISHED':'UNPUBLISHED';
      const toggle=document.createElement('button');toggle.className='small-button';toggle.textContent=item.published?'Unpublish':'Publish';toggle.addEventListener('click',()=>setPublished(item.id,!item.published,toggle));
      actions.append(status,toggle);info.append(title,detail,actions);card.append(img,info);root.append(card);
    });
  }
  async function setPublished(id,published,button) {
    button.disabled=true;
    const {error}=await londonSupabase.from('site_images').update({published}).eq('id',id);
    if(error) alert(`Could not update image: ${error.message}`);
    await refreshLists();
  }
  checkSession();
})();
