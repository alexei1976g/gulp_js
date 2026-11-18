// Количество товаров на одной странице каталога
const ITEMS_PER_PAGE = 6;

// Текущая страница пагинации
let currentPage = 1;

// Полный список товаров после применения фильтров и сортировки
let filteredProducts = [];

// Ссылка на рендерер карточек, через который отрисовывается текущая страница
let productRenderer = null;

// Сохраняем ссылку на рендерер — вызывается один раз при старте приложения
function setRenderer(rendererInstance) {
  productRenderer = rendererInstance;
}

// Инициализация пагинации при загрузке
function initPagination(products) {
  filteredProducts = [...products];
  currentPage = 1;
  renderPage();
}

// Обновляем список товаров
function updateFilteredProducts(newFilteredProducts, resetPage = true) {
  filteredProducts = newFilteredProducts;
  if (resetPage) currentPage = 1;
  else currentPage = Math.min(currentPage, getTotalPages());
  renderPage();
}

// Делим количество товаров на размер страницы, округляя вверх
function getTotalPages() {
  return Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
}

// Возвращаем срез товаров для текущей страницы
function getPageItems() {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
}

// Отрисовываем текущую страницу товаров и обновляет кнопки пагинации
function renderPage() {
  productRenderer.renderProducts(getPageItems());
  // Карточки перерисованы — инициализируем тултипы заново
  window.initializeTooltips?.();
  renderPaginationButtons();
}

// Рисуем кнопки пагинации под списком товаров
function renderPaginationButtons() {
  const paginationList = document.querySelector('.catalog__pagination');

  paginationList.innerHTML = '';
  const totalPages = getTotalPages();

  // Если страниц всего одна — пагинацию не показываю
  if (totalPages <= 1) return;

  // Переход на страницу: перерисовка списка + плавный скролл к началу каталога
  const goTo = (page) => {
    currentPage = page;
    renderPage();
    document.querySelector('.catalog__list')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Создаём кнопку пагинации
  const createBtn = (label, page, isDisabled = false, isActive = false) => {
    const li = document.createElement('li');
    li.className = 'catalog__pagination-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'catalog__pagination-link';
    btn.textContent = label;
    btn.disabled = isDisabled;

    // Активная страница подсвечивается модификатором
    if (isActive) btn.classList.add('catalog__pagination-link--active');

    // Отключённым кнопкам обработчик не нужен
    if (!isDisabled) {
      btn.addEventListener('click', () => goTo(page));
    }

    li.appendChild(btn);
    paginationList.appendChild(li);
  };

  // Кнопки с номерами всех страниц
  for (let i = 1; i <= totalPages; i++) {
    createBtn(String(i), i, false, i === currentPage);
  }
}