var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var factory = require('../factory');
var invoicesJson = require('../public/invoices');
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
    console.log(req.query);
    var invoiceId = req.query.id;
    console.log(invoiceId);
    var invoiceId = req.query.id;
    var invoiceData = {
        id:"",
        file: "",
        buyer: "",
        supplier: "",
        debit_credit: "Debit",
        invoice_number: "",
        invoice_date: "",
        net_value: "",
        gst_value: "",
        gross_value: "",
        currency: "INR",
        po_order_number: "",
        delivery_note: "",
        finance_material: "",
        sap_po_number: "",
        vendor_code: "",
        discount: "",
        is_error: true,
        material_headers: "",
        material_rows: "",
        material_rows_count: "0",
        service_headers: "",
        service_rows: "",
        service_rows_count: "0"
    }
    
    console.log(invoiceId && invoiceId !== "");
    if(invoiceId && invoiceId !== ""){
        for(var i = 0; i < invoicesJson.length; i++) { 
            if(invoicesJson[i].id === invoiceId) {
                invoiceData = invoicesJson[i];
                break;
            }
        }
        res.render('card-process', {parentPath: unProcessedParentPath, fileName: req.query.invoice, invoiceType: req.query.invoiceType, invoiceItem: invoiceData });
        
    } else {
        console.log(2);
        console.log(invoiceData);
        res.render('card-process', {parentPath: unProcessedParentPath, fileName: req.query.invoice, invoiceType: req.query.invoiceType, invoiceItem: invoiceData });
    }

    /*var invoiceData = {
        id:"",
        file: "",
        buyer: "",
        supplier: "",
        debit_credit: "Debit",
        invoice_number: "",
        invoice_date: "",
        net_value: "",
        gst_value: "",
        gross_value: "",
        currency: "INR",
        po_order_number: "",
        delivery_note: "",
        finance_material: "",
        sap_po_number: "",
        vendor_code: "",
        discount: "",
        is_error: true,
        material_headers: "",
        material_rows: "",
        material_rows_count: "0",
        service_headers: "",
        service_rows: "",
        service_rows_count: "0"
    }
    res.render('card-process', {parentPath: unProcessedParentPath, fileName: req.query.invoice, invoiceType: req.query.invoiceType, invoiceItem: invoiceData });
    */
    //console.log(invoicesJson);
   
});

router.get('/dashboard', (req, res)=>{
    var totalInvoices = [];
    /*var unprocessedInvoices = factory._getInvoices(unProcessedParentPath);
    for(var i = 0; i < unprocessedInvoices.length; i++) {
        var invoice = {
            fileName: unprocessedInvoices[i].fileName,
            type: 'light'
        }
        totalInvoices.push(invoice);
    }*/
    var processedInvoices = factory._getInvoices(processedParentPath);
    for(var i = 0; i < processedInvoices.length; i++) {
        var invoice = {
            fileName: processedInvoices[i].fileName,
            invoiceType: 'processed',
            type: 'success'
        }
        totalInvoices.push(invoice);
    }
    var errorInvoices = factory._getInvoices(errorInvoicesParentPath);
    for(var i = 0; i < errorInvoices.length; i++) {
        var invoice = {
            fileName: errorInvoices[i].fileName,
            invoiceType: 'error_invoices',
            type: 'danger'
        }
        totalInvoices.push(invoice);
    }
    var dashboardInvoices = [];
    for(var i = 0; i < totalInvoices.length; i++) {
        for(var j = 0; j < invoicesJson.length; j++) {
            if(totalInvoices[i].fileName === invoicesJson[j].file) {
                invoicesJson[j].type = totalInvoices[i].type;
                invoicesJson[j].invoiceType = totalInvoices[i].invoiceType;
                dashboardInvoices.push(invoicesJson[j]);
            }
        }
    }

    res.render('dashboard', {invoices: dashboardInvoices});
});


module.exports = router;