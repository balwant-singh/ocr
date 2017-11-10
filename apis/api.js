var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');


router.post('/process-data', (req, res)=>{
    var image_name = req.body.image_name;
    fs.mkdir('public/processed', function() {
        var inStr = fs.createReadStream('public/unprocessed/' + image_name);
        var outStr = fs.createWriteStream('public/processed/' + image_name);
        
        inStr.pipe(outStr);
        res.send(JSON.stringify({ response: 'success' }));
    });
    
});

router.get('/ocr', (req, res, next)=>{
    res.render('ocr');
});

module.exports = router;