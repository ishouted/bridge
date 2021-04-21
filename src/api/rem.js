const resizeEvent = 'orientationchange' in window ? 'orientationchange' : 'resize'
window.addEventListener(resizeEvent, calFont, false)
function calFont() {
  // const mobile =/Android|webOS|iPhone|iPad|BlackBerry/i.test(navigator.userAgent);
  const docEl = document.documentElement
  const clientWidth = docEl.clientWidth
  if (clientWidth < 1200) {
    document.body.classList.add('mobile-body')
    docEl.style.fontSize = 100 * (clientWidth / 750) + 'px'
  } else {
    document.body.classList.remove('mobile-body')
    docEl.style.fontSize = 'initial'
  }
}
calFont()