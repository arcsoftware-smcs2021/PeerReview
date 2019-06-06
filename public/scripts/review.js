document.addEventListener('DOMContentLoaded', () => {
    // When the page is loaded, add listeners to the submit buttons and tabs
    const submitButtons = document.getElementsByClassName("submitReview")
    Array.prototype.forEach.call(submitButtons, button => {
        button.addEventListener("click", (e) => {
            buttonClicked(e.srcElement)
        })
    })

    const tabs = document.getElementsByClassName("tab")
    Array.prototype.forEach.call(tabs, button => {
        button.addEventListener("click", (e) => {
            openReview(e.srcElement)
        })
    })

    // Load the first tab
    openReview(tabs[0])
}, false)

function chunkArrayInGroups(arr, size) {
    let res = []
    for(let i = 0; i < arr.length; i += size) {
        res.push(arr.slice(i, i + size))
    }
    return res
}

function openReview(element) {
    // Get all elements with class="tabContent" and hide them
    const tabContent = document.getElementsByClassName("review");
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" activeTab", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(element.id.split('-')[0]).style.display = "block";
    element.className += " activeTab";
}

function buttonClicked(element) {
    // Handle the submit button for a review being clicked
    const reviewId = element.parentElement.parentElement.parentElement.id
    const reviewMessage = element.previousSibling.value

    // Get an array of the elements that make up the criteria table
    const criteriaTable = Array.from(document.getElementById(reviewId).childNodes[0].childNodes[0].childNodes[1].childNodes).slice(4)
    console.log(criteriaTable)

    // Loop through the criteria
    let rubric = []
    const chunkedCriteria = chunkArrayInGroups(criteriaTable, 4)
    for (const i in chunkedCriteria) {
        const criteria = chunkedCriteria[i]

        // Extract values
        const textInput = criteria[2].childNodes[0]
        rubric.push({})
        rubric[i].message = textInput.value
        rubric[i].score = criteria[3].childNodes[0].value
    }

    // POST the criteria and comments
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
        alert("Review submitted!")
        if (res.status === 200) location.reload();
    }).catch(console.error)
}
