const { readFileSync, existsSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = __dirname + '/';
const html = readFileSync(root + 'dist/index.html', 'utf8');
assert(!/Баранов|Максим|772174445380|325774600429244|916.*038|mailto:|tel:/i.test(html));
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^https?:/.test(match[1])) assert(existsSync(root + 'dist/' + match[1]), match[1]);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length);
for (const match of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(match[1]), match[1]);
let submitted = 0;
const items = [];
const response = { withItemResponse(item) { items.push(item); return this; }, submit() { submitted++; return { getId: () => 'record-1' }; } };
const item = { asTextItem() { return this; }, asMultipleChoiceItem() { return this; }, createResponse(value) { return value; } };
const context = vm.createContext({
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => '1' }) },
  FormApp: { openById: () => ({ createResponse: () => response, getItemById: () => item }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) }
});
vm.runInContext(readFileSync(root + 'google-form.gs', 'utf8'), context);
for (const method of ['Telegram', 'Макс', 'WhatsApp']) {
  const result = context.doPost({ parameter: { name: 'Анна', phone: '+7 (999) 123-45-67', contactMethod: method, consent: 'yes' } });
  assert.equal(result.ok, true);
  assert.equal(result.responseId, 'record-1');
  assert(items.includes(method));
}
for (const bad of [{name:''}, {phone:'abc'}, {contactMethod:'Email'}, {consent:''}]) {
  assert.equal(context.doPost({ parameter: { name: 'Анна', phone: '89991234567', contactMethod: 'Telegram', consent: 'yes', ...bad } }).ok, false);
}
assert.equal(context.doPost().ok, false);
assert.equal(submitted, 3);
console.log('PASS: personal data removed, assets and anchors valid; Google handler accepts all 3 messengers and rejects invalid input without saving.');
