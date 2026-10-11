/* Round 4, phase 2: a placeholder so the shelf's Shapes tile lands in the frame. Phase 3 replaces this page. */
(function () {
  'use strict';
  const F = window.LPFrame, talk = F.bubble(document.getElementById('bubble'), document.getElementById('speech'));
  talk.say('Shapes are coming soon.', []);
  F.nook(document.getElementById('nook'), { feeling: 'calm', bubble: talk });
  document.getElementById('soon-shape').innerHTML = window.LPIcons.shapes;
  window.LPShelf.mountOverlay({ current: 'shapes' });
})();
