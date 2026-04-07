/*
  File: alphabetical.js
  Group: Group 5
  Course: CS 4474B/9552B
  Description: JavaScript for the Alphabetical screen
*/

const STORAGE_KEY = "spellingCentralWords";

/* DOM Elements */
const root = document.documentElement;
const orderList = document.getElementById("orderList");
const resetButton = document.getElementById("resetButton");
const emptyState = document.getElementById("emptyState");
const completionModal = document.getElementById("completionModal");
const playAgainButton = document.getElementById("playAgainButton");
const correctSound = new Audio("../sfx/correct.wav");
correctSound.preload = "auto";

/* Game State */
const gameState = {
  originalWords: [],
  currentWords: [],
  sortedWords: [],
  hasMadeFirstMove: false,
  dragIndex: null,
  currentDragGhost: null,
  interactionLocked: false,
};

/* Utility Functions */
function normalizeWord(value) {
  return String(value || "").trim().toLowerCase();
}

function toDisplayWord(value) {
  const trimmed = String(value || "").trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function swapItem(array, fromIndex, toIndex) {
  const copy = [...array];
  [copy[fromIndex], copy[toIndex]] = [copy[toIndex], copy[fromIndex]];
  return copy;
}

function arraysMatchByNormalized(first, second) {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((entry, index) => entry.normalized === second[index].normalized);
}

function getSavedWords() {
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
          value: toDisplayWord(value),
          normalized: normalizeWord(value),
        };
      })
      .filter((entry) => entry.normalized.length > 0)
      .sort((a, b) => a.slot - b.slot);
  } catch (error) {
    console.error("Could not read stored words:", error);
    return [];
  }
}

function buildShuffledWords(words) {
  if (words.length <= 1) {
    return [...words];
  }

  let shuffled = shuffleArray(words);
  let attempts = 0;

  while (arraysMatchByNormalized(shuffled, words) && attempts < 20) {
    shuffled = shuffleArray(words);
    attempts += 1;
  }

  return shuffled;
}

function createDragGhost(card) {
  const ghost = card.cloneNode(true);
  ghost.style.position = "absolute";
  ghost.style.top = "-9999px";
  ghost.style.left = "-9999px";
  ghost.style.width = `${card.offsetWidth}px`;
  ghost.style.height = `${card.offsetHeight}px`;
  ghost.style.opacity = "0.95";
  ghost.style.pointerEvents = "none";
  ghost.classList.add("drag-ghost");
  document.body.appendChild(ghost);
  return ghost;
}

function removeDragGhost() {
  if (gameState.currentDragGhost) {
    gameState.currentDragGhost.remove();
    gameState.currentDragGhost = null;
  }
}

