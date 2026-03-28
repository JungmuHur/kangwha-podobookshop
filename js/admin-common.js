/* ============================================
   강화포도책방 — 공통 관리자 유틸리티
   ============================================ */
window.AC = (function () {
  const REPO_OWNER = 'podobooks-ganghwa';
  const REPO_NAME  = 'ganghwa';
  const ADMIN_PW   = '0402';

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function getToken() { return sessionStorage.getItem('_jt') || ''; }
  function setToken(t) { if (t) sessionStorage.setItem('_jt', t.trim()); }
  function checkPw(pw) { return pw === ADMIN_PW; }

  async function fetchJSON(path) {
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${path}?t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  }

  async function saveJSON(path, data, msg) {
    const token = getToken();
    if (!token) throw new Error('NO_TOKEN');
    const infoRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' } }
    );
    if (!infoRes.ok) throw new Error('파일 조회 실패');
    const { sha } = await infoRes.json();
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const putRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: msg, content, sha })
      }
    );
    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(putRes.status === 401 ? 'NO_TOKEN' : (err.message || '저장 실패'));
    }
  }

  function promptToken() {
    const t = prompt(
      '🔑 GitHub Token 입력\n\n' +
      '처음이라면:\n' +
      '1. github.com/settings/tokens/new 접속\n' +
      '2. repo 권한 체크 → Generate\n' +
      '3. 복사 후 여기 붙여넣기'
    );
    if (t) setToken(t);
    return t ? t.trim() : '';
  }

  /* ── 공통 모달 HTML 삽입 ── */
  function injectModals(opts) {
    const html = `
    <div class="modal-overlay" id="pwOverlay">
      <div class="pw-modal">
        <div class="pw-modal__icon">🔐</div>
        <h2 class="pw-modal__title">관리자 로그인</h2>
        <p class="pw-modal__sub">비밀번호를 입력하세요</p>
        <input type="password" class="pw-modal__input" id="acPwInput" placeholder="비밀번호" />
        <p class="pw-modal__error" id="acPwError" style="display:none">비밀번호가 맞지 않아요</p>
        <button class="pw-modal__btn" id="acPwBtn">확인</button>
      </div>
    </div>
    <button class="admin-fab" id="acFab" title="관리자">✏️</button>`;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('acFab').addEventListener('click', () => {
      document.getElementById('pwOverlay').classList.add('open');
      setTimeout(() => document.getElementById('acPwInput').focus(), 100);
    });
    document.getElementById('pwOverlay').addEventListener('click', e => {
      if (e.target.id === 'pwOverlay') closePwModal();
    });
    document.getElementById('acPwBtn').addEventListener('click', () => tryLogin(opts));
    document.getElementById('acPwInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') tryLogin(opts);
    });
  }

  function closePwModal() {
    document.getElementById('pwOverlay').classList.remove('open');
    document.getElementById('acPwInput').value = '';
    document.getElementById('acPwError').style.display = 'none';
  }

  function tryLogin(opts) {
    const pw = document.getElementById('acPwInput').value;
    if (checkPw(pw)) {
      closePwModal();
      if (!getToken()) promptToken();
      if (opts && opts.onSuccess) opts.onSuccess();
    } else {
      document.getElementById('acPwError').style.display = 'block';
      document.getElementById('acPwInput').value = '';
    }
  }

  function setStatus(elId, type, msg) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.className = 'save-status ' + type;
    el.textContent = msg;
    el.style.display = 'block';
  }

  function fmtDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  }

  return { esc, getToken, setToken, checkPw, fetchJSON, saveJSON, promptToken, injectModals, setStatus, fmtDate };
})();
