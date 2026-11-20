// Deep-zoom diagram viewers. Any element with data-dzi becomes an OpenSeadragon viewer.
(function () {
  "use strict";
  function init() {
    if (typeof OpenSeadragon === "undefined") return;
    document.querySelectorAll(".workflow-viewer[data-dzi]").forEach(function (el) {
      var viewer = OpenSeadragon({
        element: el,
        prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
        tileSources: el.getAttribute("data-dzi"),
        showNavigationControl: true,
        navigationControlAnchor: OpenSeadragon.ControlAnchor.TOP_RIGHT,
        showNavigator: true,
        navigatorPosition: "BOTTOM_RIGHT",
        minZoomLevel: 0.5,
        maxZoomLevel: 10,
        visibilityRatio: 1,
        constrainDuringPan: true,
        gestureSettingsMouse: { scrollToZoom: false },
        placeholderFillStyle: "#f4f5f7",
        timeout: 120000
      });
      // Tall diagrams open fitted to the viewer width, at the top, so the first steps are readable.
      viewer.addHandler("open", function () {
        var item = viewer.world.getItemAt(0);
        if (!item) return;
        var size = item.getContentSize();
        var viewerAspect = el.clientHeight / Math.max(1, el.clientWidth);
        if (size.x > 2000 && size.y / size.x > viewerAspect * 1.4) {
          viewer.viewport.fitBounds(new OpenSeadragon.Rect(0, 0, 1, viewerAspect), true);
        }
      });
    });
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-fullscreen]");
    if (!btn) return;
    var el = document.getElementById(btn.getAttribute("data-fullscreen"));
    if (!el) return;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
