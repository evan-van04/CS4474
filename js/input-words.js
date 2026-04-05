/*
  File: input-words.js
  Group: Group 5
  Course: CS 4474B/9552B
  Description: JavaScript for the Input Words screen
*/

const MINIMUM_REQUIRED_WORDS = 5;
const STORAGE_KEY = "spellingCentralWords";

/* DOM Elements */
const inputs = Array.from(document.querySelectorAll(".word-input"));
const confirmButton = document.getElementById("confirmButton");
const clearButton = document.getElementById("clearButton");
const customizeButton = document.getElementById("customizeButton");

const countErrorModal = document.getElementById("countErrorModal");
const countErrorMessage = document.getElementById("countErrorMessage");
const closeCountErrorModalButton = document.getElementById("closeCountErrorModal");

const invalidWordModal = document.getElementById("invalidWordModal");
const invalidWordMessage = document.getElementById("invalidWordMessage");
const closeInvalidWordModalButton = document.getElementById("closeInvalidWordModal");

/* Validation State */
let validWordSet = new Set();

/* Utility Functions */
function normalizeWord(value) {
  return value.trim().toLowerCase();
}

function cleanDisplayWord(value) {
  return value.trim();
}

function getFilledWords() {
  return inputs
    .map((input) => ({
      slot: Number(input.dataset.slot),
      value: cleanDisplayWord(input.value),
      normalized: normalizeWord(input.value),
    }))
    .filter((entry) => entry.normalized.length > 0);
}

function buildWordSet() {
  if (!Array.isArray(WORD_BANK)) {
    console.error("WORD_BANK is missing or invalid.");
    return;
  }

  validWordSet = new Set(
    WORD_BANK
      .map((entry) => {
        if (!entry || typeof entry.word !== "string") {
          return "";
        }

        return normalizeWord(entry.word);
      })
      .filter((word) => word.length > 0)
  );
}

function saveWordsToStorage() {
  const filledWords = getFilledWords().map((entry) => ({
    slot: entry.slot,
    value: entry.value,
  }));

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filledWords));
}

function loadWordsFromStorage() {
  const raw = sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return;
  }

  try {
    const savedWords = JSON.parse(raw);

    if (!Array.isArray(savedWords)) {
      return;
    }

    savedWords.forEach((entry) => {
      const matchingInput = inputs.find(
        (input) => Number(input.dataset.slot) === Number(entry.slot)
      );

      if (matchingInput && typeof entry.value === "string") {
        matchingInput.value = entry.value;
      }
    });
  } catch (error) {
    console.error("Could not parse saved words:", error);
  }
}

function clearWordsFromStorage() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/* Modal Helpers */
const MODAL_CLOSE_DURATION = 380;

function showModal(modalElement) {
  if (modalElement.hideTimer) {
    window.clearTimeout(modalElement.hideTimer);
    modalElement.hideTimer = null;
  }

  modalElement.classList.remove("hidden");
  modalElement.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  window.requestAnimationFrame(() => {
    modalElement.classList.add("is-visible");
  });
}

function hideModal(modalElement) {
  if (modalElement.classList.contains("hidden")) {
    modalElement.classList.remove("is-visible");
    modalElement.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    return;
  }

  modalElement.classList.remove("is-visible");
  modalElement.setAttribute("aria-hidden", "true");

  const anyModalStillVisible =
    countErrorModal.classList.contains("is-visible") ||
    invalidWordModal.classList.contains("is-visible");

  if (!anyModalStillVisible) {
    document.body.style.overflow = "";
  }

  if (modalElement.hideTimer) {
    window.clearTimeout(modalElement.hideTimer);
  }

  modalElement.hideTimer = window.setTimeout(() => {
    if (!modalElement.classList.contains("is-visible")) {
      modalElement.classList.add("hidden");
    }
    modalElement.hideTimer = null;

    const anyModalOpen =
      !countErrorModal.classList.contains("hidden") ||
      !invalidWordModal.classList.contains("hidden");

    if (!anyModalOpen) {
      document.body.style.overflow = "";
    }
  }, MODAL_CLOSE_DURATION);
}

/* Validation Helpers */
function showCountError(message) {
  countErrorMessage.textContent = message;
  showModal(countErrorModal);
}

function showInvalidWordError(message) {
  invalidWordMessage.textContent = message;
  showModal(invalidWordModal);
}

function getInvalidWords(filledWords) {
  return filledWords.filter((entry) => !validWordSet.has(entry.normalized));
}

