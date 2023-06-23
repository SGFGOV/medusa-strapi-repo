import React, { useEffect, useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Select, Option } from '@strapi/design-system/Select'
import { useIntl } from 'react-intl'
import getTrad from '../../utils/getTrad'

const CountriesSelect = ({
  value,
  onChange,
  name,
  intlLabel,
  labelAction,
  required,
  attribute,
  description,
  placeholder,
  disabled,
  error,
}) => {
  const [allIsSelected, setAllIsSelected] = useState(false)

  const { formatMessage, messages } = useIntl()
  const parsedOptions = JSON.parse(messages[getTrad('countries')])

  const possibleOptions = useMemo(() => {
    return [
      ...(attribute['extra-options'] || [])
        .map((option) => {
          const [label, value] = [...option.split(':'), option]
          if (!label || !value) return null
          return { label, value }
        })
        .filter(Boolean),
      ...Object.entries(parsedOptions).map(([value, label]) => ({
        label,
        value,
      })),
    ]
  }, [attribute])

  const sanitizedValue = useMemo(() => {
    let parsedValue
    try {
      parsedValue = JSON.parse(value || '[]')
    } catch (e) {
      parsedValue = []
    }
    return Array.isArray(parsedValue)
      ? parsedValue.filter((val) =>
          possibleOptions.some((option) => option.value === val),
        )
      : []
  }, [value, possibleOptions])

  const handleChange = (val) => {
    onChange({
      target: {
        name,
        value: JSON.stringify(val),
        type: attribute.type,
      },
    })
  }

  useEffect(() => {
    value.indexOf('ALL') !== -1
      ? setAllIsSelected(true)
      : setAllIsSelected(false)
  }, [value])

  useEffect(() => {
    if (JSON.stringify(JSON.parse(value)) !== JSON.stringify(sanitizedValue)) {
      handleChange(sanitizedValue)
    }
  }, [sanitizedValue])

  return (
    <Select
      name={name}
      id={name}
      label={formatMessage(intlLabel)}
      error={error}
      disabled={disabled}
      required={required}
      hint={description && formatMessage(description)}
      onChange={(v) => {
        if (v.includes('ALL')) {
          v = ['ALL']
        }
        handleChange(v.filter(Boolean))
      }}
      placeholder={placeholder}
      multi
      value={sanitizedValue}
      withTags>
      {possibleOptions.map(({ label, value }) => (
        <Option
          value={value}
          key={value}
          style={{
            opacity: label !== 'ALL' && allIsSelected ? 0.5 : 1,
            cursor:
              value !== 'ALL' && allIsSelected ? 'not-allowed' : 'pointer',
          }}>
          {label}
        </Option>
      ))}
    </Select>
  )
}

CountriesSelect.defaultProps = {
  description: null,
  disabled: false,
  error: null,
  labelAction: null,
  required: false,
  value: '',
}

CountriesSelect.propTypes = {
  intlLabel: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  attribute: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.object,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  labelAction: PropTypes.object,
  required: PropTypes.bool,
  value: PropTypes.string,
}

export default CountriesSelect
