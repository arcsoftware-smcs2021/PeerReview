const request = require('request-promise')
const linkParser = require('parse-link-header')
const querystring = require('querystring')

class CanvasAdapter {
    constructor(apiKey, host) {
        // Creates an object given the API key and host
        this.apiKey = apiKey
        this.host = host
    }

    async fetchAll (url, result = []) {
        // Requests a URL from the Canvas API and handles pagination for large responses
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

    async fetch (url) {
        // Requests a URL from the Canvas API
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
        return response.body
    }

    getAssignments(courseId) {
        return this.fetchAll(`/courses/${courseId}/assignments`)
    }

    getAssignment(courseId, assignmentId) {
        return this.fetch(`/courses/${courseId}/assignments/${assignmentId}`)
    }

    getAssignmentSubmissions(courseId, assignmentId) {
        return this.fetchAll(`/courses/${courseId}/assignments/${assignmentId}/submissions`)
    }

    async getTeacherIds(courseId) {
        // Returns a list of the ID's of teachers of a course
        const teachers = await this.fetchAll(`/courses/${courseId}/enrollments?` +
          querystring.stringify({enrollment_type: ['teacher', 'ta']}))

        return teachers.map((t) => t.id)
    }

    async getStudentIds(courseId) {
        // Returns a list of the ID's of students of a course
        const students = await this.fetchAll(`/courses/${courseId}/enrollments?` +
            querystring.stringify({enrollment_type: 'student'}))

        return students.map((s) => s.id)
    }

    async getUser(userId) {
        return this.fetch(`/users/${userId}`)
    }
}

module.exports = CanvasAdapter