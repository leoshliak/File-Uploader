function renderWithLayout(res, view, options = {}) {
  res.render(view, options, (err, html) => {
    if (err) throw err;
    res.render('layout', { ...options, body: html });
  });
}

exports.getHomePage = (req, res) => {
    renderWithLayout(res, 'pages/home', {title: 'Home Page', user: req.user});
}

exports.getRegisterPage = (req, res) => {
renderWithLayout(res, 'pages/sign-up', {title: 'Register'});
}