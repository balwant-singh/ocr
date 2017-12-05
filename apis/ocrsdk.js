if (((typeof process) == 'undefined') || ((typeof window) != 'undefined')) {
	throw new Error("This code must be run on server side under NodeJS");
}

var http = require("http");
var https = require("https");
var url = require("url");
var sys = require("sys");
var events = require("events");
var fs = require('fs');

var xml2js = null;
try {
	xml2js = require('xml2js');
} catch (err) {
	throw new Error("xml2js module not found. Please install it with 'npm install xml2js'");
}

exports.create = function(applicationId, password) {
	return new ocrsdk(applicationId, password);
}

exports.ProcessingSettings = ProcessingSettings;

/**
 * TaskData object used in functions below has the following important fields:
 * {string} id 
 * {string} status 
 * {string} resultUrl
 * 
 * It is mapped from xml described at
 * http://ocrsdk.com/documentation/specifications/status-codes/
 */

/**
 * Create a new ocrsdk object.
 * 
 * @constructor
 * @param {string} applicationId 	Application Id.
 * @param {string} password 		Password for the application you received in e-mail.
 * To create an application and obtain a password,
 * register at http://cloud.ocrsdk.com/Account/Register
 * More info on getting your application id and password at
 * http://ocrsdk.com/documentation/faq/#faq3
 */
function ocrsdk(applicationId, password) {
	this.appId = applicationId;
	this.password = password;

	this.serverUrl = "http://cloud.ocrsdk.com"; // You can change it to
												// https://cloud.ocrsdk.com if
												// you need secure channel
}

/**
 * Settings used to process image
 */
function ProcessingSettings() {
	this.language = "English"; // Recognition language or comma-separated list
								// of languages.
	this.exportFormat = "txt"; // Output format. One of: txt, rtf, docx, xlsx,
								// pptx, pdfSearchable, pdfTextAndImages, xml.
	this.customOptions = ''; // Other custom options passed to RESTful call,
								// like 'profile=documentArchiving'
}

/**
 * Upload file to server and start processing.
 * 
 * @param {string} filePath 					Path to the file to be processed.
 * @param {ProcessingSettings} [settings] 		Image processing settings.
 * @param {function(error, taskData)} callback 	The callback function.
 */
ocrsdk.prototype.processImage = function(filePath, settings, userCallback) {

	if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
		userCallback(new Error("file " + filePath + " doesn't exist"), null);
		return;
	}

	if (settings == null) {
		settings = new ProcessingSettings();
	}

	var urlOptions = settings.asUrlParams();
	var req = this._createTaskRequest('POST', '/processImage' + urlOptions,
			userCallback);

	var fileContents = fs.readFileSync(filePath);
	req.write(fileContents);
	req.end();
}

/**
 * Get current task status.
 * 
 * @param {string} taskId 						Task identifier as returned in taskData.id.
 * @param {function(error, taskData)} callback 	The callback function.
 */
ocrsdk.prototype.getTaskStatus = function(taskId, userCallback) {
	var req = this._createTaskRequest('GET', '/getTaskStatus?taskId=' + taskId,
			userCallback);
	req.end();
}

ocrsdk.prototype.isTaskActive = function(taskData) {
	if (taskData.status == 'Queued' || taskData.status == 'InProgress') {
		return true;
	}
	return false;
}

/**
 * Wait until task processing is finished. You need to check task status after
 * processing to see if you can download result.
 * 
 * @param {string} taskId 						Task identifier as returned in taskData.id.
 * @param {function(error, taskData)} callback 	The callback function.
 */
ocrsdk.prototype.waitForCompletion = function(taskId, userCallback) {
	// Call getTaskStatus every several seconds until task is completed

	// Note: it's recommended that your application waits
	// at least 2 seconds before making the first getTaskStatus request
	// and also between such requests for the same task.
	// Making requests more often will not improve your application performance.
	// Note: if your application queues several files and waits for them
	// it's recommended that you use listFinishedTasks instead (which is described
	// at http://ocrsdk.com/documentation/apireference/listFinishedTasks/).

	if (taskId.indexOf('00000000') > -1) {
		// A null Guid passed here usually means a logical error in the calling code
		userCallback(new Error('Null id passed'), null);
		return;
	}
	var recognizer = this;
	var waitTimeout = 5000;

	function waitFunction() {
		recognizer.getTaskStatus(taskId,
			function(error, taskData) {
				if (error) {
					userCallback(error, null);
					return;
				}

				console.log("Task status is " + taskData.status);

				if (recognizer.isTaskActive(taskData)) {
					setTimeout(waitFunction, waitTimeout);
				} else {

					userCallback(null, taskData);
				}
			});
	}
	setTimeout(waitFunction, waitTimeout);
}

