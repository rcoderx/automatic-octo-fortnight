const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

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

app.post('/submit', async (req, res) => {
    try {
        const { twitterUsername, telegramUsername, userAddress, refereeAddress } = req.body;

        // Check if user already exists with any of the provided details
        const existingUser = await User.findOne({
            $or: [
                { solanaAddress: userAddress },
                { twitterUsername: twitterUsername },
                { telegramUsername: telegramUsername }
            ]
        });

        if (existingUser) {
            return res.status(400).send('User already exists with provided details');
        }

        // Create a new user
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