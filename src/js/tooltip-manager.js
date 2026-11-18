// Имя НЕ CITY_NAMES — оно уже объявлено в day-products-renderer.js
const TOOLTIP_CITY_NAMES = {
  moscow: 'Москва',
  orenburg: 'Оренбург',
  saintPetersburg: 'Санкт-Петербург'
};

// Полный список товаров, из которого тултип берёт данные о наличии
let tooltipProducts = [];

// Таймер задержки закрытия
let tooltipHideTimer = null;

// Ссылка на текущий открытый тултип
let activeTooltip = null;

// Вызывается один раз из startApp с полным массивом товаров
function initTooltipManager(products) {
  tooltipProducts = Array.isArray(products) ? products : [];
}

// Приводит availability к единому виду
function normalizeAvailability(availability) {
  if (Array.isArray(availability)) {
    return availability.map(item => ({
      city: TOOLTIP_CITY_NAMES[item.city] || item.city || 'Неизвестный город',
      quantity: item.quantity ?? 0
    }));
  }

  if (availability && typeof availability === 'object') {
    return Object.entries(availability).map(([code, quantity]) => ({
      city: TOOLTIP_CITY_NAMES[code] || code,
      quantity: quantity ?? 0
    }));
  }

  // Наличие не указано — возвращаем пустой список
  return [];
}

// Собираем HTML списка городов для подсказки
function buildTooltipList(productData) {
  const items = normalizeAvailability(productData?.availability);

  // Нет данных — показываем заглушку вместо пустого списка
  if (items.length === 0) {
    return '<li class="tooltip__item"><span class="tooltip__text">Информация о наличии недоступна</span></li>';
  }

  return items
    .map(item => `
      <li class="tooltip__item">
        <span class="tooltip__text">${item.city}: <span class="tooltip__count">${item.quantity}</span></span>
      </li>`)
    .join('');
}

// Подставляем актуальные данные о наличии в тултип конкретной карточки
function updateTooltipContent(tooltip, productData) {
  const list = tooltip.querySelector('.tooltip__content .tooltip__list');
  list.innerHTML = buildTooltipList(productData);
}

// Открываем тултип
function openTooltip(tooltip) {
  const card = tooltip.closest('.product-card, .product-card--small');
  const productId = card?.dataset.productId;

  const product = tooltipProducts.find(p => String(p.id) === String(productId));
  if (product) updateTooltipContent(tooltip, product);

  const content = tooltip.querySelector('.tooltip__content');
  content.style.display = 'block';

  activeTooltip = tooltip;
}

// Закрывает активный тултип, если он открыт
function closeActiveTooltip() {
  if (!activeTooltip) return;
  const content = activeTooltip.querySelector('.tooltip__content');
  content.style.display = 'none';
  activeTooltip = null;
}

// Делегируем на document
document.addEventListener('mouseover', (e) => {
  const tooltipArea = e.target.closest('.product-card__tooltip');
  if (!tooltipArea) return;

  // Сбрасываем таймер закрытия
  clearTimeout(tooltipHideTimer);

  // Открываем новый тултип
  if (tooltipArea !== activeTooltip) {
    closeActiveTooltip();
    openTooltip(tooltipArea);
  }
});

document.addEventListener('mouseout', (e) => {
  const tooltipArea = e.target.closest('.product-card__tooltip');
  // Реагируем только на уход из текущего открытого тултипа
  if (!tooltipArea || tooltipArea !== activeTooltip) return;

  // Закрываем с задержкой 200 мс
  tooltipHideTimer = setTimeout(closeActiveTooltip, 200);
});

// Зачистка открытого тултипа после перерисовки
window.initializeTooltips = closeActiveTooltip;