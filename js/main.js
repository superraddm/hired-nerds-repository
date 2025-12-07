// Minimal JS for keyboard / click accessibility
document.addEventListener('keydown', (e)=>{
// quick keyboard: numbers 1-5 to open Jofs
if (e.key >= '1' && e.key <= '5'){
const idx = parseInt(e.key,10) - 1;
const link = document.querySelectorAll('.char')[idx];
if (link) link.click();
}
});


// Simple progressive enhancement for sprite replacement if you want to animate
window.addEventListener('load', ()=>{
// Placeholder behaviour easy to replace later with real sprite-sheet logic
});