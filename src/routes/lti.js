const express = require('express')
const router = express.Router()
const lti = require('ims-lti')
const canvas = require('node-canvas-api');

router.post('/', (req, res, next) => {
    // console.log(req.body)

    const provider = new lti.Provider(req.body.oauth_consumer_key, "BBBB")
    provider.valid_request(req, (err, is_valid) => {
        if (err) return res.status(500).send(err)
        if (!is_valid) return res.status(401).send("invalid sig")

        // console.log(provider)
        if (provider.ext_content && provider.ext_content.has_return_type("lti_launch_url")) {
            canvas.getAssignments(provider.body.custom_canvas_course_id).then(r => {
                res.render("courseSelector", {
                    title: "selecc",
                    courses: r
                })
            }).catch(e => {
                console.log(e)
                res.status(500).send(e)
            })
        } else {
            res.send(provider.body.custom_canvas_course_id + " " + provider.userId)
        }
    })
})

router.get('/select/:course', ())

module.exports = router;