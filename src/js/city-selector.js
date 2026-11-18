function initCitySelector(filterInstance) {
  const location = document.querySelector('.header__location');
  if (!location) return; // на страницах без шапки селектора нет — выходим сразу

  const cityButton = location.querySelector('.location__city');
  const cityNameEl = location.querySelector('.location__city-name');
  const sublist = location.querySelector('.location__sublist');

  const cityLinks = sublist.querySelectorAll('.location__sublink');
  let activeLink = null;

  // --- Вспомогательные функции ---

  // Открытие списка городов
  function openSublist() {
    cityButton.classList.add('location__city--active');
  }

  // Закрытие списка городов
  function closeSublist() {
    cityButton.classList.remove('location__city--active');
  }

  // Запись в localStorage через try/catch
  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) { }
  }

  // Устанавливает выбранный город: обновляет текст, подсветку и запоминает выбор
  function setCity(cityName, clickedLink) {
    const cityCode = clickedLink.dataset.city;

    // UX: если кликнули на уже выбранный город — просто закрываем список
    if (activeLink === clickedLink) {
      closeSublist();
      return;
    }

    cityNameEl.textContent = cityName;

    if (activeLink) {
      activeLink.classList.remove('location__sublink--active');
    }
    clickedLink.classList.add('location__sublink--active');
    activeLink = clickedLink;

    safeSetStorage('selectedCityCode', cityCode);

    // Сообщаем фильтру о смене города.
    filterInstance.setCity(cityCode);

    closeSublist();
  }

  // --- Обработчики событий ---

  // Клик по кнопке города открывает или закрывает список
  cityButton.addEventListener('click', () => {
    if (cityButton.classList.contains('location__city--active')) {
      closeSublist();
    } else {
      openSublist();
    }
  });

  // Выбор города из списка
  cityLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); // на случай, если это ссылки <a>
      const cityName = link.textContent.trim();
      setCity(cityName, link);
    });
  });

  // Закрытие списка при клике вне селектора и по Escape.
  // Маркер на document защищает от повторного добавления обработчиков,
  // если initCitySelector вызовут несколько раз.
  const EVENT_LISTENER_MARKER = '__citySelectorInitialized__';

  if (!document[EVENT_LISTENER_MARKER]) {
    document[EVENT_LISTENER_MARKER] = true;

    document.addEventListener('click', (event) => {
      const isClickInside = location.contains(event.target);
      if (!isClickInside) {
        closeSublist();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeSublist();
      }
    });
  }

  // --- Инициализация при загрузке страницы ---

  // Читаем сохранённый город; по умолчанию — Москва
  let savedCityCode = null;

  try {
    savedCityCode = localStorage.getItem('selectedCityCode');
  } catch (e) { }

  if (!savedCityCode) {
    savedCityCode = 'moscow';
  }

  // Ищем кнопку города с сохранённым кодом
  const savedLink = Array.from(cityLinks).find(link =>
    link.dataset.city === savedCityCode
  );

  // Если сохранённый город найден — устанавливаем его,
  // иначе берём первый город из списка
  if (savedLink) {
    setCity(savedLink.textContent.trim(), savedLink);
  } else {
    setCity(cityLinks[0].textContent.trim(), cityLinks[0]);
  }
}