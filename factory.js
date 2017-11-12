var fs = require('fs');
var factory = {};

factory._getInvoices = function(folderName) {
    var invoices = [];
    fs.readdirSync(folderName).forEach(file => {
        var data = {parentPath: folderName, fileName: file}
        invoices.push(data);
    })

    for(var i = 0; i < invoices.length; i++) {
        var isError = false;
        if(i === 6 || i === 7 || i === 8 || i === 9) {
            isError = true;
        }
        invoices[i].isError = isError;
    }

    return invoices;    
}

module.exports = factory;