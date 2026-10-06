function RoutePage({ eyebrow, title, description }) {
  return (
    <section className="route-panel" aria-labelledby="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="page-title">{title}</h1>
      <p className="route-description" role="status">
        {description}
      </p>
    </section>
  );
}

export default RoutePage;
