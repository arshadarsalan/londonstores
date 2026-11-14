(() => {
  const url = window.LONDON_SUPABASE_URL;
  const key = window.LONDON_SUPABASE_ANON_KEY;
  const configured = url && key && !url.includes('YOUR_') && !key.includes('YOUR_');
  window.londonSupabaseConfigured = Boolean(configured && window.supabase);
  window.londonSupabase = window.londonSupabaseConfigured
    ? window.supabase.createClient(url, key)
    : null;
})();
