const request = require('request-promise')
const linkParser = require('parse-link-header')
const querystring = require('querystring')

class CanvasAdapter {
    constructor(apiKey, host) {
        this.apiKey = apiKey
        this.host = host
    }

    async fetchAll (url, result = []) {
        const requestObj = {
            'method': 'GET',
            'uri': this.host + '/api/v1' + url,
            'json': true,
            'resolveWithFullResponse': true,
            'headers': {
                'Authorization': 'Bearer ' + this.apiKey
            }
        }

        const response = await request(requestObj)
        result = [...result, ...response.body]
        const links = linkParser(response.headers.link)
        return links.next ? fetchAll(links.next.url, result) : result
    }

    getAssignments(courseId) {
        return this.fetchAll(`/courses/${courseId}/assignments`)
    }

    getAssignmentSubmissions(courseId, assignmentId) {
        return this.fetchAll(`/courses/${courseId}/assignments/${assignmentId}/submissions`)
    }

    async getTeacherIds(courseId) {
        const teachers = await this.fetchAll(`/courses/${courseId}/enrollments?` +
          querystring.stringify({enrollment_type: ['teacher', 'ta']}))

        console.log(teachers)
        return teachers.map((t) => t.id)
    }

    async getStudentIds(courseId) {
        const students = await this.fetchAll(`/courses/${courseId}/enrollments?` +
          querystring.stringify({enrollment_type: 'student'}))

        console.log(students)
        return students.map((t) => t.id)
    }
}

module.exports = CanvasAdapter