/* ==========================================================================
   Light / dark switch.

   The theme is chosen in two layers:
     - no stored choice  -> follow the operating system (the CSS media query)
     - a stored choice   -> data-theme on <html> overrides the media query

   The attribute is set by a tiny inline script in each page's <head>, before
   the stylesheet paints, so the page never flashes the wrong theme. This file
   only wires up the switch itself and keeps the browser chrome in sync.
   ========================================================================== */

(function () {
  "use strict";

  var KEY = "clayton-theme";
  var root = document.documentElement;
  var button = document.querySelector(".switch");
  if (!button) return;

  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (err) {
      /* Private browsing can throw on access. Fall back to the OS. */
      return null;
    }
  }

  /* What the page is actually showing right now. */
  function isDark() {
    var choice = root.getAttribute("data-theme");
    if (choice === "dark") return true;
    if (choice === "light") return false;
    return media.matches;
  }

  /* Keep the phone's address bar colour matching the page. */
  function paintChrome(dark) {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].removeAttribute("media");
      metas[i].setAttribute("content", dark ? "#000000" : "#ffffff");
    }
  }

  function render() {
    var dark = isDark();
    button.setAttribute("aria-checked", String(dark));
    button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    paintChrome(dark);
  }

  button.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch (err) {
      /* Storage unavailable: the choice still applies for this page view. */
    }
    render();
  });

  /* If the visitor has made no choice, follow the OS when it changes. */
  var onSystemChange = function () {
    if (!stored()) render();
  };
  if (media.addEventListener) {
    media.addEventListener("change", onSystemChange);
  } else if (media.addListener) {
    media.addListener(onSystemChange);
  }

  render();
})();
