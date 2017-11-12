var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var factory = require('../factory');
const unProcessedParentPath = 'C:/invoices/unprocessed/';
const processedParentPath = 'C:/invoices/processed/';
const errorInvoicesParentPath = 'C:/invoices/error_invoices/';

router.get('/card-list-unprocessed', (req, res)=>{
    var unprocessedInvoices = factory._getInvoices(unProcessedParentPath);
    res.render('unprocessed', {invoices: unprocessedInvoices});
});

router.get('/card-list-processed', (req, res)=>{
    var processedInvoices = factory._getInvoices(processedParentPath);
    res.render('processed', {invoices: processedInvoices});
});

router.get('/card-list-error', (req, res)=>{
    var errorInvoices = factory._getInvoices(errorInvoicesParentPath);
    res.render('error-invoices', {invoices: errorInvoices});
});

router.get('/card-process', (req, res)=>{
    /*var invoice = req.params.invoice;
    var index = str.lastIndexOf('.');
    var fileName = str.substring(0,index);
    var ext = str.substring(index + 1);*/

    res.render('card-process', {parentPath: unProcessedParentPath, fileName: req.query.invoice, invoiceType: req.query.invoiceType, isError: req.query.isError});
});

module.exports = router;