const express = require('express')
const router = express.Router()
const lti = require('ims-lti')

const assign = require('../lib/assign')
const CanvasAdapter = require('../dataAdapters/canvasAdapter')
const firestore = require('../dataAdapters/firestoreAdapter')

router.providers = {}

router.post('/', (req, res, next) => {
    // Context: teacher adding the tool to an assignment
    req.session.provider = new lti.Provider(req.body.oauth_consumer_key, "BBBB")
    req.session.providerId = req.body.oauth_consumer_key + req.session.provider.custom_canvas_user_id
    router.providers[req.session.providerId] = req.session.provider
    req.session.key = req.body.oauth_consumer_key

    req.session.provider.valid_request(req, (err, is_valid) => {
        if (err) return res.status(500).send(err)
        if (!is_valid) return res.status(401).send("invalid sig")

        if (req.session.provider.ext_content && req.session.provider.ext_content.has_return_type("lti_launch_url")) {
            const courseId = req.body.oauth_consumer_key + req.session.provider.body.custom_canvas_course_id
            firestore.checkCourseOnboard(courseId).then((r) => {
                if (r) {
                    const course = r.data()
                    // TODO: Make secure when running in prod
                    req.session.canvasAdapter = new CanvasAdapter(course.apiKey, "http://" + req.session.provider.body.custom_canvas_api_domain)

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
                    // TODO: Make this https in prod
                    req.session.url = "http://" + req.session.provider.body.custom_canvas_api_domain
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

    // Create provider and session data
    req.session.provider = new lti.Provider(req.body.oauth_consumer_key, "BBBB")
    req.session.providerId = req.body.oauth_consumer_key + req.session.provider.custom_canvas_user_id
    router.providers[req.session.providerId] = req.session.provider
    req.session.key = req.body.oauth_consumer_key

    req.session.provider.valid_request(req, (err, is_valid) => {
        if (err) return res.status(500).send(err)
        if (!is_valid) return res.status(401).send("invalid sig")

        firestore.getReviewsForAssignment(req.params.assignment, req.session.provider.body.custom_canvas_user_id).then(reviews => {
            console.log(reviews)
            res.render("review", {
                title: "Peer Review"
            })
        }).catch(e => {
            console.log(e)
            res.status(500).send(e)
        })
    })
})

router.post('/assignment/:course/:assignment/submit', (req, res, next) => {
    // Context: student submitting their review
    // Restore provider
    req.session.provider = router.providers[req.session.providerId]

    req.session.provider.outcome_service.send_replace_result_with_text(1, req.body.message, (err, result) => {
        if (err) throw err
        res.send(result)
    })
})

router.get('/info/:course/:assignment', (req, res, next) => {
    // Restore adapter from serialization
    req.session.canvasAdapter = new CanvasAdapter(req.session.canvasAdapter.apiKey, req.session.canvasAdapter.host)

    req.session.canvasAdapter.getAssignmentSubmissions(req.params.course, req.params.assignment).then((r) => {
        firestore.addAssignment(req.session.key + req.params.course, req.params.assignment, r).then(n => {
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
    // Restore provider
    req.session.provider = router.providers[req.session.providerId]

    firestore.getSubmissions(req.params.assignment).then(async (submissions) => {
        const submissionIds = submissions.map(s => s.id)
        const assignments = assign(submissionIds, 3)

        for (const authorPaperId in assignments) {
            const reviews = assignments[authorPaperId]

            const authorSubmission = await firestore.getSubmission(authorPaperId)
            const author = await authorSubmission.get('author')
            reviews.map(async r => await firestore.assignReview(r, author))
        }
    }).catch((e) => {
        console.log(e)
    })

    req.session.provider.ext_content.send_lti_launch_url(res,
        "http://localhost:3001/lti/assignment/" + req.session.key + req.params.course + "/" + req.params.assignment + "/review",
        "grr u", "hmmmm")
})

module.exports = router;