// Экранируем HTML-символы, чтобы данные из JSON не сломали разметку
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class ProductCardRenderer {
  constructor(containerSelector, products, cartActions) {
    this.container = document.querySelector(containerSelector);
    this.products = products;
    this.cartActions = cartActions;
  }

  // Отрисовываем список товаров в контейнер каталога
  renderProducts(productsToRender) {
    this.container.innerHTML = '';

    // Если после фильтрации ничего не найдено — показываем заглушку вместо пустого списка
    if (productsToRender.length === 0) {
      this.container.innerHTML = '<p class="no-products">Товаров не найдено по выбранным фильтрам</p>';
      return;
    }

    // Собираем все карточки в fragment и вставляем одним разом
    const fragment = document.createDocumentFragment();

    productsToRender.forEach(product => {
      const li = document.createElement('li');
      li.className = 'catalog__item';

      const image = product.image || '/images/placeholder.jpg';

      // Название экранируем, чтобы спецсимволы из JSON не попали в HTML
      const title = escapeHtml(product.name || 'Название временно недоступно');

      // Новая цена с разделителями тысяч
      const newPrice = product.price?.new != null
        ? `${product.price.new.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`
        : 'Цена уточняется';

      // Старая цена показывается только если она больше новой
      const oldPrice = product.price?.old != null
        ? product.price.old.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        : null;
      const hasOldPrice = product.price?.old != null && product.price.old > product.price.new;

      // Данные наличия по трём городам
      const availabilityData = product.availability ? [
        { name: 'Москва', count: product.availability.moscow || 0 },
        { name: 'Оренбург', count: product.availability.orenburg || 0 },
        { name: 'Санкт‑Петербург', count: product.availability.saintPetersburg || 0 }
      ] : [];

      const availabilityList = availabilityData.length > 0
        ? availabilityData.map(city => `<li class="tooltip__item"><span class="tooltip__text">${city.name}: <span class="tooltip__count">${city.count}</span></span></li>`).join('')
        : '<li class="tooltip__item"><span class="tooltip__text">Наличие не указано</span></li>';

      // data-product-id на карточке позволяет корзине понять, какой товар добавлять
      li.innerHTML = `
        <div class="product-card" data-product-id="${product.id}">
          <div class="product-card__visual">
            <img class="product-card__img" src="${image}" height="436" width="290" alt="${title}" loading="lazy">
            <div class="product-card__more">
              <a href="#cart-${product.id}" class="product-card__link btn btn--icon" data-add-to-cart="${product.id}">
                <span class="btn__text">В корзину</span>
                <svg class="icon" width="24" height="24">
                 <use href="#icon-basket"></use>
                </svg>
              </a>
              <a href="/product/${product.id}" class="product-card__link btn btn--secondary"><span class="btn__text">Подробнее</span></a>
            </div>
          </div>
          <div class="product-card__info">
            <h2 class="product-card__title">${title}</h2>
            ${hasOldPrice ? `<span class="product-card__old"><span class="product-card__old-number">${oldPrice}</span><span class="product-card__old-add"> ₽</span></span>` : ''}
            <span class="product-card__price"><span class="product-card__price-number">${newPrice}</span></span>
            <div class="product-card__tooltip tooltip">
              <button class="tooltip__btn" aria-label="Показать подсказку">
                <svg class="icon" width="5" height="10">
                 <use href="#icon-i"></use>
                </svg>
              </button>
              <div class="tooltip__content">
                <span class="tooltip__text">Наличие товара по городам:</span>
                <ul class="tooltip__list">${availabilityList}</ul>
              </div>
            </div>
          </div>
        </div>`;

      fragment.appendChild(li);
    });

    this.container.appendChild(fragment);
  }

  // Добавляем товар в корзину по его ID через переданные cartActions
  handleAddToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (product) this.cartActions.addToCart(product);
  }
}
