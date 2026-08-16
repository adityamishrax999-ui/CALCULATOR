(function () {
  "use strict";

  // Elements
  const currentDisplay = document.getElementById("current-display");
  const previousDisplay = document.getElementById("previous-display");
  const historyList = document.getElementById("history-list");
  const clearHistoryButton = document.getElementById("clear-history");
  const buttonsContainer = document.querySelector(".buttons");

  // State
  let currentValue = "";
  let previousValue = "";
  let operator = null;

  // History config
  const HISTORY_KEY = "calculatorHistory";
  const MAX_HISTORY_ITEMS = 100;

  // Load history safely
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn("Could not load history from localStorage:", err);
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (err) {
      console.warn("Could not save history to localStorage:", err);
    }
  }

  let calculationHistory = loadHistory();

  // Helpers
  function isErrorState() {
    return currentValue === "Error";
  }

  function sanitizeNumericString(s) {
    if (typeof s !== "string") return "";
    return s.replace(/[^\d.-]/g, "");
  }

  function formatResultNumber(num) {
    if (!Number.isFinite(num)) return String(num);
    // show up to 10 fractional digits but trim trailing zeros
    const opts = { maximumFractionDigits: 10 };
    const formatted = new Intl.NumberFormat(undefined, opts).format(num);
    return formatted;
  }

  // Update UI
  function updateDisplay() {
    // While typing we show the raw input (so user sees what they're entering).
    currentDisplay.textContent = currentValue === "" ? "0" : currentValue;
    previousDisplay.textContent = previousValue && operator
      ? `${previousValue} ${operator}`
      : "";
  }

  // NUMBER INPUT
  function enterNumber(number) {
    if (isErrorState()) {
      // Clear error if user starts typing a number
      currentValue = "";
    }

    // Prevent multiple dots
    if (number === "." && currentValue.includes(".")) return;

    // Prevent multiple leading zeros (keep single '0')
    if (number === "0" && currentValue === "0") return;

    // If currentValue is "0" and user types a digit (not '.'), replace it
    if (currentValue === "0" && number !== ".") {
      currentValue = "";
    }

    currentValue += number;
    updateDisplay();
  }

  // OPERATOR
  function chooseOperator(selectedOperator) {
    // If there's nothing to operate on, ignore
    if (currentValue === "" && previousValue === "") return;

    // If there's a current value and a previous value, compute first (chain operations)
    if (currentValue !== "" && previousValue !== "") {
      calculate();
    }

    // If user just pressed operator after a result, treat currentValue as previousValue
    previousValue = currentValue || previousValue;
    currentValue = "";
    operator = selectedOperator;
    updateDisplay();
  }

  // CALCULATION
  function calculate() {
    // Guard
    if (!previousValue || currentValue === "" || !operator) return;

    const a = parseFloat(sanitizeNumericString(previousValue));
    const b = parseFloat(sanitizeNumericString(currentValue));

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      setError();
      return;
    }

    let result;

    switch (operator) {
      case "+":
        result = a + b;
        break;
      case "−":
        result = a - b;
        break;
      case "×":
        result = a * b;
        break;
      case "÷":
        if (b === 0) {
          setError();
          return;
        }
        result = a / b;
        break;
      default:
        return;
    }

    if (!Number.isFinite(result)) {
      setError();
      return;
    }

    const expression = `${formatResultNumber(a)} ${operator} ${formatResultNumber(b)}`;
    addToHistory(expression, formatResultNumber(result));

    // Use unformatted result for further calculations (stringified)
    currentValue = String(result);
    previousValue = "";
    operator = null;

    // Display formatted result for readability
    currentDisplay.textContent = formatResultNumber(result);
    previousDisplay.textContent = "";
  }

  function setError() {
    currentValue = "Error";
    previousValue = "";
    operator = null;
    updateDisplay();
  }

  // CLEAR
  function clearCalculator() {
    currentValue = "";
    previousValue = "";
    operator = null;
    updateDisplay();
  }

  // DELETE (backspace)
  function deleteNumber() {
    if (isErrorState()) {
      clearCalculator();
      return;
    }
    currentValue = currentValue.slice(0, -1);
    updateDisplay();
  }

  // PERCENTAGE
  function percentage() {
    if (currentValue === "") return;

    const currentNum = parseFloat(sanitizeNumericString(currentValue));
    if (!Number.isFinite(currentNum)) return;

    let resultNum;

    // If we have a previous value and an operator, treat percentage relative to previous (common calculator behavior)
    if (previousValue && operator) {
      const prevNum = parseFloat(sanitizeNumericString(previousValue));
      if (!Number.isFinite(prevNum)) {
        resultNum = currentNum / 100;
      } else {
        resultNum = (prevNum * currentNum) / 100;
      }
    } else {
      resultNum = currentNum / 100;
    }

    currentValue = String(resultNum);
    updateDisplay();
  }

  // HISTORY
  function addToHistory(expression, result) {
    const entry = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 9),
      expression,
      result,
      when: new Date().toISOString()
    };
    calculationHistory.push(entry);

    // Enforce cap
    if (calculationHistory.length > MAX_HISTORY_ITEMS) {
      calculationHistory = calculationHistory.slice(-MAX_HISTORY_ITEMS);
    }

    saveHistory(calculationHistory);
    displayHistory();
  }

  function displayHistory() {
    historyList.innerHTML = "";

    if (!calculationHistory || calculationHistory.length === 0) {
      historyList.innerHTML = '<div class="empty-history">Your calculations will appear here</div>';
      return;
    }

    calculationHistory.forEach(item => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";
      historyItem.dataset.id = item.id;

      // left: expression = result (click to reuse)
      const left = document.createElement("button");
      left.type = "button";
      left.className = "history-reuse";
      left.title = "Click to reuse this result";
      left.textContent = `${item.expression} = ${item.result}`;

      // right: delete button
      const right = document.createElement("button");
      right.type = "button";
      right.className = "history-delete";
      right.title = "Delete this history entry";
      right.textContent = "✖";

      // timestamp (small)
      const ts = document.createElement("div");
      ts.className = "history-ts";
      ts.textContent = new Date(item.when).toLocaleString();

      historyItem.appendChild(left);
      historyItem.appendChild(right);
      historyItem.appendChild(ts);
      historyList.appendChild(historyItem);
    });
  }

  // Remove single history entry
  function removeHistoryItem(id) {
    calculationHistory = calculationHistory.filter(h => h.id !== id);
    saveHistory(calculationHistory);
    displayHistory();
  }

  // Reuse history item (populate current value with result)
  function reuseHistoryItem(id) {
    const item = calculationHistory.find(h => h.id === id);
    if (!item) return;
    currentValue = String(item.result).replace(/,/g, ""); // remove formatting if any
    previousValue = "";
    operator = null;
    updateDisplay();
  }

  // Clear all history
  clearHistoryButton.addEventListener("click", () => {
    calculationHistory = [];
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (err) {
      console.warn("Could not remove history from localStorage:", err);
    }
    displayHistory();
  });

  // BUTTON EVENTS via delegation
  buttonsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    // data-number
    if (btn.hasAttribute("data-number")) {
      enterNumber(btn.dataset.number);
      return;
    }

    // data-operator
    if (btn.hasAttribute("data-operator")) {
      chooseOperator(btn.dataset.operator);
      return;
    }

    // actions
    if (btn.dataset.action === "clear") {
      clearCalculator();
      return;
    }
    if (btn.dataset.action === "delete") {
      deleteNumber();
      return;
    }
    if (btn.dataset.action === "percentage") {
      percentage();
      return;
    }

    if (btn.classList.contains("equals")) {
      calculate();
      return;
    }
  });

  // HISTORY list actions (reuse / delete)
  historyList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    const entry = e.target.closest(".history-item");
    if (!entry) return;
    const id = entry.dataset.id;

    if (btn && btn.classList.contains("history-delete")) {
      removeHistoryItem(id);
      return;
    }

    // clicking on the text (or any non-delete area) will reuse
    reuseHistoryItem(id);
  });

  // KEYBOARD SUPPORT
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return; // ignore modifier combos

    const key = event.key;

    if (!isNaN(key) || key === ".") {
      // number or dot
      enterNumber(key);
      return;
    }

    if (key === "+" || key === "-" || key === "*" || key === "/") {
      let selectedOperator = key;
      if (key === "-") selectedOperator = "−";
      if (key === "*") selectedOperator = "×";
      if (key === "/") selectedOperator = "÷";
      chooseOperator(selectedOperator);
      return;
    }

    if (key === "Enter" || key === "=") {
      // Prevent possible default (forms etc)
      event.preventDefault();
      calculate();
      return;
    }

    if (key === "Backspace" || key === "Delete") {
      deleteNumber();
      return;
    }

    if (key === "Escape") {
      clearCalculator();
      return;
    }

    if (key === "%") {
      percentage();
      return;
    }
  });

  // Initialize displays
  displayHistory();
  updateDisplay();

  // For progressive enhancement: expose some functions for debugging (optional)
  // window._calc = { clearCalculator, calculate, enterNumber, chooseOperator };

})();
