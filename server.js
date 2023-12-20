const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // Use Railway's port or default to 3000

app.use(cors({
    origin: 'https://yourfrontenddomain.com' // Your frontend domain
}));
// Middleware to parse the body of the request
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route to display the registration form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle form submission
app.post('/submit', (req, res) => {
    // ...existing code...
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
