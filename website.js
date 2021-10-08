const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('sync-fetch');

const ip = fetch('https://api.ipify.org/?format=text').text();
const app = express();
const port = 8000;

app.use(express.static('public'));
app.use(bodyParser.json());

app.set('views', './views');
app.set('view engine', 'ejs');

// Landing Page.
app.get('/', (req, res) => {
  res.render('pages/index', {ip:ip});
});

app.listen(port, () => console.info(`HTTP Server listening on port ${port}`));