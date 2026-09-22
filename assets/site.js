document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() {
  toggle?.setAttribute('aria-expanded','false');
  toggle?.setAttribute('aria-label',toggle.dataset.openLabel);
  nav?.classList.remove('is-open');
}
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label',open ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
  nav.classList.toggle('is-open',open);
});
nav?.addEventListener('click', event => { if(event.target.closest('a')) closeMenu(); });
window.addEventListener('keydown', event => {
  if(event.key !== 'Escape') return;
  const restoreFocus = toggle?.getAttribute('aria-expanded') === 'true' && nav?.contains(document.activeElement);
  closeMenu();
  if(restoreFocus) toggle.focus();
});
const dialog = document.querySelector('.lightbox');
if(dialog && typeof dialog.showModal === 'function') {
  document.querySelectorAll('[data-lightbox]').forEach(link => {
    link.addEventListener('click', event => {
      if(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const image = dialog.querySelector('img');
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      dialog.querySelector('p').textContent = link.dataset.caption;
      dialog.showModal();
      document.body.classList.add('lightbox-open');
    });
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {if(event.target===dialog) dialog.close();});
  dialog.addEventListener('close', () => document.body.classList.remove('lightbox-open'));
}

// Credentials remain selectable without JavaScript. Copying never submits a form.
const copyStatus = document.querySelector('#demo-copy-status');
const copyButtons = [...document.querySelectorAll('[data-copy-credential]')];
let copying = false;
copyButtons.forEach(button => {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const input = document.getElementById(button.dataset.copyCredential);
    if (!input || !copyStatus || copying) return;
    copying = true;
    copyButtons.forEach(item => { item.disabled = true; });
    copyStatus.textContent = '';
    let copied = false;
    try {
      try {
        if (typeof navigator.clipboard?.writeText === 'function') {
          await navigator.clipboard.writeText(input.value);
          copied = true;
        }
      } catch {
        // A blocked Clipboard API can still allow the legacy operation below.
      }
      if (!copied) {
        input.focus();
        input.select();
        input.setSelectionRange(0, input.value.length);
        try { copied = document.execCommand?.('copy') === true; } catch { /* Keep the value selected for manual copying. */ }
      }
      copyStatus.textContent = copied ? button.dataset.copied : button.dataset.copyFallback;
    } finally {
      copying = false;
      copyButtons.forEach(item => { item.disabled = false; });
      if (copied) button.focus();
    }
  });
});
