/*
  File: mixed-words.js
  Group: Group 5
  Course: CS 4474B/9552B
  Description: JavaScript for Mixed Words screen
*/

const STORAGE_KEY = "spellingCentralWords";
const COUNTDOWN_START = 3;

/* DOM Elements */
const lettersRow = document.getElementById("lettersRow");
const hintBubble = document.getElementById("hintBubble");
const progressPill = document.getElementById("progressPill");
const completionModal = document.getElementById("completionModal");
const playAgainButton = document.getElementById("playAgainButton");
const correctSound = new Audio("../sfx/correct.wav");
correctSound.preload = "auto";

/* Game State */
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

/* Utility Functions */
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

function playSound(sound) {
  if (!sound) {
    return;
  }

  sound.currentTime = 0;
  sound.play().catch(() => {
  });
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

/* Layout */
function setResponsiveLayout() {
  const root = document.documentElement;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const allLengths = gameState.words.length
    ? gameState.words.map((entry) => entry.word.length)
    : [3];

  const currentLength = Math.max(gameState.currentWord?.word.length || 3, 3);
  const maxLength = Math.max(...allLengths, currentLength, 3);
  const isCompact = viewportWidth <= 900;

  const headerHeight = isCompact ? 76 : 90;

  let titlePx = isCompact ? 52 : maxLength >= 10 ? 70 : 76;
  let titleGapPx = isCompact ? 10 : 14;
  let instructionPx = isCompact ? 15 : 18;
  let instructionMarginPx = isCompact ? 14 : 20;

  let tileGapPx = isCompact ? 10 : 12;
  let hardMaxTile = isCompact ? 64 : 72;
  let hardMinTile = isCompact ? 42 : 48;

  const availableWidth = viewportWidth - (isCompact ? 32 : 96);
  const tileSizeByWidth = Math.floor(
    (Math.min(availableWidth, 900) - (currentLength - 1) * tileGapPx) / currentLength
  );

  const availableHeight =
    viewportHeight -
    headerHeight -
    titlePx -
    titleGapPx -
    instructionPx -
    instructionMarginPx -
    180;

  const tileSizeByHeight = Math.floor(Math.max(availableHeight, hardMinTile));
  let tileSizePx = Math.min(tileSizeByWidth, tileSizeByHeight, hardMaxTile);
  tileSizePx = Math.max(hardMinTile, tileSizePx);

  if (tileSizePx < 54) {
    titlePx = isCompact ? 44 : 60;
    titleGapPx = 8;
    instructionPx = isCompact ? 14 : 16;
    instructionMarginPx = 12;
  }

  if (tileSizePx < 48) {
    tileGapPx = isCompact ? 8 : 10;
  }

  const lettersWidthPx = currentLength * tileSizePx + (currentLength - 1) * tileGapPx;
  const shellWidthPx = Math.min(
    Math.max(lettersWidthPx + (isCompact ? 40 : 120), isCompact ? 320 : 620),
    isCompact ? viewportWidth - 24 : 940
  );

  const shellMinHeightPx = Math.min(
    Math.max(tileSizePx + 260, isCompact ? 360 : 410),
    viewportHeight - headerHeight - 18
  );

  const hintMinWidthPx = Math.min(Math.max(Math.round(lettersWidthPx * 0.7), isCompact ? 260 : 360), viewportWidth - 40);
  const hintMaxWidthPx = Math.min(Math.max(Math.round(lettersWidthPx * 1.08), isCompact ? 320 : 440), viewportWidth - 30);

  const hintFontPx = tileSizePx < 50 ? (isCompact ? 14 : 16) : (isCompact ? 15 : 18);
  const progressWidthPx = tileSizePx < 50 ? (isCompact ? 108 : 120) : (isCompact ? 120 : 136);
  const progressFontPx = tileSizePx < 50 ? (isCompact ? 26 : 30) : (isCompact ? 30 : 34);
  const letterFontPx = Math.round(tileSizePx * 0.5);

  root.style.setProperty("--mw-shell-width", `${shellWidthPx}px`);
  root.style.setProperty("--mw-shell-min-height", `${shellMinHeightPx}px`);
  root.style.setProperty("--mw-title-size", `${titlePx}px`);
  root.style.setProperty("--mw-title-gap", `${titleGapPx}px`);
  root.style.setProperty("--mw-instruction-size", `${instructionPx}px`);
  root.style.setProperty("--mw-instruction-margin", `${instructionMarginPx}px`);
  root.style.setProperty("--mw-tile-size", `${tileSizePx}px`);
  root.style.setProperty("--mw-tile-gap", `${tileGapPx}px`);
  root.style.setProperty("--mw-letter-font-size", `${letterFontPx}px`);
  root.style.setProperty("--mw-hint-min-width", `${hintMinWidthPx}px`);
  root.style.setProperty("--mw-hint-max-width", `${hintMaxWidthPx}px`);
  root.style.setProperty("--mw-hint-font-size", `${hintFontPx}px`);
  root.style.setProperty("--mw-progress-min-width", `${progressWidthPx}px`);
  root.style.setProperty("--mw-progress-font-size", `${progressFontPx}px`);
  root.style.setProperty(
    "--mw-shell-before-inset",
    isCompact ? "18% 8% 22% 8%" : "22% 20% 26% 20%"
  );
}

/* Rendering */
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
    playSound(correctSound);

    if (gameState.currentIndex >= gameState.words.length - 1) {
      setHintText("You did it!");
      showModal(completionModal);
      return;
    }

    startCountdown();
  }
}

/* Drag and Drop */
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

const MODAL_CLOSE_DURATION = 380;

/* Modal Helpers */
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
  document.body.style.overflow = "";

  if (modalElement.hideTimer) {
    window.clearTimeout(modalElement.hideTimer);
  }

  modalElement.hideTimer = window.setTimeout(() => {
    if (!modalElement.classList.contains("is-visible")) {
      modalElement.classList.add("hidden");
    }
    modalElement.hideTimer = null;
  }, MODAL_CLOSE_DURATION);
}

/* Game Flow */
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

  setResponsiveLayout();
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

/* Event Handling */
function handleEscapeKey(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (!completionModal.classList.contains("hidden")) {
    hideModal(completionModal);
  }
}

playAgainButton.addEventListener("click", () => {
  window.location.href = "game-selection.html";
});
document.addEventListener("keydown", handleEscapeKey);
window.addEventListener("resize", setResponsiveLayout);

/* Initialization */
document.addEventListener("DOMContentLoaded", startGame);