/**
 * Download result of document processing. Task needs to be in 'Completed' state
 * to call this function.
 * 
 * @param {string} resultUrl 				URL where result is located
 * @param {string} outputFilePath 			Path where to save downloaded file
 * @param {function(error)} userCallback 	The callback function.
 */
ocrsdk.prototype.downloadResult = function(resultUrl, template,
		userCallback) {
	//var file = fs.createWriteStream("C:/outputFilePath.json");

	var parsed = url.parse(resultUrl);

	var req = https.request(parsed, function(response) {
		var invoiceData = "";
		response.on('data', function(data) {
			
			invoiceData += data;
			//console.log("----" + data);
		});

		response.on('end', function() {
			
			var invoiceSelectedData = {};
			var parseString = xml2js.parseString;
			//var xml = "<root>Hello xml2js!</root>"
			parseString(invoiceData, function (err, result) {
				//file.write(JSON.stringify(result));
				//file.end();
				//console.log(JSON.stringify(result));
				try {
					var supplierChars = result.document.page[0].block[5].text[0].par[0].line[0].formatting[0].charParams;
					var supplier = "";
					for(var i = 0; i < supplierChars.length; i++) {
						var nextChar = " "
						if(supplierChars[i]._ !== undefined)
							nextChar = supplierChars[i]._;
						supplier += nextChar;
					}
					
					var buyerChars = result.document.page[0].block[14].text[0].par[0].line[1].formatting[0].charParams;
					var buyer = "";
					for(var i = 0; i < buyerChars.length; i++) {
						var nextChar = " "
						if(buyerChars[i]._ !== undefined)
							nextChar = buyerChars[i]._;
						buyer += nextChar;
					}
					
					
					var invoiceNoChars = result.document.page[0].block[7].text[0].par[0].line[0].formatting[0].charParams;
					var invoiceNo = "";
					for(var i = 0; i < invoiceNoChars.length; i++) {
						invoiceNo += invoiceNoChars[i]._;
					}
					
					var invoiceDtChars = result.document.page[0].block[7].text[0].par[1].line[0].formatting[0].charParams;
					var invoiceDt = "";
					for(var i = 0; i < invoiceDtChars.length; i++) {
						invoiceDt += invoiceDtChars[i]._;
					}
					
					var netValueChars = result.document.page[0].block[21].text[0].par[0].line[0].formatting[0].charParams;
					var netValue = "";
					for(var i = 0; i < netValueChars.length; i++) {
						var nextChar = " "
						if(netValueChars[i]._ !== undefined)
							nextChar = netValueChars[i]._;
						netValue += nextChar;
					}

					var gstValueChars = result.document.page[0].block[22].row[4].cell[2].text[0].par[0].line[0].formatting[0].charParams;
					var gstValue = "";
					for(var i = 0; i < gstValueChars.length; i++) {
						var nextChar = " "
						if(gstValueChars[i]._ !== undefined)
							nextChar = gstValueChars[i]._;
						gstValue += nextChar;
					}
					
					var poNoChars = result.document.page[0].block[10].text[0].par[0].line[0].formatting[0].charParams;
					var poNo = "";
					for(var i = 9; i < 19; i++) {
						var nextChar = " "
						if(poNoChars[i]._ !== undefined)
							nextChar = poNoChars[i]._;
						poNo += nextChar;
					}

					var tableHeaders = "";
					var tableHeaderSection = result.document.page[0].block[16].row[0];
					for(var i = 0; i < tableHeaderSection.cell.length; i++) {
						var tableHeaderItem = "";
						var tableHeaderItemParaSection = tableHeaderSection.cell[i].text[0].par;
						for(var j = 0; j < tableHeaderItemParaSection.length; j++) {
							var tableHeaderItemSection = tableHeaderItemParaSection[j].line[0].formatting[0].charParams;
							for(var k = 0; k < tableHeaderItemSection.length; k++) {
								if(tableHeaderItemSection[k]._ !== undefined) {
									tableHeaderItem += tableHeaderItemSection[k]._;
								} else {
									tableHeaderItem += " ";
								}
							}
							tableHeaderItem += " ";
						}
						tableHeaders += "<th scope='col'>" + tableHeaderItem + "</th>";
					}
					var lineItemsCount = 0;
					var tableRows = "";
					var tableRowsSection = result.document.page[0].block[16].row;
					if(tableRowsSection.length > 0) {
						lineItemsCount = tableRowsSection.length - 1;
						for(var l = 1; l < tableRowsSection.length; l++) {
							tableRows += "<tr>";
							for(var i = 0; i < tableRowsSection[l].cell.length; i++) {
								var tableRowItem = "";
								var tableRowItemParaSection = tableRowsSection[l].cell[i].text[0].par;
								for(var j = 0; j < tableRowItemParaSection.length; j++) {
									var tableRowItemSection = tableRowItemParaSection[j].line[0].formatting[0].charParams;
									for(var k = 0; k < tableRowItemSection.length; k++) {
										if(tableRowItemSection[k]._ !== undefined) {
											tableRowItem += tableRowItemSection[k]._;
										} else {
											tableRowItem += " ";
										}
									}
									tableRowItem += " ";
								}
								tableRows += "<td>" + tableRowItem + "</td>";
							}
							tableRows += "</tr>";
							console.log(tableRows);
						}
					}

					
					
					
					invoiceSelectedData =  {
						buyer: buyer,
						supplier: supplier,
						debit_credit: "Debit",
						invoice_number: invoiceNo,
						invoice_date: invoiceDt,
						net_value: netValue,
						gst_value: gstValue,
						gross_value: "",
						currency: "INR",
						po_order_number: poNo,
						delivery_note: "",

						buyer_service:"",
						supplier_service:"",
						debit_credit_service:"Debit",
						invoice_number_service:"",
						invoice_date_service:"",
						net_value_service:"",
						gst_value_service:"",
						gross_value_service:"",
						currency_service:"INR",
						po_order_number_service:"",
						delivery_note_service:"",
						finance_material_service:"",
						sap_po_number_service:"",
						vendor_code_service:"",
						discount_service:"",


						material_headers: tableHeaders,
						material_rows: tableRows,
						material_rows_count: lineItemsCount,
						service_headers: "",
						service_rows: "",
						service_rows_count: "0"
					};
					console.log('inside try');
					userCallback(invoiceSelectedData, false, req);
				}
				catch(err) {
					console.log(err);
					console.log('inside catch');
					userCallback({}, true, req);
					return;
					//document.getElementById("demo").innerHTML = err.message;
				}
				

				//userCallback(invoiceSelectedData, null);
				
				//console.dir("result" + JSON.stringify(result));
			});
			
		});
	});

	req.on('error', function(error) {
		userCallback({}, true, req);
	});

	req.end();

}

