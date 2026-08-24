// Znovupoužitelné okno s detailem člena (Část B, 2026-08-24) - otevírá se kliknutím na
// jméno jak v přehledu přihlášek (admin-akce.html), tak v přehledu členů/frontě
// dotazníků (admin-clenove.html). Vyžaduje, aby stránka už měla načtený assets/js/auth.js
// (kvůli getLoggedUser()) a definovaný API_BASE.

const CANONICAL_PATRONS = ['Káča & Adam', 'Viktorie & Oliver', 'Karin & Zbyšek', 'Káča'];

function memberModalIdentityPayload() {
  const user = getLoggedUser();
  if (!user) return null;
  const isGoogleUser = !!(user.provider === 'google' || /^google_/.test(user.userId || ''));
  return isGoogleUser ? { credential: user.credential } : { discord_user_id: user.userId };
}

// Stejná konverze na náhled jako u fotek akcí jinde na webu (akce.html/detail-akce.html) -
// funguje jen tomu, kdo je v prohlížeči přihlášený Google účtem se sdíleným přístupem ke
// složce fotek (stejné omezení, jaké platí dnes).
function memberModalImageUrl(url) {
  if (!url) return null;
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (driveMatch) return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w400`;
  if (url.includes('photos.app.goo.gl') || url.includes('photos.google.com')) {
    return 'https://images.weserv.nl/?url=' + encodeURIComponent(url);
  }
  return url;
}

function memberModalStatusIcon(status) {
  if (status === 'ok') return '✓';
  if (status === 'waiting') return '⏳';
  return '✗';
}

function memberModalEnsureDom() {
  if (document.getElementById('member-modal-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'member-modal-overlay';
  overlay.className = 'member-modal-overlay hidden';
  overlay.innerHTML = `
    <div class="member-modal">
      <button type="button" class="member-modal-close" aria-label="Zavřít">&times;</button>
      <div class="member-modal-body" id="member-modal-body"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMemberModal(); });
  overlay.querySelector('.member-modal-close').addEventListener('click', closeMemberModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMemberModal(); });
}

