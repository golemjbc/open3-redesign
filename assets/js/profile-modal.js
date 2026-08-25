// Vlastní profil člena (2026-08-25, plán sekce 7c "Vlastní profil uživatele", nápad
// 2026-08-23) - otevírá se z mini menu po kliknutí na avatar (viz auth.js). Používá
// stejné modální okno jako admin detail člena (member-modal.js) - stejné CSS třídy,
// jiný obsah a jiný, neadminovský zdroj dat (my-profile vrací vždycky jen data
// volajícího, žádná role není potřeba). Vyžaduje, aby stránka měla načtený
// assets/js/auth.js (getLoggedUser, API_BASE) - stejný předpoklad jako member-modal.js.

function profileModalEnsureDom() {
  if (document.getElementById('profile-modal-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'profile-modal-overlay';
  overlay.className = 'member-modal-overlay hidden';
  overlay.innerHTML = `
    <div class="member-modal">
      <button type="button" class="member-modal-close" aria-label="Zavřít">&times;</button>
      <div class="member-modal-body" id="profile-modal-body"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeProfileModal(); });
  overlay.querySelector('.member-modal-close').addEventListener('click', closeProfileModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeProfileModal(); });
}

function closeProfileModal() {
  const overlay = document.getElementById('profile-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function profileIdentityPayload() {
  const user = getLoggedUser();
  if (!user) return null;
  const isGoogleUser = !!(user.provider === 'google' || /^google_/.test(user.userId || ''));
  return isGoogleUser ? { credential: user.credential } : { discord_user_id: user.userId };
}

function openProfileModal() {
  profileModalEnsureDom();
  const overlay = document.getElementById('profile-modal-overlay');
  const body = document.getElementById('profile-modal-body');
  overlay.classList.remove('hidden');
  body.innerHTML = '<p class="member-modal-loading">Načítám…</p>';

  const payload = profileIdentityPayload();
  if (!payload) { body.innerHTML = '<p class="member-modal-error">Nejsi přihlášen/a.</p>'; return; }

  fetch(API_BASE + '/api/my-profile', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) { body.innerHTML = `<p class="member-modal-error">${data.error || 'Chyba při načítání profilu.'}</p>`; return; }
      const akceHtml = data.akce.length
        ? `<ul class="member-history-list">${data.akce.map(a => `<li>${a.nazev}${a.datum ? ' — ' + a.datum : ''}</li>`).join('')}</ul>`
        : '<p class="member-modal-empty">Zatím žádné přihlášky.</p>';
      body.innerHTML = `
        <div class="member-modal-header">
          <div>
            <h3>${data.jmeno}</h3>
            <p class="member-modal-contact">${data.emails.join(' · ') || '—'}</p>
          </div>
        </div>
        ${data.pairing_code ? `<p class="member-modal-contact">Párovací kód pro Discord: <strong>${data.pairing_code}</strong></p>` : ''}
        ${data.telefon ? `<p class="member-modal-contact">Telefon: ${data.telefon}</p>` : ''}
        ${data.instagram ? `<p class="member-modal-contact">Instagram: ${data.instagram}</p>` : ''}
        ${data.souhlas_datum ? `<p class="member-modal-contact">Souhlas s pravidly/GDPR: ${data.souhlas_datum}</p>` : ''}
        <h4>Tvoje akce</h4>
        ${akceHtml}
      `;
    })
    .catch(err => { body.innerHTML = `<p class="member-modal-error">Chyba: ${err.message}</p>`; });
}

window.openProfileModal = openProfileModal;
