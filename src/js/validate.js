// Экранирует HTML-символы, чтобы текст сообщения не сломал разметку
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Создаёт модальное окно с сообщением. type — модификатор стиля: 'success' или 'error'
function createModal(message, type) {
  // Единственная модалка: предыдущую убираем сразу
  document.querySelector('.modal')?.remove();

  const modal = document.createElement('div');
  modal.className = `modal modal--${type}`;
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" type="button" aria-label="Закрыть">&times;</button>
      <p class="modal-message">${escapeHtml(message)}</p>
    </div>`;

  document.body.appendChild(modal);

  // Небольшая задержка перед классом --show, чтобы CSS-анимация появления сработала
  setTimeout(() => modal.classList.add('modal--show'), 10);

  // Закрытие: убираем класс показа, а после анимации (300 мс) удаляем узел из DOM
  const closeModal = () => {
    modal.classList.remove('modal--show');
    setTimeout(() => modal.remove(), 300);
  };

  // Крестик закрывает окно
  modal.querySelector('.modal-close').addEventListener('click', closeModal);

  // Клик по фону (не по окну) закрывает окно
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Escape тоже закрывает; слушатель снимается после первого срабатывания
  const onEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', onEsc);
    }
  };
  document.addEventListener('keydown', onEsc);
}

// Настройка валидации формы обращения через библиотеку JustValidate
function initValidation() {
  const validate = new window.JustValidate('#form', {
    lockForm: false,        // не блокируем форму при отправке — управляем кнопкой вручную
    focusInvalidField: true // при ошибке автоматически фокусируемся на первом неверном поле
  });

  validate
    // Имя: обязательное поле, длина от 3 до 20 символов
    .addField('#name', [
      { rule: 'required', errorMessage: 'Введите имя' },
      { rule: 'minLength', value: 3, errorMessage: 'Минимум 3 символа' },
      { rule: 'maxLength', value: 20, errorMessage: 'Максимум 20 символов' }
    ])
    // Email: обязательное поле с проверкой формата
    .addField('#email', [
      { rule: 'required', errorMessage: 'Введите email' },
      { rule: 'email', errorMessage: 'Введите корректный email' }
    ])
    // Чекбокс согласия обязателен
    .addField('#agree', [
      { rule: 'required', errorMessage: 'Необходимо согласие' }
    ])
    // Аргумент onSuccess в текущей сборке JustValidate не является формой или событием —
    // поэтому форму НЕ берём из аргумента, а находим напрямую по id.
    .onSuccess(async () => {
      const form = document.getElementById('form');
      const submitBtn = form.querySelector('[type="submit"]');

      // На время отправки блокируем кнопку, чтобы не отправить дважды
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';

      try {
        const response = await fetch('https://httpbin.org/post', {
          method: 'POST',
          body: new FormData(form)
        });

        if (!response.ok) {
          throw new Error(`Ошибка сервера: ${response.status}`);
        }

        createModal('Благодарим за обращение!', 'success');
      } catch (error) {
        createModal('Не удалось отправить обращение', 'error');
      } finally {
        // Возвращаем кнопку в исходное состояние и очищаем форму
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить заявку';
        form.reset();
      }
    });
}