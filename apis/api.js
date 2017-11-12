var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
const unProcessedParentPath = 'C:/invoices/unprocessed/';
const processedParentPath = 'C:/invoices/processed/';
const errorInvoicesParentPath = 'C:/invoices/error_invoices/';

router.post('/process-data', (req, res)=>{
    var image_name = req.body.image_name;
    var isError = req.body.isError;
    var invoiceType = req.body.invoiceType;
    var sourcePath = unProcessedParentPath;
    if(invoiceType === "error_invoices")
        sourcePath = errorInvoicesParentPath;
    if(isError == "true") {
        //fs.mkdir(processedParentPath, function() {
            fs.renameSync(sourcePath + image_name, errorInvoicesParentPath + image_name);
            fs.renameSync('public/' + invoiceType + '/' + image_name, 'public/error_invoices/' + image_name);
            res.send(JSON.stringify({ response: 'error' }));
        //});
    } else {
        //fs.mkdir(processedParentPath, function() {
           fs.renameSync(sourcePath + image_name, processedParentPath + image_name);
           fs.renameSync('public/' + invoiceType + '/' + image_name, 'public/processed/' + image_name);
           res.send(JSON.stringify({ response: 'success' }));
       //});
    }
});

module.exports = router;