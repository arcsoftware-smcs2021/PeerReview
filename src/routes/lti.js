const express = require('express')
const router = express.Router()
const lti = require('ims-lti')

const CanvasAdapter = require('../dataAdapters/canvasAdapter')
const firestore = require('../dataAdapters/firestoreAdapter')

router.post('/', (req, res, next) => {
    // Context: teacher adding the tool to an assignment
    req.session.provider = new lti.Provider(req.body.oauth_consumer_key, "BBBB")

    req.session.provider.valid_request(req, (err, is_valid) => {
        console.log(req.session.provider.body)
        if (err) return res.status(500).send(err)
        if (!is_valid) return res.status(401).send("invalid sig")

        if (req.session.provider.ext_content && req.session.provider.ext_content.has_return_type("lti_launch_url")) {
            const courseId = req.body.oauth_consumer_key + req.session.provider.body.custom_canvas_course_id
            firestore.checkClassOnboard(courseId).then((r) => {
                if (r) {
                    // TODO: Make secure when running in prod
                    req.session.canvasAdapter = new CanvasAdapter(r.apiKey, "http://" + req.session.provider.body.custom_canvas_api_domain)

                    req.session.canvasAdapter.getAssignments(req.session.provider.body.custom_canvas_course_id).then(r => {
                        // TODO: Make secure when HTTPS works
                        res.render("assignmentSelector", {
                            title: "selecc",
                            assignments: r
                        })
                    }).catch(e => {
                        console.log(e)
                        res.status(500).send(e)
                    })
                } else {
                    res.redirect("/onboard/" + courseId + '/' + req.session.provider.body.custom_canvas_course_id)
                }
            })
        } else {
            res.send("Error: Incorrect LTI URL or wrong state")
        }
    })
})

router.post('/assignment/:course/:assignment/review', (req, res, next) => {
    // Context: student visiting the assignment page
    req.session.provider = new lti.Provider(req.body.oauth_consumer_key, "BBBB")

    req.session.provider.valid_request(req, (err, is_valid) => {
        if (err) return res.status(500).send(err)
        if (!is_valid) return res.status(401).send("invalid sig")

        res.render("review", {
            title: "Peer Review"
        })
    })
})

router.post('/assignment/:course/:assignment/submit', (req, res, next) => {
    // Context: student submitting their review
    req.session.provider.outcome_service.send_replace_result_with_text(1, req.body.message, (err, result) => {
        if (err) throw err
        res.send(result)
    })
})

router.get('/info/:course/:assignment', (req, res, next) => {
    req.session.canvasAdapter.getAssignmentSubmissions(req.params.course, req.params.assignment).then((r) => {
        firestore.addAssignment(req.params.course, req.params.assignment, r).then(n => {
            res.render("submissionInfo", {
                title: "Peer Review",
                submissionCount: n,
                assignment: {
                    course_id: req.params.course,
                    id: req.params.assignment
                }
            })
        }).catch((e) => {
            console.log(e)
            res.status(500).send(e)
        })
    }).catch((e) => {
        console.log(e)
        res.status(500).send(e)
    })
})

router.get('/select/:course/:assignment', (req, res, next) => {
    req.session.provider.ext_content.send_lti_launch_url(res,
        "http://localhost:3001/lti/assignment/" + req.params.course + "/" + req.params.assignment + "/review",
        "grr u", "hmmmm")
})

module.exports = router;