function playSound(sound) {
  if (!sound) {
    return;
  }

  sound.currentTime = 0;
  sound.play().catch(() => {
  });
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

function isSolved() {
  return arraysMatchByNormalized(gameState.currentWords, gameState.sortedWords);
}

function getCardClass(entry, index) {
  if (!gameState.hasMadeFirstMove) {
    return "neutral";
  }

  return entry.normalized === gameState.sortedWords[index].normalized
    ? "correct"
    : "incorrect";
}

/* Layout */
function setResponsiveLayout() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isCompact = viewportWidth <= 900;

  const wordCount = Math.max(gameState.currentWords.length, 1);
  const maxLength = Math.max(
    ...gameState.currentWords.map((entry) => entry.value.length),
    ...gameState.sortedWords.map((entry) => entry.value.length),
    4
  );

  const headerHeight = isCompact ? 76 : 90;

  let titlePx = isCompact ? 52 : maxLength >= 10 ? 70 : 76;
  let titleGapPx = isCompact ? 10 : 14;
  let instructionPx = isCompact ? 15 : 18;
  let instructionMarginPx = isCompact ? 14 : 20;

  let cardGapPx = isCompact ? 10 : 12;
  let cardWidthPx = isCompact
    ? Math.min(250, Math.max(170, maxLength * 11 + 92))
    : Math.min(270, Math.max(210, maxLength * 12 + 96));

  const minColumns = 1;
  const maxColumns = Math.min(4, wordCount);
  const horizontalPadding = isCompact ? 24 : 80;
  const availableWidth = viewportWidth - horizontalPadding;

  let columns = minColumns;

  for (let candidate = maxColumns; candidate >= minColumns; candidate -= 1) {
    const totalWidth = candidate * cardWidthPx + (candidate - 1) * cardGapPx;

    if (totalWidth <= availableWidth) {
      columns = candidate;
      break;
    }
  }

  const rows = Math.ceil(wordCount / columns);
  const availableHeight =
    viewportHeight -
    headerHeight -
    titlePx -
    titleGapPx -
    instructionPx -
    instructionMarginPx -
    (isCompact ? 120 : 150);

  let cardMinHeightPx = isCompact ? 68 : 78;
  let numberColumnPx = isCompact ? 42 : 48;
  let numberSizePx = isCompact ? 22 : 26;
  let wordSizePx = isCompact ? 19 : 22;
  let paddingYPx = isCompact ? 10 : 12;
  let paddingXPx = isCompact ? 12 : 14;
  let resetWidthPx = isCompact ? 150 : 180;
  let resetHeightPx = isCompact ? 50 : 56;
  let resetFontPx = isCompact ? 15 : 16;

  const estimatedGridHeight = rows * cardMinHeightPx + Math.max(0, rows - 1) * cardGapPx;

  if (estimatedGridHeight > availableHeight) {
    cardMinHeightPx = Math.max(
      isCompact ? 56 : 60,
      Math.floor((availableHeight - Math.max(0, rows - 1) * cardGapPx) / rows)
    );

    wordSizePx = Math.max(isCompact ? 16 : 18, Math.round(cardMinHeightPx * 0.28));
    numberSizePx = Math.max(isCompact ? 18 : 20, Math.round(cardMinHeightPx * 0.34));
    numberColumnPx = Math.max(isCompact ? 34 : 38, Math.round(cardWidthPx * 0.17));
    paddingYPx = Math.max(8, Math.round(cardMinHeightPx * 0.14));
    paddingXPx = isCompact ? 10 : 12;
  }

  if (cardWidthPx * columns + (columns - 1) * cardGapPx > availableWidth) {
    cardWidthPx = Math.floor(
      (availableWidth - (columns - 1) * cardGapPx) / columns
    );
  }

  if (cardWidthPx < 170) {
    titlePx = isCompact ? 44 : 60;
    instructionPx = isCompact ? 14 : 16;
    instructionMarginPx = 12;
  }

  const shellWidthPx = Math.min(
    Math.max(columns * cardWidthPx + (columns - 1) * cardGapPx + (isCompact ? 24 : 40), 320),
    isCompact ? viewportWidth - 20 : 1120
  );

  const shellMinHeightPx = Math.min(
    Math.max(rows * cardMinHeightPx + Math.max(0, rows - 1) * cardGapPx + 170, isCompact ? 340 : 420),
    viewportHeight - headerHeight - 18
  );

  root.style.setProperty("--alpha-shell-width", `${shellWidthPx}px`);
  root.style.setProperty("--alpha-shell-min-height", `${shellMinHeightPx}px`);
  root.style.setProperty("--alpha-title-size", `${titlePx}px`);
  root.style.setProperty("--alpha-title-gap", `${titleGapPx}px`);
  root.style.setProperty("--alpha-instruction-size", `${instructionPx}px`);
  root.style.setProperty("--alpha-instruction-margin", `${instructionMarginPx}px`);
  root.style.setProperty("--alpha-grid-columns", String(columns));
  root.style.setProperty("--alpha-card-width", `${cardWidthPx}px`);
  root.style.setProperty("--alpha-card-gap", `${cardGapPx}px`);
  root.style.setProperty("--alpha-card-min-height", `${cardMinHeightPx}px`);
  root.style.setProperty("--alpha-card-padding-y", `${paddingYPx}px`);
  root.style.setProperty("--alpha-card-padding-x", `${paddingXPx}px`);
  root.style.setProperty("--alpha-number-column", `${numberColumnPx}px`);
  root.style.setProperty("--alpha-number-size", `${numberSizePx}px`);
  root.style.setProperty("--alpha-word-size", `${wordSizePx}px`);
  root.style.setProperty("--alpha-reset-width", `${resetWidthPx}px`);
  root.style.setProperty("--alpha-reset-height", `${resetHeightPx}px`);
  root.style.setProperty("--alpha-reset-font-size", `${resetFontPx}px`);
  root.style.setProperty(
    "--alpha-shell-before-inset",
    isCompact ? "16% 7% 20% 7%" : "18% 14% 22% 14%"
  );
}

