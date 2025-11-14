(function () {
  if (document.querySelector('.home-icon')) return;

  const parent = document.getElementById('dom-overlay') || document.body;
  const css = `
    .home-icon {
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 9999;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, opacity 0.2s ease;
      opacity: 0.85;
    }
    .home-icon svg {
      width: 50px;
      height: 50px;
      transition: transform .2s ease;
    }
    .home-icon:hover {
      transform: scale(1.1);
      opacity: 1;
    }
    @media (max-width: 640px) {
      .home-icon { top: 12px; left: 12px; transform: scale(0.9); }
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const a = document.createElement('a');
  a.className = 'home-icon';
  a.href = '/pages/selector.html';
  a.setAttribute('aria-label', 'Inicio');
  a.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 3 10v9a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1v-9l-9-7Z"
            fill="#7666b0ff"></path>
    </svg>
  `;
    parent.appendChild(a);
})();
