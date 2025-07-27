const express = require('express');
const XLSX = require('xlsx');
const { auth, admin } = require('../middleware/auth');
const Analytics = require('../models/Analytics');
const File = require('../models/File');

const router = express.Router();

// @route POST /api/analytics/create
// @desc Create analytics chart
// @access Private
router.post('/create', auth, async (req, res) => {
    try {
        const { 
            fileId, 
            chartType, 
            xAxis, 
            yAxis, 
            zAxis, 
            title, 
            colors,
            worksheetName 
        } = req.body;

        // Verify file exists and user has access
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (file.uploadedBy.toString() !== req.user.userId && !file.isPublic && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied to file' });
        }

        if (file.status !== 'completed') {
            return res.status(400).json({ message: 'File is not processed yet' });
        }

        // Read Excel data
        const workbook = XLSX.readFile(file.filePath);
        const sheetName = worksheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ message: 'No data found in worksheet' });
        }

        // Validate columns exist
        const columns = Object.keys(data[0]);
        if (!columns.includes(xAxis.column)) {
            return res.status(400).json({ message: `Column ${xAxis.column} not found` });
        }
        if (!columns.includes(yAxis.column)) {
            return res.status(400).json({ message: `Column ${yAxis.column} not found` });
        }
        if (zAxis && zAxis.column && !columns.includes(zAxis.column)) {
            return res.status(400).json({ message: `Column ${zAxis.column} not found` });
        }

        // Process data for chart
        const chartData = processChartData(data, chartType, xAxis, yAxis, zAxis, colors);

        // Generate insights
        const insights = generateInsights(data, xAxis, yAxis, zAxis);

        // Create analytics record
        const analytics = new Analytics({
            fileId,
            userId: req.user.userId,
            chartType,
            chartConfig: {
                xAxis,
                yAxis,
                zAxis,
                title: title || `${chartType} Chart`,
                colors: colors || ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']
            },
            chartData,
            insights
        });

        await analytics.save();

        res.status(201).json({
            message: 'Analytics created successfully',
            analytics
        });
    } catch (error) {
        console.error('Create analytics error:', error);
        res.status(500).json({ message: 'Error creating analytics' });
    }
});

// @route GET /api/analytics
// @desc Get user's analytics
// @access Private
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, fileId, chartType } = req.query;
        const query = { userId: req.user.userId };

        if (fileId) {
            query.fileId = fileId;
        }

        if (chartType) {
            query.chartType = chartType;
        }

        const analytics = await Analytics.find(query)
            .populate('fileId', 'originalName filename')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Analytics.countDocuments(query);

        res.json({
            analytics,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
});

