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
    res.render('card-process', {parentPath: unProcessedParentPath, fileName: req.query.invoice, invoiceType: req.query.invoiceType, isError: req.query.isError});
});

router.get('/dashboard', (req, res)=>{
    var totalInvoices = [];
    var unprocessedInvoices = factory._getInvoices(unProcessedParentPath);
    for(var i = 0; i < unprocessedInvoices.length; i++) {
        var invoice = {
            fileName: unprocessedInvoices[i].fileName,
            type: 'light'
        }
        totalInvoices.push(invoice);
    }
    var processedInvoices = factory._getInvoices(processedParentPath);
    for(var i = 0; i < processedInvoices.length; i++) {
        var invoice = {
            fileName: processedInvoices[i].fileName,
            type: 'success'
        }
        totalInvoices.push(invoice);
    }
    var errorInvoices = factory._getInvoices(errorInvoicesParentPath);
    for(var i = 0; i < errorInvoices.length; i++) {
        var invoice = {
            fileName: errorInvoices[i].fileName,
            type: 'danger'
        }
        totalInvoices.push(invoice);
    }
    res.render('dashboard', {invoices: totalInvoices});
});


module.exports = router;