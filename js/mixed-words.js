const STORAGE_KEY = "spellingCentralWords";
const COUNTDOWN_START = 3;

const lettersRow = document.getElementById("lettersRow");
const hintBubble = document.getElementById("hintBubble");
const progressPill = document.getElementById("progressPill");
const completionModal = document.getElementById("completionModal");
const playAgainButton = document.getElementById("playAgainButton");

const gameState = {
  words: [],
  currentIndex: 0,
  currentWord: null,
  letters: [],
  hasMadeFirstMove: false,
  dragIndex: null,
  interactionLocked: false,
  neutralClass: "neutral",
};

function normalizeWord(value) {
  return String(value || "").trim().toLowerCase();
}

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function moveItem(array, fromIndex, toIndex) {
  const copy = [...array];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

function getStoredWords() {
  const raw = sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => {
        const value = typeof entry?.value === "string" ? entry.value.trim() : "";
        return {
          slot: Number(entry?.slot) || 0,
          value,
          normalized: normalizeWord(value),
        };
      })
      .filter((entry) => entry.normalized.length > 0);
  } catch (error) {
    console.error("Could not read stored words:", error);
    return [];
  }
}

function buildDefinitionMap() {
  if (!Array.isArray(WORD_BANK)) {
    return new Map();
  }

  return new Map(
    WORD_BANK
      .filter((entry) => entry && typeof entry.word === "string")
      .map((entry) => [normalizeWord(entry.word), entry.definition || "A fun word to solve."])
  );
}

function buildGameWords() {
  const storedWords = getStoredWords();
  const definitionMap = buildDefinitionMap();

  if (storedWords.length === 0) {
    return [];
  }

  const preparedWords = storedWords.map((entry) => ({
    word: entry.normalized,
    displayWord: entry.value.toUpperCase(),
    definition: definitionMap.get(entry.normalized) || "A fun word to solve.",
  }));

  return shuffleArray(preparedWords);
}

function getScrambledLetters(answer) {
  const originalLetters = answer.split("");

  if (originalLetters.length < 2) {
    return originalLetters;
  }

  let shuffled = [...originalLetters];
  let attempts = 0;

  while (shuffled.join("") === answer && attempts < 20) {
    shuffled = shuffleArray(originalLetters);
    attempts += 1;
  }

  return shuffled;
}

function updateProgress() {
  progressPill.textContent = `${Math.min(gameState.currentIndex + 1, gameState.words.length)}/${gameState.words.length}`;
}

function getLetterClass(letter, index) {
  if (!gameState.hasMadeFirstMove) {
    return gameState.neutralClass;
  }

  return letter === gameState.currentWord.word[index] ? "correct" : "incorrect";
}

function renderLetters() {
  lettersRow.innerHTML = "";

  gameState.letters.forEach((letter, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `letter-tile ${getLetterClass(letter, index)}`;
    tile.textContent = letter.toUpperCase();
    tile.dataset.index = String(index);
    tile.draggable = !gameState.interactionLocked;
    tile.setAttribute("aria-label", `Letter ${letter.toUpperCase()}`);

    tile.addEventListener("dragstart", handleDragStart);
    tile.addEventListener("dragend", handleDragEnd);
    tile.addEventListener("dragover", handleDragOver);
    tile.addEventListener("drop", handleDrop);

    lettersRow.appendChild(tile);
  });
}

function setHintText(value) {
  hintBubble.textContent = value;
}

function isCurrentWordSolved() {
  return gameState.letters.join("") === gameState.currentWord.word;
}

function evaluateAfterMove() {
  renderLetters();

  if (isCurrentWordSolved()) {
    gameState.interactionLocked = true;
    renderLetters();
    startCountdown();
  }
}

function handleMove(fromIndex, toIndex) {
  if (
    gameState.interactionLocked ||
    fromIndex === null ||
    toIndex === null ||
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= gameState.letters.length ||
    toIndex >= gameState.letters.length
  ) {
    return;
  }

  gameState.letters = moveItem(gameState.letters, fromIndex, toIndex);
  gameState.hasMadeFirstMove = true;
  evaluateAfterMove();
}

function handleDragStart(event) {
  if (gameState.interactionLocked) {
    event.preventDefault();
    return;
  }

  const tile = event.currentTarget;
  gameState.dragIndex = Number(tile.dataset.index);
  tile.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", tile.dataset.index);
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
}

function handleDragOver(event) {
  if (gameState.interactionLocked) {
    return;
  }

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleDrop(event) {
  if (gameState.interactionLocked) {
    return;
  }

  event.preventDefault();
  const tile = event.currentTarget;
  const targetIndex = Number(tile.dataset.index);
  const startIndex = gameState.dragIndex ?? Number(event.dataTransfer.getData("text/plain"));

  handleMove(startIndex, targetIndex);
  gameState.dragIndex = null;
}

function showModal(modalElement) {
  modalElement.classList.remove("hidden");
  modalElement.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function hideModal(modalElement) {
  modalElement.classList.add("hidden");
  modalElement.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function startCountdown() {
  for (let count = COUNTDOWN_START; count >= 1; count -= 1) {
    setHintText(`Next word in ${count}...`);
    await wait(1000);
  }

  gameState.currentIndex += 1;

  if (gameState.currentIndex >= gameState.words.length) {
    setHintText("You did it!");
    showModal(completionModal);
    return;
  }

  loadCurrentWord();
}

function loadCurrentWord() {
  gameState.currentWord = gameState.words[gameState.currentIndex];
  gameState.letters = getScrambledLetters(gameState.currentWord.word);
  gameState.hasMadeFirstMove = false;
  gameState.interactionLocked = false;
  gameState.dragIndex = null;
  gameState.neutralClass = "neutral";

  updateProgress();
  setHintText(gameState.currentWord.definition);
  renderLetters();
}

function startGame() {
  hideModal(completionModal);
  gameState.words = buildGameWords();
  gameState.currentIndex = 0;

  if (gameState.words.length === 0) {
    window.location.href = "input-words.html";
    return;
  }

  loadCurrentWord();
}

function handleEscapeKey(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (!completionModal.classList.contains("hidden")) {
    hideModal(completionModal);
  }
}

playAgainButton.addEventListener("click", startGame);
document.addEventListener("keydown", handleEscapeKey);

document.addEventListener("DOMContentLoaded", startGame);