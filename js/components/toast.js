let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

export function showToast(message, type = 'success', duration = 3000) {
  const parent = ensureContainer();

  const toast = document.createElement('div');
  toast.className = 'toast';

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };
  const colorMap = {
    success: '#16a34a',
    error: '#b31b25',
    info: '#7e32c1',
  };

  toast.innerHTML = `
    <span class="material-symbols-outlined" style="color: ${colorMap[type]}; font-variation-settings: 'FILL' 1;">${iconMap[type]}</span>
    <span>${message}</span>
  `;

  parent.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}
