(function(){
  // Temporary password for this V1 is: NYC2026
  // Change this SHA-256 hash before publishing if desired.
  const PASSWORD_HASH = 'cd0540e0d31b9dd348192a0c1022bbfc3f36a21490e1d7c71e0bbb1f112aa139';
  const AUTH_KEY = 'nyc2026_auth';

  async function sha256(text){
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function overlay(){
    const el = document.createElement('div');
    el.className = 'auth-overlay';
    el.innerHTML = `
      <div class="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div class="auth-badge">NYC</div>
        <p class="eyebrow">Private trip</p>
        <h1 id="auth-title">NYC 2026</h1>
        <p class="auth-sub">Toronto → New York City</p>
        <form id="auth-form">
          <label for="trip-password">Password</label>
          <input id="trip-password" type="password" autocomplete="current-password" placeholder="Enter password" required />
          <p id="auth-error" class="auth-error" aria-live="polite"></p>
          <button class="btn btn-primary btn-block" type="submit">Unlock trip</button>
        </form>
        <p class="auth-note">This device will stay unlocked until you choose “Forget this device”.</p>
      </div>`;
    document.body.appendChild(el);
    document.body.classList.add('locked');
    const form = el.querySelector('#auth-form');
    const input = el.querySelector('#trip-password');
    const error = el.querySelector('#auth-error');
    requestAnimationFrame(()=>input.focus());
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const hash = await sha256(input.value);
      if(hash === PASSWORD_HASH){
        localStorage.setItem(AUTH_KEY, 'true');
        document.body.classList.remove('locked');
        el.classList.add('auth-leaving');
        setTimeout(()=>el.remove(), 220);
      } else {
        error.textContent = 'Incorrect password. Try again.';
        el.querySelector('.auth-card').classList.remove('shake');
        void el.offsetWidth;
        el.querySelector('.auth-card').classList.add('shake');
        input.select();
      }
    });
  }

  window.TripAuth = {
    init(){ if(localStorage.getItem(AUTH_KEY) !== 'true') overlay(); },
    forget(){ localStorage.removeItem(AUTH_KEY); location.href='index.html'; },
    isUnlocked(){ return localStorage.getItem(AUTH_KEY) === 'true'; }
  };

  document.addEventListener('DOMContentLoaded', ()=>window.TripAuth.init());
})();
