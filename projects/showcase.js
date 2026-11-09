/* Shared, progressively enhanced navigation for the project case studies. */
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('a[data-project-link]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reducedMotion.matches) return;
      event.preventDefault();
      document.body.classList.add('project-leaving');
      window.setTimeout(() => { location.href = link.href; }, 180);
    });
  });
  window.addEventListener('pageshow', () => document.body.classList.remove('project-leaving'));
  document.querySelectorAll('[data-project-filter]').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.projectFilter;
      document.querySelectorAll('[data-project-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelectorAll('[data-project-group]').forEach(group => { group.hidden = filter !== 'all' && group.dataset.projectGroup !== filter; });
      const status = document.getElementById('project-filter-status');
      if (status) status.textContent = filter === 'all' ? 'Showing all 7 projects.' : filter === 'systems' ? 'Showing 3 business systems.' : 'Showing 4 machine learning projects.';
    });
  });
})();