/* Rendering */
function renderWords() {
  orderList.innerHTML = "";

  if (gameState.currentWords.length === 0) {
    emptyState.classList.remove("hidden");
    resetButton.disabled = true;
    return;
  }

  emptyState.classList.add("hidden");
  resetButton.disabled = false;

  gameState.currentWords.forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = `order-card ${getCardClass(entry, index)}`;
    item.dataset.index = String(index);
    item.draggable = !gameState.interactionLocked;
    item.setAttribute("aria-label", `Position ${index + 1}, ${entry.value}`);

    const number = document.createElement("span");
    number.className = "order-number";
    number.textContent = index + 1;

    const word = document.createElement("span");
    word.className = "order-word";
    word.textContent = entry.value;

    item.append(number, word);

    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragend", handleDragEnd);
    item.addEventListener("dragenter", handleDragEnter);
    item.addEventListener("dragleave", handleDragLeave);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("drop", handleDrop);

    orderList.appendChild(item);
  });

  setResponsiveLayout();
}

function evaluateAfterMove() {
  renderWords();

  if (gameState.hasMadeFirstMove && isSolved()) {
    gameState.interactionLocked = true;
    renderWords();
    playSound(correctSound);
    showModal(completionModal);
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
    fromIndex >= gameState.currentWords.length ||
    toIndex >= gameState.currentWords.length
  ) {
    return;
  }

  gameState.currentWords = swapItem(gameState.currentWords, fromIndex, toIndex);
  gameState.hasMadeFirstMove = true;
  evaluateAfterMove();
}

function handleDragStart(event) {
  if (gameState.interactionLocked) {
    event.preventDefault();
    return;
  }

  const card = event.currentTarget;
  gameState.dragIndex = Number(card.dataset.index);
  card.classList.add("dragging");
  gameState.currentDragGhost = createDragGhost(card);

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", card.dataset.index);
  event.dataTransfer.setDragImage(
    gameState.currentDragGhost,
    card.clientWidth / 2,
    card.clientHeight / 2
  );
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
  orderList.querySelectorAll(".drag-over").forEach((card) => {
    card.classList.remove("drag-over");
  });
  removeDragGhost();
}

function handleDragEnter(event) {
  if (gameState.interactionLocked) {
    return;
  }

  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
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

  const card = event.currentTarget;
  const targetIndex = Number(card.dataset.index);
  const startIndex = gameState.dragIndex ?? Number(event.dataTransfer.getData("text/plain"));

  card.classList.remove("drag-over");
  orderList.querySelectorAll(".drag-over").forEach((entry) => {
    entry.classList.remove("drag-over");
  });

  handleMove(startIndex, targetIndex);
  gameState.dragIndex = null;
  removeDragGhost();
}

/* Game Flow */
function restartGame() {
  hideModal(completionModal);

  gameState.currentWords = buildShuffledWords(gameState.sortedWords);
  gameState.hasMadeFirstMove = false;
  gameState.dragIndex = null;
  gameState.interactionLocked = false;

  renderWords();
}

function initializeGame() {
  hideModal(completionModal);

  gameState.originalWords = getSavedWords();

  if (gameState.originalWords.length === 0) {
    gameState.currentWords = [];
    gameState.sortedWords = [];
    renderWords();
    return;
  }

  gameState.sortedWords = [...gameState.originalWords].sort((a, b) =>
    a.normalized.localeCompare(b.normalized, undefined, { sensitivity: "base" })
  );

  gameState.currentWords = buildShuffledWords(gameState.sortedWords);
  gameState.hasMadeFirstMove = false;
  gameState.dragIndex = null;
  gameState.interactionLocked = false;

  renderWords();
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

resetButton.addEventListener("click", restartGame);
playAgainButton.addEventListener("click", () => {
  window.location.href = "game-selection.html";
});
document.addEventListener("keydown", handleEscapeKey);
window.addEventListener("resize", setResponsiveLayout);

/* Initialization */
document.addEventListener("DOMContentLoaded", initializeGame);