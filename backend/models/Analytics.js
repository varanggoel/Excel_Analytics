const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chartType: {
        type: String,
        required: true,
        enum: ['line', 'bar', 'pie', 'doughnut', 'scatter', 'area', '3d-bar', '3d-scatter', '3d-surface']
    },
    chartConfig: {
        xAxis: {
            column: String,
            label: String,
            dataType: String
        },
        yAxis: {
            column: String,
            label: String,
            dataType: String
        },
        zAxis: { // For 3D charts
            column: String,
            label: String,
            dataType: String
        },
        title: String,
        colors: [String],
        customOptions: mongoose.Schema.Types.Mixed
    },
    chartData: {
        labels: [mongoose.Schema.Types.Mixed],
        datasets: [{
            label: String,
            data: [mongoose.Schema.Types.Mixed],
            backgroundColor: [String],
            borderColor: String,
            borderWidth: Number
        }]
    },
    insights: {
        summary: String,
        trends: [String],
        correlations: [String],
        outliers: [String],
        aiGenerated: Boolean
    },
    isBookmarked: {
        type: Boolean,
        default: false
    },
    shareSettings: {
        isPublic: {
            type: Boolean,
            default: false
        },
        sharedWith: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            permission: {
                type: String,
                enum: ['view', 'edit'],
                default: 'view'
            }
        }]
    },
    viewCount: {
        type: Number,
        default: 0
    },
    downloadCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for performance
analyticsSchema.index({ fileId: 1, userId: 1 });
analyticsSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
