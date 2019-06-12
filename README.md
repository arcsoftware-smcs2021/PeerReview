This is a Poolesville High School client project for a teacher.

Using the Canvas API and nodejs, we are building a peer review platform that can anonymize papers, be assigned to students,
and allow for returning feedback to students.

# Elements of the application

## Canvas API

The Canvas API is used to interact with Canvas by Instructure. Canvas is a learning-platform used by MCPS.

Canvas allows students to view their assignments on courses and get grades from their teachers.

This application is an external tool that can be used by any teacher to add peer review assignments to their course.


## Firestore

Cloud Firestore is a NoSQL way of storing the data that we get from the Canvas course. In our case, we store the submission details from the draft assignment.

## Express.js

Express.js is a framework for Node.js. It was used for making an HTTPS server that will be used to interact with the Canvas API.

# Environment Setup

To get the public code, clone the repository using git.
```console
foo@bar:~$ git clone https://github.com/arcsoftware-smcs2021/ClientProjectPublic.git
```
Once you have the repo cloned, you can install yarn to install packages for the project. You can click [here](https://yarnpkg.com/lang/en/docs/install/#debian-stable) for the installation instructions for yarn. After you have yarn installed, you can run the following to update the packages:
```console
foo@bar:~$ cd ClientProjectPublic/
foo@bar:ClientProjectPublic$ yarn install
```
This will quickly install the packages required for the project. To run the application, simply run:
```console 
foo@bar:ClientProjectPublic$ node src/app.js
```
