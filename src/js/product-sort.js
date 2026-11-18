class ProductSorter {
  constructor() {
    this.sortSelect = document.querySelector('.catalog__sort-select');
    this.currentSort = 'price-min'; // сортировка по возрастанию цены по умолчанию

    // Восстанавливаем сохранённый выбор из localStorage
    const savedSort = localStorage.getItem('catalogSort');
    // Применяем его, только если в селекте действительно есть такая опция
    if (savedSort && this.sortSelect.querySelector(`option[value="${savedSort}"]`)) {
      this.currentSort = savedSort;
      this.sortSelect.value = savedSort;
    }

    // При смене сортировки - запоминаем выбор и перерисовываем каталог
    this.sortSelect.addEventListener('change', (event) => {
      this.currentSort = event.target.value;
      localStorage.setItem('catalogSort', this.currentSort);
      window.filterInstance?.applyFilters(false);
    });
  }

  // Сортируем массив товаров согласно выбранному режиму
  sortProducts(products) {
    switch (this.currentSort) {
      // Сначала дешёвые
      case 'price-min':
        return [...products].sort((a, b) => a.price.new - b.price.new);

      // Сначала дорогие
      case 'price-max':
        return [...products].sort((a, b) => b.price.new - a.price.new);

      // Сначала популярные: по рейтингу, при равном рейтинге — дешевле
      case 'rating-max':
        return [...products].sort((a, b) => {
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return a.price.new - b.price.new;
        });

      // Неизвестный режим — возвращаем список как есть
      default:
        return products;
    }
  }
}