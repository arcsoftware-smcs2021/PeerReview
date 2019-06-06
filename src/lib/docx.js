const zipStream = require('node-stream-zip');
const fs = require('fs');
const path = require('path')
const archiver = require('archiver');
const rimraf = require("rimraf")

module.exports = {
    extractDocx: function (filePath) {
        // Extracts the XML documents that make up a DOCX

        return new Promise(
            (resolve, reject) => {
                // Open the docx as a zip file
                const zip = new zipStream({
                    file: filePath,
                    storeEntries: true
                })
                // Unzip file to directory
                const targetDirectory = path.dirname(filePath)

                zip.on('ready', () => {
                    // rimraf works like rm -rf, deletes the directory if it exists so we work from a clean slate
                    rimraf(targetDirectory, () => {
                        // Create the directory
                        fs.mkdir(targetDirectory, err => {
                            if (err) reject(err)
                        })
                        // And extract into it
                        zip.extract(null, targetDirectory, (err, count) => {
                            if (err) reject(err)
                            zip.close()
                            resolve()
                        })
                    })
                })
            }
        )
    },
    anonymize: async function (filePath, censoredStrings) {
        // Replaces occurrences of censoredStrings in the DOCX file pointed to by filePath

        // Extract the docx so we can work with it's internals
        await module.exports.extractDocx(filePath)

        // Read the contents
        const targetDirectory = path.dirname(filePath) // The directory the files were extracted to
        const data = await new Promise((resolve, reject) => fs.readFile(targetDirectory + '/word/document.xml', 'utf8', (err, data) => {
            if (err) reject(err)
            else resolve(data)
        }))

        // Loop through and replace the strings
        let result = data
        for (const censor of censoredStrings) {
            result = result.split(censor).join("x".repeat(censor.length));
        }

        // Write the new string back to the file
        await new Promise((resolve, reject) => {
            fs.writeFile(targetDirectory + '/word/document.xml', result, (err) => {
                if (err) reject(err)
                else resolve()
            })
        })

        // Re-compress the document
        const output = fs.createWriteStream('public/documents/' + path.basename(filePath))
        const archive = archiver('zip')

        archive.on('error', function (err) {
            throw err;
        })

        // Output the archive to the stream and add the directory to it
        archive.pipe(output)
        archive.directory(targetDirectory, "../")
        archive.finalize()

        // Return the new URL
        return "https://graded-peer-review.herokuapp.com/documents/" + path.basename(filePath)
    }
}
