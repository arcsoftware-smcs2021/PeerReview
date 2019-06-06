const express = require('express')
const router = express.Router()

const CanvasAdapter = require('../dataAdapters/canvasAdapter')
const firestore = require('../dataAdapters/firestoreAdapter')

router.get('/', (req, res, next) => {
    res.render("index", {
        title: "Graded Peer Review",
    })
})

router.get('/onboard/:courseId/:canvasCourseId', (req, res, next) => {
    res.render("onboard", {
        title: "Graded Peer Review",
    })
})

router.post('/onboard/:courseId/:canvasCourseId', async (req, res, next) => {
    req.session.canvasAdapter = new CanvasAdapter(req.body.apiKey, req.session.url)

    const courseId = req.params.canvasCourseId
    firestore.createCourse(req.params.courseId, req.body.apiKey, await req.session.canvasAdapter.getUsers(courseId)).then(() => {
        res.send("Setup successful. Please exit and reopen the External Tool window.")
    }).catch(e => {
        console.log(e)
        res.status(500).send(e)
    })
})

module.exports = router