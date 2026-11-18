// Корзина: загружаем сохранённые товары из localStorage или начинаем с пустого массива
const cart = (() => {
  const saved = localStorage.getItem('myShopCart');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { }
  }
  return [];
})();

// Сохраняем корзину в localStorage после каждого изменения
function saveCartToLocal() {
  localStorage.setItem('myShopCart', JSON.stringify(cart));
}

// ТОВАРЫ ИЗ DATA.JSON — единственный источник данных о наличии
let products = []; // сюда попадут товары после загрузки data.json

async function loadProducts() {
  try {
    const response = await fetch('data/data.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    products = await response.json();
  } catch (err) {
    console.error('Не удалось загрузить data.json:', err);
    products = [];
  }
}

// ВЫБРАННЫЙ ГОРОД — берём из кнопок выбора города в шапке
let currentCity = 'null';

// При смене города: количество сбрасываем на 1,
// товары, которых в новом городе нет, — убираем из корзины
function resetCartQuantitiesForCity() {
  let changed = false;

  for (let i = cart.length - 1; i >= 0; i--) {
    const maxQty = getMaxQuantity(cart[i].id);

    if (maxQty <= 0) {
      // В новом городе этого товара нет — удаляем позицию
      cart.splice(i, 1);
      changed = true;
    } else if (cart[i].quantity > 1) {
      cart[i].quantity = 1;
      changed = true;
    }
  }

  if (changed) {
    saveCartToLocal();
    updateCartUI();
    updateCartCounter();
  }
}

// Инициализация: город берём тот, который отмечен, а не «по умолчанию»
function initCitySelection() {
  const cityNameEl = document.querySelector('.location__city-name');
  const cityButtons = Array.from(document.querySelectorAll('.location__sublink'));

  // 1. Сначала localStorage — туда пишет выбранный город селектор шапки
  let savedCity = null;
  try {
    savedCity = localStorage.getItem('selectedCityCode');
  } catch (e) { }

  // Проверяем, что сохранённый город вообще существует среди кнопок
  if (savedCity && cityButtons.some(btn => btn.dataset.city === savedCity)) {
    currentCity = savedCity;
  }

  // 2. Если в localStorage пусто — город, отмеченный активным классом в разметке
  if (!currentCity) {
    const markedBtn = cityButtons.find(
      btn => btn.classList.contains('location__sublink--active') && btn.dataset.city
    );
    if (markedBtn) currentCity = markedBtn.dataset.city;
  }

  // 3. Ещё вариант — город, показанный в шапке (сверяем по тексту кнопок)
  if (!currentCity && cityNameEl && cityNameEl.textContent.trim()) {
    const byName = cityButtons.find(
      btn => btn.textContent.trim() === cityNameEl.textContent.trim()
    );
    if (byName && byName.dataset.city) currentCity = byName.dataset.city;
  }

  // Слушаем клики по городам в списке (как раньше)
  cityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.dataset.city || btn.dataset.city === currentCity) return;

      currentCity = btn.dataset.city;
      resetCartQuantitiesForCity();
    });
  });
}

// Ключ текущего города
function getCurrentCityKey() {
  return currentCity;
}

// Сколько единиц конкретного товара доступно в выбранном городе
function getMaxQuantity(productId) {
  const id = parseInt(productId, 10);
  const product = products.find(p => p.id === id);
  if (!product || !product.availability) return 0;

  const value = product.availability[getCurrentCityKey()];
  return typeof value === 'number' && value >= 0 ? value : 0;
}

// Поиск товара по id среди загруженных из data.json
function findProductById(id) {
  return products.find(p => p.id === parseInt(id, 10)) || null;
}

// Форматирование цены: 15400 -> "15 400"
function formatPrice(value) {
  return typeof value === 'number' && !isNaN(value) ? value.toLocaleString('ru-RU') : '0';
}

