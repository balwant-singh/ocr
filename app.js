var express = require('express');
var bodyparser = require('body-parser');
var cors = require('cors');
var path = require('path');
var fs = require('fs');
var factory = require('./factory');
var pdf2png = require('pdf2png');
const ejsLint = require('ejs-lint');
const unProcessedParentPath = 'C:/invoices/Unprocessed_Invoices/';
const processedParentPath = 'C:/invoices/Processed_Invoices/';
const errorInvoicesParentPath = 'C:/invoices/Error_Invoices/';



var app = express();

app.set('view engine', 'ejs');


const api = require('./apis/api');
const route = require('./routes/route');

//adding middleware - cors
app.use(cors());

//body-parser
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

//api
app.use('/api', api);
app.use('/', route);

//static files
app.use(express.static(path.join(__dirname, 'public')))

app.use('/lib', express.static(__dirname + '/node_modules/'));

if(!fs.existsSync('C:/invoices/')) {
    fs.mkdirSync('C:/invoices/');
}

if(!fs.existsSync(unProcessedParentPath)) {
    fs.mkdirSync(unProcessedParentPath);
}

if(!fs.existsSync('public/Unprocessed_Invoices/')) {
    fs.mkdirSync('public/Unprocessed_Invoices/');
} else {
    factory._deleteInvoices('public/Unprocessed_Invoices/');
}

var unprocessedInvoices = factory._getInvoices(unProcessedParentPath);
for(var i = 0; i < unprocessedInvoices.length; i++) {
    var ext = (/[.]/.exec(unprocessedInvoices[i].fileName)) ? /[^.]+$/.exec(unprocessedInvoices[i].fileName) : undefined;
    var fileNameWithoutExt = unprocessedInvoices[i].fileName.split('.')[0];
    /*if(ext && ext[0].toUpperCase() == "PDF") { 

        var filepreview = require('filepreview');
        
         filepreview.generate(unProcessedParentPath + "/" + unprocessedInvoices[i].fileName, 'public/unprocessed/' + fileNameWithoutExt + '.gif', function(error) {
           if (error) {
             return console.log(error);
           }
           console.log('File preview is /home/myfile_preview.gif');
         });*/


        /*var PDFImage = require("pdf-image").PDFImage;
        var fs = require("fs");
        
        var pdfImage = new PDFImage(unProcessedParentPath + "/" + unprocessedInvoices[i].fileName);
        console.log("Start");
        pdfImage.convertPage(0).then(function (imagePath) {
          // 0-th page (first page) of the slide.pdf is available as slide-0.png
          console.log("Converted.");
          fs.existsSync("public/unprocessed/sample.png") // => true
        });*/
        /*pdf2png.convert(unProcessedParentPath + "/" + unprocessedInvoices[i].fileName, function(resp){
            console.log(resp);
            if(!resp.success){
                console.log("Something went wrong: " + resp.error);
                
                return;
            }
            
            console.log("Yayy the pdf got converted, now I'm gonna save it!");
            
            fs.writeFile('public/unprocessed/sample.png', resp.data, function(err) {
                if(err) {
                    console.log(err);
                }
                else {
                    console.log("The file was saved!");
                }
            });
        });
    } else {*/
        var inStr = fs.createReadStream(unProcessedParentPath + unprocessedInvoices[i].fileName);
        var outStr = fs.createWriteStream('public/Unprocessed_Invoices/' + unprocessedInvoices[i].fileName);
        inStr.pipe(outStr);
    /*}*/

    
}

if(!fs.existsSync(processedParentPath)) {
    fs.mkdirSync(processedParentPath);
}

if(!fs.existsSync('public/Processed_Invoices/')) {
    fs.mkdirSync('public/Processed_Invoices/');
} else {
    factory._deleteInvoices('public/Processed_Invoices/');
}

var processedInvoices = factory._getInvoices(processedParentPath);
for(var i = 0; i < processedInvoices.length; i++) {
    var inStr = fs.createReadStream(processedParentPath + processedInvoices[i].fileName);
    var outStr = fs.createWriteStream('public/Processed_Invoices/' + processedInvoices[i].fileName);
    inStr.pipe(outStr);
}

if(!fs.existsSync(errorInvoicesParentPath)) {
    fs.mkdirSync(errorInvoicesParentPath);
}

if(!fs.existsSync('public/Error_Invoices/')) {
    fs.mkdirSync('public/Error_Invoices/');
} else {
    factory._deleteInvoices('public/Error_Invoices/');
}

var errorInvoices = factory._getInvoices(errorInvoicesParentPath);
for(var i = 0; i < errorInvoices.length; i++) {
    var inStr = fs.createReadStream(errorInvoicesParentPath + errorInvoices[i].fileName);
    var outStr = fs.createWriteStream('public/Error_Invoices/' + errorInvoices[i].fileName);
    inStr.pipe(outStr);
}

/*fs.mkdir(unProcessedParentPath, function() {
    var unprocessedInvoices = factory._getUnprocessedInvoices('public/unprocessed');
    for(var i = 0; i < unprocessedInvoices.length; i++) {
        var inStr = fs.createReadStream('public/images/' + unprocessedInvoices[i].fileName);
        var outStr = fs.createWriteStream(unProcessedParentPath + unprocessedInvoices[i].fileName);
        inStr.pipe(outStr);
    }
});

fs.mkdir('public/unprocessed/', function() {
    var unprocessedInvoices = factory._getUnprocessedInvoices('public/images');
    for(var i = 0; i < unprocessedInvoices.length; i++) {
        var inStr = fs.createReadStream('public/images/' + unprocessedInvoices[i].fileName);
        var outStr = fs.createWriteStream('public/unprocessed/' + unprocessedInvoices[i].fileName);
        inStr.pipe(outStr);
    }
});*/

app.get('/', function(req, res) {
    var unprocessedInvoices = factory._getInvoices(unProcessedParentPath);
    var processedInvoices = factory._getInvoices(processedParentPath);
    var errorInvoices = factory._getInvoices(errorInvoicesParentPath);
    res.render('index', {unprocessedCount: unprocessedInvoices.length, processedCount: processedInvoices.length, errorCount: errorInvoices.length});
});

app.listen(3000);