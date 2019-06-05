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
