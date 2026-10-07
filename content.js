/* ============================================================
   content.js — lorisca-builds.github.io
   THE ONLY FILE YOU EDIT FOR CONTENT CHANGES.
   ============================================================ */

const SITE = {
  org: "lorisca-builds",
  orgLabel: "Builds",
  owner: "Lorisca Cessia",
  mainSite: "https://lori-sca.github.io",
  githubOrg: "https://github.com/lorisca-builds",
  email: "loriscatuuk@gmail.com",
};

const HERO = {
  eyebrow: "LORISCA-BUILDS · WORKING TOOLS",
  headline: "Tools that work.",
  lede: "Working tools with live demos and written playbooks. Designed from my own failure modes.",
};

const PROJECTS = [
  {
    id: "adhd-project-manager",
    title: "ADHD Project Manager",
    hook: "A scheduled scan that catches everything I leave midway across AI chats and lands it on one prioritized board. Built for my ADHD; built so anyone can repurpose it.",
    metric: "Live demo · open playbook",
    visual:
      "https://raw.githubusercontent.com/lori-sca/muse-adhd-project-manager/main/docs/screenshots/board.png",
    visualAlt: "Prioritized board of open loops",
    diagram:
      "https://raw.githubusercontent.com/lori-sca/muse-adhd-project-manager/main/docs/problem-diagram.svg",
    diagramAlt: "Trap → Insight → Machine diagram",
    status: "live",
    links: [
      {
        label: "Repo",
        url: "https://github.com/lori-sca/muse-adhd-project-manager",
        kind: "github",
      },
      {
        label: "Live demo",
        url: "https://lori-sca.github.io/muse-adhd-project-manager/board/index.html",
        kind: "demo",
      },
    ],
    body: {
      problem:
        "AI chats are where work goes to die midway — brilliant threads abandoned, commitments unconfirmed, and no single place to see what's actually open.",
      approach:
        "A scheduled scan reads every thread, finds open loops, and lands them on one prioritized board: sense → draft → queue → review.",
      hers: "Designed from my own failure modes — ADHD as a design constraint, never an apology. Produced is not shipped.",
      result:
        "One board, every open loop, ranked. The scan runs daily; I clear it in one sitting.",
      lesson: "The job isn't organizing tasks. It's noticing them.",
    },
  },
];

/* Prototyping — one honest line. Empty string hides it. */
const PROTOTYPING =
  "More tools are in the workshop — each one earns its card here when it has a live demo and a written playbook.";
