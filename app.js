const express = require('express');
const app = express();
const path = require('path');
const passport = require('passport');
const initializePassport = require('./config/passport');
const sessionMiddleware = require('./config/session').sessionMiddLeware;
const authRoutes = require('./routes/auth');

initializePassport(passport);

app.use(express.json());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const routes = require('./routes/index');
app.use('/', routes);
app.use('/', authRoutes);

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});