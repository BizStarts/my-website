const amount = document.querySelector('#amount');
const formatAmount = () => { document.querySelector('#amount-value').textContent = Number(amount.value).toLocaleString('ru-RU') + ' ₽'; };
amount.addEventListener('input', formatAmount);
formatAmount();
document.querySelector('#year').textContent = new Date().getFullYear();
const menu = document.querySelector('.menu-toggle');
menu.addEventListener('click', () => {
  const open = document.querySelector('.header nav').classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
document.querySelectorAll('.header nav a').forEach(link => link.addEventListener('click', () => {
  document.querySelector('.header nav').classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Открыть меню');
}));
const privacy = document.querySelector('#privacy');
document.querySelectorAll('#privacy-open, #privacy-footer').forEach(button => button.addEventListener('click', () => privacy.showModal()));
document.querySelector('.dialog-close').addEventListener('click', () => privacy.close());
privacy.addEventListener('click', event => { if (event.target === privacy) { const rect = privacy.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) privacy.close(); } });
document.querySelector('#credit-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = document.querySelector('#name').value.trim();
  const phoneField = document.querySelector('#phone');
  const phone = phoneField.value.trim();
  const digits = phone.replace(/\D/g, '');
  phoneField.setCustomValidity('');
  if (!name) { document.querySelector('#name').setCustomValidity('Введите ваше имя'); document.querySelector('#name').reportValidity(); return; }
  if (digits.length < 10 || digits.length > 15) { phoneField.setCustomValidity('Введите корректный номер телефона'); phoneField.reportValidity(); return; }
  const body = `Здравствуйте! Хочу обсудить помощь в получении кредита.\n\nИмя: ${name}\nТелефон: ${phone}\nЖелаемая сумма: ${document.querySelector('#amount-value').textContent}\n\nСогласен на использование этих данных для ответа на моё обращение.`;
  window.location.href = `mailto:baranov_95msk@mail.ru?subject=${encodeURIComponent('Заявка на консультацию с сайта')}&body=${encodeURIComponent(body)}`;
  const status = document.querySelector('#form-status');
  status.hidden = false;
  status.textContent = 'Письмо подготовлено. Отправьте его в почтовом приложении. Если оно не открылось, позвоните +7 (916) 038-77-54 или напишите на baranov_95msk@mail.ru.';
});
document.querySelector('#phone').addEventListener('input', event => event.target.setCustomValidity(''));
document.querySelector('#name').addEventListener('input', event => event.target.setCustomValidity(''));
