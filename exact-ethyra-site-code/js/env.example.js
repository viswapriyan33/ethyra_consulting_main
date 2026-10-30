/**
 * Ethyra Consulting Services - Environment Configuration Template
 * 
 * Instructions:
 * 1. To override default endpoints locally, copy this file to 'env.js':
 *    cp env.example.js env.js
 * 2. Update with your project-specific URL and public anon key.
 * 3. 'env.js' is already registered in .gitignore, so it will NEVER be committed to GitHub.
 * 
 * IMPORTANT SECURITY NOTE:
 * - NEVER put your Supabase `service_role` key here or anywhere in client-side code!
 * - Only the public `anon` key should ever be provided to web browsers.
 */

window.ETHYRA_CONFIG = {
  SUPABASE_URL: "https://your-project-id.supabase.co",
  SUPABASE_ANON_KEY: "your-public-anon-key-here"
};
