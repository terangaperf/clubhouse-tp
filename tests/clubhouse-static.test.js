// Tests statiques sans dépendances, sans accès réseau ni modification des données.
// Exécution : node --test tests/clubhouse-static.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'gestion-tp-2026.html'), 'utf8');

test('authentification administrative initialisée', () => {
  assert.match(source, /TerangaAuth\.init\(/);
  assert.match(source, /teranga-admin-auth\.js/);
});

test('chargement des ventes, clubs et stocks', () => {
  for (const table of ['ventes', 'clubs', 'stock', 'stock_secteur']) {
    assert.match(source, new RegExp("supaFetch\\('" + table + "\\?"));
  }
});

test('une erreur 401/403 affiche une alerte de reconnexion', () => {
  assert.match(source, /s!==401&&s!==403/);
  assert.match(source, /Session expirée/);
});

test('les appels Supabase possèdent un timeout', () => {
  assert.match(source, /AbortController\(/);
  assert.match(source, /controller\.abort\(\),15000/);
});

test('les opérations ne doivent pas utiliser la clé publique après expiration', () => {
  // Test de garde : actuellement non conforme, à corriger sur la branche avant déploiement.
  const fallback = /TerangaAuth\.getAuthHeader\(\):'Bearer '\+SUPA_KEY/;
  assert.doesNotMatch(source, fallback, 'Requête potentiellement anonyme malgré une session admin expirée');
});
