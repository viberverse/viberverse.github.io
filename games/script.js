const fullscreenBtn = document.getElementById("fullscreen");
const gameFrame = document.getElementById("gameframe");
fullscreenBtn.addEventListener("click", () => {
  gameFrame.requestFullscreen();
});
gameFrame.focus();

const titleTag = document.getElementsByTagName("title")[0];
if (localStorage.getItem("tab-name")) {
  titleTag.innerHTML = localStorage.getItem("tab-name");
}
gameFrame.contentWindow.addEventListener("keydown", (e) => {
  console.log(e.key);
  let panicStorage = localStorage.getItem("panic");
  let panicHref = localStorage.getItem("panicHref")
    ? localStorage.getItem("panicHref")
    : "https://google.com";
  if (
    (panicStorage && e.key === panicStorage) ||
    (!panicStorage && e.key === "`")
  ) {
    window.location.href = panicHref;
  }
});
document.addEventListener("keydown", (e) => {
  let panicStorage = localStorage.getItem("panic");
  let panicHref = localStorage.getItem("panicHref")
    ? localStorage.getItem("panicHref")
    : "https://google.com";
  if (
    (panicStorage && e.key === panicStorage) ||
    (!panicStorage && e.key === "`")
  ) {
    window.location.href = panicHref;
  }
});
