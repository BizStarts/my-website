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
const config = window.SITE_CONFIG || {};
const contactHosts = { telegram: ['t.me', 'telegram.me'], max: ['max.ru', 'www.max.ru'] };
document.querySelectorAll('[data-contact]').forEach(link => {
  const service = link.dataset.contact;
  try {
    const url = new URL(config[service === 'telegram' ? 'telegramUrl' : 'maxUrl']);
    if (url.protocol !== 'https:' || !contactHosts[service].includes(url.hostname) || url.pathname === '/') throw new Error('Invalid contact');
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  } catch {
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
  }
});
document.querySelector('#contacts-availability').hidden = !document.querySelector('[data-contact][aria-disabled]');

const form = document.querySelector('#credit-form');
const submit = form.querySelector('[type=submit]');
let endpoint = '';
try {
  const url = new URL(config.googleScriptUrl);
  if (url.protocol === 'https:' && url.hostname === 'script.google.com' && /^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname)) endpoint = url.href;
} catch { /* The form stays unavailable until connected. */ }
let googleForm = null;
try {
  const settings = config.googleForm;
  const url = new URL(settings.action);
  if (url.protocol === 'https:' && url.hostname === 'docs.google.com' && /^\/forms\/d\/e\/[\w-]+\/formResponse$/.test(url.pathname) &&
      /^entry\.\d+$/.test(settings.nameField) && /^entry\.\d+$/.test(settings.phoneField)) googleForm = settings;
} catch { /* No direct Google Form configured. */ }
submit.disabled = !endpoint && !googleForm;
if (endpoint || googleForm) document.querySelector('#form-availability').textContent = endpoint
  ? 'Свяжемся с вами в выбранном мессенджере'
  : 'После отправки откроется подтверждение Google Формы';

window.addEventListener('pageshow', () => {
  submit.disabled = !endpoint && !googleForm;
  form.removeAttribute('aria-busy');
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.querySelector('#name').value.trim();
  const phoneField = document.querySelector('#phone');
  const phone = phoneField.value.trim();
  const digits = phone.replace(/\D/g, '');
  phoneField.setCustomValidity('');
  if (!name) { document.querySelector('#name').setCustomValidity('Введите ваше имя'); document.querySelector('#name').reportValidity(); return; }
  if (!/^[+0-9 ()-]{10,22}$/.test(phone) || digits.length < 10 || digits.length > 15) { phoneField.setCustomValidity('Введите корректный номер телефона'); phoneField.reportValidity(); return; }
  if (!form.reportValidity() || (!endpoint && !googleForm) || submit.disabled) return;
  const status = document.querySelector('#form-status');
  status.hidden = false;
  if (!endpoint && googleForm) {
    // A normal browser POST displays Google's real confirmation or validation error.
    // This form currently has only two text fields, so keep the preferred channel
    // alongside the phone rather than silently discarding it.
    const method = form.querySelector('[name=contactMethod]:checked').value;
    const googleSubmission = document.createElement('form');
    googleSubmission.method = 'POST';
    googleSubmission.action = googleForm.action;
    googleSubmission.hidden = true;
    for (const [key, value] of [[googleForm.nameField, name], [googleForm.phoneField, `${phone}\nУдобный способ связи: ${method}`]]) {
      const field = document.createElement('input');
      field.type = 'hidden';
      field.name = key;
      field.value = value;
      googleSubmission.append(field);
    }
    document.body.append(googleSubmission);
    status.textContent = 'Переходим к подтверждению Google Формы';
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    googleSubmission.submit();
    return;
  }
  status.textContent = 'Отправляем обращение';
  submit.disabled = true;
  form.setAttribute('aria-busy', 'true');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const payload = new URLSearchParams(new FormData(form));
    payload.set('name', name);
    payload.set('phone', phone);
    const response = await fetch(endpoint, { method: 'POST', body: payload, signal: controller.signal, credentials: 'omit' });
    if (!response.ok) throw new Error('Request failed');
    const result = await response.json();
    if (result.ok !== true || !result.responseId) throw new Error('Unconfirmed submission');
    status.textContent = 'Спасибо! Заявка принята Свяжемся с вами в выбранном мессенджере';
    form.reset();
  } catch {
    status.textContent = 'Не удалось подтвердить отправку Данные оставлены в форме Напишите нам в мессенджере или попробуйте позже';
  } finally {
    clearTimeout(timeout);
    submit.disabled = false;
    form.removeAttribute('aria-busy');
  }
});
document.querySelector('#phone').addEventListener('input', event => event.target.setCustomValidity(''));
document.querySelector('#name').addEventListener('input', event => event.target.setCustomValidity(''));
