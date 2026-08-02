/* ==========================================================================
   CLAYTON HOUSE — RESOURCE DATA
   --------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO ADD NOTES.

   To add a resource, find the grade, then the subject, and add one line
   inside the square brackets:

     { title: "Algebra Summary", type: "Notes", url: "files/algebra.pdf" }

   Two kinds of "url" work:
     1. A file you uploaded  ->  url: "files/algebra.pdf"
        (drop the PDF into the "files" folder next to this project)
     2. A link to anywhere    ->  url: "https://www.siyavula.com"

   "type" can be any of: Notes, Summary, Past Paper, Worksheet, Video,
   Textbook, Link. (Anything else works too - it just shows as a label.)

   "description" is optional.
   ========================================================================== */

const SITE = {
  house: "Clayton",
  tagline: "Every set of notes, every past paper, in one place.",
};

const GRADES = [8, 9, 10, 11, 12];

/* The "id" is used in the web address. Keep ids lowercase with dashes. */
const SUBJECTS = [
  { id: "mathematics", name: "Mathematics" },
  { id: "english", name: "English" },
  { id: "afrikaans", name: "Afrikaans" },
  { id: "life-orientation", name: "Life Orientation" },
  { id: "physical-science", name: "Physical Science" },
  { id: "biology", name: "Biology" },
  { id: "information-technology", name: "Information Technology" },
  { id: "geography", name: "Geography" },
  { id: "history", name: "History" },
  { id: "drama", name: "Drama" },
  { id: "art", name: "Art" },
  { id: "french", name: "French" },
  { id: "zulu", name: "Zulu" },
];

/* --------------------------------------------------------------------------
   THE RESOURCES

   Structure:  NOTES[grade][subject-id] = [ ...resources... ]

   Every grade and subject already has an empty list waiting for you, so you
   never have to create the structure yourself - just add lines to a list.
   -------------------------------------------------------------------------- */

const NOTES = {
  8: {
    mathematics: [],
    english: [],
    afrikaans: [],
    "life-orientation": [],
    "physical-science": [],
    biology: [],
    "information-technology": [],
    geography: [],
    history: [],
    drama: [],
    art: [],
    french: [],
    zulu: [],
  },

  9: {
    mathematics: [],
    english: [],
    afrikaans: [],
    "life-orientation": [],
    "physical-science": [],
    biology: [],
    "information-technology": [],
    geography: [],
    history: [],
    drama: [],
    art: [],
    french: [],
    zulu: [],
  },

  10: {
    /* ---- These three are EXAMPLES so you can see how it looks. ----
       Delete them once you add your own. The links are real study sites. */
    mathematics: [
      {
        title: "Everything Maths — Grade 10 Textbook",
        type: "Textbook",
        description: "Free, full CAPS-aligned textbook from Siyavula.",
        url: "https://www.siyavula.com",
      },
      {
        title: "DBE Past Exam Papers",
        type: "Past Paper",
        description: "Official past papers and memos from the Department of Basic Education.",
        url: "https://www.education.gov.za",
      },
    ],
    english: [],
    afrikaans: [],
    "life-orientation": [],
    "physical-science": [
      {
        title: "Everything Science — Grade 10 Textbook",
        type: "Textbook",
        description: "Free, full CAPS-aligned textbook from Siyavula.",
        url: "https://www.siyavula.com",
      },
    ],
    biology: [],
    "information-technology": [],
    geography: [],
    history: [],
    drama: [],
    art: [],
    french: [],
    zulu: [],
  },

  11: {
    mathematics: [],
    english: [],
    afrikaans: [],
    "life-orientation": [],
    "physical-science": [],
    biology: [],
    "information-technology": [],
    geography: [],
    history: [],
    drama: [],
    art: [],
    french: [],
    zulu: [],
  },

  12: {
    mathematics: [],
    english: [],
    afrikaans: [],
    "life-orientation": [],
    "physical-science": [],
    biology: [],
    "information-technology": [],
    geography: [],
    history: [],
    drama: [],
    art: [],
    french: [],
    zulu: [],
  },
};
