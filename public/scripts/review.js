function buttonClicked(element) {
    const reviewId = element.parentElement.id
    const reviewMessage = element.previousSibling.value

    fetch('review/' + reviewId, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: reviewMessage
        })
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
