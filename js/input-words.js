const MINIMUM_REQUIRED_WORDS = 5;
const STORAGE_KEY = "spellingCentralWords";

const inputs = Array.from(document.querySelectorAll(".word-input"));
const confirmButton = document.getElementById("confirmButton");

const countErrorModal = document.getElementById("countErrorModal");
const countErrorMessage = document.getElementById("countErrorMessage");
const closeCountErrorModalButton = document.getElementById("closeCountErrorModal");

const invalidWordModal = document.getElementById("invalidWordModal");
const invalidWordMessage = document.getElementById("invalidWordMessage");
const closeInvalidWordModalButton = document.getElementById("closeInvalidWordModal");

let validWordSet = new Set();

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

function showModal(modalElement) {
  modalElement.classList.remove("hidden");
  modalElement.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function hideModal(modalElement) {
  modalElement.classList.add("hidden");
  modalElement.setAttribute("aria-hidden", "true");

  const anyModalOpen =
    !countErrorModal.classList.contains("hidden") ||
    !invalidWordModal.classList.contains("hidden");

  if (!anyModalOpen) {
    document.body.style.overflow = "";
  }
}

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

function buildInvalidWordsMessage(invalidWords) {
  const invalidList = invalidWords.map((entry) => `"${entry.value}"`).join(", ");

  if (invalidWords.length === 1) {
    return `${invalidList} is not in the word bank. Please enter a real supported word.`;
  }

  return `These words are not in the word bank: ${invalidList}. Please enter real supported words.`;
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

function initializeInputWordsPage() {
  buildWordSet();
  loadWordsFromStorage();
}

initializeInputWordsPage();