import { useCallback, useEffect, useState } from 'react'
import {
  useBeforeUnload,
  useBlocker,
  useNavigate,
  useParams,
} from 'react-router-dom'
import apiRequest from '../api'
import Dialog from '../components/Dialog'
import DynamicReportFields from '../components/DynamicReportFields'
import ReportContent from '../components/ReportContent'

const currentYear = new Date().getFullYear()

function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  )
}

function ReportWizardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editingExisting = Boolean(id)
  const [step, setStep] = useState(editingExisting ? 2 : 1)
  const [categories, setCategories] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [category, setCategory] = useState(null)
  const [template, setTemplate] = useState(null)
  const [draftId, setDraftId] = useState(id || null)
  const [title, setTitle] = useState('')
  const [year, setYear] = useState(currentYear)
  const [content, setContent] = useState({})
  const [previewReport, setPreviewReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const blocker = useBlocker(dirty)

  useBeforeUnload(
    useCallback(
      (event) => {
        if (dirty) {
          event.preventDefault()
          event.returnValue = ''
        }
      },
      [dirty],
    ),
  )

  useEffect(() => {
    let active = true

    async function loadInitialData() {
      setLoading(true)
      setError('')

      try {
        if (editingExisting) {
          const data = await apiRequest(`/reports/${id}`)
          const report = data.report

          if (report.status !== 'osnutek') {
            throw new Error('Urejati je mogoče samo osnutke')
          }

          if (!active) {
            return
          }

          setCategory({
            id: report.kategorija_id,
            naziv: report.kategorija_naziv,
          })
          setTemplate({
            id: report.predloga_id,
            naziv: report.predloga_naziv,
            struktura_obrazca: report.struktura_obrazca,
          })
          setTitle(report.naslov)
          setYear(report.arhivirno_leto)
          setContent(report.vsebina_obrazca || {})
        } else {
          const data = await apiRequest('/categories')

          if (active) {
            setCategories(Array.isArray(data.categories) ? data.categories : [])
          }
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInitialData()
    return () => {
      active = false
    }
  }, [editingExisting, id])

  useEffect(() => {
    if (editingExisting || !selectedCategoryId) {
      return undefined
    }

    let active = true

    async function loadTemplates() {
      setLoadingTemplates(true)
      setError('')

      try {
        const data = await apiRequest(
          `/templates?category=${selectedCategoryId}`,
        )

        if (active) {
          setTemplates(Array.isArray(data.templates) ? data.templates : [])
        }
      } catch (requestError) {
        if (active) {
          setTemplates([])
          setError(requestError.message)
        }
      } finally {
        if (active) {
          setLoadingTemplates(false)
        }
      }
    }

    loadTemplates()
    return () => {
      active = false
    }
  }, [editingExisting, selectedCategoryId])

  function handleCategoryChange(event) {
    setSelectedCategoryId(event.target.value)
    setSelectedTemplateId('')
    setTemplates([])
  }

  function startEditing() {
    const selectedCategory = categories.find(
      (item) => String(item.id) === selectedCategoryId,
    )
    const selectedTemplate = templates.find(
      (item) => String(item.id) === selectedTemplateId,
    )

    if (!selectedCategory || !selectedTemplate) {
      return
    }

    setCategory(selectedCategory)
    setTemplate(selectedTemplate)
    setTitle(
      `${selectedCategory.naziv} - ${selectedTemplate.naziv} ${currentYear}`,
    )
    setYear(currentYear)
    setContent({})
    setDirty(true)
    setStep(2)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateTitle(event) {
    setTitle(event.target.value)
    setDirty(true)
  }

  function updateYear(event) {
    setYear(event.target.value)
    setDirty(true)
  }

  function updateContent(name, value) {
    setContent((current) => ({ ...current, [name]: value }))
    setDirty(true)
  }

  function buildPayload(validateRequiredFields) {
    const normalizedTitle = title.trim()
    const numericYear = Number(year)

    if (!normalizedTitle || normalizedTitle.length > 200) {
      throw new Error('Naslov mora vsebovati od 1 do 200 znakov')
    }

    if (!Number.isInteger(numericYear) || numericYear < 1) {
      throw new Error('Arhivsko leto mora biti veljavno število')
    }

    if (validateRequiredFields) {
      const missingFields = (template.struktura_obrazca || [])
        .filter((field) => field.required && isEmpty(content[field.name]))
        .map((field) => field.label || field.name)

      if (missingFields.length > 0) {
        throw new Error(`Manjkajo obvezna polja: ${missingFields.join(', ')}`)
      }
    }

    return {
      naslov: normalizedTitle,
      arhivirno_leto: numericYear,
      predloga_id: template.id,
      kategorija_id: category.id,
      vsebina_obrazca: content,
    }
  }

  async function persistDraft(validateRequiredFields) {
    const payload = buildPayload(validateRequiredFields)
    const path = draftId ? `/reports/${draftId}` : '/reports'
    const method = draftId ? 'PUT' : 'POST'

    setSaving(true)

    try {
      const data = await apiRequest(path, {
        method,
        body: JSON.stringify(payload),
      })
      setDraftId(data.report.id)
      setTitle(data.report.naslov)
      setPreviewReport(data.report)
      setDirty(false)
      return data.report
    } finally {
      setSaving(false)
    }
  }

  async function saveAndReview(event) {
    event.preventDefault()
    setError('')

    try {
      await persistDraft(true)
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  async function saveAndLeave() {
    setDialogError('')

    try {
      await persistDraft(false)

      if (blocker.state === 'blocked') {
        blocker.proceed()
      }
    } catch (saveError) {
      setDialogError(saveError.message)
    }
  }

  function leaveWithoutSaving() {
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }

  function stayOnPage() {
    setDialogError('')

    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }

  async function submitReport() {
    setSubmitting(true)
    setError('')

    try {
      await apiRequest(`/reports/${draftId}/submit`, { method: 'POST' })
      navigate('/my-reports', {
        replace: true,
        state: { success: 'Poročilo je bilo uspešno oddano v arhiv.' },
      })
    } catch (submitError) {
      setConfirmSubmit(false)
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="loading-message">Nalagam obrazec …</p>
  }

  if (error && editingExisting && !template) {
    return (
      <section className="page-panel">
        <p className="message message-error" role="alert">
          {error}
        </p>
        <button type="button" onClick={() => navigate('/my-reports')}>
          Nazaj na moja poročila
        </button>
      </section>
    )
  }

  return (
    <section className="page-panel report-wizard">
      <h1>{editingExisting ? 'Uredi poročilo' : 'Novo poročilo'}</h1>
      <WizardSteps currentStep={step} />

      {error && (
        <p className="message message-error" role="alert">
          {error}
        </p>
      )}

      {step === 1 && (
        <TemplateStep
          categories={categories}
          templates={templates}
          selectedCategoryId={selectedCategoryId}
          selectedTemplateId={selectedTemplateId}
          loadingTemplates={loadingTemplates}
          onCategoryChange={handleCategoryChange}
          onTemplateChange={(event) =>
            setSelectedTemplateId(event.target.value)
          }
          onContinue={startEditing}
          onCancel={() => navigate('/my-reports')}
        />
      )}

      {step === 2 && template && (
        <EditingStep
          category={category}
          template={template}
          title={title}
          year={year}
          content={content}
          saving={saving}
          onTitleChange={updateTitle}
          onYearChange={updateYear}
          onContentChange={updateContent}
          onCancel={() => navigate('/my-reports')}
          onSubmit={saveAndReview}
        />
      )}

      {step === 3 && previewReport && (
        <ReviewStep
          report={previewReport}
          submitting={submitting}
          onBack={() => {
            setError('')
            setStep(2)
          }}
          onSubmit={() => setConfirmSubmit(true)}
        />
      )}

      {blocker.state === 'blocked' && (
        <Dialog
          title="Neshranjene spremembe"
          actions={
            <>
              <button type="button" onClick={saveAndLeave} disabled={saving}>
                {saving ? 'Shranjujem …' : 'Shrani osnutek'}
              </button>
              <button
                className="warning-button"
                type="button"
                onClick={leaveWithoutSaving}
                disabled={saving}
              >
                Zapusti brez shranjevanja
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={stayOnPage}
                disabled={saving}
              >
                Ostani na strani
              </button>
            </>
          }
        >
          <p>Obrazec vsebuje spremembe, ki še niso shranjene.</p>
          {dialogError && (
            <p className="message message-error" role="alert">
              {dialogError}
            </p>
          )}
        </Dialog>
      )}

      {confirmSubmit && (
        <Dialog
          title="Oddaja poročila"
          actions={
            <>
              <button type="button" onClick={submitReport} disabled={submitting}>
                {submitting ? 'Oddajam …' : 'Oddaj v arhiv'}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setConfirmSubmit(false)}
                disabled={submitting}
              >
                Prekliči
              </button>
            </>
          }
        >
          <p>Poročila po oddaji ne bo več mogoče urejati.</p>
        </Dialog>
      )}
    </section>
  )
}

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

export default ReportWizardPage
