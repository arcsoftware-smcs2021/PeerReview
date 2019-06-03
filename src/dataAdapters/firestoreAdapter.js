const {Firestore, FieldValue} = require('@google-cloud/firestore');

// Create a new client
const firestore = new Firestore(require('../../config/firestore.json'));

async function addAssignment(courseId, assignmentId, submissions) {
    const assignmentDocument = firestore.collection('assignments').doc(assignmentId)
    let submissionCount = 0

    await assignmentDocument.set({
        submissions: []
    })

    const courseDocument = firestore.collection('courses').doc(courseId)

    try {
        await courseDocument.update({
            assignments: FieldValue.arrayUnion(assignmentDocument)
        });
    } catch (e) {
        console.log(e)
        throw new Error("Class not setup.")
    }

    for (const i in submissions) {
        const submission = submissions[i]
        if (submission.workflow_state !== 'unsubmitted' && submission.attachments) {
            submissionCount++

            const submissionDocument = firestore.collection('documents').doc(submission.attachments[0].uuid)
            await submissionDocument.set({
                assignment: assignmentDocument,
                downloadLink: submission.attachments[0].url
            })

            await assignmentDocument.update({
                submissions: FieldValue.arrayUnion(submissionDocument)
            })

            await assignSubmission(submissionDocument, submission.user_id.toString())
        }
    }

    return submissionCount
}


async function checkCourseOnboard(courseId) {
    const course = await firestore.collection('courses').doc(courseId).get()
    return course.exists ? course : false
}

async function addUser(userId) {
    console.log(userId)
    const user = firestore.collection('users').doc(userId)

    await user.set({
        courses: [],
        submissions: [],
        reviews: []
    })
    return user
}

async function createCourse(courseId, apiKey, teacherIds, studentIds) {
    const course = firestore.collection('courses').doc(courseId)
    await course.set({
        teachers: [],
        students: [],
        assignments: [],
        apiKey
    })

    console.log(studentIds)
    console.log(teacherIds)

    for (const i in teacherIds) {
        const teacherId = teacherIds[i].toString()
        const teacherDocument = firestore.collection('users').doc(teacherId)
        const teacherContent = await teacherDocument.get()

        console.log(teacherId)
        console.log(teacherContent.exists)
        if (!teacherContent.exists) {
            await addUser(teacherId)
        }

        await teacherDocument.update({
            courses: FieldValue.arrayUnion(course)
        })

        await course.update({
            teachers: FieldValue.arrayUnion(teacherDocument)
        })
    }

    for (const i in studentIds) {
        const studentId = studentIds[i].toString()
        const studentDocument = firestore.collection('users').doc(studentId)
        const studentContent = await studentDocument.get()

        if (!studentContent.exists) {
            await addUser(studentId)
        }


        await studentDocument.update({
            courses: FieldValue.arrayUnion(course)
        })

        await course.update({
            students: FieldValue.arrayUnion(studentDocument)
        })
    }
}

async function assignSubmission(submissionDocument, userId) {
    const userDocument = firestore.collection('users').doc(userId)

    await submissionDocument.update({
        author: userDocument
    })

    await userDocument.update({
        submissions: FieldValue.arrayUnion(submissionDocument)
    })
}

async function assignReview(submissionId, user) {
    const submissionDocument = firestore.collection('documents').doc(submissionId)

    await user.update({
        reviews: FieldValue.arrayUnion(submissionDocument)
    })
}

async function getSubmission(submissionId) {
    return firestore.collection('documents').doc(submissionId).get()
}

async function getSubmissions(assignmentId) {
    const assignmentDocument = firestore.collection('assignments').doc(assignmentId)
    const documentSnapshot = await assignmentDocument.get()

    return documentSnapshot.data().submissions
}

async function getReviewsForAssignment(assignmentId, userId) {
    const assignmentDocument = firestore.collection('assignments').doc(assignmentId)

    const userDocument = firestore.collection('users').doc(userId)
    const userData = await userDocument.get()
    const reviews = await Promise.all(userData.get('reviews').map(r => r.get()))

    reviews.filter(r => r.get('assignment').id === assignmentDocument.id)

    return reviews.map(r => r.data())
}

const adapter = {
    addAssignment,
    addUser,
    assignSubmission,
    assignReview,
    createCourse,
    checkCourseOnboard,
    getSubmission,
    getSubmissions,
    getReviewsForAssignment
}

module.exports = adapter