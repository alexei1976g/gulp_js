// Экранирует HTML-символы, чтобы данные из JSON не сломали разметку
// и не открыли XSS-уязвимость при вставке через innerHTML
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Коды городов из data-city
const CITY_NAMES = {
  moscow: 'Москва',
  orenburg: 'Оренбург',
  saintPetersburg: 'Санкт-Петербург'
};

// Вывод цены
function formatPriceWithCurrency(value) {
  return value != null
    ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'
    : 'Цена уточняется';
}

// Рендерит слайдер "Товары дня" из общего списка товаров
class DayProductsRenderer {
  constructor(containerSelector, allProducts) {
    this.container = document.querySelector(containerSelector);
    this.allProducts = allProducts;
    this.swiper = null;

    this.render();
    this.initSwiper();
  }

  render() {
    // Берём только товары с флагом goodsOfDay
    const dayProducts = this.allProducts.filter(p => p.goodsOfDay === true);

    const listContainer = this.container.querySelector('.swiper-wrapper');

    // Сначала очищаем контейнер, чтобы не дублировать карточки при повторном рендере
    listContainer.innerHTML = '';

    // Если товаров дня нет — показываем заглушку вместо пустого слайдера
    if (dayProducts.length === 0) {
      this.container.innerHTML = '<p>Сегодня нет товаров дня</p>';
      return;
    }

    // Собираем карточки в fragment и вставляем одним разом
    const fragment = document.createDocumentFragment();

    dayProducts.forEach(product => {
      const title = escapeHtml(product.name || 'Товар');
      const image = product.image || '/images/placeholder.jpg';
      const currentPrice = product.price?.new != null ?formatPriceWithCurrency(product.price.new) : 'Цена уточняется';

      // Старую цену показываем только если она больше текущей
      const oldPrice = product.price?.old != null && product.price.new < product.price.old
        ?formatPriceWithCurrency(product.price.old)
        : null;

      // Список наличия по городам; если данных нет — заглушка
      const availabilityList = product.availability
        ? Object.entries(CITY_NAMES).map(([code, name]) =>
          `<li class="tooltip__item"><span class="tooltip__text">${name}: <span class="tooltip__count">${product.availability[code] || 0}</span></span></li>`
        ).join('')
        : '<li class="tooltip__item"><span class="tooltip__text">Наличие не указано</span></li>';

      const itemLi = document.createElement('li');
      itemLi.className = 'day-products__item swiper-slide';

      // data-product-id на карточке нужен корзине, чтобы понимать, какой товар добавлять
      itemLi.innerHTML = `
        <div class="product-card--small" data-product-id="${product.id}">
          <div class="product-card__visual">
            <img class="product-card__img" src="${image}" alt="${title}"
              height="344" width="290" loading="lazy">
            <div class="product-card__more">
              <a href="#cart-${product.id}" class="product-card__link btn btn--icon" data-add-to-cart="${product.id}">
                <span class="btn__text">В корзину</span>
                <svg width="24" height="24" aria-hidden="true"><use xlink:href="#icon-basket"></use></svg>
              </a>
              <a href="/product/${product.id}" class="product-card__link btn btn--secondary">
                <span class="btn__text">Подробнее</span>
              </a>
            </div>
          </div>
          <div class="product-card__info">
            <h2 class="product-card__title">${title}</h2>
            ${oldPrice ? `<span class="product-card__old"><span class="product-card__old-number">${oldPrice}</span><span class="product-card__old-add"> ₽</span></span>` : ''}
            <span class="product-card__price"><span class="product-card__price-number">${currentPrice}</span></span>
            <div class="product-card__tooltip tooltip">
              <button class="tooltip__btn" aria-label="Показать подсказку">
                <svg class="tooltip__icon" width="5" height="10" aria-hidden="true"><use xlink:href="#icon-i"></use></svg>
              </button>
              <div class="tooltip__content">
                <span class="tooltip__text">Наличие товара по городам:</span>
                <ul class="tooltip__list">${availabilityList}</ul>
              </div>
            </div>
          </div>
        </div>`;

      fragment.appendChild(itemLi);
    });

    listContainer.appendChild(fragment);

    // Карточки перерисованы — инициализируем тултипы заново
    window.initializeTooltips?.();
  }

  // Инициализация слайдера Swiper на контейнере "Товары дня"
  initSwiper() {
    this.swiper = new Swiper(this.container, {
      navigation: {
        prevEl: '.day-products__navigation-btn--prev',
        nextEl: '.day-products__navigation-btn--next',
      },
      slidesPerView: 4,   // четыре карточки в ряд
      slidesPerGroup: 4,  // листаем сразу по четыре
      spaceBetween: 32,   // отступ между карточками
      grabCursor: true,   // курсор-рука при перетаскивании
      watchOverflow: true, // если слайдов меньше 4 — стрелки скрываются сами

      // Плавность 600 мс
      speed: 600,
    });
  }
}