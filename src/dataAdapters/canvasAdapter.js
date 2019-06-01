const canvas = require('node-canvas-api');

async function getTeacherIds(courseId) {
    const teachers = await canvas.getUsersInCourse(courseId, ['enrollment_type[]=teacher', 'enrollment_type[]=ta'])

    return teachers.map((t) => t.id)
}

function getStudentIds(courseId) {

}

const adapter = {
    getAssignments: canvas.getAssignments,
    getAssignmentSubmissions: canvas.getAssignmentSubmissions,
    getTeacherIds
}

module.exports = adapter