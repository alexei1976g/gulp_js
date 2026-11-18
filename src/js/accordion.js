function initAccordion() {
  const elements = document.querySelectorAll('.accordion__element');
  if (elements.length === 0) return;

  elements.forEach(element => {
    const btn = element.querySelector('.accordion__btn');
    const content = element.querySelector('.accordion__content');

    if (!btn || !content) return;

    // Начальные атрибуты для доступности
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', content.id || '');
    if (!content.id) {
      content.id = `accordion-content-${Math.random().toString(36).slice(2, 9)}`;
      btn.setAttribute('aria-controls', content.id);
    }

    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      // Закрываем все остальные элементы — открытым остаётся один
      elements.forEach(other => {
        const otherBtn = other.querySelector('.accordion__btn');
        const otherContent = other.querySelector('.accordion__content');
        if (!otherBtn || !otherContent) return;

        otherBtn.setAttribute('aria-expanded', 'false');
        otherBtn.classList.remove('accordion__btn--active');
        other.classList.remove('accordion__element--active');
        otherContent.style.maxHeight = null;
      });

      // Раскрываем текущий
      if (!isExpanded) {
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('accordion__btn--active');
        element.classList.add('accordion__element--active');

        // Плавное раскрытие: высота по фактическому содержимому
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}