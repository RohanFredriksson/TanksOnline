const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 8000;

app.use(express.static('public'));
app.use(bodyParser.json());

app.set('views', './views');
app.set('view engine', 'ejs');

// Landing Page.
app.get('/', (req, res) => {
  res.render('pages/index');
});

app.listen(port, () => console.info(`Listening on port ${port}`));