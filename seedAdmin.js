const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const username = "FixedOrthodontics";
        const email = "admin@fixedorthodontics.com"; // Placeholder email
        const password = "FixedOrthodontics@2025";

        let admin = await User.findOne({ name: username });

        if (admin) {
            console.log('Admin user already exists. Updating role...');
            admin.role = 'admin';
            admin.password = await bcrypt.hash(password, await bcrypt.genSalt(10)); // Reset password to ensure it matches
            await admin.save();
            console.log('Admin user role updated to admin');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        admin = new User({
            name: username,
            email: email,
            password: hashedPassword,
            role: 'admin',
            phone: '0000000000',
            studentClass: 'Admin'
        });

        await admin.save();
        console.log('Admin user created successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
