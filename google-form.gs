// Paste into a standalone Google Apps Script project owned by the form owner.
// Run setupGoogleForm once, then deploy as a web app (execute as you; Anyone).
const TARGET_FORM_ID = '1Ums8vlFJ8WD4pKooGqBVdIOpYEIMLQRiG_DEFx4xbOc';

function setupGoogleForm() {
  const props = PropertiesService.getScriptProperties();
  const existing = props.getProperty('FORM_ID');
  if (existing === TARGET_FORM_ID && props.getProperty('NAME_ID') && props.getProperty('PHONE_ID') && props.getProperty('METHOD_ID') && props.getProperty('CONSENT_ID')) {
    console.log(FormApp.openById(existing).getEditUrl());
    return;
  }
  const form = FormApp.openById(TARGET_FORM_ID);
  // Reuse compatible questions; append missing questions without deleting existing ones.
  const textItem = (titles, title) => {
    const existingItem = form.getItems(FormApp.ItemType.TEXT).find(item => titles.includes(item.getTitle().trim().toLowerCase()));
    return existingItem ? existingItem.asTextItem() : form.addTextItem().setTitle(title).setRequired(true);
  };
  const name = textItem(['имя', 'ваше имя', 'как к вам обращаться'], 'Имя');
  const phone = textItem(['телефон', 'ваш телефон', 'номер телефона'], 'Телефон');
  const choices = ['Telegram', 'Макс', 'WhatsApp'];
  const methodItem = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE).find(item =>
    item.getTitle().trim().toLowerCase() === 'удобный способ связи' &&
    choices.every(value => item.asMultipleChoiceItem().getChoices().some(choice => choice.getValue() === value)));
  const method = methodItem ? methodItem.asMultipleChoiceItem() : form.addMultipleChoiceItem()
    .setTitle('Удобный способ связи').setChoiceValues(choices).setRequired(true);
  const consent = textItem(['согласие на обработку обращения'], 'Согласие на обработку обращения');
  props.setProperties({ FORM_ID: form.getId(), NAME_ID: String(name.getId()),
    PHONE_ID: String(phone.getId()), METHOD_ID: String(method.getId()), CONSENT_ID: String(consent.getId()) });
  console.log(form.getEditUrl());
}

function doPost(event) {
  try {
    const data = event && event.parameter || {};
    const name = String(data.name || '').trim();
    const phone = String(data.phone || '').trim();
    const digits = phone.replace(/\D/g, '');
    if (!name || name.length > 80 || !/^[+0-9 ()-]{10,22}$/.test(phone) || digits.length < 10 || digits.length > 15 ||
        !['Telegram', 'Макс', 'WhatsApp'].includes(data.contactMethod) || data.consent !== 'yes') {
      return jsonResponse({ ok: false });
    }
    const props = PropertiesService.getScriptProperties();
    const form = FormApp.openById(props.getProperty('FORM_ID'));
    const result = form.createResponse()
      .withItemResponse(form.getItemById(Number(props.getProperty('NAME_ID'))).asTextItem().createResponse(name))
      .withItemResponse(form.getItemById(Number(props.getProperty('PHONE_ID'))).asTextItem().createResponse(phone))
      .withItemResponse(form.getItemById(Number(props.getProperty('METHOD_ID'))).asMultipleChoiceItem().createResponse(data.contactMethod))
      .withItemResponse(form.getItemById(Number(props.getProperty('CONSENT_ID'))).asTextItem().createResponse('Да, для ответа на обращение'))
      .submit();
    return jsonResponse({ ok: true, responseId: result.getId() });
  } catch (error) {
    // Do not expose submitted personal information or internal errors.
    return jsonResponse({ ok: false });
  }
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
