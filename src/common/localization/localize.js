import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './translations/en-US.json'
import fr from './translations/fr-FR.json'
import cn from './translations/zh-CN.json'
import tw from './translations/zh-TW.json'
import ru from './translations/ru-RU.json'

export let supportedLanguages = {
    'en-US': en,
    'fr-FR': fr,
    'zh-CN': cn,
    'zh-TW': tw,
    'ru-RU': ru,
}

export async function initLocalizations() {
    return i18next
        .use(LanguageDetector)
        .init({
            fallbackLng: 'en-US',
            debug: false,
            supportedLngs: Object.keys(supportedLanguages),
            resources: supportedLanguages
        }, function(err, t) {})
}
