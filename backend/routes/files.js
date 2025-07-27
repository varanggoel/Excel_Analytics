const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { auth, admin } = require('../middleware/auth');
const File = require('../models/File');
const User = require('../models/User');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel files (.xls, .xlsx) are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// @route POST /api/files/upload
// @desc Upload Excel file
// @access Private
router.post('/upload', auth, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { description, tags, isPublic } = req.body;

        // Create file record
        const fileRecord = new File({
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: req.user.userId,
            description: description || '',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            isPublic: isPublic === 'true'
        });

        // Process Excel file
        try {
            const workbook = XLSX.readFile(req.file.path);
            const worksheets = [];
            
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
                const headers = [];
                
                // Extract column headers
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
                    const cell = worksheet[cellAddress];
                    headers.push(cell ? cell.v : `Column ${col + 1}`);
                }
                
                worksheets.push({
                    name: sheetName,
                    rowCount: range.e.r - range.s.r + 1,
                    columnCount: range.e.c - range.s.c + 1,
                    columns: headers
                });
            });

            fileRecord.worksheets = worksheets;
            fileRecord.metadata = {
                totalRows: worksheets.reduce((sum, ws) => sum + ws.rowCount, 0),
                totalColumns: Math.max(...worksheets.map(ws => ws.columnCount)),
                worksheetCount: worksheets.length,
                createdDate: new Date(),
                modifiedDate: new Date()
            };
            fileRecord.status = 'completed';
        } catch (processingError) {
            fileRecord.status = 'error';
            fileRecord.processingError = processingError.message;
        }

        await fileRecord.save();

        // Update user stats
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: { 
                filesUploaded: 1,
                storageUsed: req.file.size
            }
        });

        res.status(201).json({
            message: 'File uploaded and processed successfully',
            file: fileRecord
        });
    } catch (error) {
        console.error('File upload error:', error);
        
        // Clean up uploaded file if error occurs
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ message: 'Error uploading file' });
    }
});

// @route GET /api/files
// @desc Get user's files
// @access Private
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        const query = { uploadedBy: req.user.userId };

        if (search) {
            query.$text = { $search: search };
        }

        if (status) {
            query.status = status;
        }

        const files = await File.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-filePath'); // Don't expose file path

        const total = await File.countDocuments(query);

        res.json({
            files,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ message: 'Error fetching files' });
    }
});

// @route GET /api/files/:id
// @desc Get specific file details
// @access Private
router.get('/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id).populate('uploadedBy', 'name email');

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check if user has access to this file
        if (file.uploadedBy._id.toString() !== req.user.userId && !file.isPublic && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(file);
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ message: 'Error fetching file' });
    }
});

// @route GET /api/files/:id/data/:worksheet
// @desc Get worksheet data
// @access Private
router.get('/:id/data/:worksheet', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check access
        if (file.uploadedBy.toString() !== req.user.userId && !file.isPublic && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (file.status !== 'completed') {
            return res.status(400).json({ message: 'File is not processed yet' });
        }

        // Read Excel data
        const workbook = XLSX.readFile(file.filePath);
        const worksheetName = req.params.worksheet;
        
        if (!workbook.SheetNames.includes(worksheetName)) {
            return res.status(404).json({ message: 'Worksheet not found' });
        }

        const worksheet = workbook.Sheets[worksheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        res.json({
            worksheetName,
            data,
            rowCount: data.length,
            columns: Object.keys(data[0] || {})
        });
    } catch (error) {
        console.error('Get worksheet data error:', error);
        res.status(500).json({ message: 'Error fetching worksheet data' });
    }
});

// @route DELETE /api/files/:id
// @desc Delete file
// @access Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check if user owns the file or is admin
        if (file.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Delete physical file
        if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        // Update user stats
        await User.findByIdAndUpdate(file.uploadedBy, {
            $inc: { 
                filesUploaded: -1,
                storageUsed: -file.fileSize
            }
        });

        await File.findByIdAndDelete(req.params.id);

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
});

// @route GET /api/files/admin/all
// @desc Get all files (admin only)
// @access Private (Admin)
router.get('/admin/all', auth, admin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        const query = {};

        if (search) {
            query.$text = { $search: search };
        }

        if (status) {
            query.status = status;
        }

        const files = await File.find(query)
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await File.countDocuments(query);

        res.json({
            files,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Admin get files error:', error);
        res.status(500).json({ message: 'Error fetching files' });
    }
});

module.exports = router;
