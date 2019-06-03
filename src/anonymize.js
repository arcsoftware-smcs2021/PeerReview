const doc = require('./doc.js');

function anonymize(document) {
  doc.edit(document).then(function(res, err) {
    if (err) {
      console.log(err)
    } else {
      console.log()
    }
  })
}

anonymize("tmp/documents/boi.docx")