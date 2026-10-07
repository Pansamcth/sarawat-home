const fs = require('fs');
let js = fs.readFileSync('c:/Users/Administrator/Desktop/MP/js/main.js', 'utf8');
if (!js.includes('updateNewsFade')) {
  js += `

// Handle news track fade overlays
document.addEventListener("DOMContentLoaded", () => {
  const trackWrap = document.getElementById("newsTrackWrap");
  const fadeLeft = document.getElementById("newsFadeLeft");
  const fadeRight = document.getElementById("newsFadeRight");

  if (trackWrap && fadeLeft && fadeRight) {
    const updateNewsFade = () => {
      const scrollLeft = trackWrap.scrollLeft;
      const maxScroll = trackWrap.scrollWidth - trackWrap.clientWidth;

      if (scrollLeft <= 5) {
        fadeLeft.style.opacity = "0";
      } else {
        fadeLeft.style.opacity = "1";
      }

      if (scrollLeft >= maxScroll - 5) {
        fadeRight.style.opacity = "0";
      } else {
        fadeRight.style.opacity = "1";
      }
    };

    trackWrap.addEventListener("scroll", updateNewsFade);
    window.addEventListener("resize", updateNewsFade);
    // Initial check
    setTimeout(updateNewsFade, 500);
  }
});
`;
  fs.writeFileSync('c:/Users/Administrator/Desktop/MP/js/main.js', js);
  console.log('Added JS logic.');
}