// МОДАЛЬНЫЕ ОКНА
function showModal(text) {
  // Если модалка уже открыта — просто обновляем текст
  let overlay = document.querySelector('#cart-modal-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cart-modal-overlay';
    overlay.className = 'cart-modal-overlay';
    overlay.innerHTML = `
      <div class="cart-modal" role="dialog" aria-modal="true">
        <button class="cart-modal__close" type="button" aria-label="Закрыть">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </button>
        <p class="cart-modal__text">${text}</p>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    overlay.querySelector('.cart-modal__close').addEventListener('click', close);
    // Клик по тёмному фону тоже закрывает модалку
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  } else {
    overlay.querySelector('.cart-modal__text').textContent = text;
  }
}

// РАСЧЁТЫ И БЛОК ИТОГА
function calculateTotalPrice() {
  return cart.reduce((total, item) => {
    const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
    return total + (itemPrice * item.quantity);
  }, 0);
}

function createTotalBlock() {
  if (document.querySelector('#basket-total-block')) return;
  const basketContainer = document.querySelector('.basket__list')?.parentElement;
  if (!basketContainer) return;

  const totalBlock = document.createElement('div');
  totalBlock.id = 'basket-total-block';
  totalBlock.className = 'basket__total';
  totalBlock.innerHTML = `
  <span class="basket__total-label">ИТОГО:</span>
  <span class="basket__total-amount" id="basket-total">0 ₽</span>
`;
  const basketLink = document.querySelector('.basket__link');
  if (basketLink) {
    basketLink.parentNode.insertBefore(totalBlock, basketLink);
  } else {
    basketContainer.appendChild(totalBlock);
  }
}

// ДОБАВЛЕНИЕ В КОРЗИНУ
function addToCart(product) {
  const existingItemIndex = cart.findIndex(item => item.id === product.id);

  if (existingItemIndex > -1) {
    showModal('Товар уже добавлен в корзину');
    return;
  }

  const maxQty = getMaxQuantity(product.id);
  if (maxQty <= 0) {
    // Товара нет в наличии в выбранном городе — своя формулировка
    showModal('Извините, выбранный Вами товар отсутствует в Вашем городе.');
    return;
  }

  let price = 0;

  // Если price — это объект с полями new/old
  if (typeof product.price === 'object' && product.price !== null && typeof product.price.new === 'number') {
    price = product.price.new;
  }
  // Если вдруг цена всё-таки просто число (для совместимости)
  else if (typeof product.price === 'number') {
    price = product.price;
  }

  cart.push({
    id: product.id,
    name: product.name,
    price: price,
    image: product.image || '/images/default-product.jpg',
    quantity: 1
  });

  saveCartToLocal();
  updateCartUI();
  updateCartCounter();
}

// ИЗМЕНЕНИЕ КОЛИЧЕСТВА (+/- В КОРЗИНЕ)
function changeQuantity(productId, delta) {
  const item = cart.find(i => i.id == productId);
  if (!item) return;

  const maxQty = getMaxQuantity(item.id);
  const nextQty = item.quantity + delta;

  // Пробуем уйти выше доступного количества — показываем модалку
  if (delta > 0 && nextQty > maxQty) {
    showModal('Превышено количество товаров находящихся в наличии');
    return;
  }

  // Ниже единицы не опускаемся: количество в корзине — от 1
  if (nextQty < 1) return;

  item.quantity = nextQty;
  saveCartToLocal();
  updateCartUI();
  updateCartCounter();
}

// Удаляем товар из корзины полностью
function removeFromCart(productId) {
  const item = cart.find(item => item.id == productId);
  if (!item) return;

  const index = cart.findIndex(i => i.id == productId);
  cart.splice(index, 1);

  saveCartToLocal();
  updateCartUI();
  updateCartCounter();
}

// Показать или скрыть корзину
function toggleCartVisibility() {
  const basket = document.querySelector('.basket');
  if (basket) basket.classList.toggle('basket--active');
}

// Обновляем счётчик товаров у иконки корзины в шапке
function updateCartCounter() {
  const counter = document.querySelector('.header__user-count');
  if (!counter) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  counter.textContent = totalItems > 0 ? totalItems : '0';

  // Пустую корзину сразу закрываем
  const basket = document.querySelector('.basket');
  if (basket && totalItems === 0) {
    basket.classList.remove('basket--active');
  }
}

// Полностью перерисовываем содержимое корзины
function updateCartUI() {
  const basket = document.querySelector('.basket');
  const basketList = document.querySelector('.basket__list');
  const emptyBlock = document.querySelector('.basket__empty-block');
  const basketLink = document.querySelector('.basket__link');
  const totalBlock = document.querySelector('#basket-total-block');
  const totalAmount = document.querySelector('#basket-total');

  if (!basketList || !emptyBlock) return;

  if (cart.length === 0) {
    basketList.style.display = 'none';
    if (basketLink) basketLink.style.display = 'none';
    if (totalBlock) totalBlock.style.display = 'none'; // ИТОГО не показываем в пустой корзине
    emptyBlock.style.display = 'block';
    if (totalAmount) totalAmount.textContent = '0 ₽';
    if (basket) basket.classList.remove('basket--has-items');
  } else {
    basketList.innerHTML = '';

    cart.forEach(item => {
      const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
      const totalPrice = itemPrice * item.quantity;

      const li = document.createElement('li');
      li.className = 'basket__item';
      li.innerHTML = `
        <div class="basket__img"><img src="${item.image}" alt="${item.name}" height="60" width="60"></div>
        <span class="basket__name">${item.name}</span>
        <div class="basket__qty">
          <button class="basket__qty-btn basket__qty-minus" data-id="${item.id}" type="button" title="Уменьшить">−</button>
          <span class="basket__qty-value">${item.quantity}</span>
          <button class="basket__qty-btn basket__qty-plus" data-id="${item.id}" type="button" title="Увеличить">+</button>
        </div>
        <span class="basket__price">${formatPrice(totalPrice)} ₽</span>
        <button class="basket__close" data-id="${item.id}" type="button" title="Удалить">
          <svg width="24" height="24" viewBox="0 0 24 24"><use xlink:href="#icon-close"></use></svg>
        </button>
      `;
      basketList.appendChild(li);
    });

    createTotalBlock();

    const totalBlockAfterCreate = document.querySelector('#basket-total-block');
    if (totalBlockAfterCreate) totalBlockAfterCreate.style.display = 'flex';
    if (totalAmount) totalAmount.textContent = `${formatPrice(calculateTotalPrice())} ₽`;

    basketList.style.display = 'block';
    if (basketLink) basketLink.style.display = 'flex';
    emptyBlock.style.display = 'none';
    if (basket) basket.classList.add('basket--has-items');
  }
}

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', async () => {
  const cartBtn = document.querySelector('.header__user-item:first-child .header__user-btn');
  const basketBlock = document.querySelector('.basket');

  // Сначала грузим data.json, потом всё, что от него зависит
  await loadProducts();

  // Подхватываем выбранный город из шапки
  initCitySelection();

  // Восстанавливаем корзину из localStorage при загрузке
  updateCartCounter();
  updateCartUI();

  if (cartBtn && basketBlock) {
    cartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCartVisibility();
      updateCartUI();
    });

    document.addEventListener('click', (e) => {
      const target = e.target;

      const isInsideCart = basketBlock && basketBlock.contains(target);
      const isCartBtn = cartBtn && cartBtn.contains(target);
      const isModalOpen = document.querySelector('#cart-modal-overlay') !== null;
      const isProductCard = target.closest('.product-card, .product-card--small') !== null;
      const isProductLink = target.closest('.product-card__link') !== null;

      // Пока открыта модалка — корзину не закрываем
      if (isModalOpen) return;

      if (!isInsideCart && !isCartBtn && !isProductCard && !isProductLink) {
        if (basketBlock.classList.contains('basket--active')) {
          toggleCartVisibility();
        }
      }
    });

    const closeBtn = basketBlock.querySelector('.basket__close-all');
    if (closeBtn) closeBtn.addEventListener('click', () => toggleCartVisibility());

    // Единый обработчик событий внутри корзины: +/- и удаление
    basketBlock.addEventListener('click', (e) => {
      const plusBtn = e.target.closest('.basket__qty-plus');
      const minusBtn = e.target.closest('.basket__qty-minus');
      const removeBtn = e.target.closest('.basket__close');

      if (plusBtn) {
        e.stopPropagation();
        if (plusBtn.dataset.id) changeQuantity(plusBtn.dataset.id, +1);
        return;
      }

      if (minusBtn) {
        e.stopPropagation();
        if (minusBtn.dataset.id) changeQuantity(minusBtn.dataset.id, -1);
        return;
      }

      if (removeBtn) {
        e.stopPropagation();
        const id = removeBtn.dataset.id;
        if (id) removeFromCart(id);
      }
    });
  }

  // Ловим клики по кнопке "В корзину" на любых карточках
  if (!window.cartClickHandlerInitialized) {
    window.cartClickHandlerInitialized = true;

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.product-card__link');
      if (!btn) return;

      if (!btn.classList.contains('btn--icon')) return;

      e.preventDefault();

      const card = btn.closest('.product-card, .product-card--small');
      if (!card) return;

      const imgEl = card.querySelector('.product-card__img');

      // ID берём из имени картинки, иначе генерируем временный
      let id = Date.now();
      if (imgEl && imgEl.src) {
        const match = imgEl.src.match(/item-(\d+)/i);
        if (match) id = parseInt(match[1], 10);
      }

      // Ищем товар в data.json по id — имя, цену и картинку берём оттуда
      const product = findProductById(id);
      if (!product) {
        showModal('Превышено количество товаров находящихся в наличии');
        return;
      }

      addToCart(product);
    });
  }
});
