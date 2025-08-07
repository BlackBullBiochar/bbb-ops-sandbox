import React, { useState } from 'react';
import styles from './Form.module.css';

const Form = ({ fields = [], onSubmit }) => {
  const initialData = fields.reduce((acc, field) => {
    if (field.type === 'checkbox') {
      acc[field.name] = [];
    } else {
      acc[field.name] = '';
    }
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialData);
  const [otherValues, setOtherValues] = useState({});

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, option) => {
    setFormData(prev => {
      const selected = new Set(prev[name]);
      selected.has(option) ? selected.delete(option) : selected.add(option);
      return { ...prev, [name]: Array.from(selected) };
    });
  };

  const handleRadioChange = (name, value, hasOther) => {
    handleChange(name, value);
    if (hasOther && value !== 'Other') {
      setOtherValues(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const combined = { ...formData };
    for (const key in otherValues) {
      if (formData[key] === 'Other') {
        combined[key] = otherValues[key];
      }
    }
    onSubmit?.(combined);
  };

  const renderField = (field) => {
    const { name, label, type, required, options = [] } = field;
    const value = formData[name];

    switch (type) {
      case 'text':
        return (
          <label key={name} className={styles.label}>
            {label}
            <input
              type="text"
              name={name}
              className={styles.input}
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              required={required}
            />
          </label>
        );
      case 'textarea':
        return (
          <label key={name} className={styles.label}>
            {label}
            <textarea
              name={name}
              className={styles.textarea}
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              rows={4}
              required={required}
            />
          </label>
        );
      case 'select':
        return (
          <label key={name} className={styles.label}>
            {label}
            <select
              name={name}
              className={styles.input}
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              required={required}
            >
              <option value="">Select...</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        );
      case 'radio':
      case 'radio+text':
        return (
          <fieldset key={name} className={styles.fieldset}>
            <legend>{label}</legend>
            {options.map(opt => (
              <label key={opt} className={styles.radioOption}>
                <input
                  type="radio"
                  name={name}
                  value={opt}
                  checked={value === opt}
                  onChange={() => handleRadioChange(name, opt, type === 'radio+text')}
                  required={required}
                />
                {opt}
              </label>
            ))}
            {type === 'radio+text' && (
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name={name}
                  value="Yes"
                  checked={value === 'Yes'}
                  onChange={() => handleRadioChange(name, 'Yes', true)}
                />
                Yes:
                {value === 'Yes' && (
                  <input
                    type="text"
                    className={styles.input}
                    value={otherValues[name] || ''}
                    onChange={(e) =>
                      setOtherValues(prev => ({ ...prev, [name]: e.target.value }))
                    }
                    placeholder="Please specify"
                    required={required}
                  />
                )}
              </label>
            )}
          </fieldset>
        );
      case 'checkbox':
        return (
          <fieldset key={name} className={styles.fieldset}>
            <legend>{label}</legend>
            {options.map(opt => (
              <label key={opt} className={styles.checkboxOption}>
                <input
                  type="checkbox"
                  name={name}
                  value={opt}
                  checked={formData[name]?.includes(opt)}
                  onChange={() => handleCheckboxChange(name, opt)}
                />
                {opt}
              </label>
            ))}
          </fieldset>
        );
      case 'datetime-local':
        return (
            <div className={styles.formGroup} key={field.name}>
            <label className={styles.label} htmlFor={field.name}>{field.label}</label>
            <input
                type="date"
                id={field.name}
                name={field.name}
                className={styles.input}
                value={formData[field.name] || field.defaultValue || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
            />
            </div>
        );
      case 'radio+compound': {
        const { options = [], compound = {} } = field;

        return (
            <fieldset key={name} className={styles.fieldset}>
            <legend>{label}</legend>

            {options.map((opt) => (
                <label key={opt} className={styles.radioOption}>
                <input
                    type="radio"
                    name={name}
                    value={opt}
                    checked={value === opt}
                    onChange={() => handleChange(name, opt)}
                    required={required}
                />
                {opt}
                </label>
            ))}

            {value === compound?.showIf &&
                compound?.fields?.map(subField => renderField(subField))}
            </fieldset>
        );
        }

      default:
        return null;
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {fields.map(renderField)}
      <button type="submit" className={styles.button}>Submit</button>
    </form>
  );
};

export default Form;
