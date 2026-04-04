const STORAGE_KEY = "spellingCentralWords";
const orderList = document.getElementById("orderList");
const checkButton = document.getElementById("checkButton");
const resetButton = document.getElementById("resetButton");
const messageModal = document.getElementById("messageModal");
const messageText = document.getElementById("messageText");
const closeMessageButton = document.getElementById("closeMessageButton");
const emptyState = document.getElementById("emptyState");

let currentWords = [];
let alphabeticalWords = [];
let draggedIndex = null;
let currentDragGhost = null;

function normalizeWord(value) {
  return String(value).trim().toLowerCase();
}

function getSavedWords() {
  const raw = sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const savedWords = JSON.parse(raw);

    if (!Array.isArray(savedWords)) {
      return [];
    }

    return savedWords
      .filter((entry) => entry && typeof entry.value === "string")
      .sort((a, b) => Number(a.slot) - Number(b.slot))
      .map((entry) => ({
        value: entry.value.trim(),
        normalized: normalizeWord(entry.value),
      }))
      .filter((entry) => entry.normalized.length > 0);
  } catch (error) {
    console.error("Could not parse saved words:", error);
    return [];
  }
}

function shuffleWords(words) {
  const list = [...words];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
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
  if (currentDragGhost) {
    currentDragGhost.remove();
    currentDragGhost = null;
  }
}

function renderWords(words) {
  orderList.innerHTML = "";

  if (words.length === 0) {
    emptyState.classList.remove("hidden");
    checkButton.disabled = true;
    resetButton.disabled = true;
    return;
  }

  emptyState.classList.add("hidden");
  checkButton.disabled = false;
  resetButton.disabled = false;

  words.forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = "order-card";
    item.setAttribute("draggable", "true");
    item.dataset.index = index;

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
}

function handleDragStart(event) {
  const card = event.currentTarget;
  draggedIndex = Number(card.dataset.index);
  card.classList.add("dragging");
  orderList.classList.add("dragging-active");
  currentDragGhost = createDragGhost(card);
  event.dataTransfer.setDragImage(currentDragGhost, card.clientWidth / 2, card.clientHeight / 2);
  event.dataTransfer.setData("text/plain", "");
  event.dataTransfer.effectAllowed = "move";
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
  orderList.classList.remove("dragging-active");
  orderList.querySelectorAll(".drag-over").forEach((card) => card.classList.remove("drag-over"));
  removeDragGhost();
}

function handleDragEnter(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleDrop(event) {
  event.preventDefault();
  const card = event.currentTarget;
  card.classList.remove("drag-over");
  orderList.querySelectorAll(".drag-over").forEach((card) => card.classList.remove("drag-over"));
  const targetIndex = Number(card.dataset.index);

  if (draggedIndex === null || draggedIndex === targetIndex) {
    removeDragGhost();
    orderList.classList.remove("dragging-active");
    return;
  }

  const items = [...currentWords];
  const [draggedItem] = items.splice(draggedIndex, 1);
  items.splice(targetIndex, 0, draggedItem);
  currentWords = items;
  renderWords(currentWords);
}

function showMessage(message) {
  messageText.textContent = message;
  messageModal.classList.remove("hidden");
  messageModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function hideMessage() {
  messageModal.classList.add("hidden");
  messageModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function clearResultStyles() {
  orderList.querySelectorAll(".order-card").forEach((card) => {
    card.classList.remove("correct", "incorrect");
  });
}

function checkOrder() {
  clearResultStyles();

  let isComplete = true;

  currentWords.forEach((entry, index) => {
    const expected = alphabeticalWords[index];
    const card = orderList.querySelector(`[data-index="${index}"]`);

    if (!card) {
      return;
    }

    if (entry.normalized === expected.normalized) {
      card.classList.add("correct");
    } else {
      card.classList.add("incorrect");
      isComplete = false;
    }
  });

  if (isComplete) {
    showMessage("Nice work! The words are in alphabetical order.");
  } else {
    showMessage("Not quite yet. Keep moving the words until each box is green.");
  }
}

function initializeGame() {
  const savedWords = getSavedWords();

  if (savedWords.length === 0) {
    currentWords = [];
    alphabeticalWords = [];
    renderWords(currentWords);
    return;
  }

  alphabeticalWords = [...savedWords].sort((a, b) =>
    a.normalized.localeCompare(b.normalized, undefined, { sensitivity: "base" })
  );
  currentWords = shuffleWords(savedWords);
  renderWords(currentWords);
}

checkButton.addEventListener("click", checkOrder);
resetButton.addEventListener("click", () => {
  currentWords = shuffleWords(alphabeticalWords);
  renderWords(currentWords);
  clearResultStyles();
});
closeMessageButton.addEventListener("click", hideMessage);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !messageModal.classList.contains("hidden")) {
    hideMessage();
  }
});

initializeGame();
