function PagePlaceholder({ title, description, compact = false }) {
  const content = (
    <section className="page-panel">
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
    </section>
  )

  return compact ? <main className="auth-shell">{content}</main> : content
}

export default PagePlaceholder
