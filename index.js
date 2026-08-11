const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());

require('dotenv').config();
// Routes



app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});