const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    twitterUsername: String,
    telegramUsername: String,
    solanaAddress: { type: String, unique: true },
    referralCount: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

app.use(cors({
    origin: 'https://literate-dollop-nine.vercel.app/' // Your frontend domain
}));
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/submit', async (req, res) => {
    try {
        const { twitterUsername, telegramUsername, userAddress, refereeAddress } = req.body;
        let user = await User.findOne({ solanaAddress: userAddress });

        if (!user) {
            user = new User({
                twitterUsername,
                telegramUsername,
                solanaAddress: userAddress,
                referralCount: 0
            });
            await user.save();

            if (refereeAddress) {
                await User.findOneAndUpdate({ solanaAddress: refereeAddress }, { $inc: { referralCount: 1 } });
            }
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
