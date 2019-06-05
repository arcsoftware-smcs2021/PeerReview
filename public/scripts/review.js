function buttonClicked(element) {
    const reviewId = element.parentElement.id
    const reviewMessage = element.previousSibling.value

    const criteriaTable = Array.from(document.getElementById('criteria').childNodes[0].childNodes).slice(1)

    let rubric = []
    for (const i in criteriaTable) {
        const criteria = criteriaTable[i].cells

        rubric.push({})
        rubric[i].message = criteria[2].childNodes[0].value
        rubric[i].score = criteria[3].childNodes[0].value
    }

    fetch('review/' + reviewId, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: reviewMessage,
            rubric
        })
    }).then(res => {
        if (res.status === 200) location.reload();
    }).catch(console.error)
}

document.addEventListener('DOMContentLoaded', () => {
    const submitButtons = document.getElementsByClassName("submitReview")

    Array.prototype.forEach.call(submitButtons, button => {
        button.addEventListener("click", (e) => {
            buttonClicked(e.srcElement)
        })
    }
)}, false)

/*
Make tabs for the review.pug filePath
*/

function openReview(reviewName) {
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";
}
