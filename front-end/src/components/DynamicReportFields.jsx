function DynamicReportFields({ fields, values, onChange }) {
  if (!Array.isArray(fields) || fields.length === 0) {
    return <p className="empty-message">Predloga nima dodatnih polj.</p>
  }

  return fields.map((field, index) => {
    const name = field.name || `field_${index}`
    const label = field.label || name
    const type = field.type || field.tip || 'text'
    const value = values[name]

    return (
      <label className="form-field" key={name} htmlFor={`report-${name}`}>
        <span>
          {label} {field.required && <small>(obvezno)</small>}
        </span>
        <FieldInput
          field={field}
          id={`report-${name}`}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
        />
      </label>
    )
  })
}

function FieldInput({ field, id, name, type, value, onChange }) {
  if (type === 'textarea') {
    return (
      <textarea
        id={id}
        name={name}
        rows="6"
        placeholder={field.placeholder || ''}
        value={value ?? ''}
        onChange={(event) => onChange(name, event.target.value)}
      />
    )
  }

  if (type === 'select' && Array.isArray(field.options)) {
    return (
      <select
        id={id}
        name={name}
        value={value ?? ''}
        onChange={(event) => onChange(name, event.target.value)}
      >
        <option value="">Izberi</option>
        {field.options.map((option) => {
          const optionValue =
            typeof option === 'object' ? option.value : option
          const optionLabel =
            typeof option === 'object' ? option.label : option

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
    )
  }

  if (type === 'checkbox') {
    return (
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(name, event.target.checked)}
      />
    )
  }

  const inputType = ['date', 'number'].includes(type) ? type : 'text'

  return (
    <input
      id={id}
      name={name}
      type={inputType}
      placeholder={field.placeholder || ''}
      value={value ?? ''}
      onChange={(event) => onChange(name, event.target.value)}
    />
  )
}

export default DynamicReportFields