function getDuplicateWords(filledWords) {
  const seenWords = new Map();
  const duplicateWords = [];

  filledWords.forEach((entry) => {
    if (seenWords.has(entry.normalized)) {
      duplicateWords.push(entry);
      return;
    }

    seenWords.set(entry.normalized, entry);
  });

  return duplicateWords;
}

function buildInvalidWordsMessage(invalidWords) {
  const invalidList = invalidWords.map((entry) => `"${entry.value}"`).join(", ");

  if (invalidWords.length === 1) {
    return `${invalidList} is not in the word bank. Please enter a real supported word.`;
  }

  return `These words are not in the word bank: ${invalidList}. Please enter real supported words.`;
}

function buildDuplicateWordsMessage(duplicateWords) {
  const uniqueDuplicateMap = new Map();

  duplicateWords.forEach((entry) => {
    if (!uniqueDuplicateMap.has(entry.normalized)) {
      uniqueDuplicateMap.set(entry.normalized, entry.value);
    }
  });

  const uniqueDuplicateValues = Array.from(uniqueDuplicateMap.values());
  const duplicateList = uniqueDuplicateValues.map((word) => `"${word}"`).join(", ");

  if (uniqueDuplicateValues.length === 1) {
    return `${duplicateList} is a duplicate word. Please enter each word only once.`;
  }

  return `These are duplicate words: ${duplicateList}. Please enter each word only once.`;
}

/* Word Actions */
function getRandomWords(count) {
  if (!Array.isArray(WORD_BANK) || WORD_BANK.length === 0) {
    return [];
  }

  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function fillInputsWithWords(words) {
  inputs.forEach((input, index) => {
    if (index < words.length) {
      input.value = words[index].word.charAt(0).toUpperCase() + words[index].word.slice(1).toLowerCase();
    } else {
      input.value = "";
    }
  });

  saveWordsToStorage();
}

function handleClear() {
  inputs.forEach((input) => {
    input.value = "";
  });

  saveWordsToStorage();
}

function handleCustomize() {
  const randomWords = getRandomWords(20);
  fillInputsWithWords(randomWords);
}

function handleConfirm() {
  const filledWords = getFilledWords();

  saveWordsToStorage();

  if (filledWords.length < MINIMUM_REQUIRED_WORDS) {
    showCountError(`Please input at least ${MINIMUM_REQUIRED_WORDS} words.`);
    return;
  }

  if (validWordSet.size === 0) {
    showInvalidWordError("The word bank could not be loaded. Please try again.");
    return;
  }

  const duplicateWords = getDuplicateWords(filledWords);

  if (duplicateWords.length > 0) {
    showInvalidWordError(buildDuplicateWordsMessage(duplicateWords));
    return;
  }

  const invalidWords = getInvalidWords(filledWords);

  if (invalidWords.length > 0) {
    showInvalidWordError(buildInvalidWordsMessage(invalidWords));
    return;
  }

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      filledWords.map((entry) => ({
        slot: entry.slot,
        value: entry.value,
      }))
    )
  );

  window.location.href = "game-selection.html";
}

function handleInputChange(event) {
  const input = event.target;

  input.value = input.value.replace(/\s{2,}/g, " ");
  saveWordsToStorage();
}

/* Event Handling */
function handleEscapeKey(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (!countErrorModal.classList.contains("hidden")) {
    hideModal(countErrorModal);
  }

  if (!invalidWordModal.classList.contains("hidden")) {
    hideModal(invalidWordModal);
  }
}

inputs.forEach((input) => {
  input.addEventListener("input", handleInputChange);
});

confirmButton.addEventListener("click", handleConfirm);
clearButton.addEventListener("click", handleClear);
customizeButton.addEventListener("click", handleCustomize);

closeCountErrorModalButton.addEventListener("click", () => {
  hideModal(countErrorModal);
});

closeInvalidWordModalButton.addEventListener("click", () => {
  hideModal(invalidWordModal);
});

countErrorModal.addEventListener("click", (event) => {
  if (event.target === countErrorModal) {
    hideModal(countErrorModal);
  }
});

invalidWordModal.addEventListener("click", (event) => {
  if (event.target === invalidWordModal) {
    hideModal(invalidWordModal);
  }
});

document.addEventListener("keydown", handleEscapeKey);

window.addEventListener("beforeunload", () => {
  saveWordsToStorage();
});

/* Initialization */
function initializeInputWordsPage() {
  buildWordSet();

  const raw = sessionStorage.getItem(STORAGE_KEY);
  const hasSavedWords = raw && JSON.parse(raw)?.length > 0;

  if (hasSavedWords) {
    loadWordsFromStorage();
  } else {
    const randomWords = getRandomWords(20);
    fillInputsWithWords(randomWords);
  }
}

initializeInputWordsPage();