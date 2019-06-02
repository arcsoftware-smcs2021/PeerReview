const express = require('express')
const router = express.Router()
const lti = require('ims-lti')

const CanvasAdapter = require('../dataAdapters/canvasAdapter')

const self = {
    router: router,
    sessions: {},
    firestore: require('../dataAdapters/firestoreAdapter')
}

self.router.post('/', (req, res, next) => {
    // Context: teacher adding the tool to an assignment
    const session = {
        provider: new lti.Provider(req.body.oauth_consumer_key, "BBBB")
    }

    session.provider.valid_request(req, (err, is_valid) => {
        console.log(session.provider.body)
        const ident = req.body.oauth_consumer_key + session.provider.userId
        if (err) return res.status(500).send(err)
        if (!is_valid) return res.status(401).send("invalid sig")

        if (session.provider.ext_content && session.provider.ext_content.has_return_type("lti_launch_url")) {
            const courseId = req.body.oauth_consumer_key + session.provider.body.custom_canvas_course_id
            self.firestore.checkClassOnboard(courseId).then((r) => {
                if (r) {
                    // TODO: Make secure when running in prod
                    session.canvasAdapter = new CanvasAdapter(r.apiKey, "http://" + session.provider.body.custom_canvas_api_domain)

                    session.canvasAdapter.getAssignments(session.provider.body.custom_canvas_course_id).then(r => {
                        // TODO: Make secure when HTTPS works
                        self.sessions[ident] = session
                        res.cookie('session', ident, {
                            domain: 'localhost',
                            maxAge: 900000,
                            httpOnly: true,
                            sameSite: true
                        });

                        res.render("assignmentSelector", {
                            title: "selecc",
                            assignments: r
                        })
                    }).catch(e => {
                        console.log(e)
                        res.status(500).send(e)
                    })
                } else {
                    res.redirect("/onboard/" + courseId + '/' + session.provider.body.custom_canvas_course_id)
                }
            })
        } else {
            res.send("Error: Incorrect LTI URL or wrong state")
        }
    })
})

self.router.post('/assignment/:course/:assignment/review', (req, res, next) => {
    // Context: student visiting the assignment page
    const session = {
        provider: new lti.Provider(req.body.oauth_consumer_key, "BBBB")
    }

    session.provider.valid_request(req, (err, is_valid) => {
        const ident = req.body.oauth_consumer_key + provider.userId
        if (err) return res.status(500).send(err)
        if (!is_valid) return res.status(401).send("invalid sig")

        // TODO: Make secure when HTTPS works
        self.sessions[ident] = session
        res.cookie('session', ident, {
            domain: 'localhost',
            maxAge: 900000,
            httpOnly: true,
            sameSite: true
        });

        res.render("review", {
            title: "Peer Review"
        })
    })
})

self.router.post('/assignment/:course/:assignment/submit', (req, res, next) => {
    // Context: student submitting data from the assignment page
    const {provider} = self.sessions[req.cookies.session]

    provider.outcome_service.send_replace_result_with_text(1, req.body.message, (err, result) => {
        if (err) throw err
        res.send(result)
    })
})

self.router.get('/info/:course/:assignment', (req, res, next) => {
    const session = self.sessions[req.cookies.session]
    session.canvasAdapter.getAssignmentSubmissions(req.params.course, req.params.assignment).then((r) => {
        self.firestore.addAssignment(req.params.course, req.params.assignment, r).then(n => {
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

self.router.get('/select/:course/:assignment', (req, res, next) => {
    // Context: teacher has confirmed the assignment to add
    const {provider} = self.sessions[req.cookies.session]

    provider.ext_content.send_lti_launch_url(res,
        "http://localhost:3001/lti/assignment/" + req.params.course + "/" + req.params.assignment + "/review",
        "grr u", "hmmmm")
})

module.exports = self;