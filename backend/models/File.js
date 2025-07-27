const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true,
        enum: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'error'],
        default: 'processing'
    },
    processingError: {
        type: String,
        default: null
    },
    worksheets: [{
        name: String,
        rowCount: Number,
        columnCount: Number,
        columns: [String] // Column headers
    }],
    metadata: {
        totalRows: Number,
        totalColumns: Number,
        worksheetCount: Number,
        createdDate: Date,
        modifiedDate: Date,
        author: String,
        application: String
    },
    tags: [String],
    description: {
        type: String,
        maxlength: 500
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    downloadCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for search optimization
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ originalName: 'text', description: 'text' });

module.exports = mongoose.model('File', fileSchema);
