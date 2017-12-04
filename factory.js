var fs = require('fs');
var factory = {};

factory._getInvoices = function(folderName) {
    var invoices = [];
    fs.readdirSync(folderName).forEach(file => {
        var data = {parentPath: folderName, fileName: file}
        invoices.push(data);
    })
    return invoices;    
},

factory._deleteInvoices = function(folderName) {
    fs.readdirSync(folderName).forEach(file => {
        fs.unlinkSync(folderName + '/' + file);
    })
},
module.exports = factory;