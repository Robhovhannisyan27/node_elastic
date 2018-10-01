const express    = require('express');
const user       = require('./app/controllers/UserController');
const app        = express();
const bodyParser = require('body-parser');
const paginate   = require('express-paginate');

app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(paginate.middleware(2));

app.get('/api', function (req, res) {
    res.send('API is running');
});

app.post('/api/users', user.create);
app.post('/api/users/el', user.createEl)

app.get('/api/users/search', user.search);
app.get('/api/users/search/el', user.searchEl);

app.listen(3001);