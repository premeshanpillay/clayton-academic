/* ==========================================================================
   POST /api/upload?grade=10&subject=mathematics&filename=notes.pdf

   The request body is the raw file. Stores it in Vercel Blob at
   notes/<grade>/<subject>/<timestamp>-<filename> so the grade and subject
   live in the path and no database is needed.

   NOTE ON ACCESS: this endpoint is deliberately open - anyone who can reach
   the site can upload. That was an explicit product decision. The checks
   below are therefore the ONLY thing standing between the store and abuse:

     - extension allowlist (no .html/.svg/.js, which would otherwise be
       served from our own domain and could run script against visitors)
     - content type is set by US from the extension, never trusted from the
       client
     - 4 MB cap, which also keeps us under Vercel's 4.5 MB body limit
     - filename is stripped of path separators and anything non-printable

   Do not loosen these without replacing them with something equivalent.
   ========================================================================== */

import { put } from "@vercel/blob";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

const GRADES = ["8", "9", "10", "11", "12"];

const SUBJECTS = [
  "mathematics", "english", "afrikaans", "life-orientation",
  "physical-science", "biology", "information-technology", "geography",
  "history", "drama", "art", "french", "zulu",
];

/* Extension -> content type. This map IS the allowlist: anything not listed
   here is rejected. Deliberately excludes html, svg, js and archives. */
const TYPES = {
  pdf: "application/pdf",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function fail(message, status) {
  return Response.json({ error: message }, { status: status });
}

/* Reduce whatever the client sent to a plain, safe basename.
   The stem is truncated but the extension is kept, otherwise a long filename
   would lose its ".pdf" and then be rejected as a disallowed type. */
function safeName(raw) {
  var base = String(raw || "file").split(/[\\/]/).pop();

  var clean = function (s) {
    return s
      .replace(/[^A-Za-z0-9._ -]/g, "")
      .replace(/\s+/g, " ")
      .replace(/^[.\s]+/, "")
      .trim();
  };

  var dot = base.lastIndexOf(".");
  if (dot <= 0) return clean(base).slice(0, 80) || "file";

  var stem = clean(base.slice(0, dot)).slice(0, 70);
  var ext = clean(base.slice(dot + 1)).slice(0, 10);

  if (!ext) return stem.slice(0, 80) || "file";
  return (stem || "file") + "." + ext;
}

export default async function handler(request) {
  if (request.method !== "POST") return fail("Method not allowed.", 405);

  var url = new URL(request.url);
  var grade = url.searchParams.get("grade");
  var subject = url.searchParams.get("subject");
  var filename = safeName(url.searchParams.get("filename"));

  if (GRADES.indexOf(grade) === -1) return fail("Unknown grade.", 400);
  if (SUBJECTS.indexOf(subject) === -1) return fail("Unknown subject.", 400);

  var ext = filename.indexOf(".") !== -1 ? filename.split(".").pop().toLowerCase() : "";
  var contentType = TYPES[ext];
  if (!contentType) {
    return fail(
      "That file type is not allowed. Use PDF, Word, PowerPoint, Excel, a text file or an image.",
      415
    );
  }

  var body;
  try {
    body = await request.arrayBuffer();
  } catch (err) {
    return fail("Could not read the file.", 400);
  }

  if (!body.byteLength) return fail("The file is empty.", 400);
  if (body.byteLength > MAX_BYTES) {
    return fail("That file is larger than the 4 MB limit.", 413);
  }

  try {
    var blob = await put(
      "notes/" + grade + "/" + subject + "/" + Date.now() + "-" + filename,
      body,
      {
        access: "public",
        contentType: contentType,
        addRandomSuffix: false,
      }
    );

    return Response.json({
      url: blob.url,
      pathname: blob.pathname,
      size: body.byteLength,
    });
  } catch (err) {
    /* Most commonly: the Blob store is not connected, so there is no
       BLOB_READ_WRITE_TOKEN. Say so plainly rather than leaking the stack. */
    return fail("Upload failed. Is a Blob store connected to this project?", 500);
  }
}
