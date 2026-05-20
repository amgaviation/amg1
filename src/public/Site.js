// site.js — Wix Velo site-level code
import wixWindow from 'wix-window';

$w.onReady(function () {
  wixWindow.getBoundingRect().then((rect) => {
    // Listen for height messages from HTML embeds
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'wix-amg-resize') {
        // Find the HTML embed on the current page and resize it
        try {
          $w('#htmlEmbed1').height = e.data.height;
        } catch (err) { /* element ID may vary per page */ }
      }
    });
  });
});