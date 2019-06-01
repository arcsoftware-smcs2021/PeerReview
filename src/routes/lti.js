const express = require('express')
const router = express.Router()
const lti = require('ims-lti')

const self = {
    router: router,
    providers: {},
    canvas: require('../dataAdapters/canvasAdapter'),
    firestore: require('../dataAdapters/firestoreAdapter')
}

self.router.post('/', (req, res, next) => {
    const provider = new lti.Provider(req.body.oauth_consumer_key, "BBBB")
    provider.valid_request(req, (err, is_valid) => {
        const ident = req.body.oauth_consumer_key + provider.userId
        self.providers[ident] = provider
        if (err) return res.status(500).send(err)
        if (!is_valid) return res.status(401).send("invalid sig")

        if (provider.ext_content && provider.ext_content.has_return_type("lti_launch_url")) {
            const courseId = req.body.oauth_consumer_key + provider.body.custom_canvas_course_id
            self.firestore.checkClassOnboard(courseId).then((r) => {
                if (r) {
                    self.canvas.getAssignments(provider.body.custom_canvas_course_id).then(r => {
                        // TODO: Make secure when HTTPS works
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
                    res.redirect("/onboard/" + courseId + '/' + provider.body.custom_canvas_course_id)
                }
            })
        } else {
            res.send("Error: Incorrect LTI URL or wrong state")
        }
    })
})

self.router.post('/assignment/:course/:assignment/review', (req, res, next) => {
    const provider = new lti.Provider(req.body.oauth_consumer_key, "BBBB")
    provider.valid_request(req, (err, is_valid) => {
        const ident = req.body.oauth_consumer_key + provider.userId
        self.providers[ident] = provider
        if (err) return res.status(500).send(err)
        if (!is_valid) return res.status(401).send("invalid sig")


        // TODO: Make secure when HTTPS works
        res.cookie('session', ident, { domain: 'localhost', maxAge: 900000, httpOnly: true});
        res.render("review", {
            title: "Peer Review"
        })
    })
})

self.router.post('/assignment/:course/:assignment/submit', (req, res, next) => {
    const provider = self.providers[req.cookies.session]

    provider.outcome_service.send_replace_result_with_text(1, req.body.message, (err, result) => {
        if (err) throw err
        res.send(result)
    })
})

self.router.get('/info/:course/:assignment', (req, res, next) => {
    self.canvas.getAssignmentSubmissions(req.params.course, req.params.assignment).then((r) => {
        self.firestore.addAssignment(req.params.course, req.params.assignment, r).then(n => {
            res.render("submissionInfo", {
                title: "selecc",
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
    const provider = self.providers[req.cookies.session]

    provider.ext_content.send_lti_launch_url(res,
        "http://localhost:3001/lti/assignment/" + req.params.course + "/" + req.params.assignment + "/review",
        "grr u", "hmmmm")
})

module.exports = self;