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

    for (const i in teacherIds) {
        const teacherId = teacherIds[i]
        const teacherDocument = firestore.collection('users').doc(teacherId)
        const teacherContent = await teacherDocument.get()

        if (!teacherContent.exists) {
            await addUser(teacherId)
        }

        await course.update({
            teachers: FieldValue.arrayUnion(teacherDocument)
        })
    }

    for (const i in studentIds) {
        const studentId = studentIds[i]
        const studentDocument = firestore.collection('users').doc(studentId)
        const studentContent = await studentDocument.get()

        if (!studentContent.exists) {
            await addUser(studentId)
        }

        await course.update({
            students: FieldValue.arrayUnion(studentDocument)
        })
    }
}

const adapter = {
    addAssignment,
    addUser,
    createCourse,
    checkCourseOnboard: checkCourseOnboard
}

module.exports = adapter