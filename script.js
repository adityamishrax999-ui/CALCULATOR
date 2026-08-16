const historyList = document.getElementById("history-list");
const clearHistoryButton = document.getElementById("clear-history");

let calculationHistory = [];

// Add calculation to history
function addToHistory(expression, result) {

    calculationHistory.push({
        expression: expression,
        result: result
    });

    displayHistory();
}

// Display history
function displayHistory() {

    historyList.innerHTML = "";

    if (calculationHistory.length === 0) {

        historyList.innerHTML =
            '<p class="empty-history">No calculations yet</p>';

        return;
    }

    calculationHistory.forEach(item => {

        const historyItem = document.createElement("div");

        historyItem.classList.add("history-item");

        historyItem.textContent =
            `${item.expression} = ${item.result}`;

        historyList.appendChild(historyItem);
    });
}

// Clear history
clearHistoryButton.addEventListener("click", () => {

    calculationHistory = [];

    displayHistory();
});

// Initial history display
displayHistory();