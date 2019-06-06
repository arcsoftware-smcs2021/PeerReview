function shuffle(array) {
  array.sort(() => Math.random() - 0.5)
}

function assign(papers, n) {
  if (n >= papers.length) {
    throw 'Too many reviews for the number of submissions'
  }

  let assignments = {}

  shuffle(papers)

  for (let i = 0; i < papers.length; i++) {
    const reviewer = papers[i]
    let reviews = []

    for (let j = i + 1; j < i + n + 1; j++) {
      reviews.push(papers[j % papers.length])
    }

    assignments[reviewer] = reviews
  }

  return assignments
}

module.exports = assign
