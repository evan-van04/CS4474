/*Helper functions.*/

function getApp() {
  return document.getElementById("app");
}

function createButton(label, onClick, className = "button") {
  const button = document.createElement("button");
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}