/**
 * Create http GET or POST request to cloud service with given path and
 * parameters.
 * 
 * @param {string} method 				'GET' or 'POST'.
 * @param {string} urlPath 				RESTful verb with parameters, e.g. '/processImage/language=French'.
 * @param {function(error, TaskData)} 	User callback which is called when request is executed.
 * @return {http.ClientRequest} 		Created request which is ready to be started.
 */
ocrsdk.prototype._createTaskRequest = function(method, urlPath,
		taskDataCallback) {

	/**
	 * Convert server xml response to TaskData. Calls taskDataCallback after.
	 * 
	 * @param data	Server XML response.
	 */
	function parseXmlResponse(data) {
		var response = null;

		var parser = new xml2js.Parser({
			explicitCharKey : false,
			trim : true,
			explicitRoot : true,
			mergeAttrs : true
		});
		parser.parseString(data, function(err, objResult) {
			if (err) {
				taskDataCallback(err, null);
				return;
			}

			response = objResult;
		});

		if (response == null) {
			return;
		}

		if (response.response == null || response.response.task == null
				|| response.response.task[0] == null) {
			if (response.error != null) {
				taskDataCallback(new Error(response.error.message[0]['_']), null);
			} else {
				taskDataCallback(new Error("Unknown server response"), null);
			}

			return;
		}

		var task = response.response.task[0];

		taskDataCallback(null, task);
	}

	function getServerResponse(res) {
		res.setEncoding('utf8');
		res.on('data', parseXmlResponse);
	}

	var requestOptions = url.parse(this.serverUrl + urlPath);
	requestOptions.auth = this.appId + ":" + this.password;
	requestOptions.method = method;
	requestOptions.headers = {
		'User-Agent' : "node.js client library"
	};

	var req = null;
	if (requestOptions.protocol == 'http:') {
		req = http.request(requestOptions, getServerResponse);
	} else {
		req = https.request(requestOptions, getServerResponse);
	}

	req.on('error', function(e) {
		taskDataCallback(e, null);
	});

	return req;
}

