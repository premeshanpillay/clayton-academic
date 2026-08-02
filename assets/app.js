/* ==========================================================================
   Clayton House — view rendering for the Notes section.

   Three views, chosen by the query string on /notes:
     /notes                              -> pick a grade
     /notes?grade=10                     -> pick a subject
     /notes?grade=10&subject=mathematics -> the resources
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("view");
  if (!root) return;

  /* ------------------------------------------------------------ helpers -- */

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
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

  function countForGrade(grade) {
    var total = 0;
    for (var i = 0; i < SUBJECTS.length; i++) {
      total += resourcesFor(grade, SUBJECTS[i].id).length;
    }
    return total;
  }

  /* Pluralise without the awkward "1 resources". */
  function plural(n, word) {
    return n + " " + word + (n === 1 ? "" : "s");
  }

  function isExternal(url) {
    return /^https?:\/\//i.test(url);
  }

  function setTitle(text) {
    document.title = text + " — " + SITE.house + " House";
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
      var n = countForGrade(grade);
      return (
        '<a class="card card--grade" href="/notes?grade=' + grade + '">' +
          '<span class="card__label">Grade</span>' +
          '<h2 class="card__title">' + grade + "</h2>" +
          '<span class="card__meta">' + plural(n, "resource") + "</span>" +
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
      var n = resourcesFor(grade, subject.id).length;
      return (
        '<a class="card" href="/notes?grade=' + grade + "&subject=" + esc(subject.id) + '">' +
          '<h2 class="card__title" style="font-size:20px">' + esc(subject.name) + "</h2>" +
          '<span class="card__meta">' + (n ? plural(n, "resource") : "Nothing yet") + "</span>" +
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

    var all = resourcesFor(grade, subject.id);

    /* Distinct types present, so the filter only ever offers real options. */
    var types = [];
    all.forEach(function (r) {
      var t = r.type || "Link";
      if (types.indexOf(t) === -1) types.push(t);
    });

    var chips = "";
    if (types.length > 1) {
      chips =
        '<div class="chips" role="group" aria-label="Filter by type">' +
          '<button class="chip" type="button" data-type="" aria-pressed="true">All</button>' +
          types.map(function (t) {
            return '<button class="chip" type="button" data-type="' + esc(t) + '" aria-pressed="false">' + esc(t) + "</button>";
          }).join("") +
        "</div>";
    }

    var toolbar = all.length
      ? '<div class="toolbar reveal">' +
          '<label class="visually-hidden" for="search">Search resources</label>' +
          '<input class="search" id="search" type="search" placeholder="Search ' + esc(subject.name) + '" autocomplete="off">' +
          chips +
        "</div>"
      : "";

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
        toolbar +
        '<div id="results" class="reveal"></div>' +
      "</section>";

    var results = document.getElementById("results");
    var searchEl = document.getElementById("search");
    var activeType = "";

    function draw() {
      var query = (searchEl ? searchEl.value : "").trim().toLowerCase();

      var shown = all.filter(function (r) {
        if (activeType && (r.type || "Link") !== activeType) return false;
        if (!query) return true;
        return (
          (r.title || "").toLowerCase().indexOf(query) !== -1 ||
          (r.description || "").toLowerCase().indexOf(query) !== -1
        );
      });

      if (!shown.length) {
        results.innerHTML = all.length
          ? '<div class="empty">' +
              '<p class="empty__title">No matches.</p>' +
              '<p class="empty__text">Try a different search or filter.</p>' +
            "</div>"
          : '<div class="empty">' +
              '<p class="empty__title">Nothing here yet.</p>' +
              '<p class="empty__text">Resources for Grade ' + grade + " " + esc(subject.name) +
                " will appear here as they are added.</p>" +
            "</div>";
        return;
      }

      results.innerHTML =
        '<ul class="list">' +
          shown.map(function (r) {
            var ext = isExternal(r.url);
            return (
              '<li class="item">' +
                '<a class="item__link" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' +
                  '<div class="item__body">' +
                    '<h2 class="item__title">' + esc(r.title) + "</h2>" +
                    (r.description ? '<p class="item__desc">' + esc(r.description) + "</p>" : "") +
                  "</div>" +
                  '<span class="item__tag">' + esc(r.type || "Link") + "</span>" +
                  '<span class="item__chevron" aria-hidden="true">' + (ext ? "&#8599;" : "&#8250;") + "</span>" +
                "</a>" +
              "</li>"
            );
          }).join("") +
        "</ul>";
    }

    if (searchEl) searchEl.addEventListener("input", draw);

    Array.prototype.forEach.call(root.querySelectorAll(".chip"), function (chip) {
      chip.addEventListener("click", function () {
        activeType = chip.dataset.type;
        Array.prototype.forEach.call(root.querySelectorAll(".chip"), function (c) {
          c.setAttribute("aria-pressed", String(c === chip));
        });
        draw();
      });
    });

    draw();
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