function closeMemberModal() {
  const overlay = document.getElementById('member-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function openMemberModal(oooId) {
  memberModalEnsureDom();
  const overlay = document.getElementById('member-modal-overlay');
  const body = document.getElementById('member-modal-body');
  overlay.classList.remove('hidden');
  body.innerHTML = '<p class="member-modal-loading">Načítám…</p>';

  const identity = memberModalIdentityPayload();
  if (!identity) {
    body.innerHTML = '<p class="member-modal-error">Nejsi přihlášený/á.</p>';
    return;
  }

  try {
    const res = await fetch(API_BASE + '/api/panel-member-detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...identity, ooo_id: oooId }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      body.innerHTML = `<p class="member-modal-error">${escapeHtml(data.error || 'Nepodařilo se načíst detail.')}</p>`;
      return;
    }
    renderMemberModal(body, data);
  } catch (err) {
    body.innerHTML = `<p class="member-modal-error">Chyba: ${escapeHtml(err.message)}</p>`;
  }
}

function renderMemberModal(body, data) {
  const photoUrl = data.questionnaire.exists && data.questionnaire.foto_url.length
    ? memberModalImageUrl(data.questionnaire.foto_url[0]) : null;

  const accessRows = ['A', 'B', 'C'].map(typ => {
    const a = data.access[typ];
    return `<div class="member-access-row member-access-${a.status}">
      <span class="member-access-icon">${memberModalStatusIcon(a.status)}</span>
      <span class="member-access-label">Typ ${typ}: ${escapeHtml(a.label)}</span>
    </div>`;
  }).join('');

  const historyRows = data.eventHistory.length
    ? data.eventHistory.map(h => `<li>${escapeHtml(h.nazev)} <span class="member-history-status">(záloha: ${escapeHtml(h.deposit_status || '—')}${h.doplatek_status ? ', doplatek: ' + escapeHtml(h.doplatek_status) : ''})</span></li>`).join('')
    : '<li class="member-modal-empty">Zatím bez historie akcí.</li>';

  let questionnaireHtml = '<p class="member-modal-empty">Dotazník zatím nevyplnil/a.</p>';
  if (data.questionnaire.exists) {
    const q = data.questionnaire;
    const field = (label, val) => val ? `<div class="member-q-field"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(val)}</div>` : '';
    questionnaireHtml = `
      <div class="member-q-fields">
        ${field('Přezdívka v dotazníku', q.jmeno_prezdivka)}
        ${field('Upřesnění', q.upresneni)}
        ${field('Lokalita', q.lokalita)}
        ${field('Sociálně-demografické', q.socialne_demograficke)}
        ${field('Aktuální situace', q.aktualni_situace)}
        ${field('Co může nabídnout', q.co_nabidnout)}
        ${field('Sny a přání', q.sny_prani)}
        ${q.zna_patrony.length ? field('Zná patrony', q.zna_patrony.join(', ')) : ''}
        ${field('Přiřazený patron', q.patron_kdo_historicky)}
        ${q.locked ? field('Schválil/a', q.schvalil_patron) : ''}
      </div>
    `;
    if (!q.locked) {
      questionnaireHtml += `
        <div class="member-patron-actions">
          <label>Přiřadit patrona:
            <select id="member-patron-select">
              <option value="">— vyber —</option>
              ${CANONICAL_PATRONS.map(p => `<option value="${escapeHtml(p)}" ${q.patron_kdo_historicky === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
            </select>
          </label>
          <div class="member-patron-buttons">
            <button type="button" class="btn btn-outline btn-sm" id="member-assign-patron-btn">Přiřadit</button>
            <button type="button" class="btn btn-primary btn-sm" id="member-approve-btn">Schválit</button>
          </div>
          <p class="member-modal-msg" id="member-patron-msg"></p>
        </div>
      `;
    }
  }

  body.innerHTML = `
    <div class="member-modal-header">
      ${photoUrl ? `<img src="${photoUrl}" alt="" class="member-modal-photo">` : '<div class="member-modal-photo member-modal-photo-empty"></div>'}
      <div>
        <h3>${escapeHtml(data.jmeno || data.ooo_id)}</h3>
        <p class="member-modal-contact">
          ${data.discord_username ? '@' + escapeHtml(data.discord_username) + ' · ' : ''}
          ${escapeHtml(data.email || '')}${data.telefon ? ' · ' + escapeHtml(data.telefon) : ''}
        </p>
      </div>
    </div>
    <div class="member-access-list">${accessRows}</div>
    <h4>Historie akcí</h4>
    <ul class="member-history-list">${historyRows}</ul>
    <h4>Dotazník</h4>
    ${questionnaireHtml}
  `;

  const assignBtn = document.getElementById('member-assign-patron-btn');
  const approveBtn = document.getElementById('member-approve-btn');
  const msgEl = document.getElementById('member-patron-msg');
  if (assignBtn) {
    assignBtn.addEventListener('click', async () => {
      const select = document.getElementById('member-patron-select');
      if (!select.value) { msgEl.textContent = 'Vyber prosím patrona.'; return; }
      msgEl.textContent = 'Ukládám…';
      const identity = memberModalIdentityPayload();
      try {
        const res = await fetch(API_BASE + '/api/panel-review-questionnaire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...identity, ooo_id: data.ooo_id, action: 'assign_patron', patron: select.value }),
        });
        const resData = await res.json();
        if (!res.ok || !resData.ok) { msgEl.textContent = resData.error || 'Nepodařilo se uložit.'; return; }
        msgEl.textContent = 'Patron přiřazen.';
        openMemberModal(data.ooo_id);
      } catch (err) { msgEl.textContent = 'Chyba: ' + err.message; }
    });
  }
  if (approveBtn) {
    approveBtn.addEventListener('click', async () => {
      if (!confirm(`Opravdu schválit dotazník uživatele ${data.jmeno || data.ooo_id}?`)) return;
      msgEl.textContent = 'Ukládám…';
      const identity = memberModalIdentityPayload();
      try {
        const res = await fetch(API_BASE + '/api/panel-review-questionnaire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...identity, ooo_id: data.ooo_id, action: 'approve' }),
        });
        const resData = await res.json();
        if (!res.ok || !resData.ok) { msgEl.textContent = resData.error || 'Nepodařilo se schválit.'; return; }
        msgEl.textContent = 'Schváleno.';
        openMemberModal(data.ooo_id);
      } catch (err) { msgEl.textContent = 'Chyba: ' + err.message; }
    });
  }
}
