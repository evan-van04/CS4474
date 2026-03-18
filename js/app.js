/*App entry point and screen switching.*/

function navigateTo(screen) {
  switch (screen) {
    case "wordsearch":
      renderWordSearchScreen();
      break;
    case "alphabetical":
      renderAlphabeticalScreen();
      break;
    case "mixedwords":
      renderMixedWordsScreen();
      break;
    case "missingletter":
      renderMissingLetterScreen();
      break;
    default:
      renderMenuScreen();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderHomeScreen();
});