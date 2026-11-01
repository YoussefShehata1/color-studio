// Notification toast service

let timer = null;

export function showNotification(message, type = 'default', duration = 2500) {
  const el = document.getElementById('notification');
  if (!el) return;

  el.textContent = message;
  el.className = `notification ${type} show`;

  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    el.classList.remove('show');
  }, duration);
}
