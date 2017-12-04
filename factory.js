var fs = require('fs');
var invoicesJson = require('./public/invoices');
var factory = {};

factory._getInvoices = function(folderName) {
    var invoices = [];
    fs.readdirSync(folderName).forEach(file => {
        var data = {parentPath: folderName, fileName: file}
        for(var i = 0; i < invoicesJson.length; i++) {
            if(invoicesJson[i].file == file) {
                data.id = invoicesJson[i].id;
                break;
            }
        }
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