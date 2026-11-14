# London Stores Website

A responsive kids-fashion storefront and Supabase-powered image management dashboard.

## Visual direction

Vibrant but subtle kids palette: warm cream, soft coral, mint, butter yellow, lilac and sky blue. The visual style is playful and premium rather than neon or overly cartoonish.

## Files

- `index.html` — public storefront
- `admin.html` — private admin dashboard
- `css/styles.css` — responsive public and admin styling
- `js/config.js` — Supabase project URL and anon/public key placeholders
- `js/supabase-client.js` — Supabase client initialisation
- `js/site.js` — public product gallery and banner slideshow
- `js/admin.js` — login, uploads and publish/unpublish controls
- `supabase-setup.sql` — database, storage and row-level security setup

## Preview before publishing

1. Extract the ZIP file.
2. Open the folder in Visual Studio Code.
3. Install the Live Server extension.
4. Right-click `index.html` and choose **Open with Live Server**.
5. To preview the dashboard layout, open `admin.html` in the same way.

The public page and admin layout can be previewed before Supabase is configured. Actual login, upload, and publish/unpublish operations require Supabase setup.

## Supabase setup

1. Create a Supabase project.
2. Run the full contents of `supabase-setup.sql` in SQL Editor.
3. Add your project URL and anon/public key in `js/config.js`.
4. Create an administrator in Supabase Authentication > Users.
5. Add that user's UUID to `public.admin_users` using the SQL instructions in `supabase-setup.sql`.
6. Configure the Supabase Auth Site URL and Redirect URLs for your GitHub Pages address.

Never put the Supabase `service_role` key in frontend code. Keep it private.

## GitHub Pages

Upload the contents of this folder (not the containing folder itself) to the root of a GitHub repository. Enable Settings > Pages > Deploy from a branch > `main` > `/(root)`.

## Before launch

- Replace the sample hero/story photography with London Stores product photography.
- Confirm store contact numbers, Instagram URL and final store address details.
- Test admin login, image uploads, publish/unpublish, mobile layout and public gallery after configuring Supabase.