/**
 * Convert processing settings to string passed to RESTful request.
 */
ProcessingSettings.prototype.asUrlParams = function() {
	var result = '';

	if (this.language.length != null) {
		result = '?language=' + this.language;
	} else {
		result = '?language=English';
	}

	if (this.exportFormat.length != null) {
		result += '&exportFormat=' + this.exportFormat;
	} else {
		result += "&exportFormat=txt"
	}

	if (this.customOptions.length != 0) {
		result += '?' + this.customOptions;
	}

	return result;
}


exports.initiateProcessImage = function(imagePath, imageName, docType, res) {
	//return new ocrsdk(applicationId, password);

	// Name of application you created
	var appId = 'ocr-demo11';
	// Password should be sent to your e-mail after application was created
	var password = 'pZbZ9NzAaFOtYB0mUFFkUD3D';

	//var imagePath = 'invoice1.jpg';
	//var outputPath = 'result1_xmlForCorrectedImage.txt';

	try {
		
		//var ocrsdkModule = require('./ocrsdk.js');
		var ocrsdkObj = new ocrsdk(appId, password);
		//var ocrsdk = ocrsdkModule.create(appId, password);
		ocrsdkObj.serverUrl = "http://cloud.ocrsdk.com"; // change to https for secure connection

		if (appId.length == 0 || password.length == 0) {
			throw new Error("Please provide your application id and password!");
		}
	
		if( !imagePath || imagePath == '') {
			throw new Error( "Please provide path to your image!")
		}

		function downloadCompleted(invoiceSelectedData, isError, req) {
			req.end();
			if (isError) {
				res.send({ isError: isError, response: "error" });
			} else {
				res.send( {invoice: invoiceSelectedData, response: "success"});
			}
		}

		function processingCompleted(error, taskData) {
			if (error) {
				console.log("Error: " + error.message);
				return;
			}

			if (taskData.status != 'Completed') {
				console.log("Error processing the task.");
				if (taskData.error) {
					console.log("Message: " + taskData.error);
				}
				return;
			}

			console.log("Processing completed.");
			ocrsdkObj
				.downloadResult(taskData.resultUrl.toString(),imagePath,
					downloadCompleted);
		}

		function uploadCompleted(error, taskData) {
			if (error) {
				console.log("Error: " + error.message);
				return;
			}

			console.log("Upload completed.");
			console.log("Task id = " + taskData.id + ", status is " + taskData.status);
			if (!ocrsdkObj.isTaskActive(taskData)) {
				console.log("Unexpected task status " + taskData.status);
				return;
			}

			ocrsdkObj.waitForCompletion(taskData.id, processingCompleted);
		}

		var settings = new ProcessingSettings();
		// Set your own recognition language and output format here
		settings.language = "English"; // Can be comma-separated list, e.g. "German,French".
		settings.exportFormat = "xmlForCorrectedImage"; // All possible values are listed in 'exportFormat' parameter description 
                                   // at http://ocrsdk.com/documentation/apireference/processImage/

		console.log("Uploading image..");
		var invoicesJson = require('../public/invoices');
		if(docType.toUpperCase() === "JPG" || docType.toUpperCase() === "PNG") {
			ocrsdkObj.processImage(imagePath, settings, uploadCompleted);
		} else {
			var hasInvoiceData = false;
			var invoiceData = {};
			for(var i = 0; i < invoicesJson.length; i++) {
				if((imageName == "Multiple Line Item Invoice.pdf" || imageName == "services invoices.pdf") && imageName == invoicesJson[i].file) {
					invoiceData = invoicesJson[i];
					hasInvoiceData = true;
					break;
				}
			}
			
			if(hasInvoiceData) {
				if(invoiceData.is_error)
					res.send( {invoice: invoiceData, response: "error"});
				else	
					res.send( {invoice: invoiceData, response: "success"});
			} else {
				res.send( {isError: isError, response: "error"});
			}
			
		}
	} catch (err) {
		console.log("Error: " + err.message);
	}
}