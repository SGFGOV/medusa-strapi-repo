import { prefixPluginTranslations } from '@strapi/helper-plugin'
import pluginId from './pluginId'
import CountrySelectIcon from './components/MultiCountriesSelectIcon'
import getTrad from './utils/getTrad'
import countries from 'i18n-iso-countries'

export default {
  register(app) {
    app.customFields.register({
      name: 'countries',
      pluginId: 'multi-country-select',
      type: 'json',
      icon: CountrySelectIcon,
      intlLabel: {
        id: getTrad('multi-country-select.label'),
        defaultMessage: 'Multi Countries',
      },
      intlDescription: {
        id: getTrad('multi-country-select.description'),
        defaultMessage: 'Select multiple countries',
      },
      components: {
        Input: async () => import('./components/MultiCountriesSelect'),
      },
      options: {
        base: [
          {
            sectionTitle: null,
            items: [
              {
                name: 'options.extra-options',
                type: 'textarea-enum',
                intlLabel: {
                  id: getTrad('multi-country-select.extra-options.label'),
                  defaultMessage: 'Add more options to the select menu',
                },
                description: {
                  id: getTrad('multi-country-select.extra-options.description'),
                  defaultMessage:
                    'One option per line, in the format value:label',
                },
                placeholder: {
                  id: getTrad('multi-country-select.extra-options.placeholder'),
                  defaultMessage: 'Ex:\nMN:MOON\nMRS:MARS\nNEP:NEPTUNE',
                },
              },
            ],
          },
        ],
        advanced: [
          {
            sectionTitle: {
              id: 'global.settings',
              defaultMessage: 'Settings',
            },
            items: [
              {
                name: 'options.required',
                type: 'checkbox',
                intlLabel: {
                  id: 'form.attribute.item.requiredField',
                  defaultMessage: 'Required field',
                },
                description: {
                  id: 'form.attribute.item.requiredField.description',
                  defaultMessage:
                    "You won't be able to create an entry if this field is empty",
                },
              },
            ],
          },
        ],
      },
    })
  },

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return Promise.all([
          import(`./translations/${locale}.json`),
          import(`i18n-iso-countries/langs/${locale}.json`),
        ])
          .then(([pluginTranslations, countryTranslations]) => {
            countries.registerLocale(countryTranslations.default)

            return {
              data: {
                ...prefixPluginTranslations(
                  pluginTranslations.default,
                  pluginId,
                ),
                [`${pluginId}.countries`]: JSON.stringify(
                  countries.getNames(locale),
                ),
              },
              locale,
            }
          })
          .catch(() => {
            return {
              data: {},
              locale,
            }
          })
      }),
    )
    return Promise.resolve(importedTrads)
  },
}
