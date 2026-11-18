class ProductFilter {
  constructor(productRenderer, sorter) {
    this.productRenderer = productRenderer;
    this.sorter = sorter;
    this.products = productRenderer?.products || [];
    this.currentCity = 'moscow';
    this.form = document.querySelector('.catalog-form');

    this.init();
  }

  init() {
    // Слушаем любые изменения в форме
    this.form.addEventListener('input', () => this.applyFilters());

    // Кнопка сброса фильтров
    const resetBtn = this.form.querySelector('.catalog-form__reset');

    resetBtn.addEventListener('click', (e) => {
      e.preventDefault(); // форма не отправляется на сервер

      // Снимаем все чекбоксы типов
      const checkboxes = this.form.querySelectorAll('input[name="type"]');
      checkboxes.forEach(cb => cb.checked = false);

      // Возвращаем радио в положение «Все»
      const statusRadio = this.form.querySelector('input[name="status"][value="all-item"]');
      statusRadio.checked = true;

      // После сброса пересчитываем счётчики и перерисовываем список
      this.updateCounts(this.getActiveFilters().status, this.currentCity);
      this.applyFilters();
    });

    // Первичная отрисовка счётчиков при загрузке
    this.updateCounts('all-item', this.currentCity);
  }

  // Собираем активные фильтры отмеченные типы товаров и статус наличия
  getActiveFilters() {
    const checkedTypes = Array.from(
      this.form.querySelectorAll('input[name="type"]:checked')
    ).map(cb => cb.value);

    const statusRadio = this.form.querySelector('input[name="status"]:checked');
    const status = statusRadio ? statusRadio.value : 'all-item';

    return { types: checkedTypes, status };
  }

  // Устанавливаем новый город
  setCity(cityKey) {
    if (this.currentCity === cityKey) return; // тот же город — выходим сразу

    this.currentCity = cityKey;

    // Пересчитываем счётчики под новый город
    const filters = this.getActiveFilters();
    this.updateCounts(filters.status, this.currentCity);

    // Обновляем список если включён режим «В наличии» —
    // при статусе «Все» город на выборку не влияет
    if (filters.status === 'instock') {
      this.applyFilters();
    }
  }

  // Подсчёт количества товаров для отображения в скобках рядом с каждым типом
  updateCounts(status, city) {
    const checkboxes = this.form.querySelectorAll('input[name="type"]');

    checkboxes.forEach(cb => {
      const type = cb.value;

      // Для каждого типа считаем, сколько товаров ему соответствует
      const count = this.products.filter(product => {
        // Приводим к массиву тип товара
        const productTypes = Array.isArray(product?.type)
          ? product.type
          : (typeof product?.type === 'string' ? [product.type] : []);

        if (!productTypes.includes(type)) return false;

        // При режиме «В наличии» учитываем остаток в выбранном городе
        if (status === 'instock' && city) {
          const stock = product.availability?.[city] || 0;
          return stock > 0;
        }

        return true;
      }).length;

      // Обновляем счётчик в скобках
      const container = cb.closest('.custom-checkbox');
      const countSpan = container.querySelector('.custom-checkbox__count');
      countSpan.textContent = count > 0 ? `(${count})` : '';
    });
  }

  // Собираем активные фильтры и передаём результат в пагинацию
  applyFilters(resetPage = true) {
    const { types, status } = this.getActiveFilters();
    const city = this.currentCity;

    let list = this.products;

    // Сортировка всегда идёт первой: порядок важен до разбиения на страницы
    list = this.sorter.sortProducts(list);

    // Фильтр по выбранным типам: товар подходит, если совпадает хотя бы один тип
    if (types.length > 0) {
      list = list.filter(product => {
        const productTypes = Array.isArray(product?.type)
          ? product.type
          : (typeof product?.type === 'string' ? [product.type] : []);
        return productTypes.some(t => types.includes(t));
      });
    }

    // Режим «В наличии»: оставляем только товары, у которых есть остаток в выбранном городе
    if (status === 'instock') {
      list = list.filter(product => (product.availability?.[city] || 0) > 0);
    }

    // Отдаём отфильтрованный список в пагинацию
    updateFilteredProducts(list, resetPage);
  }
}
