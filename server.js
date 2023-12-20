const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: 'https://literate-dollop-nine.vercel.app' // Your frontend domain
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    twitterUsername: String,
    telegramUsername: String,
    solanaAddress: { type: String, unique: true },
    referralCount: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/submit', async (req, res) => {
    try {
        const { twitterUsername, telegramUsername, userAddress, refereeAddress } = req.body;

        // Check if user already exists with any of the provided details
        console.log('Checking for existing user...');
        console.log('userAddress:', userAddress);
        console.log('twitterUsername:', twitterUsername);
        console.log('telegramUsername:', telegramUsername);
        
        const existingUser = await User.findOne({
            $or: [
                { solanaAddress: userAddress },
                { twitterUsername: twitterUsername },
                { telegramUsername: telegramUsername }
            ]
        });
        
        console.log('Existing user:', existingUser);
        
        if (existingUser) {
            console.log('User already exists with provided details');
            return res.status(400).send('User already exists with provided details');
        }

        // Create new user
        const newUser = new User({
            twitterUsername,
            telegramUsername,
            solanaAddress: userAddress,
            referralCount: 0
        });
        await newUser.save();

        // Update referee's referral count, if provided
        if (refereeAddress) {
            await User.findOneAndUpdate({ solanaAddress: refereeAddress }, { $inc: { referralCount: 1 } });
        }

        res.status(200).send('Registration successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during registration');
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
app.get('/referrals/:userAddress', async (req, res) => {
    try {
        const userAddress = req.params.userAddress;
        const user = await User.findOne({ solanaAddress: userAddress });
        
        if (user) {
            res.json({ referralCount: user.referralCount });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Define the CSV file header
const csvHeader = [
    { id: 'twitterUsername', title: 'Twitter Username' },
    { id: 'telegramUsername', title: 'Telegram Username' },
    { id: 'solanaAddress', title: 'Solana Address' },
    { id: 'referralCount', title: 'Referral Count' }
];

// Create a CSV writer
const csvWriter = createCsvWriter({
    path: 'user_data.csv', // Specify the CSV file path
    header: csvHeader
});

// Your route for exporting data to CSV
app.get('/export-csv', async (req, res) => {
    try {
        // Fetch user data from the database (adjust this part based on your data retrieval)
        const userData = await User.find({}, { _id: 0, __v: 0 });

        // Write the data to the CSV file
        await csvWriter.writeRecords(userData);

        res.status(200).send('Data exported to CSV successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exporting data to CSV');
    }
});
