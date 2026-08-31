function Dialog({ title, children, actions }) {
  return (
    <div className="dialog-backdrop">
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <h2 id="dialog-title">{title}</h2>
        <div className="dialog-content">{children}</div>
        <div className="dialog-actions">{actions}</div>
      </section>
    </div>
  )
}

export default Dialog
