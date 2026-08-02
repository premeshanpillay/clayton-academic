/* ==========================================================================
   GET /api/files?grade=10&subject=mathematics

   Lists everything uploaded for one grade + subject. There is no database:
   the grade and subject are read straight back out of the blob pathname.
   ========================================================================== */

import { list } from "@vercel/blob";

const GRADES = ["8", "9", "10", "11", "12"];

const SUBJECTS = [
  "mathematics", "english", "afrikaans", "life-orientation",
  "physical-science", "biology", "information-technology", "geography",
  "history", "drama", "art", "french", "zulu",
];

export default async function handler(request) {
  var url = new URL(request.url);
  var grade = url.searchParams.get("grade");
  var subject = url.searchParams.get("subject");

  if (GRADES.indexOf(grade) === -1 || SUBJECTS.indexOf(subject) === -1) {
    return Response.json({ error: "Unknown grade or subject." }, { status: 400 });
  }

  try {
    var result = await list({
      prefix: "notes/" + grade + "/" + subject + "/",
      limit: 1000,
    });

    var files = result.blobs.map(function (blob) {
      /* Pathname is notes/<grade>/<subject>/<timestamp>-<name>. Strip the
         folders and the timestamp so students see the original filename. */
      var base = blob.pathname.split("/").pop();
      return {
        title: base.replace(/^\d+-/, ""),
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      };
    });

    /* Newest first. */
    files.sort(function (a, b) {
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    });

    return new Response(JSON.stringify({ files: files }), {
      headers: {
        "content-type": "application/json",
        /* No caching: a student who just uploaded should see it straight away. */
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    return Response.json(
      { error: "Could not list files. Is a Blob store connected to this project?" },
      { status: 500 }
    );
  }
}
