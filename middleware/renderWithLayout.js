exports.renderWithLayout = (res, view, options = {}) => {
  res.render(view, options, (err, html) => {
    if (err) {
      console.error('View render error:', err);
      return res.status(500).send('Error rendering view');
    }
    res.render('layout', { ...options, body: html }, (err, html) => {
      if (err) {
        console.error('Layout render error:', err);
        return res.status(500).send('Error rendering layout');
      }
      res.send(html);
    });
  });
}