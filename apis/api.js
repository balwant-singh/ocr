var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var invoicesJson = require('../public/invoices');
var ocrsdkModule = require('./ocrsdk.js');
const unProcessedParentPath = 'C:/invoices/Unprocessed_Invoices/';
const processedParentPath = 'C:/invoices/Processed_Invoices/';
const errorInvoicesParentPath = 'C:/invoices/Error_Invoices/';

router.post('/process-data', (req, res)=>{
    var image_name = req.body.image_name;
    var isError = req.body.isError;
    var invoiceType = req.body.invoiceType;
    var invoice = JSON.parse( req.body.invoice );
    console.log(invoice);
    var sourcePath = unProcessedParentPath;
    for(var i = 0; i < invoicesJson.length; i++) {
        if(invoicesJson[i].id == invoice.id) {
            invoicesJson[i] = invoice;
            break;
        }
    }
    var updatedInvoicesJson = JSON.stringify(invoicesJson);
    fs.writeFileSync('./public/invoices.json', updatedInvoicesJson, 'utf8');
    if(invoiceType === "Error_Invoices")
        sourcePath = errorInvoicesParentPath;
    if(isError == "true") {
        //fs.mkdir(processedParentPath, function() {
            fs.renameSync(sourcePath + image_name, errorInvoicesParentPath + image_name);
            fs.renameSync('public/' + invoiceType + '/' + image_name, 'public/Error_Invoices/' + image_name);
            res.send(JSON.stringify({ response: 'error' }));
        //});
    } else {
        //fs.mkdir(processedParentPath, function() {
           fs.renameSync(sourcePath + image_name, processedParentPath + image_name);
           fs.renameSync('public/' + invoiceType + '/' + image_name, 'public/Processed_Invoices/' + image_name);
           res.send(JSON.stringify({ response: 'success' }));
       //});
    }
});


router.post('/fetch-invoice-data', (req, res)=>{
    var image_name = req.body.image_name;
    var invoiceType = req.body.invoiceType;
    var ext = (/[.]/.exec(image_name)) ? /[^.]+$/.exec(image_name) : undefined;
    ocrsdkModule.initiateProcessImage('public/' + invoiceType + '/' + image_name, image_name, ext[0], res);
});


module.exports = router;