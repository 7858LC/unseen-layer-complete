export const MODE1_TAXONOMY = [
  { id: "non_response", type: 1, name: "Conspicuous Non-Response", short: "The Silence of the Room", diagnostic: "Who should have spoken and didn't? What obvious question went unasked?", color: "#7C6AF7", anchor: "Matt 20:18–19" },
  { id: "unmentioned_condition", type: 2, name: "Unmentioned Condition", short: "The Hidden Cost", diagnostic: "What did God not mention in the instruction, and when does it appear?", color: "#E8834A", anchor: "Jonah 1:3" },
  { id: "withheld_power", type: 3, name: "Withheld Power", short: "What He Could Have Done", diagnostic: "What could He have done that He didn't, and what does the restraint teach?", color: "#4A9EE8", anchor: "Matt 21:19" },
  { id: "curated_memory", type: 4, name: "Curated Memory", short: "The Edited Past", diagnostic: "What did they choose not to remember, and what does the omission protect?", color: "#E84A7C", anchor: "Numbers 11:5" },
  { id: "unnecessary_announcement", type: 5, name: "Unnecessary Announcement", short: "God States the Obvious", diagnostic: "Why is God telling them something they already know?", color: "#4AE8A0", anchor: "Josh 1:2" },
  { id: "quantified_devotion", type: 6, name: "Quantified Devotion", short: "The Math of the Text", diagnostic: "What does the arithmetic reveal that the narrative doesn't state?", color: "#E8D44A", anchor: "2 Samuel 6" },
  { id: "indefensible_equity", type: 7, name: "Indefensible Equity", short: "Why Does This Bother Us", diagnostic: "Why does this text bother us, and what does our offense expose?", color: "#E84A4A", anchor: "Matt 20:1–16" },
  { id: "homiletical_bridge", type: 8, name: "Homiletical Bridge", short: "The Interior the Text Omits", diagnostic: "What is the plausible human interior experience of the characters that the narrator omits?", color: "#B44AE8", anchor: "Matt 20:1–16 workers watching latecomers", flagged: true },
  { id: "canonical_typology", type: 9, name: "Canonical Typology", short: "Where God Does This Again", diagnostic: "Where does God operate by the same structural principle elsewhere in Scripture?", color: "#4AE8D4", anchor: "Matt 20:16 / 1 Thess 4:16–17" }
];

export const MODE2_TAXONOMY = [
  { id: "undefended_premise", type: "M1", name: "Undefended Premise", short: "What He Never Stops to Prove", diagnostic: "What is the author arguing from that he never stops to defend?", color: "#7C6AF7", anchor: "Eph 2:10 — predestination of works stated as settled" },
  { id: "uncited_source", type: "M2", name: "Uncited Source", short: "The OT Text Behind the NT Word", diagnostic: "What OT text is the author quoting or assuming without attribution?", color: "#4AE8D4", anchor: "Eph 2:13 — Isaiah 57:19 assumed, not cited" },
  { id: "biographical_silence", type: "M3", name: "Biographical Silence", short: "What His History Supplies", diagnostic: "What fact about the author's history does the text argue from without stating?", color: "#E8834A", anchor: "1 Cor 6:12 — Roman citizenship as unstated premise" },
  { id: "confirmatory_canon", type: "M4", name: "Confirmatory Canon", short: "The Author Ratifying Himself", diagnostic: "Where is the author ratifying an earlier document across his own corpus?", color: "#4AE8A0", anchor: "1 John 5:11–12 confirming the Gospel of John" },
  { id: "withheld_conclusion", type: "M5", name: "Withheld Conclusion", short: "The Argument He Doesn't Finish", diagnostic: "What logical conclusion does the argument build toward that the author stops just short of stating?", color: "#E84A4A", anchor: "Gal 3:20 — God is one, mediation is continuous and Trinitarian" }
];

export const LITERARY_MODES = [
  { id: "narrative", label: "Narrative", desc: "Gospels, Historical, Prophetic narrative", taxonomy: MODE1_TAXONOMY },
  { id: "pauline", label: "Pauline / Epistolary", desc: "Romans, Corinthians, Ephesians, Hebrews, General Epistles", taxonomy: MODE2_TAXONOMY },
  { id: "apostolic", label: "Apostolic / Historical", desc: "Acts, James, Peter, John's Epistles", taxonomy: [...MODE1_TAXONOMY.slice(0,2), ...MODE2_TAXONOMY.slice(0,3)] },
  { id: "eschatological", label: "Apocalyptic", desc: "Revelation — eschatological / symbolic", taxonomy: MODE1_TAXONOMY }
];

export const TRADITIONS = [
  "Black Baptist", "Baptist", "Missionary Baptist", "Reformed", "Wesleyan / Methodist",
  "Pentecostal", "AME", "COGIC", "Non-denominational"
];

export const CONTEXTS = [
  "Sunday Morning", "Sunday Evening", "Wednesday Bible Study", "Revival",
  "Annual Day", "Funeral / Eulogy", "Wedding", "Men's Day", "Women's Day", "Youth Service"
];

export const DEFAULT_CHURCH_CONTEXT = {
  pastorName: "Larry Chase",
  churchName: "Greater New Hope Missionary Baptist Church",
  denomination: "Missionary Baptist",
  location: "Dickinson, TX",
  attendance: "200",
  translation: "KJV"
};
