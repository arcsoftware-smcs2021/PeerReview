This is a Poolesville High School client project for a teacher.

Using the Canvas API and nodejs, we are building a peer review platform that can anonymize papers, be assigned to students,
and allow for returning feedback to students.

#Elements of the application

##Canvas API

The Canvas API is used to interact with Canvas by Instructure. Canvas is a learning-platform used by MCPS.

Canvas allows students to view their assignments on courses and get grades from their teachers.

This application is an external tool that can be used by any teacher to add peer review assignments to their course.


##Firestore

Cloud Firestore is a NoSQL way of storing the data that we get from the Canvas course. In our case, we store the submission details from the draft assignment.

##Express.js

Express.js is a framework for Node.js. It was used for making an HTTPS server that will be used to interact with the Canvas API.
