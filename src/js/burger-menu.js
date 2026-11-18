function initBurgerMenu() {
  const hamburgerOpen = document.querySelector('.header__catalog-btn');
  const hamburgerClose = document.querySelector('.main-menu__close');
  const menuItems = document.querySelector('.main-menu');

  // Функция открытия меню
  function openMenu() {
    menuItems.classList.add('main-menu--active')
  }

  // Функция закрытия меню
  function closeMenu() {
    menuItems.classList.remove('main-menu--active')
  }

  // Обработчики событий
  hamburgerOpen.addEventListener('click', openMenu);
  hamburgerClose.addEventListener('click', closeMenu);

  // Закрытие по кнопке закрытия
  if (hamburgerClose) {
    hamburgerClose.addEventListener('click', closeMenu);
  }

  // Закрываем меню при нажатии Esc
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuItems.classList.contains('main-menu--active')) {
      closeMenu();
    }
  })
}

document.addEventListener('DOMContentLoaded', initBurgerMenu)
