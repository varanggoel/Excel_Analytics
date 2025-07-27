const express = require('express');
const { auth, admin } = require('../middleware/auth');
const User = require('../models/User');
const File = require('../models/File');
const Analytics = require('../models/Analytics');

const router = express.Router();

// @route GET /api/users/profile
// @desc Get user profile
// @access Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get additional stats
        const filesCount = await File.countDocuments({ uploadedBy: req.user.userId });
        const analyticsCount = await Analytics.countDocuments({ userId: req.user.userId });

        res.json({
            ...user.toObject(),
            stats: {
                filesUploaded: filesCount,
                analyticsCreated: analyticsCount,
                storageUsed: user.storageUsed
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// @route GET /api/users/dashboard
// @desc Get user dashboard data
// @access Private
router.get('/dashboard', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get recent files
        const recentFiles = await File.find({ uploadedBy: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('originalName fileSize status createdAt');

        // Get recent analytics
        const recentAnalytics = await Analytics.find({ userId })
            .populate('fileId', 'originalName')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('chartType chartConfig.title createdAt viewCount');

        // Get statistics
        const totalFiles = await File.countDocuments({ uploadedBy: userId });
        const totalAnalytics = await Analytics.countDocuments({ userId });
        const totalViews = await Analytics.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
        ]);

        const user = await User.findById(userId).select('storageUsed');

        // Chart type distribution
        const chartTypeStats = await Analytics.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            { $group: { _id: '$chartType', count: { $sum: 1 } } }
        ]);

        res.json({
            stats: {
                totalFiles,
                totalAnalytics,
                totalViews: totalViews[0]?.totalViews || 0,
                storageUsed: user.storageUsed
            },
            recentFiles,
            recentAnalytics,
            chartTypeStats
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// @route GET /api/users/admin/all
// @desc Get all users (admin only)
// @access Private (Admin)
router.get('/admin/all', auth, admin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role, isActive } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        // Get additional stats for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const filesCount = await File.countDocuments({ uploadedBy: user._id });
            const analyticsCount = await Analytics.countDocuments({ userId: user._id });
            
            return {
                ...user.toObject(),
                stats: {
                    filesUploaded: filesCount,
                    analyticsCreated: analyticsCount
                }
            };
        }));

        res.json({
            users: usersWithStats,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// @route PUT /api/users/admin/:id/status
// @desc Update user status (admin only)
// @access Private (Admin)
router.put('/admin/:id/status', auth, admin, async (req, res) => {
    try {
        const { isActive } = req.body;
        const userId = req.params.id;

        // Prevent admin from deactivating themselves
        if (userId === req.user.userId) {
            return res.status(400).json({ message: 'Cannot modify your own status' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ message: 'Error updating user status' });
    }
});

// @route PUT /api/users/admin/:id/role
// @desc Update user role (admin only)
// @access Private (Admin)
router.put('/admin/:id/role', auth, admin, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Prevent admin from changing their own role
        if (userId === req.user.userId) {
            return res.status(400).json({ message: 'Cannot modify your own role' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: `User role updated to ${role} successfully`,
            user
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Error updating user role' });
    }
});

// @route DELETE /api/users/admin/:id
// @desc Delete user (admin only)
// @access Private (Admin)
router.delete('/admin/:id', auth, admin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (userId === req.user.userId) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete user's files and analytics
        await File.deleteMany({ uploadedBy: userId });
        await Analytics.deleteMany({ userId });

        // Delete user
        await User.findByIdAndDelete(userId);

        res.json({ message: 'User and associated data deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// @route GET /api/users/admin/stats
// @desc Get admin dashboard stats
// @access Private (Admin)
router.get('/admin/stats', auth, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const totalFiles = await File.countDocuments();
        const totalAnalytics = await Analytics.countDocuments();

        // Get user registrations over time (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const userRegistrations = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get file uploads over time
        const fileUploads = await File.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get storage usage
        const storageStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalStorage: { $sum: '$storageUsed' },
                    avgStorage: { $avg: '$storageUsed' }
                }
            }
        ]);

        res.json({
            overview: {
                totalUsers,
                activeUsers,
                totalFiles,
                totalAnalytics
            },
            charts: {
                userRegistrations,
                fileUploads
            },
            storage: storageStats[0] || { totalStorage: 0, avgStorage: 0 }
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
});

module.exports = router;
