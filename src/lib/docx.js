const zipStream = require('node-stream-zip');
const fs = require('fs');
const archiver = require('archiver');
const rimraf = require("rimraf")

module.exports = {
    extractDocx: function (filePath) {
        return new Promise(
            function (resolve, reject) {
                const zip = new zipStream({
                    file: filePath,
                    storeEntries: true
                })
                //unzip file to directory
                zip.on('ready', () => {
                    rimraf('tmp/documents/enhof/ext', () => {
                        fs.mkdir('tmp/documents/enhof/ext', err => {
                            if (err) reject(err)
                        })
                        zip.extract(null, 'tmp/documents/enhof/ext', (err, count) => {
                            if (err) reject(err)
                            zip.close()
                            resolve()
                        })
                    })
                })
            }
        )
    },
    anonymize: async function (filePath, firstName, lastName) {
        await module.exports.extractDocx(filePath)
        //editing the file
        console.log('yeeeeee boiiiiiii')
        const data = await new Promise((resolve, reject) => fs.readFile('tmp/documents/enhof/ext/word/document.xml', 'utf8', (err, data) => {
            if (err) reject(err)
            else resolve(data)
        }))

        let result = data.split(firstName).join("x".repeat(firstName.length));
        result = result.split(lastName).join("x".repeat(lastName.length));
        fs.writeFile('tmp/documents/enhof/ext/word/document.xml', result, (err) => {
            if (err) reject(err)
            //zipping the file back to docx
            var output = fs.createWriteStream('public/documents/output.docx')
            var archive = archiver('zip')

            archive.on('error', function (err) {
                throw err;
            })

            archive.pipe(output)
            archive.directory("tmp/documents/enhof/ext", "../")
            archive.finalize()
        })
    }
}
