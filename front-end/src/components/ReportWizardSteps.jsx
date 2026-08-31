import DynamicReportFields from './DynamicReportFields'
import ReportContent from './ReportContent'

function WizardSteps({ currentStep }) {
  const steps = [
    'Izbira predloge',
    'Urejanje',
    'Pregled in oddaja',
  ]

  return (
    <ol className="wizard-steps" aria-label="Koraki priprave poročila">
      {steps.map((label, index) => {
        const number = index + 1
        const className =
          number === currentStep
            ? 'current'
            : number < currentStep
              ? 'completed'
              : ''

        return (
          <li className={className} key={label}>
            {number}. {label}
          </li>
        )
      })}
    </ol>
  )
}

function TemplateStep({
  categories,
  templates,
  selectedCategoryId,
  selectedTemplateId,
  loadingTemplates,
  onCategoryChange,
  onTemplateChange,
  onContinue,
  onCancel,
}) {
  return (
    <div className="wizard-step">
      <h2>Izberi predlogo</h2>
      <label className="form-field" htmlFor="report-category">
        <span>Kategorija</span>
        <select
          id="report-category"
          value={selectedCategoryId}
          onChange={onCategoryChange}
        >
          <option value="">Izberi kategorijo</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.naziv}
            </option>
          ))}
        </select>
      </label>

      {selectedCategoryId && (
        <label className="form-field" htmlFor="report-template">
          <span>Predloga</span>
          <select
            id="report-template"
            value={selectedTemplateId}
            onChange={onTemplateChange}
            disabled={loadingTemplates}
          >
            <option value="">
              {loadingTemplates ? 'Nalagam predloge …' : 'Izberi predlogo'}
            </option>
            {templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.naziv}
              </option>
            ))}
          </select>
          {!loadingTemplates && templates.length === 0 && (
            <small>V tej kategoriji ni veljavnih predlog.</small>
          )}
        </label>
      )}

      <div className="form-actions">
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedTemplateId || loadingTemplates}
        >
          Nadaljuj
        </button>
        <button className="secondary-button" type="button" onClick={onCancel}>
          Prekliči
        </button>
      </div>
    </div>
  )
}

function EditingStep({
  category,
  template,
  title,
  year,
  content,
  saving,
  onTitleChange,
  onYearChange,
  onContentChange,
  onCancel,
  onSubmit,
}) {
  return (
    <form className="wizard-step report-form" onSubmit={onSubmit} noValidate>
      <h2>Uredi poročilo</h2>

      <dl className="locked-selection">
        <div>
          <dt>Kategorija</dt>
          <dd>{category.naziv}</dd>
        </div>
        <div>
          <dt>Predloga</dt>
          <dd>{template.naziv}</dd>
        </div>
      </dl>

      <label className="form-field" htmlFor="report-title">
        <span>Naslov</span>
        <input
          id="report-title"
          type="text"
          maxLength="200"
          value={title}
          onChange={onTitleChange}
        />
      </label>

      <label className="form-field" htmlFor="report-year">
        <span>Arhivsko leto</span>
        <input
          id="report-year"
          type="number"
          min="1"
          value={year}
          onChange={onYearChange}
        />
      </label>

      <DynamicReportFields
        fields={template.struktura_obrazca}
        values={content}
        onChange={onContentChange}
      />

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Shranjujem …' : 'Shrani in preglej'}
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Prekliči
        </button>
      </div>
    </form>
  )
}

function ReviewStep({ report, submitting, onBack, onSubmit }) {
  return (
    <div className="wizard-step review-step">
      <ReportContent report={report} />
      <div className="form-actions">
        <button type="button" onClick={onSubmit} disabled={submitting}>
          Oddaj v arhiv
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={onBack}
          disabled={submitting}
        >
          Nazaj na urejanje
        </button>
      </div>
    </div>
  )
}

export { EditingStep, ReviewStep, TemplateStep, WizardSteps }
