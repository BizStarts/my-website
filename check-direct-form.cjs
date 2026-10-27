const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function check(method, invalidPhone = false) {
  const listeners = {};
  const nodes = {};
  let submitted;
  const node = () => ({ value: '', disabled: false, hidden: true, textContent: '',
    addEventListener() {}, setAttribute() {}, removeAttribute() {},
    setCustomValidity(message) { this.validityMessage = message; }, reportValidity() { return true; } });
  const get = selector => nodes[selector] ||= node();
  const form = get('#credit-form');
  form.addEventListener = (name, callback) => { listeners[name] = callback; };
  const button = node();
  form.querySelector = selector => selector === '[type=submit]' ? button : { value: method };
  get('#name').value = 'Анна';
  get('#phone').value = invalidPhone ? 'invalid' : '+7 (999) 123-45-67';
  const context = vm.createContext({ URL, Date,
    window: { addEventListener() {} },
    document: {
      querySelector: get, querySelectorAll: () => [],
      body: { append() {} },
      createElement(tag) {
        if (tag === 'input') return {};
        return { fields: [], append(field) { this.fields.push(field); }, submit() { submitted = this; } };
      }
    }
  });
  vm.runInContext(fs.readFileSync(__dirname + '/dist/config.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync(__dirname + '/dist/app.js', 'utf8'), context);
  assert.equal(button.disabled, false);
  await listeners.submit({ preventDefault() {} });
  if (invalidPhone) {
    assert.equal(submitted, undefined);
    assert(get('#phone').validityMessage);
    return;
  }
  assert.equal(submitted.method, 'POST');
  assert.equal(submitted.action, context.window.SITE_CONFIG.googleForm.action);
  const payload = Object.fromEntries(submitted.fields.map(field => [field.name, field.value]));
  assert.equal(payload['entry.1908189698'], 'Анна');
  assert.equal(payload['entry.2034992491'], '+7 (999) 123-45-67\nУдобный способ связи: ' + method);
  assert.equal(button.disabled, true);
}

(async () => {
  for (const method of ['Telegram', 'Макс', 'WhatsApp']) await check(method);
  await check('Telegram', true);
  console.log('PASS: direct Google POST sends name, phone and each preferred messenger; invalid phone prevents submission.');
})().catch(error => { console.error(error); process.exitCode = 1; });
