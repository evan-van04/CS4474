const MINIMUM_REQUIRED_WORDS = 5;
const STORAGE_KEY = "spellingCentralWords";
const WORD_BANK_PATH = "../json/word-bank.json";

const inputs = Array.from(document.querySelectorAll(".word-input"));
const confirmButton = document.getElementById("confirmButton");
const errorModal = document.getElementById("errorModal");
const errorMessage = document.getElementById("errorMessage");
const closeErrorModalButton = document.getElementById("closeErrorModal");

let validWordSet = new Set();
let wordBankLoaded = false;

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

function saveWordsToStorage() {
  const filledWords = getFilledWords().map((entry) => ({
    slot: entry.slot,
    value: entry.value,
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filledWords));
}

function loadWordsFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);

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

async function loadWordBank() {
  try {
    const response = await fetch(WORD_BANK_PATH);

    if (!response.ok) {
      throw new Error(`Failed to load word bank: ${response.status}`);
    }

    const wordBank = await response.json();

    if (!Array.isArray(wordBank)) {
      throw new Error("Word bank is not a valid array.");
    }

    validWordSet = new Set(
      wordBank
        .map((entry) => {
          if (!entry || typeof entry.word !== "string") {
            return "";
          }

          return normalizeWord(entry.word);
        })
        .filter((word) => word.length > 0)
    );

    wordBankLoaded = true;
  } catch (error) {
    console.error("Could not load word bank:", error);
    wordBankLoaded = false;
  }
}

function showErrorModal(message) {
  errorMessage.textContent = message;
  errorModal.classList.remove("hidden");
  errorModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function hideErrorModal() {
  errorModal.classList.add("hidden");
  errorModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function getInvalidWords(filledWords) {
  return filledWords.filter((entry) => !validWordSet.has(entry.normalized));
}

function buildInvalidWordsMessage(invalidWords) {
  const invalidList = invalidWords.map((entry) => entry.value).join(", ");

  if (invalidWords.length === 1) {
    return `"${invalidList}" is not in the word bank. Please enter a real supported word.`;
  }

  return `These words are not in the word bank: ${invalidList}. Please enter real supported words.`;
}

async function handleConfirm() {
  const filledWords = getFilledWords();

  saveWordsToStorage();

  if (filledWords.length < MINIMUM_REQUIRED_WORDS) {
    showErrorModal(`Please input at least ${MINIMUM_REQUIRED_WORDS} words.`);
    return;
  }

  if (!wordBankLoaded) {
    await loadWordBank();
  }

  if (!wordBankLoaded) {
    showErrorModal("The word bank could not be loaded. Please try again.");
    return;
  }

  const invalidWords = getInvalidWords(filledWords);

  if (invalidWords.length > 0) {
    showErrorModal(buildInvalidWordsMessage(invalidWords));
    return;
  }

  localStorage.setItem(
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

inputs.forEach((input) => {
  input.addEventListener("input", handleInputChange);
});

confirmButton.addEventListener("click", handleConfirm);
closeErrorModalButton.addEventListener("click", hideErrorModal);

errorModal.addEventListener("click", (event) => {
  if (event.target === errorModal) {
    hideErrorModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !errorModal.classList.contains("hidden")) {
    hideErrorModal();
  }
});

async function initializeInputWordsPage() {
  loadWordsFromStorage();
  await loadWordBank();
}

initializeInputWordsPage();