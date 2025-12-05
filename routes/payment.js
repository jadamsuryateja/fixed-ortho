const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Enrollment = require('../models/Enrollment');
const auth = require('../middleware/auth');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   GET api/payment/my-enrollments
// @desc    Get logged in user's enrollments
// @access  Private
router.get('/my-enrollments', auth, async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(enrollments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/payment/create-order
// @desc    Create Razorpay Order
// @access  Private
router.post('/create-order', auth, async (req, res) => {
    const { amount, currency = 'INR' } = req.body;

    const options = {
        amount: amount * 100, // amount in smallest currency unit
        currency,
        receipt: `receipt_${Date.now()}`
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/payment/verify
// @desc    Verify Payment and Create Enrollment
// @access  Private
router.post('/verify', auth, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, courseName, userId, amount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        try {
            // Create Enrollment Record
            const enrollment = new Enrollment({
                userId,
                courseId,
                courseName,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount,
                status: 'completed' // Initial status after payment
            });

            await enrollment.save();

            res.json({ msg: 'Payment Successful', enrollmentId: enrollment._id });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error saving enrollment');
        }
    } else {
        res.status(400).json({ msg: 'Payment verification failed' });
    }
});

module.exports = router;
