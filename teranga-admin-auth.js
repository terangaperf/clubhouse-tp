/**
 * TERANGA PERF - Module de connexion admin (Supabase Auth)
 * Ajoute un ecran de connexion (email + mot de passe Supabase) par-dessus
 * les panneaux admin. Tant que TerangaAuth.init(...) n'est pas appele dans
 * une page, ce fichier n'a aucun effet sur cette page.
 */

const TerangaAuth = (() => {
    let config = { supabaseUrl: '', anonKey: '' };
    const STORAGE_KEY = 'teranga_admin_session';

                       function saveSession(session) {
                             localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
                       }

                       function loadSession() {
                             try {
                                     const raw = localStorage.getItem(STORAGE_KEY);
                                     return raw ? JSON.parse(raw) : null;
                             } catch (e) {
                                     return null;
                             }
                       }

                       function clearSession() {
                             localStorage.removeItem(STORAGE_KEY);
                       }

                       function isLoggedIn() {
                             const s = loadSession();
                             if (!s || !s.access_token || !s.expires_at) return false;
                             return (s.expires_at * 1000) > Date.now();
                       }

                       function getAuthHeader() {
                             const s = loadSession();
                             if (s && isLoggedIn()) {
                                     return 'Bearer ' + s.access_token;
                             }
                             return 'Bearer ' + config.anonKey;
                       }

                       async function login(email, password) {
                             const res = await fetch(config.supabaseUrl + '/auth/v1/token?grant_type=password', {
                                     method: 'POST',
                                     headers: {
                                               'Content-Type': 'application/json',
                                               'apikey': config.anonKey
                                     },
                                     body: JSON.stringify({ email: email, password: password })
                             });

      if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error_description || err.msg || 'Connexion refusee. Verifie ton email et ton mot de passe.');
      }

      const data = await res.json();
                             saveSession({
                                     access_token: data.access_token,
                                     refresh_token: data.refresh_token,
                                     expires_at: data.expires_at,
                                     user_email: data.user && data.user.email
                             });
                             return data;
                       }

                       function logout() {
                             clearSession();
                             window.location.reload();
                       }

                       function renderLoginScreen(onSuccess) {
                             const overlay = document.createElement('div');
                             overlay.id = 'teranga-auth-overlay';
                             overlay.style.cssText = 'visibility: visible; position: fixed; inset: 0; background: #0b1220; z-index: 999999; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif;';
                             overlay.innerHTML = '<div style="background:#fff;border-radius:14px;padding:32px;width:340px;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,.3);">' +
                                     '<h2 style="margin:0 0 4px;font-size:20px;color:#111;">TERANGA PERF - Admin</h2>' +
                                     '<p style="margin:0 0 20px;font-size:13px;color:#666;">Connexion requise</p>' +
                                     '<input id="ta-email" type="email" placeholder="Email" style="width:100%;box-sizing:border-box;padding:10px;margin-bottom:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;" />' +
                                     '<input id="ta-password" type="password" placeholder="Mot de passe" style="width:100%;box-sizing:border-box;padding:10px;margin-bottom:14px;border:1px solid #ddd;border-radius:8px;font-size:14px;" />' +
                                     '<button id="ta-submit" style="width:100%;padding:11px;background:#111;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Se connecter</button>' +
                                     '<p id="ta-error" style="color:#d33;font-size:12px;margin:10px 0 0;min-height:14px;"></p>' +
                                     '</div>';
                             document.body.appendChild(overlay);

      const submit = async () => {
              const email = document.getElementById('ta-email').value.trim();
              const password = document.getElementById('ta-password').value;
              const errorEl = document.getElementById('ta-error');
              errorEl.textContent = '';
              try {
                        await login(email, password);
                        overlay.remove();
                        onSuccess();
              } catch (e) {
                        errorEl.textContent = e.message;
              }
      };

      document.getElementById('ta-submit').addEventListener('click', submit);
                             document.getElementById('ta-password').addEventListener('keydown', (e) => {
                                     if (e.key === 'Enter') submit();
                             });
                       }

                       function init(opts) {
                             config = Object.assign({}, config, opts);
                             if (!isLoggedIn()) {
                                     document.documentElement.style.visibility = 'hidden';
                                     renderLoginScreen(() => {
                                               document.documentElement.style.visibility = 'visible';
                                     });
                             }
                       }

                       return { init: init, login: login, logout: logout, isLoggedIn: isLoggedIn, getAuthHeader: getAuthHeader };
})();