// @route GET /api/analytics/:id
// @desc Get specific analytics
// @access Private
router.get('/:id', auth, async (req, res) => {
    try {
        const analytics = await Analytics.findById(req.params.id)
            .populate('fileId', 'originalName filename')
            .populate('userId', 'name email');

        if (!analytics) {
            return res.status(404).json({ message: 'Analytics not found' });
        }

        // Check access
        if (analytics.userId._id.toString() !== req.user.userId && 
            !analytics.shareSettings.isPublic && 
            req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Increment view count
        analytics.viewCount += 1;
        await analytics.save();

        res.json(analytics);
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
});

// @route PUT /api/analytics/:id
// @desc Update analytics
// @access Private
router.put('/:id', auth, async (req, res) => {
    try {
        const analytics = await Analytics.findById(req.params.id);

        if (!analytics) {
            return res.status(404).json({ message: 'Analytics not found' });
        }

        // Check ownership
        if (analytics.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { title, colors, isBookmarked, shareSettings } = req.body;

        if (title) {
            analytics.chartConfig.title = title;
        }
        if (colors) {
            analytics.chartConfig.colors = colors;
        }
        if (typeof isBookmarked === 'boolean') {
            analytics.isBookmarked = isBookmarked;
        }
        if (shareSettings) {
            analytics.shareSettings = { ...analytics.shareSettings, ...shareSettings };
        }

        await analytics.save();

        res.json({
            message: 'Analytics updated successfully',
            analytics
        });
    } catch (error) {
        console.error('Update analytics error:', error);
        res.status(500).json({ message: 'Error updating analytics' });
    }
});

// @route DELETE /api/analytics/:id
// @desc Delete analytics
// @access Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const analytics = await Analytics.findById(req.params.id);

        if (!analytics) {
            return res.status(404).json({ message: 'Analytics not found' });
        }

        // Check ownership
        if (analytics.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Analytics.findByIdAndDelete(req.params.id);

        res.json({ message: 'Analytics deleted successfully' });
    } catch (error) {
        console.error('Delete analytics error:', error);
        res.status(500).json({ message: 'Error deleting analytics' });
    }
});

// @route GET /api/analytics/public/shared
// @desc Get public analytics
// @access Public
router.get('/public/shared', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const analytics = await Analytics.find({ 'shareSettings.isPublic': true })
            .populate('fileId', 'originalName')
            .populate('userId', 'name')
            .sort({ viewCount: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-chartData'); // Don't include full data for listing

        const total = await Analytics.countDocuments({ 'shareSettings.isPublic': true });

        res.json({
            analytics,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get public analytics error:', error);
        res.status(500).json({ message: 'Error fetching public analytics' });
    }
});

// Helper function to process chart data
function processChartData(data, chartType, xAxis, yAxis, zAxis, colors) {
    const labels = data.map(row => row[xAxis.column]);
    const yData = data.map(row => parseFloat(row[yAxis.column]) || 0);
    
    let chartData = {
        labels,
        datasets: [{
            label: yAxis.label || yAxis.column,
            data: yData,
            backgroundColor: colors || ['#3498db'],
            borderColor: colors?.[0] || '#3498db',
            borderWidth: 2
        }]
    };

    // Handle 3D data
    if (zAxis && zAxis.column) {
        const zData = data.map(row => parseFloat(row[zAxis.column]) || 0);
        chartData.datasets[0].data = data.map((row, index) => ({
            x: parseFloat(row[xAxis.column]) || index,
            y: yData[index],
            z: zData[index]
        }));
    }

    // Handle different chart types
    if (chartType === 'pie' || chartType === 'doughnut') {
        // Aggregate data for pie charts
        const aggregated = {};
        data.forEach(row => {
            const key = row[xAxis.column];
            const value = parseFloat(row[yAxis.column]) || 0;
            aggregated[key] = (aggregated[key] || 0) + value;
        });

        chartData.labels = Object.keys(aggregated);
        chartData.datasets[0].data = Object.values(aggregated);
        chartData.datasets[0].backgroundColor = colors || [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#9c88ff'
        ];
    }

    return chartData;
}

// Helper function to generate insights
function generateInsights(data, xAxis, yAxis, zAxis) {
    const insights = {
        summary: '',
        trends: [],
        correlations: [],
        outliers: [],
        aiGenerated: false
    };

    const yValues = data.map(row => parseFloat(row[yAxis.column]) || 0);
    const mean = yValues.reduce((sum, val) => sum + val, 0) / yValues.length;
    const max = Math.max(...yValues);
    const min = Math.min(...yValues);

    insights.summary = `Dataset contains ${data.length} records. ${yAxis.column} ranges from ${min.toFixed(2)} to ${max.toFixed(2)} with an average of ${mean.toFixed(2)}.`;

    // Simple trend analysis
    if (yValues.length > 1) {
        const firstHalf = yValues.slice(0, Math.floor(yValues.length / 2));
        const secondHalf = yValues.slice(Math.floor(yValues.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

        if (secondAvg > firstAvg * 1.1) {
            insights.trends.push('Upward trend detected in the data');
        } else if (secondAvg < firstAvg * 0.9) {
            insights.trends.push('Downward trend detected in the data');
        } else {
            insights.trends.push('Relatively stable trend in the data');
        }
    }

    // Outlier detection (simple method)
    const stdDev = Math.sqrt(yValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / yValues.length);
    const outliers = data.filter((row, index) => {
        const value = yValues[index];
        return Math.abs(value - mean) > 2 * stdDev;
    });

    if (outliers.length > 0) {
        insights.outliers = outliers.map(row => `${row[xAxis.column]}: ${row[yAxis.column]}`);
    }

    return insights;
}

module.exports = router;
