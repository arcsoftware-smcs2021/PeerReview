const zipStream = require('node-stream-zip');
const fs = require('fs');
const archiver = require('archiver');
module.exports = {
  open: function(filePath) {
       return new Promise(
           function(resolve, reject) {
               const zip = new zipStream({
                   file: filePath,
                   storeEntries: true
               })
               //unzip file to directory
               zip.on('ready', () => {
                   // var chunks = []
                   // var content = ''
                   // zip.stream('word/document.xml', (err, stream) => {
                   //     if (err) {
                   //         reject(err)
                   //     }
                   //     stream.on('data', function(chunk) {
                   //         chunks.push(chunk)
                   //     })
                   //     stream.on('end', function() {
                   //         content = Buffer.concat(chunks)
                   //         zip.close()
                   //         resolve(content.toString())
                   //     })
                   // })
                   fs.mkdir('extracted_doc', err => {
                     if(err) throw err
                   })
                   zip.extract(null, './extracted_doc', (err, count) => {
                     console.log(err ? 'Extract error' : 'Extracted')
                     zip.close()
                   })
               })
           }
       )
   },

   edit: function(filePath) {
       return new Promise(
           function(resolve, reject) {
               module.exports.open(filePath).then(function (res, err) {
                   if (err) {
                       reject(err)
                   }

                   // var body = ''
                   // var components = res.toString()
                   // var name = components.indexOf('<w:t>')
                   // var end = components.indexOf('<\/w:t>')
                   //var components = res.toString()
                   // var startNameIndex = components.indexOf('<w:t>')+6
                   // var endNameIndex = components.indexOf('<\/w:t>')
                   //console.log(components.slice(name+5, end))
                   //console.log(components[startNameIndex])
                   //var result = components.replace(components.slice(name+5, end), "XXXXXXXXXXXXXXXXXX")
                   //var result = components.replace(components[startNameIndex, endNameIndex+1], "XXXXXXXXXXXXXXXXXX")
                   // for(var i=0;i<components.length;i++) {
                   //     var tags = components[i].split('>')
                   //     var content = tags[1].rexplace(/<.*$/,"")
                   //     body += content+' '
                   // }
                  //editing the file
                  console.log('yeeeeee boiiiiiii')
                   var data = fs.readFile('./extracted_doc/word/document.xml', 'utf8', (err, data) => {
                     if (err) throw err;
                   });
                   console.log(typeof data)
                   var name = data.indexOf('<w:t>')
                   var end = data.indexOf('<\/w:t>')
                   var result = data.replace(data.slice(name+5, end), "XXXXXXXXXXXXXXXXXX")
                   fs.writeFile('./extracted_doc/word/document.xml', data, err => {
                     if (err) throw err
                   })
                   //zipping the file back to docx
                   var output = fs.createWriteStream('./anonymized_submission.docx')
                   var archive = archiver('zip')


                   archive.on('error', function(err){
                     throw err;
                   })

                   archive.pipe(output)
                   archive.directory("./extracted_doc", "extracted_doc")
                   archive.finalize()
               })
           }
       )
   }
}

return module.export;