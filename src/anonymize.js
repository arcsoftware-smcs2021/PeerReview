var good_stuff = require('./doc.js');

function anonymize(document_path) {
  good_stuff.edit(document).then(function(res, err) {
    if (err) {
      console.log(err)
    } else {
      console.log()
    }
  })
}

//
// function anonymize(document,name){
//   var fs = require("fs");
//   var docx = require("docx");
//
//   fs.readFile(document, function (err, data) {
//     if(data.includes('Name')){
//       data = data.toString();
//       var doc = data.replace('Name','XXXXX')
//       fs.writeFileSync(document, doc);
//     }
//
//   });
//
// }
//
// //anonymize("C:/Users/ronoy/anonymization/test.docx","name"); // sample call
// module.exports.anonymize = anonymize;
