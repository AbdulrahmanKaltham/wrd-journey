var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_https = __toESM(require("https"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_vite = require("vite");

// src/data/quranJourneyData.ts
var WORLDS_DATA = [
  {
    id: "juz_amma",
    title: "\u062C\u0632\u0621 \u0639\u0645",
    subtitle: "\u0631\u062D\u0644\u0629 \u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u0623\u0648\u0644\u0649 - \u0663\u0667 \u0633\u0648\u0631\u0629 \u0645\u0628\u0627\u0631\u0643\u0629",
    description: "\u0631\u062D\u0644\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0639\u0628\u0631 \u0661\u0667 \u0623\u0633\u0628\u0648\u0639\u0627\u064B \u062F\u0631\u0627\u0633\u064A\u0627\u064B \u0644\u062D\u0641\u0638 \u0648\u062A\u062B\u0628\u064A\u062A \u062C\u0632\u0621 \u0639\u0645 \u0645\u0639 \u0646\u0627\u062F\u064A \u0648\u0631\u062F.",
    order: 1,
    locked: false,
    totalWeeks: 17,
    icon: "\u{1F4D6}"
  },
  {
    id: "juz_tabarak",
    title: "\u062C\u0632\u0621 \u062A\u0628\u0627\u0631\u0643",
    subtitle: "\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0631\u062A\u0642\u0627\u0621 \u0648\u0627\u0644\u062A\u062F\u0628\u0631",
    description: "\u0623\u0643\u0645\u0644 \u0631\u062D\u0644\u0629 \u062C\u0632\u0621 \u0639\u0645 \u0644\u0641\u062A\u062D \u0631\u062D\u0644\u0629 \u062C\u0632\u0621 \u062A\u0628\u0627\u0631\u0643 \u0648\u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644 \u0644\u0644\u0633\u0627\u062D\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629.",
    order: 2,
    locked: true,
    totalWeeks: 18,
    icon: "\u{1F512}"
  },
  {
    id: "juz_qad_samia",
    title: "\u062C\u0632\u0621 \u0642\u062F \u0633\u0645\u0639",
    subtitle: "\u0631\u062D\u0644\u0629 \u0627\u0644\u062A\u062F\u0628\u0631 \u0648\u0627\u0644\u0639\u0645\u0644",
    description: "\u0645\u0631\u062D\u0644\u0629 \u0645\u062A\u0642\u062F\u0645\u0629 \u0645\u0646 \u0631\u062D\u0644\u0629 \u062A\u062D\u0641\u064A\u0638 \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0645\u0639 \u0646\u0627\u062F\u064A \u0648\u0631\u062F.",
    order: 3,
    locked: true,
    totalWeeks: 18,
    icon: "\u{1F512}"
  }
];
function generateWeekNodes(weekNum, surahs) {
  const nodes = [];
  const surahListText = surahs.join("\u060C ");
  const surahText = surahs.join(" \u0648 ");
  nodes.push({
    id: `w${weekNum}_node_1`,
    weekId: weekNum,
    order: 1,
    type: "listen",
    title: "\u0627\u0633\u062A\u0645\u0627\u0639 \u0648\u062A\u0631\u062A\u064A\u0644",
    surahName: surahListText,
    surahsList: [...surahs],
    audioFiles: surahs.map((s) => ({
      surah: s,
      url: `https://example.com/audio/${s}.mp3`
    })),
    description: `\u0627\u0633\u062A\u0645\u0639 \u0628\u0625\u0646\u0635\u0627\u062A \u0625\u0644\u0649 \u062A\u0644\u0627\u0648\u0629 \u062E\u0627\u0634\u0639\u0629 \u0644\u062C\u0645\u064A\u0639 \u0633\u0648\u0631 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0645\u0642\u0631\u0631\u0629 (${surahListText}) \u0644\u0636\u0628\u0637 \u0627\u0644\u0646\u0637\u0642 \u0648\u0627\u0644\u0623\u062D\u0643\u0627\u0645.`,
    xpReward: 15,
    required: true,
    audioSample: "https://example.com/audio.mp3"
  });
  nodes.push({
    id: `w${weekNum}_node_2`,
    weekId: weekNum,
    order: 2,
    type: "memorize",
    title: "\u062A\u0643\u0631\u0627\u0631 \u0648\u062D\u0641\u0638",
    surahName: surahListText,
    description: `\u0627\u062D\u0641\u0638 \u0627\u0644\u0645\u0642\u0627\u0637\u0639 \u0648\u0627\u0644\u0633\u0648\u0631 \u0627\u0644\u0645\u0642\u0631\u0631\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 (${surahListText}) \u0645\u0639 \u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u0622\u064A\u0627\u062A \u0628\u062A\u0623\u0646\u0651\u064D \u0648\u062A\u062F\u0628\u0631.`,
    xpReward: 20,
    required: true
  });
  nodes.push({
    id: `w${weekNum}_node_3`,
    weekId: weekNum,
    order: 3,
    type: "recite",
    title: "\u062A\u0633\u0645\u064A\u0639 \u0648\u0627\u0639\u062A\u0645\u0627\u062F",
    surahName: surahListText,
    description: `\u0633\u062C\u0651\u0644 \u062A\u0644\u0627\u0648\u062A\u0643 \u0644\u062C\u0645\u064A\u0639 \u0633\u0648\u0631 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 (${surahListText}) \u0623\u0648 \u0642\u0645 \u0628\u0627\u0644\u062A\u0633\u0645\u064A\u0639 \u0641\u064A \u0627\u0644\u062D\u0644\u0642\u0629 \u0644\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0633\u0644\u0627\u0633\u0629 \u0627\u0644\u062D\u0641\u0638 \u0648\u0636\u0628\u0637 \u0627\u0644\u0622\u064A\u0627\u062A.`,
    xpReward: 25,
    required: true
  });
  nodes.push({
    id: `w${weekNum}_node_4`,
    weekId: weekNum,
    order: 4,
    type: "review",
    title: "\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u062A\u062B\u0628\u064A\u062A",
    surahName: surahListText,
    description: `\u0645\u0631\u0627\u062C\u0639\u0629 \u0630\u0627\u062A\u064A\u0629 \u0648\u062A\u0645\u0643\u064A\u0646 \u0634\u0627\u0645\u0644 \u0644\u062C\u0645\u064A\u0639 \u0633\u0648\u0631 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0645\u0642\u0631\u0631\u0629 (${surahListText}) \u0644\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062D\u0641\u0638 \u0648\u0627\u0644\u062A\u0645\u0643\u064A\u0646 \u0642\u0628\u0644 \u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0628\u0648\u0627\u0628\u0629.`,
    xpReward: 30,
    required: true
  });
  const gateQ1Correct = `${surahs.length} \u0633\u0648\u0631`;
  const gateQ1Options = shuffleOptions([gateQ1Correct, "10 \u0633\u0648\u0631", "1 \u0633\u0648\u0631\u0629", "20 \u0633\u0648\u0631\u0629"]);
  const gateQ2Correct = "\u0627\u0644\u0628\u0631\u0643\u0629 \u0648\u0627\u0644\u062B\u0628\u0627\u062A \u0648\u0627\u0644\u0623\u062C\u0631 \u0627\u0644\u0639\u0638\u064A\u0645";
  const gateQ2Options = shuffleOptions([gateQ2Correct, "\u0627\u0644\u0633\u0631\u0639\u0629 \u0641\u0642\u0637", "\u0627\u0644\u062A\u0646\u0627\u0641\u0633 \u0627\u0644\u0645\u0627\u062F\u064A", "\u0644\u0627 \u0634\u064A\u0621"]);
  nodes.push({
    id: `w${weekNum}_gate`,
    weekId: weekNum,
    order: 5,
    type: "gate",
    title: weekNum === 17 ? "\u{1F3C6} \u0642\u0644\u0639\u0629 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064A \u0644\u062C\u0632\u0621 \u0639\u0645" : `\u{1F3C6} \u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 ${weekNum}`,
    surahName: surahListText,
    description: weekNum === 17 ? "\u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u062E\u062A\u0627\u0645\u064A \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0625\u062A\u0642\u0627\u0646 \u062C\u0632\u0621 \u0639\u0645 \u0648\u0627\u062C\u062A\u064A\u0627\u0632 \u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629!" : `\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u062A\u062B\u0628\u064A\u062A \u0648\u0627\u0644\u0639\u0628\u0648\u0631 \u0644\u0644\u0623\u0633\u0627\u0628\u064A\u0639 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 (${surahText}).`,
    xpReward: weekNum === 17 ? 250 : 100,
    required: true,
    questions: [
      {
        id: `g_${weekNum}_1`,
        type: "mcq",
        question: `\u0643\u0645 \u0639\u062F\u062F \u0627\u0644\u0633\u0648\u0631 \u0627\u0644\u0645\u0642\u0631\u0631\u0629 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 (${surahText})\u061F`,
        options: gateQ1Options,
        correctAnswer: gateQ1Correct,
        explanation: `\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 ${surahs.length} \u0633\u0648\u0631 \u062D\u0633\u0628 \u062E\u0637\u0629 \u0646\u0627\u062F\u064A \u0648\u0631\u062F.`
      },
      {
        id: `g_${weekNum}_2`,
        type: "mcq",
        question: `\u0645\u0627 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0627\u0644\u062A\u064A \u0646\u0643\u062A\u0633\u0628\u0647\u0627 \u0645\u0646 \u0627\u0633\u062A\u0645\u0631\u0627\u0631\u064A\u0629 \u0648\u0631\u062F \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u064A\u0648\u0645\u064A\u061F`,
        options: gateQ2Options,
        correctAnswer: gateQ2Correct,
        explanation: "\u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u064A\u0648\u0645\u064A \u0647\u0645\u0627 \u0631\u0648\u062D \u0631\u062D\u0644\u0629 \u0648\u0631\u062F."
      }
    ]
  });
  return nodes;
}
function shuffleOptions(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
var WEEKS_DATA = [
  {
    id: 1,
    worldId: "juz_amma",
    weekNumber: 1,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0623\u0648\u0644",
    startDate: "30/8",
    endDate: "5/9",
    surahs: ["\u0627\u0644\u0646\u0627\u0633", "\u0627\u0644\u0641\u0644\u0642", "\u0627\u0644\u0625\u062E\u0644\u0627\u0635", "\u0627\u0644\u0645\u0633\u062F", "\u0627\u0644\u0646\u0635\u0631", "\u0627\u0644\u0643\u0627\u0641\u0631\u0648\u0646"],
    status: "IN_PROGRESS",
    xpReward: 100,
    nodes: generateWeekNodes(1, ["\u0627\u0644\u0646\u0627\u0633", "\u0627\u0644\u0641\u0644\u0642", "\u0627\u0644\u0625\u062E\u0644\u0627\u0635", "\u0627\u0644\u0645\u0633\u062F", "\u0627\u0644\u0646\u0635\u0631", "\u0627\u0644\u0643\u0627\u0641\u0631\u0648\u0646"])
  },
  {
    id: 2,
    worldId: "juz_amma",
    weekNumber: 2,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062B\u0627\u0646\u064A",
    startDate: "6/9",
    endDate: "12/9",
    surahs: ["\u0627\u0644\u0643\u0648\u062B\u0631", "\u0627\u0644\u0645\u0627\u0639\u0648\u0646", "\u0642\u0631\u064A\u0634", "\u0627\u0644\u0641\u064A\u0644", "\u0627\u0644\u0647\u0645\u0632\u0629", "\u0627\u0644\u0639\u0635\u0631"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(2, ["\u0627\u0644\u0643\u0648\u062B\u0631", "\u0627\u0644\u0645\u0627\u0639\u0648\u0646", "\u0642\u0631\u064A\u0634", "\u0627\u0644\u0641\u064A\u0644", "\u0627\u0644\u0647\u0645\u0632\u0629", "\u0627\u0644\u0639\u0635\u0631"])
  },
  {
    id: 3,
    worldId: "juz_amma",
    weekNumber: 3,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062B\u0627\u0644\u062B",
    startDate: "13/9",
    endDate: "19/9",
    surahs: ["\u0627\u0644\u062A\u0643\u0627\u062B\u0631", "\u0627\u0644\u0642\u0627\u0631\u0639\u0629", "\u0627\u0644\u0639\u0627\u062F\u064A\u0627\u062A", "\u0627\u0644\u0632\u0644\u0632\u0644\u0629"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(3, ["\u0627\u0644\u062A\u0643\u0627\u062B\u0631", "\u0627\u0644\u0642\u0627\u0631\u0639\u0629", "\u0627\u0644\u0639\u0627\u062F\u064A\u0627\u062A", "\u0627\u0644\u0632\u0644\u0632\u0644\u0629"])
  },
  {
    id: 4,
    worldId: "juz_amma",
    weekNumber: 4,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0631\u0627\u0628\u0639",
    startDate: "20/9",
    endDate: "26/9",
    surahs: ["\u0627\u0644\u0628\u064A\u0646\u0629", "\u0627\u0644\u0642\u062F\u0631", "\u0627\u0644\u0639\u0644\u0642", "\u0627\u0644\u062A\u064A\u0646"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(4, ["\u0627\u0644\u0628\u064A\u0646\u0629", "\u0627\u0644\u0642\u062F\u0631", "\u0627\u0644\u0639\u0644\u0642", "\u0627\u0644\u062A\u064A\u0646"])
  },
  {
    id: 5,
    worldId: "juz_amma",
    weekNumber: 5,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062E\u0627\u0645\u0633",
    startDate: "27/9",
    endDate: "3/10",
    surahs: ["\u0627\u0644\u0634\u0631\u062D", "\u0627\u0644\u0636\u062D\u0649", "\u0627\u0644\u0644\u064A\u0644"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(5, ["\u0627\u0644\u0634\u0631\u062D", "\u0627\u0644\u0636\u062D\u0649", "\u0627\u0644\u0644\u064A\u0644"])
  },
  {
    id: 6,
    worldId: "juz_amma",
    weekNumber: 6,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0633\u0627\u062F\u0633",
    startDate: "4/10",
    endDate: "10/10",
    surahs: ["\u0627\u0644\u0634\u0645\u0633", "\u0627\u0644\u0628\u0644\u062F"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(6, ["\u0627\u0644\u0634\u0645\u0633", "\u0627\u0644\u0628\u0644\u062F"])
  },
  {
    id: 7,
    worldId: "juz_amma",
    weekNumber: 7,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0633\u0627\u0628\u0639",
    startDate: "11/10",
    endDate: "17/10",
    surahs: ["\u0627\u0644\u0641\u062C\u0631", "\u0627\u0644\u063A\u0627\u0634\u064A\u0629"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(7, ["\u0627\u0644\u0641\u062C\u0631", "\u0627\u0644\u063A\u0627\u0634\u064A\u0629"])
  },
  {
    id: 8,
    worldId: "juz_amma",
    weekNumber: 8,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062B\u0627\u0645\u0646",
    startDate: "18/10",
    endDate: "24/10",
    surahs: ["\u0627\u0644\u0623\u0639\u0644\u0649", "\u0627\u0644\u0637\u0627\u0631\u0642"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(8, ["\u0627\u0644\u0623\u0639\u0644\u0649", "\u0627\u0644\u0637\u0627\u0631\u0642"])
  },
  {
    id: 9,
    worldId: "juz_amma",
    weekNumber: 9,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062A\u0627\u0633\u0639",
    startDate: "25/10",
    endDate: "31/10",
    surahs: ["\u0627\u0644\u0628\u0631\u0648\u062C", "\u0627\u0644\u0627\u0646\u0634\u0642\u0627\u0642"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(9, ["\u0627\u0644\u0628\u0631\u0648\u062C", "\u0627\u0644\u0627\u0646\u0634\u0642\u0627\u0642"])
  },
  {
    id: 10,
    worldId: "juz_amma",
    weekNumber: 10,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0639\u0627\u0634\u0631",
    startDate: "1/11",
    endDate: "7/11",
    surahs: ["\u0627\u0644\u0645\u0637\u0641\u0641\u064A\u0646"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(10, ["\u0627\u0644\u0645\u0637\u0641\u0641\u064A\u0646"])
  },
  {
    id: 11,
    worldId: "juz_amma",
    weekNumber: 11,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062D\u0627\u062F\u064A \u0639\u0634\u0631",
    startDate: "8/11",
    endDate: "14/11",
    surahs: ["\u0627\u0644\u0627\u0646\u0641\u0637\u0627\u0631", "\u0627\u0644\u062A\u0643\u0648\u064A\u0631"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(11, ["\u0627\u0644\u0627\u0646\u0641\u0637\u0627\u0631", "\u0627\u0644\u062A\u0643\u0648\u064A\u0631"])
  },
  {
    id: 12,
    worldId: "juz_amma",
    weekNumber: 12,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062B\u0627\u0646\u064A \u0639\u0634\u0631",
    startDate: "15/11",
    endDate: "21/11",
    surahs: ["\u0639\u0628\u0633", "\u0627\u0644\u0646\u0627\u0632\u0639\u0627\u062A"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(12, ["\u0639\u0628\u0633", "\u0627\u0644\u0646\u0627\u0632\u0639\u0627\u062A"])
  },
  {
    id: 13,
    worldId: "juz_amma",
    weekNumber: 13,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062B\u0627\u0644\u062B \u0639\u0634\u0631",
    startDate: "22/11",
    endDate: "28/11",
    surahs: ["\u0627\u0644\u0646\u0628\u0623"],
    status: "LOCKED",
    xpReward: 100,
    nodes: generateWeekNodes(13, ["\u0627\u0644\u0646\u0628\u0623"])
  },
  {
    id: 14,
    worldId: "juz_amma",
    weekNumber: 14,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0631\u0627\u0628\u0639 \u0639\u0634\u0631",
    startDate: "29/11",
    endDate: "5/12",
    surahs: ["\u0645\u0631\u0627\u062C\u0639\u0629 1 (\u0627\u0644\u0646\u0627\u0633 \u0625\u0644\u0649 \u0627\u0644\u0632\u0644\u0632\u0644\u0629)"],
    status: "LOCKED",
    xpReward: 120,
    nodes: generateWeekNodes(14, ["\u0645\u0631\u0627\u062C\u0639\u0629 1"])
  },
  {
    id: 15,
    worldId: "juz_amma",
    weekNumber: 15,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062E\u0627\u0645\u0633 \u0639\u0634\u0631",
    startDate: "6/12",
    endDate: "12/12",
    surahs: ["\u0645\u0631\u0627\u062C\u0639\u0629 2 (\u0627\u0644\u0628\u064A\u0646\u0629 \u0625\u0644\u0649 \u0627\u0644\u0644\u064A\u0644)"],
    status: "LOCKED",
    xpReward: 120,
    nodes: generateWeekNodes(15, ["\u0645\u0631\u0627\u062C\u0639\u0629 2"])
  },
  {
    id: 16,
    worldId: "juz_amma",
    weekNumber: 16,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0633\u0627\u062F\u0633 \u0639\u0634\u0631",
    startDate: "13/12",
    endDate: "19/12",
    surahs: ["\u062A\u062B\u0628\u064A\u062A \u0648\u0645\u0631\u0627\u062C\u0639\u0629 \u0634\u0627\u0645\u0644\u0629"],
    status: "LOCKED",
    xpReward: 150,
    nodes: generateWeekNodes(16, ["\u062A\u062B\u0628\u064A\u062A \u0648\u0645\u0631\u0627\u062C\u0639\u0629"])
  },
  {
    id: 17,
    worldId: "juz_amma",
    weekNumber: 17,
    title: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0633\u0627\u0628\u0639 \u0639\u0634\u0631",
    startDate: "20/12",
    endDate: "26/12",
    surahs: ["\u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u062E\u062A\u0627\u0645\u064A \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u062C\u0632\u0621 \u0639\u0645"],
    status: "LOCKED",
    xpReward: 300,
    nodes: generateWeekNodes(17, ["\u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u062E\u062A\u0627\u0645\u064A"])
  }
];

// src/services/streakService.ts
function getTodayDateString() {
  const d = /* @__PURE__ */ new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getYesterdayDateString() {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function updateStreakOnActivity(currentStreak = 0, longestStreak = 0, lastActiveDate = "", completedDates = []) {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const updatedCompletedDates = Array.from(/* @__PURE__ */ new Set([...completedDates, today]));
  if (lastActiveDate === today) {
    return {
      streak: Math.max(1, currentStreak),
      longestStreak: Math.max(currentStreak, longestStreak, 1),
      lastActiveDate: today,
      completedDates: updatedCompletedDates,
      streakIncreased: false,
      streakReset: false,
      isFirstToday: false
    };
  }
  let newStreak = 1;
  let streakIncreased = false;
  let streakReset = false;
  if (lastActiveDate === yesterday) {
    newStreak = currentStreak + 1;
    streakIncreased = true;
  } else if (!lastActiveDate) {
    newStreak = 1;
    streakIncreased = true;
  } else {
    newStreak = 1;
    streakReset = true;
  }
  const newLongestStreak = Math.max(newStreak, longestStreak);
  return {
    streak: newStreak,
    longestStreak: newLongestStreak,
    lastActiveDate: today,
    completedDates: updatedCompletedDates,
    streakIncreased,
    streakReset,
    isFirstToday: true
  };
}

// server.ts
var SUPABASE_HOST = "olhruwqwdiehbqwzbxso.supabase.co";
var SUPABASE_ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9saHJ1d3F3ZGllaGJxd3pieHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMTg5NTIsImV4cCI6MjEwMjY5NDk1Mn0.LB2r-fNh3UoEwDAeeobEJJMoY5QroNY9owwhEH0lJiY").trim();
var SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim();
var isValidUUID = (str) => {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};
function supabaseRequest(pathName, options = {}) {
  return new Promise((resolve) => {
    const postData = options.body ? JSON.stringify(options.body) : "";
    const activeKey = options.useServiceRole && SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
    const headers = {
      "apikey": activeKey,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation"
    };
    if (options.useServiceRole && SUPABASE_SERVICE_ROLE_KEY) {
      headers["Authorization"] = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
    } else if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
    } else {
      headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
    }
    if (postData) {
      headers["Content-Length"] = String(Buffer.byteLength(postData));
    }
    const req = import_https.default.request(
      {
        hostname: SUPABASE_HOST,
        port: 443,
        path: pathName,
        method: options.method || "GET",
        headers
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => raw += chunk);
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          const statusCode = res.statusCode || 200;
          resolve({
            ok: statusCode >= 200 && statusCode < 300,
            status: statusCode,
            data: parsed
          });
        });
      }
    );
    req.on("error", (err) => {
      console.error("[supabaseRequest Error]:", err.message);
      resolve({ ok: false, status: 500, data: { message: err.message } });
    });
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`[API /api/auth/login] Attempting login for: ${email}`);
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
    }
    try {
      const authRes = await supabaseRequest("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: { email: email.trim(), password: password.trim() }
      });
      if (!authRes.ok || !authRes.data?.user) {
        const errorMsg = authRes.data?.msg || authRes.data?.error_description || authRes.data?.message;
        console.warn(`[API /api/auth/login] Supabase Auth rejected:`, errorMsg);
        let friendlyMessage = "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629.";
        if (errorMsg === "Email not confirmed") {
          friendlyMessage = "\u064A\u0631\u062C\u0649 \u062A\u0623\u0643\u064A\u062F \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648\u0644\u0627\u064B.";
        }
        return res.status(400).json({ success: false, error: friendlyMessage });
      }
      const user = authRes.data.user;
      const accessToken = authRes.data.access_token;
      const session = {
        access_token: authRes.data.access_token,
        refresh_token: authRes.data.refresh_token,
        expires_in: authRes.data.expires_in,
        token_type: authRes.data.token_type,
        user
      };
      const profileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${user.id}&select=*`, {
        token: accessToken
      });
      let profile = Array.isArray(profileRes.data) && profileRes.data.length > 0 ? profileRes.data[0] : null;
      if (!profile) {
        const metadata = user.user_metadata || {};
        const userRole = metadata.role || "student";
        const userName = metadata.name || user.email?.split("@")[0] || "\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0631\u062F";
        const userGender = metadata.gender || "male";
        const newProfile = {
          id: user.id,
          email: user.email,
          name: userName,
          role: userRole,
          gender: userGender,
          circle_id: null,
          xp: 0,
          streak: 1,
          current_week: 1,
          completed_nodes: [],
          completed_weeks: []
        };
        const createRes = await supabaseRequest("/rest/v1/profiles", {
          method: "POST",
          token: accessToken,
          body: newProfile
        });
        profile = createRes.ok && createRes.data ? Array.isArray(createRes.data) ? createRes.data[0] : createRes.data : newProfile;
      }
      console.log(`[API /api/auth/login] Login success for: ${user.id}`);
      return res.json({
        success: true,
        session,
        user,
        profile
      });
    } catch (err) {
      console.error(`[API /api/auth/login] Internal error:`, err);
      return res.status(500).json({
        success: false,
        error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u062E\u0627\u062F\u0645."
      });
    }
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" });
    }
    try {
      const resetRes = await supabaseRequest("/auth/v1/recover", {
        method: "POST",
        body: { email: email.trim() }
      });
      if (!resetRes.ok) {
        const errorMsg = resetRes.data?.msg || resetRes.data?.error_description || resetRes.data?.message;
        return res.status(400).json({ success: false, error: errorMsg || "\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0631\u0627\u0628\u0637 \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629" });
      }
      return res.json({ success: true, message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0627\u0628\u0637 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0625\u0644\u0649 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A." });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645" });
    }
  });
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name, role = "student", gender = "male", circleName } = req.body;
    console.log(`
========================================`);
    console.log(`\u{1F4DD} [API /api/auth/signup] Attempting signup for email: "${email}", name: "${name}", role: "${role}", gender: "${gender}"`);
    if (!email || !password || !name) {
      console.warn(`\u26A0\uFE0F [API /api/auth/signup] Missing required fields: email=${!!email}, password=${!!password}, name=${!!name}`);
      return res.status(400).json({ success: false, error: "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0645\u0637\u0644\u0648\u0628\u0629 (\u0627\u0644\u0627\u0633\u0645\u060C \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u060C \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631)" });
    }
    try {
      console.log(`\u{1F4E1} [API /api/auth/signup] Sending signup request to Supabase Auth (/auth/v1/signup)...`);
      const signupRes = await supabaseRequest("/auth/v1/signup", {
        method: "POST",
        body: {
          email: email.trim(),
          password: password.trim(),
          data: { name: name.trim(), role, gender, circleName }
        }
      });
      console.log(`\u{1F4E5} [API /api/auth/signup] Supabase Auth response status: ${signupRes.status}, ok: ${signupRes.ok}`);
      const user = signupRes.data?.user || (signupRes.data?.id ? signupRes.data : null);
      if (!signupRes.ok || !user) {
        const errorMsg = signupRes.data?.msg || signupRes.data?.error_description || signupRes.data?.message || (typeof signupRes.data === "string" ? signupRes.data : "");
        console.error(`\u274C [API /api/auth/signup] Supabase Auth rejected signup! Error:`, errorMsg, `Full payload:`, JSON.stringify(signupRes.data));
        let friendlyMsg = "\u062A\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628. \u064A\u0631\u062C\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.";
        const lowerMsg = (errorMsg || "").toLowerCase();
        if (lowerMsg.includes("already registered") || lowerMsg.includes("already exists") || lowerMsg.includes("user already registered")) {
          friendlyMsg = "\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u062C\u0644 \u0645\u0633\u0628\u0642\u0627\u064B. \u064A\u0645\u0643\u0646\u0643 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0628\u0627\u0634\u0631\u0629.";
        } else if (lowerMsg.includes("rate limit") || lowerMsg.includes("over_email_send_rate_limit")) {
          friendlyMsg = "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u062D\u062F \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0645\u0624\u0642\u062A\u0627\u064B. \u064A\u0631\u062C\u0649 \u0625\u064A\u0642\u0627\u0641 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F (Confirm email) \u0645\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A Supabase \u0644\u0644\u0633\u0645\u0627\u062D \u0628\u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0641\u0648\u0631\u064A \u063A\u064A\u0631 \u0627\u0644\u0645\u062D\u062F\u0648\u062F.";
        } else if (lowerMsg.includes("password should be at least") || lowerMsg.includes("weak_password")) {
          friendlyMsg = "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0636\u0639\u064A\u0641\u0629 \u0623\u0648 \u0642\u0635\u064A\u0631\u0629. \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 6 \u062E\u0627\u0646\u0627\u062A \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.";
        } else if (lowerMsg.includes("valid email") || lowerMsg.includes("invalid email") || lowerMsg.includes("unable to validate email")) {
          friendlyMsg = "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0639\u0646\u0648\u0627\u0646 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0635\u062D\u064A\u062D.";
        } else if (errorMsg) {
          friendlyMsg = `\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u0633\u062C\u064A\u0644: ${errorMsg}`;
        }
        return res.status(400).json({
          success: false,
          error: friendlyMsg,
          rawError: errorMsg,
          details: signupRes.data
        });
      }
      console.log(`\u2705 [API /api/auth/signup] Supabase Auth user created successfully with ID: ${user.id}`);
      let accessToken = signupRes.data?.access_token || null;
      let session = signupRes.data?.access_token ? {
        access_token: signupRes.data.access_token,
        refresh_token: signupRes.data.refresh_token,
        expires_in: signupRes.data.expires_in,
        token_type: signupRes.data.token_type,
        user
      } : null;
      if (!accessToken) {
        console.log(`\u{1F511} [API /api/auth/signup] No access_token returned directly in signup, attempting password grant login...`);
        const loginAttempt = await supabaseRequest("/auth/v1/token?grant_type=password", {
          method: "POST",
          body: { email: email.trim(), password: password.trim() }
        });
        if (loginAttempt.ok && loginAttempt.data?.access_token) {
          console.log(`\u2705 [API /api/auth/signup] Password grant login succeeded after signup.`);
          accessToken = loginAttempt.data.access_token;
          session = {
            access_token: loginAttempt.data.access_token,
            refresh_token: loginAttempt.data.refresh_token,
            expires_in: loginAttempt.data.expires_in,
            token_type: loginAttempt.data.token_type,
            user: loginAttempt.data.user || user
          };
        } else {
          console.log(`\u2139\uFE0F [API /api/auth/signup] Direct login post-signup returned status: ${loginAttempt.status} (Confirm email might be required)`);
        }
      }
      const profileData = {
        id: user.id,
        email: email.trim(),
        name: name.trim(),
        role,
        gender,
        circle_id: null,
        xp: 0,
        streak: 1,
        current_week: 1,
        completed_nodes: [],
        completed_weeks: []
      };
      console.log(`\u{1F4BE} [API /api/auth/signup] Upserting profile record into 'profiles' table for user: ${user.id}...`);
      const profileRes = await supabaseRequest("/rest/v1/profiles?on_conflict=id", {
        method: "POST",
        token: accessToken || void 0,
        prefer: "resolution=merge-duplicates,return=representation",
        body: profileData
      });
      if (!profileRes.ok) {
        console.warn(`\u26A0\uFE0F [API /api/auth/signup] Profile upsert notice (status ${profileRes.status}):`, profileRes.data);
      } else {
        console.log(`\u2705 [API /api/auth/signup] Profile record saved/merged successfully.`);
      }
      console.log(`\u{1F389} [API /api/auth/signup] Signup process completed successfully for: ${user.id} (${email})`);
      console.log(`========================================
`);
      return res.json({
        success: true,
        session,
        user,
        profile: profileData
      });
    } catch (err) {
      console.error(`\u274C [API /api/auth/signup] Internal server error:`, err);
      return res.status(500).json({
        success: false,
        error: `\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628: ${err.message || "\u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641"}`,
        details: err.message
      });
    }
  });
  app.get(["/api/auth/profile/:userId", "/api/profile/:userId"], async (req, res) => {
    const { userId } = req.params;
    try {
      console.log(`[API /api/profile] Fetching profile for user: ${userId}`);
      const profileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`);
      const profile = Array.isArray(profileRes.data) && profileRes.data.length > 0 ? profileRes.data[0] : null;
      if (!profile) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      let circle = null;
      if (profile.circle_id) {
        const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${profile.circle_id}&select=*`);
        circle = Array.isArray(circleRes.data) && circleRes.data.length > 0 ? circleRes.data[0] : null;
      }
      return res.json({
        success: true,
        profile,
        circle
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/profile/complete-node", async (req, res) => {
    const {
      userId,
      nodeId,
      weekId = 1,
      xpGained = 15,
      currentStreak = 1
    } = req.body;
    console.log(`\u{1F3AF} [API /api/profile/complete-node] Request for user: ${userId}, node: ${nodeId}, xp: ${xpGained}`);
    if (!userId || !nodeId) {
      return res.status(400).json({ success: false, error: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0637\u0627\u0644\u0628 \u0648\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062F\u0631\u0633 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    try {
      const getProfileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
        useServiceRole: true,
        token: userToken
      });
      const profile = Array.isArray(getProfileRes.data) && getProfileRes.data.length > 0 ? getProfileRes.data[0] : null;
      if (!profile) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const existingCompletedNodes = Array.isArray(profile.completed_nodes) ? profile.completed_nodes : [];
      const isAlreadyCompleted = existingCompletedNodes.includes(nodeId);
      const newCompletedNodes = isAlreadyCompleted ? existingCompletedNodes : [...existingCompletedNodes, nodeId];
      const addedXp = isAlreadyCompleted ? Math.round(Number(xpGained || 15) * 0.2) : Number(xpGained || 15);
      const newXp = (Number(profile.xp) || 0) + addedXp;
      const updateData = {
        completed_nodes: newCompletedNodes,
        xp: newXp,
        streak: Number(currentStreak) || profile.streak || 1
      };
      console.log(`\u{1F3AF} [API /api/profile/complete-node] Saving updated completed_nodes for ${userId}:`, newCompletedNodes);
      const updateRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        body: updateData,
        useServiceRole: true,
        token: userToken
      });
      if (!updateRes.ok) {
        console.error(`\u274C [API /api/profile/complete-node] Update failed:`, updateRes);
        return res.status(500).json({ success: false, error: "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u062A\u0642\u062F\u0645 \u0627\u0644\u0637\u0627\u0644\u0628 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
      }
      const refetchedRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
        useServiceRole: true,
        token: userToken
      });
      const updatedProfile = Array.isArray(refetchedRes.data) && refetchedRes.data.length > 0 ? refetchedRes.data[0] : { ...profile, ...updateData };
      return res.json({
        success: true,
        message: "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u062A\u0642\u062F\u0645 \u0628\u0646\u062C\u0627\u062D",
        profile: updatedProfile
      });
    } catch (err) {
      console.error(`\u274C [API /api/profile/complete-node] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/profile/complete-week", async (req, res) => {
    const {
      userId,
      weekId,
      gateNodeId,
      xpEarned = 100,
      newCompletedWeeks,
      newCurrentWeek
    } = req.body;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    console.log(`\u{1F3C6} [API /api/profile/complete-week] Request for user: ${userId}, week: ${weekId}, gate: ${gateNodeId}, xp: ${xpEarned}`);
    if (!userId || !weekId) {
      return res.status(400).json({ success: false, error: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0637\u0627\u0644\u0628 \u0648\u0631\u0642\u0645 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    try {
      const getProfileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
        useServiceRole: true,
        token: userToken
      });
      const profile = Array.isArray(getProfileRes.data) && getProfileRes.data.length > 0 ? getProfileRes.data[0] : null;
      if (!profile) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const existingCompletedWeeks = Array.isArray(profile.completed_weeks) ? profile.completed_weeks : [];
      const numWeekId = Number(weekId);
      const updatedCompletedWeeks = Array.isArray(newCompletedWeeks) ? Array.from(/* @__PURE__ */ new Set([...existingCompletedWeeks, ...newCompletedWeeks, numWeekId])) : existingCompletedWeeks.includes(numWeekId) ? existingCompletedWeeks : [...existingCompletedWeeks, numWeekId];
      const targetNextWeek = Number(newCurrentWeek) || Math.max(Number(profile.current_week || 1), numWeekId + 1);
      const existingCompletedNodes = Array.isArray(profile.completed_nodes) ? profile.completed_nodes : [];
      const targetGateNodeId = gateNodeId || `w${numWeekId}_gate`;
      const weekData = WEEKS_DATA.find((w) => w.id === numWeekId);
      const weekNodeIds = weekData ? weekData.nodes.map((n) => n.id) : [`w${numWeekId}_node_1`, `w${numWeekId}_node_2`, `w${numWeekId}_node_3`, `w${numWeekId}_node_4`, targetGateNodeId];
      const updatedCompletedNodes = Array.from(
        /* @__PURE__ */ new Set([...existingCompletedNodes, targetGateNodeId, ...weekNodeIds])
      );
      const addedXp = Number(xpEarned || 100);
      const newXp = (Number(profile.xp) || 0) + addedXp;
      const updateData = {
        completed_weeks: updatedCompletedWeeks,
        current_week: targetNextWeek,
        completed_nodes: updatedCompletedNodes,
        xp: newXp
      };
      console.log(`\u{1F3C6} [API /api/profile/complete-week] Saving to profiles for ${userId}:`, updateData);
      const updateRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        body: updateData,
        useServiceRole: true,
        token: userToken
      });
      if (!updateRes.ok) {
        console.error(`\u274C [API /api/profile/complete-week] Update failed:`, updateRes);
        return res.status(500).json({ success: false, error: "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
      }
      const refetchedRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
        useServiceRole: true,
        token: userToken
      });
      const updatedProfile = Array.isArray(refetchedRes.data) && refetchedRes.data.length > 0 ? refetchedRes.data[0] : { ...profile, ...updateData };
      return res.json({
        success: true,
        message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0648\u0641\u062A\u062D \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062A\u0627\u0644\u064A \u0628\u0646\u062C\u0627\u062D",
        profile: updatedProfile
      });
    } catch (err) {
      console.error(`\u274C [API /api/profile/complete-week] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.patch("/api/profile/:userId", async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    console.log(`\u{1F4DD} [API PATCH /api/profile/${userId}] Updating fields:`, Object.keys(updates));
    try {
      const updateRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        body: updates,
        useServiceRole: true,
        token: userToken
      });
      if (!updateRes.ok) {
        return res.status(500).json({ success: false, error: "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A" });
      }
      const refetched = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
        useServiceRole: true,
        token: userToken
      });
      const updatedProfile = Array.isArray(refetched.data) && refetched.data.length > 0 ? refetched.data[0] : null;
      return res.json({
        success: true,
        profile: updatedProfile
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/profile/reset", async (req, res) => {
    const { userId } = req.body;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    console.log(`\u{1F504} [API POST /api/profile/reset] Resetting all progress and wiping recordings for user:`, userId);
    if (!userId) {
      return res.status(400).json({ success: false, error: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0637\u0644\u0648\u0628" });
    }
    try {
      const resetData = {
        completed_nodes: [],
        completed_weeks: [],
        xp: 0,
        streak: 1,
        current_week: 1
      };
      await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        body: resetData,
        token: userToken,
        useServiceRole: true
      });
      let initialCount = 0;
      let deletedCount = 0;
      let remainingCount = 0;
      try {
        console.log(`\u{1F5D1}\uFE0F [API /api/profile/reset] Checking and deleting recordings for student: ${userId}`);
        const countRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}&select=id,status`, {
          useServiceRole: true,
          token: userToken
        });
        if (countRes.ok && Array.isArray(countRes.data)) {
          initialCount = countRes.data.length;
          console.log(`\u{1F5D1}\uFE0F [API /api/profile/reset] Found ${initialCount} recordings for student.`);
        }
        const delServiceRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}`, {
          method: "DELETE",
          useServiceRole: true,
          prefer: "return=representation"
        });
        if (delServiceRes.ok && Array.isArray(delServiceRes.data)) {
          deletedCount += delServiceRes.data.length;
        }
        const delUserRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}`, {
          method: "DELETE",
          token: userToken,
          prefer: "return=representation"
        });
        if (delUserRes.ok && Array.isArray(delUserRes.data)) {
          deletedCount += delUserRes.data.length;
        }
        await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}`, {
          method: "DELETE"
        });
        const checkRemaining = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}&select=id`, {
          useServiceRole: true,
          token: userToken
        });
        if (checkRemaining.ok && Array.isArray(checkRemaining.data) && checkRemaining.data.length > 0) {
          console.log(`\u26A0\uFE0F [API /api/profile/reset] Purging remaining ${checkRemaining.data.length} recording rows individually...`);
          for (const item of checkRemaining.data) {
            if (item.id) {
              await supabaseRequest(`/rest/v1/recordings?id=eq.${item.id}`, { method: "DELETE", useServiceRole: true });
              await supabaseRequest(`/rest/v1/recordings?id=eq.${item.id}`, { method: "DELETE", token: userToken });
              await supabaseRequest(`/rest/v1/recordings?id=eq.${item.id}`, { method: "DELETE" });
              await supabaseRequest(`/rest/v1/recordings?id=eq.${item.id}`, {
                method: "PATCH",
                body: { status: "deleted", audio_url: null, student_id: null },
                useServiceRole: true,
                token: userToken
              });
            }
          }
          const finalCheck = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}&select=id`, {
            useServiceRole: true,
            token: userToken
          });
          remainingCount = finalCheck.ok && Array.isArray(finalCheck.data) ? finalCheck.data.length : 0;
        } else {
          remainingCount = 0;
        }
      } catch (delErr) {
        console.warn("\u26A0\uFE0F [API /api/profile/reset] Error wiping recordings for student:", delErr);
      }
      const refetched = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, { useServiceRole: true, token: userToken });
      const updatedProfile = Array.isArray(refetched.data) && refetched.data.length > 0 ? refetched.data[0] : null;
      return res.json({
        success: true,
        message: "\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637 \u062C\u0645\u064A\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0627\u0644\u0628 \u0648\u0645\u0633\u062D \u0643\u0627\u0641\u0629 \u0627\u0644\u062A\u0633\u062C\u064A\u0644\u0627\u062A \u0648\u0627\u0644\u062A\u0633\u0645\u064A\u0639\u0627\u062A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0646\u062C\u0627\u062D",
        initialRecordings: initialCount,
        remainingRecordings: remainingCount,
        profile: updatedProfile
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/submissions/teacher/:teacherId", async (req, res) => {
    const { teacherId } = req.params;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    try {
      console.log(`\u{1F399}\uFE0F [API /api/submissions/teacher] Loading submissions from DB for teacher: ${teacherId}`);
      const circlesRes = await supabaseRequest(`/rest/v1/circles?teacher_id=eq.${teacherId}&select=id,name`, { token: userToken });
      const circleIds = Array.isArray(circlesRes.data) ? circlesRes.data.map((c) => c.id).filter(Boolean) : [];
      const studentNameMap = /* @__PURE__ */ new Map();
      const studentCircleMap = /* @__PURE__ */ new Map();
      const studentIds = [];
      try {
        let studentQuery = `/rest/v1/profiles?role=eq.student&select=id,name,circle_id,teacher_id`;
        if (isValidUUID(teacherId)) {
          studentQuery = `/rest/v1/profiles?role=eq.student&or=(teacher_id.eq.${teacherId}${circleIds.length > 0 ? `,circle_id.in.(${circleIds.join(",")})` : ""})&select=id,name,circle_id,teacher_id`;
        }
        const profRes = await supabaseRequest(studentQuery, { token: userToken });
        if (profRes.ok && Array.isArray(profRes.data)) {
          profRes.data.forEach((p) => {
            if (p.id) {
              studentIds.push(p.id);
              if (p.name) studentNameMap.set(p.id, p.name);
              if (p.circle_id) studentCircleMap.set(p.id, p.circle_id);
            }
          });
        }
      } catch (e) {
      }
      if (studentIds.length === 0 && circleIds.length === 0) {
        console.log(`\u{1F399}\uFE0F [API /api/submissions/teacher] Teacher ${teacherId} has no assigned students or circles yet.`);
        return res.json({
          success: true,
          submissions: []
        });
      }
      let dbRecordings = [];
      try {
        let recQuery = "";
        if (studentIds.length > 0 && circleIds.length > 0) {
          recQuery = `/rest/v1/recordings?or=(student_id.in.(${studentIds.join(",")}),circle_id.in.(${circleIds.join(",")}))&select=*&order=created_at.desc`;
        } else if (studentIds.length > 0) {
          recQuery = `/rest/v1/recordings?student_id=in.(${studentIds.join(",")})&select=*&order=created_at.desc`;
        } else if (circleIds.length > 0) {
          recQuery = `/rest/v1/recordings?circle_id=in.(${circleIds.join(",")})&select=*&order=created_at.desc`;
        }
        if (recQuery) {
          const recRes = await supabaseRequest(recQuery, { token: userToken });
          if (recRes.ok && Array.isArray(recRes.data)) {
            dbRecordings = recRes.data.filter(
              (r) => r && r.student_id && studentIds.includes(r.student_id) && r.status !== "deleted" && r.status !== "cancelled_reset"
            );
          }
        }
      } catch (e) {
        console.warn("Recordings table query notice:", e);
      }
      const resolveSubmissionDetails = (nodeId, weekId) => {
        let matchedWeek = WEEKS_DATA.find((w) => w.nodes.some((n) => n.id === nodeId));
        let matchedNode = matchedWeek?.nodes.find((n) => n.id === nodeId);
        if (!matchedWeek && nodeId) {
          const m = nodeId.match(/w(\d+)/i);
          if (m) {
            const wNum = parseInt(m[1], 10);
            matchedWeek = WEEKS_DATA.find((w) => w.id === wNum || w.weekNumber === wNum);
            matchedNode = matchedWeek?.nodes.find((n) => n.id === nodeId) || matchedWeek?.nodes.find((n) => n.type === "recite");
          }
        }
        if (!matchedWeek && weekId) {
          matchedWeek = WEEKS_DATA.find((w) => w.id === weekId);
          matchedNode = matchedWeek?.nodes.find((n) => n.id === nodeId) || matchedWeek?.nodes.find((n) => n.type === "recite");
        }
        const resolvedWeekId = matchedWeek?.id || weekId || 1;
        const weekTitle = matchedWeek?.title || `\u0627\u0644\u0623\u0633\u0628\u0648\u0639 ${resolvedWeekId}`;
        const nodeTitle = matchedNode?.title || (matchedNode?.type === "recite" ? "\u062A\u0633\u0645\u064A\u0639 \u0648\u0627\u0639\u062A\u0645\u0627\u062F" : "\u062A\u0633\u0645\u064A\u0639 \u0627\u0644\u0633\u0648\u0631 \u0627\u0644\u0645\u0642\u0631\u0631\u0629");
        const surahsList = matchedNode?.surahsList && matchedNode.surahsList.length > 0 ? matchedNode.surahsList : matchedWeek?.surahs && matchedWeek.surahs.length > 0 ? matchedWeek.surahs : [];
        const surahName = matchedNode?.surahName || (surahsList.length > 0 ? surahsList.join("\u060C ") : "");
        const nodeDescription = matchedNode?.description || (surahsList.length > 0 ? `\u062A\u0633\u0645\u064A\u0639 \u0648\u062A\u0644\u0627\u0648\u0629 \u0633\u0648\u0631 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0645\u0642\u0631\u0631\u0629 (${surahsList.join("\u060C ")}) \u0648\u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0636\u0628\u0637 \u0627\u0644\u062A\u0644\u0627\u0648\u0629 \u0648\u0627\u0644\u0623\u062D\u0643\u0627\u0645.` : "");
        return {
          weekId: resolvedWeekId,
          weekTitle,
          nodeTitle,
          surahName,
          surahsList,
          nodeDescription
        };
      };
      const allSubmissions = dbRecordings.map((rec) => {
        const studentName = studentNameMap.get(rec.student_id) || "\u0637\u0627\u0644\u0628 \u0642\u0631\u0622\u0646";
        const circleId = rec.circle_id || studentCircleMap.get(rec.student_id) || "";
        const details = resolveSubmissionDetails(rec.node_id, rec.week_id);
        return {
          id: rec.id || `${rec.student_id}_${rec.node_id}`,
          studentId: rec.student_id,
          studentName,
          circleId,
          teacherId,
          nodeId: rec.node_id,
          weekId: details.weekId,
          weekTitle: details.weekTitle,
          nodeTitle: rec.node_title || details.nodeTitle,
          surahName: details.surahName,
          surahsList: details.surahsList,
          nodeDescription: details.nodeDescription,
          type: rec.type || (rec.audio_url ? "recording" : "halaqah"),
          audioUrl: rec.audio_url || "",
          status: rec.status === "approved" ? "approved" : rec.status === "reviewed" ? "reviewed" : "pending_teacher_review",
          teacherNotes: rec.teacher_notes || "",
          rating: rec.rating || (rec.status === "approved" ? "\u0645\u0645\u062A\u0627\u0632 \u{1F31F}" : rec.status === "reviewed" ? "\u064A\u062D\u062A\u0627\u062C \u062A\u062F\u0631\u064A\u0628 \u{1F504}" : ""),
          submittedAt: rec.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          reviewedAt: rec.updated_at || void 0
        };
      }).sort(
        (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
      );
      console.log(`\u{1F399}\uFE0F [API /api/submissions/teacher] Loaded ${allSubmissions.length} submissions directly from Supabase DB for teacher ${teacherId}`);
      return res.json({
        success: true,
        submissions: allSubmissions
      });
    } catch (err) {
      console.error(`\u{1F399}\uFE0F [API /api/submissions/teacher] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/submissions/student/:studentId", async (req, res) => {
    const { studentId } = req.params;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    try {
      const dbRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&select=*&order=created_at.desc`, { token: userToken });
      const recordingsList = dbRes.ok && Array.isArray(dbRes.data) ? dbRes.data : [];
      const submissions = recordingsList.map((rec) => {
        let matchedWeek = WEEKS_DATA.find((w) => w.nodes.some((n) => n.id === rec.node_id));
        let matchedNode = matchedWeek?.nodes.find((n) => n.id === rec.node_id);
        if (!matchedWeek && rec.node_id) {
          const m = rec.node_id.match(/w(\d+)/i);
          if (m) {
            const wNum = parseInt(m[1], 10);
            matchedWeek = WEEKS_DATA.find((w) => w.id === wNum || w.weekNumber === wNum);
            matchedNode = matchedWeek?.nodes.find((n) => n.id === rec.node_id) || matchedWeek?.nodes.find((n) => n.type === "recite");
          }
        }
        const resolvedWeekId = matchedWeek?.id || rec.week_id || 1;
        const weekTitle = matchedWeek?.title || `\u0627\u0644\u0623\u0633\u0628\u0648\u0639 ${resolvedWeekId}`;
        const nodeTitle = rec.node_title || matchedNode?.title || (matchedNode?.type === "recite" ? "\u062A\u0633\u0645\u064A\u0639 \u0648\u0627\u0639\u062A\u0645\u0627\u062F" : "\u062A\u0633\u0645\u064A\u0639 \u0627\u0644\u0633\u0648\u0631 \u0627\u0644\u0645\u0642\u0631\u0631\u0629");
        const surahsList = matchedNode?.surahsList && matchedNode.surahsList.length > 0 ? matchedNode.surahsList : matchedWeek?.surahs && matchedWeek.surahs.length > 0 ? matchedWeek.surahs : [];
        const surahName = matchedNode?.surahName || (surahsList.length > 0 ? surahsList.join("\u060C ") : "");
        const nodeDescription = matchedNode?.description || (surahsList.length > 0 ? `\u062A\u0633\u0645\u064A\u0639 \u0648\u062A\u0644\u0627\u0648\u0629 \u0633\u0648\u0631 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0645\u0642\u0631\u0631\u0629 (${surahsList.join("\u060C ")}) \u0648\u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0636\u0628\u0637 \u0627\u0644\u062A\u0644\u0627\u0648\u0629 \u0648\u0627\u0644\u0623\u062D\u0643\u0627\u0645.` : "");
        return {
          id: rec.id || `${rec.student_id}_${rec.node_id}`,
          studentId: rec.student_id,
          circleId: rec.circle_id,
          nodeId: rec.node_id,
          weekId: resolvedWeekId,
          weekTitle,
          nodeTitle,
          surahName,
          surahsList,
          nodeDescription,
          type: rec.type || (rec.audio_url ? "recording" : "halaqah"),
          audioUrl: rec.audio_url || "",
          status: rec.status === "approved" ? "approved" : rec.status === "reviewed" ? "reviewed" : "pending_teacher_review",
          teacherNotes: rec.teacher_notes || "",
          rating: rec.rating || (rec.status === "approved" ? "\u0645\u0645\u062A\u0627\u0632 \u{1F31F}" : rec.status === "reviewed" ? "\u064A\u062D\u062A\u0627\u062C \u062A\u062F\u0631\u064A\u0628 \u{1F504}" : ""),
          submittedAt: rec.created_at,
          reviewedAt: rec.updated_at || void 0
        };
      });
      return res.json({
        success: true,
        submissions
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/submissions/submit", async (req, res) => {
    try {
      const {
        studentId,
        studentName,
        circleId,
        teacherId,
        nodeId,
        weekId,
        nodeTitle,
        surahName,
        surahsList,
        type,
        audioUrl,
        audioData
      } = req.body;
      const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
      console.log("\u{1F4E4} [API POST /api/submissions/submit] Submission received for DB save:", {
        studentId,
        studentName,
        nodeId,
        circleId,
        type
      });
      if (!studentId || !nodeId) {
        return res.status(400).json({
          success: false,
          error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0646\u0627\u0642\u0635\u0629: studentId \u0648 nodeId \u0645\u0637\u0644\u0648\u0628\u0627\u0646"
        });
      }
      let finalCircleId = circleId;
      let finalTeacherId = teacherId;
      let finalStudentName = studentName;
      try {
        const profRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}&select=circle_id,teacher_id,name`, { token: userToken });
        if (profRes.ok && Array.isArray(profRes.data) && profRes.data.length > 0) {
          const prof = profRes.data[0];
          if (!finalCircleId) finalCircleId = prof.circle_id;
          if (!finalTeacherId) finalTeacherId = prof.teacher_id;
          if (!finalStudentName) finalStudentName = prof.name;
        }
      } catch (err) {
        console.warn("\u26A0\uFE0F Could not fetch profile details in submission:", err);
      }
      if (!finalTeacherId && finalCircleId && isValidUUID(finalCircleId)) {
        try {
          const circRes = await supabaseRequest(`/rest/v1/circles?id=eq.${finalCircleId}&select=teacher_id`, { token: userToken });
          if (circRes.ok && Array.isArray(circRes.data) && circRes.data.length > 0) {
            finalTeacherId = circRes.data[0].teacher_id;
          }
        } catch (e) {
        }
      }
      const generatedId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let savedRecordingId = generatedId;
      const recordingPayload = {
        student_id: studentId,
        node_id: nodeId,
        audio_url: audioUrl || audioData || "",
        status: "pending",
        teacher_notes: null,
        type: type || (audioUrl ? "recording" : "halaqah"),
        node_title: nodeTitle || "\u062A\u0633\u0645\u064A\u0639 \u0627\u0644\u0633\u0648\u0631 \u0627\u0644\u0645\u0642\u0631\u0631\u0629",
        surah_name: surahName || "",
        surahs_list: surahsList || []
      };
      if (isValidUUID(finalCircleId)) {
        recordingPayload.circle_id = finalCircleId;
      }
      try {
        const checkExisting = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&node_id=eq.${nodeId}&select=id`, { token: userToken });
        if (checkExisting.ok && Array.isArray(checkExisting.data) && checkExisting.data.length > 0) {
          const existingId = checkExisting.data[0].id;
          savedRecordingId = existingId;
          await supabaseRequest(`/rest/v1/recordings?id=eq.${existingId}`, {
            method: "PATCH",
            body: recordingPayload,
            token: userToken
          });
          console.log(`\u2705 [API /api/submissions/submit] Existing DB recording updated: ${existingId}`);
        } else {
          const insertRes = await supabaseRequest("/rest/v1/recordings", {
            method: "POST",
            body: recordingPayload,
            token: userToken
          });
          if (insertRes.ok) {
            const recData = Array.isArray(insertRes.data) ? insertRes.data[0] : insertRes.data;
            if (recData?.id) savedRecordingId = recData.id;
            console.log(`\u2705 [API /api/submissions/submit] New DB recording inserted: ${savedRecordingId}`);
          }
        }
      } catch (dbErr) {
        console.warn("\u26A0\uFE0F [API /api/submissions/submit] Exception while saving to DB recordings table:", dbErr);
      }
      const newSubmission = {
        id: savedRecordingId,
        studentId,
        studentName: finalStudentName || "\u0637\u0627\u0644\u0628 \u0642\u0631\u0622\u0646",
        circleId: finalCircleId || "",
        teacherId: finalTeacherId || "",
        nodeId,
        weekId: weekId || 1,
        nodeTitle: nodeTitle || "\u062A\u0633\u0645\u064A\u0639 \u0627\u0644\u0633\u0648\u0631 \u0627\u0644\u0645\u0642\u0631\u0631\u0629",
        surahName: surahName || "",
        surahsList: surahsList || [],
        type: type || "recording",
        audioUrl: audioUrl || audioData || "",
        status: "pending_teacher_review",
        teacherNotes: "",
        rating: "",
        submittedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      return res.json({
        success: true,
        message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062A\u0633\u0645\u064A\u0639 \u0625\u0644\u0649 \u0627\u0644\u0645\u0639\u0644\u0645 \u0648\u062D\u0641\u0638\u0647 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0646\u062C\u0627\u062D",
        submission: newSubmission
      });
    } catch (err) {
      console.error("\u274C [API /api/submissions/submit] Unhandled error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0625\u0644\u0649 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A"
      });
    }
  });
  app.post("/api/submissions/review", async (req, res) => {
    const {
      submissionId,
      studentId,
      nodeId,
      status = "approved",
      // 'approved' | 'reviewed' | 'needs_practice'
      teacherNotes = "",
      rating = "\u0645\u0645\u062A\u0627\u0632 \u{1F31F}",
      xpReward = 25,
      weekId = 1
    } = req.body;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const finalNotes = (teacherNotes || "").trim();
    const finalRating = (rating || (status === "approved" ? "\u0645\u0645\u062A\u0627\u0632 \u{1F31F}" : "\u064A\u062D\u062A\u0627\u062C \u062A\u062F\u0631\u064A\u0628 \u{1F504}")).trim();
    console.log(`\u{1F4DD} [API POST /api/submissions/review] Saving teacher review to Supabase DB:`, {
      submissionId,
      studentId,
      nodeId,
      status,
      finalRating,
      notesLength: finalNotes.length
    });
    if (!studentId || !nodeId) {
      return res.status(400).json({ success: false, error: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0637\u0627\u0644\u0628 \u0648\u0627\u0644\u0645\u062D\u0637\u0629 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    try {
      const dbStatus = status === "approved" ? "approved" : "reviewed";
      let rowsUpdated = false;
      try {
        if (submissionId && !submissionId.includes("_") && isValidUUID(submissionId)) {
          const updateByIdRes = await supabaseRequest(`/rest/v1/recordings?id=eq.${submissionId}`, {
            method: "PATCH",
            body: {
              status: dbStatus,
              teacher_notes: finalNotes,
              rating: finalRating
            },
            useServiceRole: true,
            token: userToken,
            prefer: "return=representation"
          });
          if (updateByIdRes.ok && Array.isArray(updateByIdRes.data) && updateByIdRes.data.length > 0) {
            rowsUpdated = true;
            console.log(`\u2705 [API /api/submissions/review] Recording updated by ID: ${submissionId}`);
          }
        }
        if (!rowsUpdated) {
          const updateRecRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&node_id=eq.${nodeId}`, {
            method: "PATCH",
            body: {
              status: dbStatus,
              teacher_notes: finalNotes,
              rating: finalRating
            },
            useServiceRole: true,
            token: userToken,
            prefer: "return=representation"
          });
          if (updateRecRes.ok && Array.isArray(updateRecRes.data) && updateRecRes.data.length > 0) {
            rowsUpdated = true;
            console.log(`\u2705 [API /api/submissions/review] Recording updated by student_id & node_id for student ${studentId}`);
          } else if (!updateRecRes.ok) {
            console.warn("\u26A0\uFE0F [API /api/submissions/review] Retrying recording update with minimal fields:", updateRecRes.data);
            const retryRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&node_id=eq.${nodeId}`, {
              method: "PATCH",
              body: {
                status: dbStatus,
                teacher_notes: finalNotes
              },
              useServiceRole: true,
              token: userToken,
              prefer: "return=representation"
            });
            if (retryRes.ok && Array.isArray(retryRes.data) && retryRes.data.length > 0) {
              rowsUpdated = true;
            }
          }
        }
        if (!rowsUpdated) {
          console.log(`\u2139\uFE0F [API /api/submissions/review] No existing recording row found; creating new row in DB for student ${studentId}, node ${nodeId}`);
          await supabaseRequest("/rest/v1/recordings", {
            method: "POST",
            body: {
              student_id: studentId,
              node_id: nodeId,
              status: dbStatus,
              teacher_notes: finalNotes,
              rating: finalRating,
              type: "halaqah"
            },
            useServiceRole: true,
            token: userToken
          });
        }
      } catch (recErr) {
        console.warn("\u26A0\uFE0F [API /api/submissions/review] Error updating recordings table:", recErr);
      }
      if (status === "approved") {
        try {
          const studentProfileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}&select=*`, {
            useServiceRole: true,
            token: userToken
          });
          if (studentProfileRes.ok && Array.isArray(studentProfileRes.data) && studentProfileRes.data.length > 0) {
            const profile = studentProfileRes.data[0];
            const existingNodes = Array.isArray(profile.completed_nodes) ? profile.completed_nodes : [];
            const newNodes = existingNodes.includes(nodeId) ? existingNodes : [...existingNodes, nodeId];
            const newXp = (profile.xp || 0) + xpReward;
            await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}`, {
              method: "PATCH",
              body: {
                completed_nodes: newNodes,
                xp: newXp
              },
              useServiceRole: true,
              token: userToken
            });
            console.log(`\u2705 [API /api/submissions/review] Student ${studentId} marked completed for node ${nodeId} in DB. XP: ${newXp}`);
          }
        } catch (profErr) {
          console.warn("Notice updating student profile on review:", profErr);
        }
      }
      const updatedSubmission = {
        id: submissionId || `${studentId}_${nodeId}`,
        studentId,
        nodeId,
        weekId,
        type: req.body.type || "recording",
        status: dbStatus,
        teacherNotes: finalNotes,
        rating: finalRating,
        reviewedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      return res.json({
        success: true,
        message: status === "approved" ? "\u062A\u0645 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u062A\u0633\u0645\u064A\u0639 \u0648\u062D\u0641\u0638 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0646\u062C\u0627\u062D" : "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0648\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
        submission: updatedSubmission
      });
    } catch (err) {
      console.error("Error reviewing submission:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/submissions/switch-type", async (req, res) => {
    try {
      const { studentId, nodeId, newType } = req.body;
      const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!studentId || !nodeId || !newType) {
        return res.status(400).json({ success: false, error: "studentId \u0648 nodeId \u0648 newType \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
      }
      if (newType !== "halaqah" && newType !== "recording") {
        return res.status(400).json({ success: false, error: "\u0646\u0648\u0639 \u0627\u0644\u062A\u0633\u0645\u064A\u0639 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      console.log(`\u{1F504} [API POST /api/submissions/switch-type] Switching recitation for student ${studentId}, node ${nodeId} to ${newType}`);
      if (isValidUUID(studentId)) {
        try {
          const checkRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&node_id=eq.${nodeId}&select=*`, {
            useServiceRole: true,
            token: userToken
          });
          if (!checkRes.ok || !Array.isArray(checkRes.data) || checkRes.data.length === 0) {
            console.log(`\u2139\uFE0F No existing recording row found to switch for ${studentId} & ${nodeId} - inserting new record`);
            let circleId = null;
            try {
              const profRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}&select=circle_id`, { useServiceRole: true, token: userToken });
              if (profRes.ok && Array.isArray(profRes.data) && profRes.data.length > 0) {
                circleId = profRes.data[0].circle_id;
              }
            } catch (e) {
            }
            const insertPayload = {
              student_id: studentId,
              node_id: nodeId,
              type: newType,
              status: "pending",
              audio_url: "",
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            if (circleId && isValidUUID(circleId)) {
              insertPayload.circle_id = circleId;
            }
            await supabaseRequest("/rest/v1/recordings", {
              method: "POST",
              body: insertPayload,
              useServiceRole: true,
              token: userToken
            });
            console.log(`\u2705 [API /api/submissions/switch-type] Inserted new ${newType} submission row for student ${studentId}`);
          } else {
            const rec = checkRes.data[0];
            if (rec.status === "approved") {
              return res.status(400).json({ success: false, error: "\u062A\u0645 \u0627\u0639\u062A\u0645\u0627\u062F \u0647\u0630\u0627 \u0627\u0644\u062A\u0633\u0645\u064A\u0639 \u0645\u0633\u0628\u0642\u0627\u064B \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0628\u062F\u064A\u0644 \u0637\u0631\u064A\u0642\u062A\u0647" });
            }
            const patchPayload = {
              type: newType,
              status: "pending",
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            if (newType === "halaqah") {
              patchPayload.audio_url = "";
            }
            await supabaseRequest(`/rest/v1/recordings?id=eq.${rec.id}`, {
              method: "PATCH",
              body: patchPayload,
              useServiceRole: true,
              token: userToken
            });
            console.log(`\u2705 [API /api/submissions/switch-type] Switched submission ${rec.id} to ${newType}`);
          }
        } catch (dbErr) {
          console.warn("\u26A0\uFE0F [API /api/submissions/switch-type] Exception during DB switch:", dbErr);
        }
      }
      return res.json({
        success: true,
        message: `\u062A\u0645 \u062A\u0628\u062F\u064A\u0644 \u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062A\u0633\u0645\u064A\u0639 \u0625\u0644\u0649 ${newType === "halaqah" ? "\u0627\u0644\u062A\u0633\u0645\u064A\u0639 \u0641\u064A \u0627\u0644\u062D\u0644\u0642\u0629" : "\u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0630\u0627\u062A\u064A"} \u0628\u0646\u062C\u0627\u062D`,
        newType
      });
    } catch (err) {
      console.error("\u274C [API /api/submissions/switch-type] Error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/submissions/mark-absent", async (req, res) => {
    try {
      const { studentId, nodeId, submissionId } = req.body;
      const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!studentId && !submissionId) {
        return res.status(400).json({ success: false, error: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629 \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u063A\u064A\u0627\u0628" });
      }
      console.log(`\u{1F4CB} [API /api/submissions/mark-absent] Marking student ${studentId} absent for node ${nodeId}`);
      if (submissionId && !submissionId.includes("_") && isValidUUID(submissionId)) {
        await supabaseRequest(`/rest/v1/recordings?id=eq.${submissionId}`, {
          method: "DELETE",
          useServiceRole: true,
          token: userToken
        });
      } else if (studentId && nodeId) {
        await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&node_id=eq.${nodeId}`, {
          method: "DELETE",
          useServiceRole: true,
          token: userToken
        });
      }
      return res.json({
        success: true,
        message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u063A\u064A\u0627\u0628 \u0627\u0644\u0637\u0627\u0644\u0628 \u0628\u0646\u062C\u0627\u062D\u060C \u0648\u0623\u0635\u0628\u062D \u0628\u0625\u0645\u0643\u0627\u0646\u0647 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u062A\u0633\u0645\u064A\u0639 \u0645\u062C\u062F\u062F\u0627\u064B \u0641\u064A \u064A\u0648\u0645 \u0622\u062E\u0631"
      });
    } catch (err) {
      console.error("\u274C [API /api/submissions/mark-absent] Error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  const DEFAULT_SYSTEM_CIRCLES = [
    {
      id: "circ_male_101",
      name: "\u062D\u0644\u0642\u0629 \u0627\u0644\u0625\u062A\u0642\u0627\u0646 \u0648\u0627\u0644\u062A\u0631\u062A\u064A\u0644 (\u0628\u0646\u064A\u0646)",
      code: "WRD-101",
      teacherId: "teacher_ahmed",
      teacherName: "\u0627\u0644\u0634\u064A\u062E \u062F. \u0623\u062D\u0645\u062F \u0627\u0644\u0645\u0646\u0634\u0627\u0648\u064A",
      gender: "male",
      studentIds: [],
      isActive: true,
      createdAt: "2025-01-01T00:00:00.000Z"
    },
    {
      id: "circ_male_102",
      name: "\u062D\u0644\u0642\u0629 \u0627\u0644\u0641\u0631\u0642\u0627\u0646 \u0644\u062A\u062D\u0641\u064A\u0638 \u062C\u0632\u0621 \u0639\u0645 (\u0628\u0646\u064A\u0646)",
      code: "WRD-102",
      teacherId: "teacher_ibrahim",
      teacherName: "\u0627\u0644\u0634\u064A\u062E \u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u0627\u0644\u0633\u0639\u062F\u064A",
      gender: "male",
      studentIds: [],
      isActive: true,
      createdAt: "2025-01-01T00:00:00.000Z"
    },
    {
      id: "circ_female_201",
      name: "\u062D\u0644\u0642\u0629 \u062D\u0627\u0641\u0638\u0627\u062A \u0627\u0644\u0641\u0631\u0642\u0627\u0646 (\u0628\u0646\u0627\u062A)",
      code: "WRD-201",
      teacherId: "teacher_maryam",
      teacherName: "\u0627\u0644\u0623\u0633\u062A\u0627\u0630\u0629 \u0645\u0631\u064A\u0645 \u0627\u0644\u0635\u0627\u0644\u062D",
      gender: "female",
      studentIds: [],
      isActive: true,
      createdAt: "2025-01-01T00:00:00.000Z"
    },
    {
      id: "circ_female_202",
      name: "\u062D\u0644\u0642\u0629 \u062A\u0631\u062A\u064A\u0644 \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 (\u0628\u0646\u0627\u062A)",
      code: "WRD-202",
      teacherId: "teacher_fatima",
      teacherName: "\u0627\u0644\u0623\u0633\u062A\u0627\u0630\u0629 \u0641\u0627\u0637\u0645\u0629 \u0627\u0644\u0632\u0647\u0631\u0627\u0621",
      gender: "female",
      studentIds: [],
      isActive: true,
      createdAt: "2025-01-01T00:00:00.000Z"
    }
  ];
  app.get("/api/circles/:circleId", async (req, res) => {
    const { circleId } = req.params;
    try {
      const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}&select=*`);
      if (circleRes.ok && Array.isArray(circleRes.data) && circleRes.data.length > 0) {
        const c = circleRes.data[0];
        return res.json({
          success: true,
          circle: {
            id: c.id,
            name: c.name,
            code: c.code || (c.id ? `WRD-${c.id.replace(/-/g, "").slice(0, 4).toUpperCase()}` : "WRD-101"),
            teacherId: c.teacher_id,
            teacherName: c.teacher_name,
            gender: c.gender,
            studentIds: c.student_ids || [],
            isActive: c.is_active !== false,
            createdAt: c.created_at
          }
        });
      }
      const defMatch = DEFAULT_SYSTEM_CIRCLES.find((c) => c.id === circleId || c.code.toLowerCase() === circleId.toLowerCase());
      if (defMatch) {
        return res.json({ success: true, circle: defMatch });
      }
      return res.status(404).json({ success: false, error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062D\u0644\u0642\u0629" });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/student/circle-info/:circleId", async (req, res) => {
    const { circleId } = req.params;
    try {
      console.log(`\u26A1 [API /api/student/circle-info] Fetching circle + teacher info for: ${circleId}`);
      const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}&select=*`);
      if (circleRes.ok && Array.isArray(circleRes.data) && circleRes.data.length > 0) {
        const c = circleRes.data[0];
        const teacherId = c.teacher_id;
        let teacherName = c.teacher_name;
        if (teacherId) {
          const teacherProfileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${teacherId}&select=id,name,role,gender`);
          if (teacherProfileRes.ok && Array.isArray(teacherProfileRes.data) && teacherProfileRes.data[0]?.name) {
            teacherName = teacherProfileRes.data[0].name;
          }
        }
        const circle = {
          id: c.id,
          name: c.name,
          code: c.code || (c.id ? `WRD-${c.id.replace(/-/g, "").slice(0, 4).toUpperCase()}` : "WRD-101"),
          teacherId: c.teacher_id,
          teacherName: teacherName || c.teacher_name || "\u0627\u0644\u0645\u0639\u0644\u0645",
          gender: c.gender,
          studentIds: c.student_ids || [],
          isActive: c.is_active !== false,
          createdAt: c.created_at
        };
        return res.json({
          success: true,
          circle,
          teacherName: circle.teacherName,
          teacherId: circle.teacherId
        });
      }
      const defMatch = DEFAULT_SYSTEM_CIRCLES.find((c) => c.id === circleId || c.code.toLowerCase() === circleId.toLowerCase());
      if (defMatch) {
        return res.json({
          success: true,
          circle: defMatch,
          teacherName: defMatch.teacherName,
          teacherId: defMatch.teacherId
        });
      }
      return res.status(404).json({ success: false, error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062D\u0644\u0642\u0629" });
    } catch (err) {
      console.error(`\u26A1 [API /api/student/circle-info] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/circles/available", async (req, res) => {
    const { gender } = req.query;
    try {
      let endpoint = "/rest/v1/circles?select=*";
      if (gender) {
        endpoint += `&gender=eq.${gender}`;
      }
      const circleRes = await supabaseRequest(endpoint);
      let circles = [];
      if (circleRes.ok && Array.isArray(circleRes.data) && circleRes.data.length > 0) {
        circles = circleRes.data.filter((c) => c.is_active !== false).map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code || (c.id ? `WRD-${c.id.replace(/-/g, "").slice(0, 4).toUpperCase()}` : "WRD-101"),
          teacherId: c.teacher_id,
          teacherName: c.teacher_name || "\u0627\u0644\u0645\u0639\u0644\u0645",
          gender: c.gender,
          studentIds: c.student_ids || [],
          isActive: c.is_active !== false,
          createdAt: c.created_at
        }));
      }
      const fallbackCircles = DEFAULT_SYSTEM_CIRCLES.filter(
        (c) => !gender || c.gender === gender
      );
      const existingIds = new Set(circles.map((c) => c.id));
      for (const defC of fallbackCircles) {
        if (!existingIds.has(defC.id)) {
          circles.push(defC);
        }
      }
      return res.json({ success: true, circles });
    } catch (err) {
      console.warn("\u26A0\uFE0F [API /api/circles/available] Error, returning fallback circles:", err);
      const fallback = DEFAULT_SYSTEM_CIRCLES.filter((c) => !gender || c.gender === gender);
      return res.json({ success: true, circles: fallback });
    }
  });
  app.get("/api/circles/teacher/:teacherId", async (req, res) => {
    const { teacherId } = req.params;
    try {
      console.log(`[API /api/circles/teacher] Fetching circles for teacher: ${teacherId}`);
      const circleRes = await supabaseRequest(`/rest/v1/circles?teacher_id=eq.${teacherId}&select=*`);
      let rawCircles = Array.isArray(circleRes.data) ? circleRes.data : [];
      if (rawCircles.length === 0) {
        const profRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${teacherId}&select=circle_id`);
        if (profRes.ok && Array.isArray(profRes.data) && profRes.data[0]?.circle_id) {
          const cId = profRes.data[0].circle_id;
          const cRes = await supabaseRequest(`/rest/v1/circles?id=eq.${cId}&select=*`);
          if (cRes.ok && Array.isArray(cRes.data) && cRes.data.length > 0) {
            rawCircles = cRes.data;
          }
        }
      }
      if (rawCircles.length === 0) {
        const allCirclesRes = await supabaseRequest(`/rest/v1/circles?select=*`);
        if (allCirclesRes.ok && Array.isArray(allCirclesRes.data)) {
          const matches = allCirclesRes.data.filter(
            (c) => String(c.teacher_id).trim() === String(teacherId).trim()
          );
          if (matches.length > 0) {
            rawCircles = matches;
          }
        }
      }
      const circles = rawCircles.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code || (c.id ? c.id.slice(0, 6).toUpperCase() : "WRD-101"),
        teacherId: c.teacher_id,
        teacherName: c.teacher_name,
        gender: c.gender,
        studentIds: c.student_ids || [],
        isActive: c.is_active !== false,
        createdAt: c.created_at
      }));
      console.log(`[API /api/circles/teacher] Found ${circles.length} circles for teacher ${teacherId}`);
      return res.json({ success: true, circles });
    } catch (err) {
      console.error(`[API /api/circles/teacher] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/teacher/dashboard-data/:teacherId", async (req, res) => {
    const { teacherId } = req.params;
    try {
      console.log(`\u26A1 [API /api/teacher/dashboard-data] Fast fetching all data for teacher: ${teacherId}`);
      const [directCircleRes, teacherProfileRes, allCirclesRes] = await Promise.all([
        supabaseRequest(`/rest/v1/circles?teacher_id=eq.${teacherId}&select=*`),
        supabaseRequest(`/rest/v1/profiles?id=eq.${teacherId}&select=id,name,circle_id`),
        supabaseRequest(`/rest/v1/circles?select=*`)
      ]);
      let rawCircles = [];
      if (directCircleRes.ok && Array.isArray(directCircleRes.data) && directCircleRes.data.length > 0) {
        rawCircles = directCircleRes.data;
      } else if (teacherProfileRes.ok && Array.isArray(teacherProfileRes.data) && teacherProfileRes.data[0]?.circle_id) {
        const cId = teacherProfileRes.data[0].circle_id;
        const matched = Array.isArray(allCirclesRes.data) ? allCirclesRes.data.filter((c) => c.id === cId) : [];
        if (matched.length > 0) rawCircles = matched;
      }
      if (rawCircles.length === 0 && allCirclesRes.ok && Array.isArray(allCirclesRes.data)) {
        const matches = allCirclesRes.data.filter(
          (c) => String(c.teacher_id).trim() === String(teacherId).trim()
        );
        if (matches.length > 0) rawCircles = matches;
      }
      const circles = rawCircles.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code || (c.id ? c.id.slice(0, 6).toUpperCase() : "WRD-101"),
        teacherId: c.teacher_id,
        teacherName: c.teacher_name,
        gender: c.gender,
        studentIds: c.student_ids || [],
        isActive: c.is_active !== false,
        createdAt: c.created_at
      }));
      let students = [];
      const activeCircle = circles[0] || null;
      if (activeCircle) {
        const [circleProfilesRes, subRes] = await Promise.all([
          supabaseRequest(`/rest/v1/profiles?circle_id=eq.${activeCircle.id}&role=eq.student&select=*`),
          supabaseRequest(`/rest/v1/submissions?circle_id=eq.${activeCircle.id}&select=*`)
        ]);
        students = Array.isArray(circleProfilesRes.data) ? circleProfilesRes.data : [];
        const studentIds = activeCircle.studentIds || [];
        if (studentIds.length > 0) {
          const existingIds = new Set(students.map((s) => s.id));
          const missingIds = studentIds.filter((id) => !existingIds.has(id));
          if (missingIds.length > 0) {
            const inQuery = missingIds.map((id) => `"${id}"`).join(",");
            const batchRes = await supabaseRequest(`/rest/v1/profiles?id=in.(${inQuery})&select=*`);
            if (batchRes.ok && Array.isArray(batchRes.data)) {
              students = [...students, ...batchRes.data];
            }
          }
        }
      }
      console.log(`\u26A1 [API /api/teacher/dashboard-data] Complete! Found ${circles.length} circles and ${students.length} students`);
      return res.json({
        success: true,
        circles,
        activeCircle,
        students
      });
    } catch (err) {
      console.error(`\u26A1 [API /api/teacher/dashboard-data] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/student/circle-info/:circleId", async (req, res) => {
    const { circleId } = req.params;
    try {
      console.log(`\u26A1 [API /api/student/circle-info] Fetching circle + teacher info for: ${circleId}`);
      const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}&select=*`);
      if (!circleRes.ok || !Array.isArray(circleRes.data) || circleRes.data.length === 0) {
        return res.status(404).json({ success: false, error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062D\u0644\u0642\u0629" });
      }
      const c = circleRes.data[0];
      const teacherId = c.teacher_id;
      let teacherName = c.teacher_name;
      if (teacherId) {
        const teacherProfileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${teacherId}&select=id,name,role,gender`);
        if (teacherProfileRes.ok && Array.isArray(teacherProfileRes.data) && teacherProfileRes.data[0]?.name) {
          teacherName = teacherProfileRes.data[0].name;
        }
      }
      const circle = {
        id: c.id,
        name: c.name,
        code: c.code || (c.id ? c.id.slice(0, 6).toUpperCase() : "WRD-101"),
        teacherId: c.teacher_id,
        teacherName: teacherName || c.teacher_name || "\u0627\u0644\u0645\u0639\u0644\u0645",
        gender: c.gender,
        studentIds: c.student_ids || [],
        isActive: c.is_active !== false,
        createdAt: c.created_at
      };
      return res.json({
        success: true,
        circle,
        teacherName: circle.teacherName,
        teacherId: circle.teacherId
      });
    } catch (err) {
      console.error(`\u26A1 [API /api/student/circle-info] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/circles/available", async (req, res) => {
    const { gender } = req.query;
    try {
      let endpoint = "/rest/v1/circles?select=*";
      if (gender) {
        endpoint += `&gender=eq.${gender}`;
      }
      const circleRes = await supabaseRequest(endpoint);
      const circles = Array.isArray(circleRes.data) ? circleRes.data.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code || (c.id ? c.id.slice(0, 6).toUpperCase() : "WRD-101"),
        teacherId: c.teacher_id,
        teacherName: c.teacher_name,
        gender: c.gender,
        studentIds: c.student_ids || [],
        isActive: c.is_active !== false,
        createdAt: c.created_at
      })) : [];
      return res.json({ success: true, circles });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/circles/:circleId/students", async (req, res) => {
    const { circleId } = req.params;
    try {
      console.log(`[API /api/circles/:circleId/students] Fetching students for circle: ${circleId}`);
      const studentsRes = await supabaseRequest(`/rest/v1/profiles?circle_id=eq.${circleId}&role=eq.student&select=*`);
      let students = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}&select=*`);
      if (circleRes.ok && Array.isArray(circleRes.data) && circleRes.data.length > 0) {
        const studentIds = circleRes.data[0].student_ids || [];
        if (studentIds.length > 0) {
          const existingIds = new Set(students.map((s) => s.id));
          const missingIds = studentIds.filter((id) => !existingIds.has(id));
          if (missingIds.length > 0) {
            const inQuery = missingIds.map((id) => `"${id}"`).join(",");
            const batchRes = await supabaseRequest(`/rest/v1/profiles?id=in.(${inQuery})&select=*`);
            if (batchRes.ok && Array.isArray(batchRes.data)) {
              students = [...students, ...batchRes.data];
            }
          }
        }
      }
      console.log(`[API /api/circles/:circleId/students] Returning ${students.length} students for circle ${circleId}`);
      return res.json({ success: true, students });
    } catch (err) {
      console.error(`[API /api/circles/:circleId/students] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/circles", async (req, res) => {
    const { teacherId, teacherName, name, gender = "male" } = req.body;
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "") || void 0;
    if (!teacherId || !name) {
      return res.status(400).json({ success: false, error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0644\u0642\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629" });
    }
    try {
      const genCircleId = import_crypto.default.randomUUID();
      const code = `WRD-${genCircleId.slice(0, 4).toUpperCase()}`;
      const circleData = {
        id: genCircleId,
        name: name.trim(),
        teacher_id: teacherId,
        teacher_name: teacherName || "\u0627\u0644\u0645\u0639\u0644\u0645",
        gender,
        student_ids: [],
        is_active: true
      };
      console.log(`[API /api/circles] Inserting circle for teacher ${teacherId}:`, circleData);
      const createRes = await supabaseRequest("/rest/v1/circles", {
        method: "POST",
        token,
        body: circleData
      });
      if (!createRes.ok) {
        console.error(`[API /api/circles] Insert failed:`, createRes);
        const errorDetail = createRes.data?.message || createRes.data?.details || createRes.data?.hint || createRes.data?.msg || "\u062A\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u0644\u0642\u0629 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A";
        return res.status(400).json({ success: false, error: errorDetail });
      }
      await supabaseRequest(`/rest/v1/profiles?id=eq.${teacherId}`, {
        method: "PATCH",
        token,
        body: { circle_id: genCircleId }
      });
      console.log(`[API /api/circles] Circle successfully created: ${genCircleId}`);
      return res.json({
        success: true,
        circle: {
          id: genCircleId,
          name: name.trim(),
          code,
          teacherId,
          teacherName: teacherName || "\u0627\u0644\u0645\u0639\u0644\u0645",
          gender,
          studentIds: [],
          isActive: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } catch (err) {
      console.error(`[API /api/circles] Exception:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/circles/join", async (req, res) => {
    const { studentId, circleCodeOrId } = req.body;
    if (!studentId || !circleCodeOrId) {
      return res.status(400).json({ success: false, error: "\u064A\u0631\u062C\u0649 \u062A\u0642\u062F\u064A\u0645 \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0637\u0627\u0644\u0628 \u0648\u0631\u0645\u0632 \u0627\u0644\u062D\u0644\u0642\u0629" });
    }
    try {
      const cleanInput = String(circleCodeOrId || "").trim();
      const normalizedInput = cleanInput.replace(/^WRD[-_]?/i, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const findRes = await supabaseRequest(`/rest/v1/circles?select=*`);
      const allCircles = Array.isArray(findRes.data) ? findRes.data : [];
      let match = allCircles.find((c) => {
        if (c.id === cleanInput) return true;
        if (c.code && c.code.toLowerCase() === cleanInput.toLowerCase()) return true;
        const cIdNorm = String(c.id || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const cCodeNorm = String(c.code || "").replace(/^WRD[-_]?/i, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        if (cCodeNorm && cCodeNorm === normalizedInput) return true;
        if (cIdNorm.startsWith(normalizedInput) && normalizedInput.length >= 3) return true;
        if (c.name && c.name.trim().toLowerCase() === cleanInput.toLowerCase()) return true;
        return false;
      });
      let isSystemFallback = false;
      if (!match) {
        const sysMatch = DEFAULT_SYSTEM_CIRCLES.find(
          (c) => c.id === cleanInput || c.code.toLowerCase() === cleanInput.toLowerCase() || c.code.replace(/^WRD[-_]?/i, "").toLowerCase() === normalizedInput || c.name.trim().toLowerCase() === cleanInput.toLowerCase()
        );
        if (sysMatch) {
          match = { ...sysMatch };
          isSystemFallback = true;
        }
      }
      if (!match) {
        return res.status(404).json({ success: false, error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u062D\u0644\u0642\u0629 \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0631\u0645\u0632 \u0623\u0648 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0645\u062F\u062E\u0644." });
      }
      if (isSystemFallback) {
        try {
          await supabaseRequest("/rest/v1/circles", {
            method: "POST",
            body: {
              id: match.id,
              name: match.name,
              teacher_id: match.teacherId || match.teacher_id,
              teacher_name: match.teacherName || match.teacher_name,
              gender: match.gender,
              student_ids: [studentId],
              is_active: true
            }
          });
        } catch (insertErr) {
          console.warn("\u26A0\uFE0F [API /api/circles/join] System circle insert note:", insertErr);
        }
      } else {
        const updatedStudentIds = Array.from(/* @__PURE__ */ new Set([...match.student_ids || [], studentId]));
        await supabaseRequest(`/rest/v1/circles?id=eq.${match.id}`, {
          method: "PATCH",
          body: {
            student_ids: updatedStudentIds
          }
        });
      }
      await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}`, {
        method: "PATCH",
        body: {
          circle_id: match.id,
          teacher_id: match.teacher_id || match.teacherId
        }
      });
      const responseCircle = {
        id: match.id,
        name: match.name,
        code: match.code || (match.id ? `WRD-${match.id.replace(/-/g, "").slice(0, 4).toUpperCase()}` : "WRD-101"),
        teacherId: match.teacher_id || match.teacherId,
        teacherName: match.teacher_name || match.teacherName || "\u0627\u0644\u0645\u0639\u0644\u0645",
        gender: match.gender,
        studentIds: Array.from(/* @__PURE__ */ new Set([...match.student_ids || match.studentIds || [], studentId])),
        isActive: match.is_active !== false,
        createdAt: match.created_at || match.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      };
      return res.json({
        success: true,
        message: `\u062A\u0645 \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645 \u0628\u0646\u062C\u0627\u062D \u0625\u0644\u0649 ${match.name}!`,
        circle: responseCircle
      });
    } catch (err) {
      console.error("\u274C [API /api/circles/join] Exception:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/circles/leave", async (req, res) => {
    const { studentId, circleId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, error: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0637\u0627\u0644\u0628 \u0645\u0637\u0644\u0648\u0628" });
    }
    try {
      await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}`, {
        method: "PATCH",
        body: {
          circle_id: null,
          teacher_id: null
        }
      });
      if (circleId) {
        const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}&select=*`);
        if (circleRes.ok && Array.isArray(circleRes.data) && circleRes.data.length > 0) {
          const c = circleRes.data[0];
          const updatedStudentIds = (c.student_ids || []).filter((id) => id !== studentId);
          await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}`, {
            method: "PATCH",
            body: { student_ids: updatedStudentIds }
          });
        }
      }
      return res.json({ success: true, message: "\u062A\u0645\u062A \u0645\u063A\u0627\u062F\u0631\u0629 \u0627\u0644\u062D\u0644\u0642\u0629 \u0628\u0646\u062C\u0627\u062D." });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/content/curriculum", (req, res) => {
    res.json({
      success: true,
      worlds: WORLDS_DATA,
      weeks: WEEKS_DATA
    });
  });
  app.post("/api/verify-completion", (req, res) => {
    const {
      nodeId,
      weekId,
      userCurrentWeek = 1,
      userCompletedNodes = [],
      userCompletedWeeks = [],
      userXp = 0,
      userStreak = 0,
      userLongestStreak = 0,
      lastActiveDate = "",
      completedDates = []
    } = req.body;
    if (!nodeId || !weekId) {
      return res.status(400).json({ success: false, error: "MISSING_PARAMS", message: "\u0645\u0639\u0631\u0641 \u0627\u0644\u062F\u0631\u0633 \u0648\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    const numericWeekId = Number(weekId);
    const numericCurrentWeek = Number(userCurrentWeek) || 1;
    const completedNodesArr = Array.isArray(userCompletedNodes) ? userCompletedNodes : [];
    const completedWeeksArr = Array.isArray(userCompletedWeeks) ? userCompletedWeeks : [];
    const isWeekUnlocked = numericWeekId <= numericCurrentWeek || completedWeeksArr.includes(numericWeekId);
    if (!isWeekUnlocked) {
      return res.status(403).json({
        success: false,
        error: "WEEK_LOCKED",
        message: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0643\u0645\u0627\u0644 \u062F\u0631\u0633 \u0641\u064A \u0623\u0633\u0628\u0648\u0639 \u0645\u063A\u0644\u0642 \u0645\u0633\u0628\u0642\u0627\u064B"
      });
    }
    const targetWeek = WEEKS_DATA.find((w) => w.id === numericWeekId);
    if (!targetWeek) {
      return res.status(404).json({ success: false, error: "WEEK_NOT_FOUND", message: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    const nodeIndex = targetWeek.nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1) {
      return res.status(404).json({ success: false, error: "NODE_NOT_FOUND", message: "\u0627\u0644\u062F\u0631\u0633 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0628\u0627\u0644\u0623\u0633\u0628\u0648\u0639" });
    }
    const targetNode = targetWeek.nodes[nodeIndex];
    if (nodeIndex > 0) {
      const prevNode = targetWeek.nodes[nodeIndex - 1];
      const isPrevNodeCompleted = completedNodesArr.includes(prevNode.id);
      if (!isPrevNodeCompleted) {
        return res.status(403).json({
          success: false,
          error: "NODE_LOCKED",
          message: "\u064A\u062C\u0628 \u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u062F\u0631\u0633 \u0627\u0644\u0633\u0627\u0628\u0642 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0623\u0648\u0644\u0627\u064B"
        });
      }
    }
    const isAlreadyCompleted = completedNodesArr.includes(nodeId);
    const addedXp = isAlreadyCompleted ? 5 : targetNode.xpReward;
    const newXp = (Number(userXp) || 0) + addedXp;
    const newCompletedNodes = isAlreadyCompleted ? completedNodesArr : [...completedNodesArr, nodeId];
    const allWeekNodesDone = targetWeek.nodes.every((n) => newCompletedNodes.includes(n.id));
    let newCompletedWeeks = [...completedWeeksArr];
    let newCurrentWeek = numericCurrentWeek;
    if (allWeekNodesDone && !newCompletedWeeks.includes(numericWeekId)) {
      newCompletedWeeks.push(numericWeekId);
      newCurrentWeek = Math.max(numericCurrentWeek, numericWeekId + 1);
    }
    const streakResult = updateStreakOnActivity(
      Number(userStreak) || 0,
      Number(userLongestStreak) || 0,
      lastActiveDate,
      Array.isArray(completedDates) ? completedDates : []
    );
    const unlockedBadges = [];
    if (newCompletedNodes.length >= 1) unlockedBadges.push("first_step");
    if (newCompletedWeeks.includes(1)) unlockedBadges.push("week_1_done");
    if (newCompletedWeeks.includes(17)) unlockedBadges.push("juz_amma_master");
    return res.json({
      success: true,
      nodeId,
      weekId: numericWeekId,
      isRepeat: isAlreadyCompleted,
      addedXp,
      newXp,
      newCompletedNodes,
      newCompletedWeeks,
      newCurrentWeek,
      unlockedBadges,
      streakResult
    });
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", serverTime: (/* @__PURE__ */ new Date()).toISOString() });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.get("/", (req, res) => {
      res.redirect("/wrd-journey/");
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.get("/", (req, res) => {
      res.redirect("/wrd-journey/");
    });
    app.use("/wrd-journey", import_express.default.static(distPath));
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ward Club Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
