const currentDisplay = document.getElementById("current-display");
const previousDisplay = document.getElementById("previous-display");

const historyList = document.getElementById("history-list");
const clearHistoryButton = document.getElementById("clear-history");

const buttons = document.querySelectorAll(".buttons button");

let currentValue = "";
let previousValue = "";
let operator = null;


let calculationHistory =
    JSON.parse(localStorage.getItem("calculatorHistory")) || [];


// =============================
// DISPLAY
// =============================

function updateDisplay() {

    currentDisplay.textContent =
        currentValue || "0";

    previousDisplay.textContent =
        previousValue && operator
            ? `${previousValue} ${operator}`
            : "";
}


// =============================
// NUMBER INPUT
// =============================

function enterNumber(number) {

    if (number === "." && currentValue.includes(".")) {
        return;
    }

    if (currentValue === "0" && number !== ".") {
        currentValue = "";
    }

    currentValue += number;

    updateDisplay();
}


// =============================
// OPERATOR
// =============================

function chooseOperator(selectedOperator) {

    if (currentValue === "" && previousValue === "") {
        return;
    }

    if (currentValue !== "" && previousValue !== "") {
        calculate();
    }

    previousValue = currentValue || previousValue;

    currentValue = "";

    operator = selectedOperator;

    updateDisplay();
}


// =============================
// CALCULATION
// =============================

function calculate() {

    if (!previousValue || !currentValue || !operator) {
        return;
    }

    const firstNumber = parseFloat(previousValue);
    const secondNumber = parseFloat(currentValue);

    let result;

    switch (operator) {

        case "+":
            result = firstNumber + secondNumber;
            break;

        case "−":
            result = firstNumber - secondNumber;
            break;

        case "×":
            result = firstNumber * secondNumber;
            break;

        case "÷":

            if (secondNumber === 0) {
                currentValue = "Error";
                previousValue = "";
                operator = null;

                updateDisplay();

                return;
            }

            result = firstNumber / secondNumber;
            break;
    }

    const expression =
        `${firstNumber} ${operator} ${secondNumber}`;

    addToHistory(expression, result);

    currentValue = String(result);
    previousValue = "";
    operator = null;

    updateDisplay();
}


// =============================
// CLEAR
// =============================

function clearCalculator() {

    currentValue = "";
    previousValue = "";
    operator = null;

    updateDisplay();
}


// =============================
// DELETE
// =============================

function deleteNumber() {

    currentValue =
        currentValue.slice(0, -1);

    updateDisplay();
}


// =============================
// PERCENTAGE
// =============================

function percentage() {

    if (currentValue === "") {
        return;
    }

    currentValue =
        String(parseFloat(currentValue) / 100);

    updateDisplay();
}


// =============================
// HISTORY
// =============================
function addToHistory(expression, result) {

    calculationHistory.push({
        expression: expression,
        result: result
    });

    localStorage.setItem(
        "calculatorHistory",
        JSON.stringify(calculationHistory)
    );

    displayHistory();
}



function displayHistory() {

    historyList.innerHTML = "";

    if (calculationHistory.length === 0) {

        historyList.innerHTML =
            '<p class="empty-history">No calculations yet</p>';

        return;
    }

    calculationHistory.forEach(item => {

        const historyItem =
            document.createElement("div");

        historyItem.classList.add("history-item");

        historyItem.textContent =
            `${item.expression} = ${item.result}`;

        historyList.appendChild(historyItem);
    });
}

clearHistoryButton.addEventListener("click", () => {

    calculationHistory = [];

    localStorage.removeItem("calculatorHistory");

    displayHistory();
});




// =============================
// BUTTON EVENTS
// =============================
const numberButtons =
    document.querySelectorAll("[data-number]");

const operatorButtons =
    document.querySelectorAll("[data-operator]");

const clearButton =
    document.querySelector('[data-action="clear"]');

const deleteButton =
    document.querySelector('[data-action="delete"]');

const percentageButton =
    document.querySelector('[data-action="percentage"]');

const equalsButton =
    document.querySelector(".equals");


numberButtons.forEach(button => {

    button.addEventListener("click", () => {

        enterNumber(button.dataset.number);

    });

});


operatorButtons.forEach(button => {

    button.addEventListener("click", () => {

        chooseOperator(button.dataset.operator);

    });

});


clearButton.addEventListener("click", () => {

    clearCalculator();

});


deleteButton.addEventListener("click", () => {

    deleteNumber();

});


percentageButton.addEventListener("click", () => {

    percentage();

});


equalsButton.addEventListener("click", () => {

    calculate();

});


// =============================
// KEYBOARD SUPPORT
// =============================

document.addEventListener("keydown", event => {

    const key = event.key;

    if (!isNaN(key) || key === ".") {

        enterNumber(key);

    } else if (
        key === "+" ||
        key === "-" ||
        key === "*" ||
        key === "/"
    ) {

        let selectedOperator = key;

        if (key === "-") selectedOperator = "−";
        if (key === "*") selectedOperator = "×";
        if (key === "/") selectedOperator = "÷";

        chooseOperator(selectedOperator);

    } else if (key === "Enter" || key === "=") {

        calculate();

    } else if (key === "Backspace") {

        deleteNumber();

    } else if (key === "Escape") {

        clearCalculator();

    } else if (key === "%") {

        percentage();
    }
});


// Initial display
displayHistory();
updateDisplay();
