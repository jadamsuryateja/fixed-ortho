const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        next();
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @route   GET api/admin/enrollments
// @desc    Get all enrollments
// @access  Private/Admin
router.get('/enrollments', auth, adminAuth, async (req, res) => {
    try {
        const enrollments = await Enrollment.find().populate('userId', 'name email phone studentClass');
        res.json(enrollments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/enrollments/:id
// @desc    Update enrollment status
// @access  Private/Admin
router.put('/enrollments/:id', auth, adminAuth, async (req, res) => {
    const { status } = req.body;

    try {
        let enrollment = await Enrollment.findById(req.params.id);

        if (!enrollment) {
            return res.status(404).json({ msg: 'Enrollment not found' });
        }

        enrollment.status = status;
        await enrollment.save();

        res.json(enrollment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
