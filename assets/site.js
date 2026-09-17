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
