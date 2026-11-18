// Загружаем товары, инициализируем все компоненты страницы.
async function startApp() {
  let productsArray = [];

  // Загружаем данные о товарах из JSON
  try {
    const response = await fetch('data/data.json');
    if (!response.ok) throw new Error('Ошибка загрузки данных');
    const data = await response.json();
    productsArray = Array.isArray(data) ? data : (data.products || []);
  } catch (err) {
    // При ошибке просто оставляем пустой массив
    productsArray = [];
  }

  // Инициализируем рендерер карточек каталога
  const renderer = new ProductCardRenderer('.catalog__list', productsArray);

  // Подключаем тултипы для карточек товаров
  initTooltipManager(productsArray);

  // Запускаем аккордеоны и валидацию форм
  initAccordion();
  initValidation();

  // Настраиваем пагинацию
  setRenderer(renderer);
  initPagination(productsArray);

  // Создаём сортировщик и фильтр товаров
  const sorter = new ProductSorter();
  const filterInstance = new ProductFilter(renderer, sorter);
  window.filterInstance = filterInstance;

  // Инициализируем выбор города
  initCitySelector(filterInstance);

  // Отрисовываем слайдер «Товары дня» и запускаем Swiper
  new DayProductsRenderer('.day-products__slider', productsArray);

  // Обновляем счётчик товаров в корзине и её интерфейс
  updateCartCounter();
  updateCartUI();
}

// Запуск приложения, когда DOM полностью готов
document.addEventListener('DOMContentLoaded', startApp);