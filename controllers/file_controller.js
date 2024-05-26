const fs = require('fs');
const csvParser = require('csv-parser');
const CSV = require('../models/csv');
const path = require('path');

module.exports.upload = async function(req, res) {
    try {
        if (!req.file) {
            return res.status(400).send('No files were uploaded.');
        }
        if (req.file.mimetype != "text/csv") {
            return res.status(400).send('Select CSV files only.');
        }

        let file = await CSV.create({
            fileName: req.file.originalname,
            filePath: req.file.path,
            file: req.file.filename
        });

        const socketId = req.headers['socket-id'];
        const socket = req.io.sockets.connected[socketId];

        // Simulate progress for demonstration purposes
        for (let i = 0; i <= 100; i += 10) {
            setTimeout(() => {
                if (socket) {
                    socket.emit('uploadProgress', { progress: i });
                }
            }, i * 100);
        }

        return res.redirect('/');
    } catch (error) {
        console.log('Error in fileController/upload', error);
        res.status(500).send('Internal server error');
    }
};

module.exports.view = async function(req, res) {
    try {
        let csvFile = await CSV.findOne({ file: req.params.id });
        const results = [];
        const header = [];
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        fs.createReadStream(csvFile.filePath)
            .pipe(csvParser())
            .on('headers', (headers) => {
                headers.map((head) => {
                    header.push(head);
                });
            })
            .on('data', (data) => results.push(data))
            .on('end', () => {
                const paginatedResults = results.slice(skip, skip + limit);
                const totalPages = Math.ceil(results.length / limit);
                res.render("file_viewer", {
                    title: "File Viewer",
                    fileName: csvFile.fileName,
                    head: header,
                    data: paginatedResults,
                    currentPage: page,
                    totalPages: totalPages
                });
            });

    } catch (error) {
        console.log('Error in fileController/view', error);
        res.status(500).send('Internal server error');
    }
};

module.exports.calculateSubscription = async function(req, res) {
    try {
        const { id, basePrice, pricePerCreditLine, pricePerCreditScorePoint } = req.body;
        let csvFile = await CSV.findOne({ file: id });
        const results = [];

        fs.createReadStream(csvFile.filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                const subscriptions = results.map(row => {
                    const creditScore = parseInt(row['CreditScore']);
                    const creditLines = parseInt(row['CreditLines']);
                    const subscriptionPrice = basePrice + (pricePerCreditLine * creditLines) + (pricePerCreditScorePoint * creditScore);
                    return {
                        ...row,
                        subscriptionPrice: subscriptionPrice
                    };
                });
                res.json(subscriptions);
            });

    } catch (error) {
        console.log('Error in fileController/calculateSubscription', error);
        res.status(500).send('Internal server error');
    }
};
