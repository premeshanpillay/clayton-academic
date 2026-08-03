/* ==========================================================================
   Clayton House — view rendering for the Notes section.

   Three views, chosen by the query string on /notes:
     /notes                              -> pick a grade
     /notes?grade=10                     -> pick a subject
     /notes?grade=10&subject=mathematics -> the resources

   Resources shown on the last view come from two places:
     1. assets/data.js  - curated, edited by hand
     2. /api/files      - uploaded by visitors, stored in Vercel Blob
   The API is optional: if it is not reachable (for example when previewing
   locally with a plain static server) the page still works, it just shows
   the curated list and says uploads are unavailable.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("view");
  if (!root) return;

  var MAX_UPLOAD_MB = 4;

  /* ------------------------------------------------------------ helpers -- */

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Only ever emit http(s) or same-site relative links, so a bad entry in
     data.js can never turn into a javascript: URL. */
  function safeUrl(value) {
    var url = String(value == null ? "" : value).trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (/^[A-Za-z0-9._~\-/]/.test(url) && url.indexOf(":") === -1) return url;
    return "#";
  }

  function subjectById(id) {
    for (var i = 0; i < SUBJECTS.length; i++) {
      if (SUBJECTS[i].id === id) return SUBJECTS[i];
    }
    return null;
  }

  function resourcesFor(grade, subjectId) {
    var byGrade = NOTES[grade];
    if (!byGrade) return [];
    return byGrade[subjectId] || [];
  }

  function isExternal(url) {
    return /^https?:\/\//i.test(url);
  }

  function setTitle(text) {
    document.title = text + " — " + SITE.house + " House";
  }

  function formatSize(bytes) {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatDate(value) {
    var d = new Date(value);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  }

  function extensionOf(name) {
    var parts = String(name || "").split(".");
    return parts.length > 1 ? parts.pop().toUpperCase() : "File";
  }

  /* Fetch that insists on JSON, so a 404 HTML page from a static server is
     treated as "no API here" rather than crashing the view. */
  function fetchJSON(url, options) {
    return fetch(url, options).then(function (response) {
      var type = response.headers.get("content-type") || "";
      if (type.indexOf("application/json") === -1) {
        throw new Error("no-api");
      }
      return response.json().then(function (data) {
        if (!response.ok) throw new Error(data.error || "Request failed.");
        return data;
      });
    });
  }

  /* -------------------------------------------------------- breadcrumbs -- */

  function crumbs(parts) {
    var html = '<nav class="crumbs" aria-label="Breadcrumb">';
    parts.forEach(function (part, i) {
      if (i > 0) html += '<span class="crumbs__sep" aria-hidden="true">/</span>';
      html += part.href
        ? '<a href="' + esc(part.href) + '">' + esc(part.label) + "</a>"
        : '<span class="crumbs__current" aria-current="page">' + esc(part.label) + "</span>";
    });
    return html + "</nav>";
  }

  /* ------------------------------------------------------ view: grades -- */

  function renderGrades() {
    setTitle("Notes");

    var cards = GRADES.map(function (grade) {
      return (
        '<a class="card card--grade" href="/notes?grade=' + grade + '">' +
          '<span class="card__label">Grade</span>' +
          '<h2 class="card__title">' + grade + "</h2>" +
        "</a>"
      );
    }).join("");

    root.innerHTML =
      crumbs([{ label: "Notes" }]) +
      '<section class="section section--tight">' +
        '<div class="head reveal">' +
          '<p class="head__eyebrow">Notes</p>' +
          '<h1 class="head__title">Choose your grade.</h1>' +
          '<p class="head__sub">Notes, summaries and past papers, organised by grade and then by subject.</p>' +
        "</div>" +
        '<div class="grid grid--grades reveal">' + cards + "</div>" +
      "</section>";
  }

  /* ---------------------------------------------------- view: subjects -- */

  function renderSubjects(grade) {
    setTitle("Grade " + grade);

    var cards = SUBJECTS.map(function (subject) {
      return (
        '<a class="card card--subject" href="/notes?grade=' + grade + "&subject=" + esc(subject.id) + '">' +
          '<h2 class="card__title" style="font-size:20px">' + esc(subject.name) + "</h2>" +
        "</a>"
      );
    }).join("");

    root.innerHTML =
      crumbs([
        { label: "Notes", href: "/notes" },
        { label: "Grade " + grade },
      ]) +
      '<section class="section section--tight">' +
        '<div class="head reveal">' +
          '<p class="head__eyebrow">Grade ' + grade + "</p>" +
          '<h1 class="head__title">Choose a subject.</h1>' +
        "</div>" +
        '<div class="grid grid--subjects reveal">' + cards + "</div>" +
      "</section>";
  }

  /* --------------------------------------------------- view: resources -- */

  function renderResources(grade, subject) {
    setTitle(subject.name + " — Grade " + grade);

    var curated = resourcesFor(grade, subject.id);
    var uploaded = [];

    root.innerHTML =
      crumbs([
        { label: "Notes", href: "/notes" },
        { label: "Grade " + grade, href: "/notes?grade=" + grade },
        { label: subject.name },
      ]) +
      '<section class="section section--tight">' +
        '<div class="head reveal">' +
          '<p class="head__eyebrow">Grade ' + grade + "</p>" +
          '<h1 class="head__title">' + esc(subject.name) + "</h1>" +
        "</div>" +
        '<div id="toolbar" class="reveal"></div>' +
        '<div id="results" class="reveal"></div>' +
        '<div id="upload" class="upload reveal"></div>' +
      "</section>";

    var toolbarEl = document.getElementById("toolbar");
    var resultsEl = document.getElementById("results");
    var uploadEl = document.getElementById("upload");

    var activeType = "";
    var query = "";

    function everything() {
      return curated.concat(uploaded);
    }

    /* ---- toolbar (search + type filter) ---- */

    function drawToolbar() {
      var all = everything();
      if (!all.length) {
        toolbarEl.innerHTML = "";
        return;
      }

      var types = [];
      all.forEach(function (r) {
        var t = r.type || "Link";
        if (types.indexOf(t) === -1) types.push(t);
      });

      var chips = "";
      if (types.length > 1) {
        chips =
          '<div class="chips" role="group" aria-label="Filter by type">' +
            '<button class="chip" type="button" data-type="" aria-pressed="' + (activeType === "" ) + '">All</button>' +
            types.map(function (t) {
              return '<button class="chip" type="button" data-type="' + esc(t) + '" aria-pressed="' +
                (activeType === t) + '">' + esc(t) + "</button>";
            }).join("") +
          "</div>";
      }

      toolbarEl.innerHTML =
        '<div class="toolbar">' +
          '<label class="visually-hidden" for="search">Search resources</label>' +
          '<input class="search" id="search" type="search" placeholder="Search ' +
            esc(subject.name) + '" autocomplete="off" value="' + esc(query) + '">' +
          chips +
        "</div>";

      var searchEl = document.getElementById("search");
      searchEl.addEventListener("input", function () {
        query = searchEl.value;
        drawResults();
      });

      Array.prototype.forEach.call(toolbarEl.querySelectorAll(".chip"), function (chip) {
        chip.addEventListener("click", function () {
          activeType = chip.dataset.type;
          Array.prototype.forEach.call(toolbarEl.querySelectorAll(".chip"), function (c) {
            c.setAttribute("aria-pressed", String(c === chip));
          });
          drawResults();
        });
      });
    }

    /* ---- the list ---- */

    function drawResults() {
      var all = everything();
      var needle = query.trim().toLowerCase();

      var shown = all.filter(function (r) {
        if (activeType && (r.type || "Link") !== activeType) return false;
        if (!needle) return true;
        return (
          (r.title || "").toLowerCase().indexOf(needle) !== -1 ||
          (r.description || "").toLowerCase().indexOf(needle) !== -1
        );
      });

      if (!shown.length) {
        resultsEl.innerHTML = all.length
          ? '<div class="empty">' +
              '<p class="empty__title">No matches.</p>' +
              '<p class="empty__text">Try a different search or filter.</p>' +
            "</div>"
          : '<div class="empty">' +
              '<p class="empty__title">Nothing here yet.</p>' +
              '<p class="empty__text">Be the first to add something for Grade ' +
                grade + " " + esc(subject.name) + ".</p>" +
            "</div>";
        return;
      }

      resultsEl.innerHTML =
        '<ul class="list">' +
          shown.map(function (r) {
            var url = safeUrl(r.url);
            return (
              '<li class="item">' +
                '<a class="item__link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
                  '<div class="item__body">' +
                    '<h2 class="item__title">' + esc(r.title) + "</h2>" +
                    (r.description ? '<p class="item__desc">' + esc(r.description) + "</p>" : "") +
                  "</div>" +
                  '<span class="item__tag">' + esc(r.type || "Link") + "</span>" +
                  '<span class="item__chevron" aria-hidden="true">' +
                    (isExternal(url) ? "&#8599;" : "&#8250;") +
                  "</span>" +
                "</a>" +
              "</li>"
            );
          }).join("") +
        "</ul>";
    }

    /* ---- upload ---- */

    function drawUpload(state, message) {
      if (state === "unavailable") {
        uploadEl.innerHTML =
          '<p class="upload__note">Uploading is available on the published site.</p>';
        return;
      }

      var busy = state === "busy";

      uploadEl.innerHTML =
        '<div class="upload__inner">' +
          '<div class="upload__text">' +
            '<p class="upload__title">Add to this page</p>' +
            '<p class="upload__hint">PDF, Word, PowerPoint, Excel, text or image. Up to ' +
              MAX_UPLOAD_MB + " MB.</p>" +
          "</div>" +
          '<input type="file" id="file" class="visually-hidden"' +
            ' accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp,.heic,.gif"' +
            (busy ? " disabled" : "") + ">" +
          '<label class="btn btn--secondary' + (busy ? " is-busy" : "") + '" for="file">' +
            (busy ? "Uploading…" : "Choose a file") +
          "</label>" +
        "</div>" +
        '<p class="upload__status' + (state === "error" ? " is-error" : "") +
          '" role="status">' + (message ? esc(message) : "") + "</p>";

      var input = document.getElementById("file");
      if (input && !busy) input.addEventListener("change", onPick);
    }

    function onPick(event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;

      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        drawUpload("error", "That file is " + formatSize(file.size) +
          ", which is over the " + MAX_UPLOAD_MB + " MB limit.");
        return;
      }

      drawUpload("busy");

      fetchJSON(
        "/api/upload?grade=" + encodeURIComponent(grade) +
          "&subject=" + encodeURIComponent(subject.id) +
          "&filename=" + encodeURIComponent(file.name),
        { method: "POST", body: file }
      )
        .then(function () {
          return loadUploaded();
        })
        .then(function () {
          drawUpload("idle", "Uploaded. Thanks for adding to the house.");
        })
        .catch(function (err) {
          drawUpload(
            "error",
            err.message === "no-api"
              ? "Uploading is not available here."
              : err.message
          );
        });
    }

    /* ---- load uploaded files ---- */

    function loadUploaded() {
      return fetchJSON(
        "/api/files?grade=" + encodeURIComponent(grade) +
          "&subject=" + encodeURIComponent(subject.id)
      ).then(function (data) {
        uploaded = (data.files || []).map(function (f) {
          var bits = [formatDate(f.uploadedAt), formatSize(f.size)].filter(Boolean);
          return {
            title: f.title,
            type: extensionOf(f.title),
            description: bits.length ? "Uploaded " + bits.join(" · ") : "Uploaded",
            url: f.url,
          };
        });
        drawToolbar();
        drawResults();
      });
    }

    /* ---- go ---- */

    drawToolbar();
    drawResults();
    drawUpload("idle");

    loadUploaded().catch(function () {
      /* No API (local static preview, or Blob store not connected yet).
         The curated list still works; just say uploads are off. */
      drawUpload("unavailable");
    });
  }

  /* ------------------------------------------------------------- route -- */

  var params = new URLSearchParams(window.location.search);
  var grade = params.get("grade");
  var subjectId = params.get("subject");

  if (grade && GRADES.indexOf(Number(grade)) !== -1) {
    var subject = subjectId ? subjectById(subjectId) : null;
    if (subject) {
      renderResources(Number(grade), subject);
    } else {
      renderSubjects(Number(grade));
    }
  } else {
    renderGrades();
  }
})();
