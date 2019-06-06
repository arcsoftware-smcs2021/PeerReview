const { Firestore, FieldValue } = require('@google-cloud/firestore')
const fs = require('fs')

// Read firestore config from environment if needed
if (process.env.FIRESTORE_CONFIG) {
  fs.mkdirSync('./config/secure')
  fs.writeFileSync('./config/firestore.json', process.env.FIRESTORE_CONFIG)
  fs.writeFileSync(
    './config/secure/firebase-key.json',
    process.env.FIRESTORE_KEY
  )
}

// Create a new client
const firestore = new Firestore(require('../../config/firestore.json'))

async function addAssignment(courseId, assignmentId, submissions, rubric) {
  // Add an assignment to the database and reference it appropriately
  const assignmentDocument = firestore
    .collection('assignments')
    .doc(assignmentId)
  let submissionCount = 0

  rubric = rubric.map(criteria => {
    return {
      description: criteria.description,
      longDescription: criteria.long_description,
      totalPoints: criteria.points,
      message: '',
      ratings: criteria.ratings
    }
  })

  await assignmentDocument.set({
    submissions: [],
    rubric: rubric || {}
  })

  const courseDocument = firestore.collection('courses').doc(courseId)

  try {
    await courseDocument.update({
      assignments: FieldValue.arrayUnion(assignmentDocument)
    })
  } catch (e) {
    console.log(e)
    throw new Error('Class not setup.')
  }

  for (const i in submissions) {
    const submission = submissions[i]
    if (submission.workflow_state !== 'unsubmitted' && submission.attachments) {
      submissionCount++

      const submissionDocument = firestore
        .collection('submissions')
        .doc(submission.attachments[0].uuid)
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
  const course = await firestore
    .collection('courses')
    .doc(courseId)
    .get()
  return course.exists ? course : false
}

async function addUser(userId, name) {
  console.log(userId)
  const user = firestore.collection('users').doc(userId)

  await user.set({
    name,
    courses: [],
    submissions: [],
    reviews: []
  })
  return user
}

async function createCourse(courseId, apiKey, users) {
  const course = firestore.collection('courses').doc(courseId)
  await course.set({
    users: [],
    assignments: [],
    apiKey
  })

  for (const user of users) {
    const userId = user.user.id.toString()
    const userDocument = firestore.collection('users').doc(userId)
    const userContent = await userDocument.get()

    if (!userContent.exists) {
      await addUser(userId, user.user.name)
    }

    await userDocument.update({
      courses: FieldValue.arrayUnion(course)
    })

    await course.update({
      users: FieldValue.arrayUnion(userDocument)
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
  const submissionDocument = firestore
    .collection('submissions')
    .doc(submissionId)
  const submissionData = await submissionDocument.get()

  const reviewsCollection = firestore.collection('reviews')

  const assignmentDoc = submissionData.get('assignment')
  const assignmentData = await assignmentDoc.get()

  const userData = await user.get()

  const authorDoc = submissionData.get('author')
  const authorData = await authorDoc.get()

  const rubric = assignmentData.get('rubric')

  // Some parameters are duplicated in the review document to make other code simpler and avoid extra database queries
  const reviewDocument = await reviewsCollection.add({
    submission: submissionDocument,
    status: 'incomplete',
    author: authorDoc,
    reviewerName: userData.get('name'),
    authorName: authorData.get('name'),
    downloadLink: submissionData.get('downloadLink'),
    assignment: assignmentDoc,
    rubric: rubric
  })

  await user.update({
    reviews: FieldValue.arrayUnion(reviewDocument)
  })
}

async function checkReviewsCompleted(userId) {
  const user = await firestore
    .collection('users')
    .doc(userId)
    .get()

  const userReviews = await user.get('reviews')
  for (const userReview of userReviews) {
    const reviewData = await userReview.get()
    const reviewStatus = reviewData.get('status')

    if (reviewStatus !== 'complete') {
      return false
    }
  }

  return true
}

async function completeReview(reviewId, userId, updateBlob) {
  const review = firestore.collection('reviews').doc(reviewId)

  if (updateBlob.rubric) {
    const reviewData = await review.get()
    const rubric = reviewData.get('rubric')

    for (const i in rubric) {
      // Merge the update criteria and the data from firestore
      // ... is spread notation, inlines all properties of the object
      updateBlob.rubric[i] = {
        ...rubric[i],
        ...updateBlob.rubric[i]
      }
    }
  }

  await review.update({
    ...updateBlob,
    status: 'complete'
  })

  return checkReviewsCompleted(userId)
}

async function getReviewsFromUser(assignmentId, userId) {
  const assignmentDocument = firestore
    .collection('assignments')
    .doc(assignmentId)

  const userDocument = firestore.collection('users').doc(userId)
  const userData = await userDocument.get()
  const reviews = await userData.get('reviews')
  const reviewDocuments = await Promise.all(reviews.map(r => r.get()))

  reviewDocuments.filter(
    r => r.get('submission').get('assignment').id === assignmentDocument.id
  )

  const reviewData = reviewDocuments.map(r => r.data())
  const submissions = await Promise.all(reviewData.map(r => r.submission.get()))

  for (const i in reviewData) {
    const review = reviewData[i]

    review.id = reviews[i].id
    review.downloadLink = submissions[i].data().downloadLink
  }

  return reviewData
}

async function getReviewsOfUser(assignmentId, userId) {
  // Get the documents needed
  const userDocument = firestore.collection('users').doc(userId)
  const assignmentDocument = firestore
    .collection('assignments')
    .doc(assignmentId)

  // Filter the reviews
  const reviews = await firestore
    .collection('reviews')
    .where('author', '==', userDocument)
    .where('assignment', '==', assignmentDocument)
    .get()
  let reviewData = []

  // This segment converts data from Firestore snapshots into Javascript objects
  reviews.forEach(r => {
    reviewData.push(r.data())
  })
  await Promise.all(
    reviewData.map(async r => {
      const submission = await r.submission.get()
      r.submission = submission.data()

      // A return is used to make timing work but no value is passed back
      return null
    })
  )

  return reviewData
}

async function getUserName(userId) {
  console.log(userId)
  const userDocument = firestore.collection('users').doc(userId)
  console.log(userDocument)
  const userData = await userDocument.get()
  console.log(userData)

  return userData.get('name')
}

async function getSubmission(submissionId) {
  return firestore
    .collection('submissions')
    .doc(submissionId)
    .get()
}

async function getSubmissions(assignmentId) {
  const assignmentDocument = firestore
    .collection('assignments')
    .doc(assignmentId)
  const documentSnapshot = await assignmentDocument.get()

  return documentSnapshot.data().submissions
}

// Export the functions
const adapter = {
  addAssignment,
  addUser,
  assignSubmission,
  assignReview,
  completeReview,
  createCourse,
  checkCourseOnboard,
  checkReviewsCompleted,
  getSubmission,
  getSubmissions,
  getReviewsFromUser,
  getReviewsOfUser,
  getUserName
}

module.exports = adapter
