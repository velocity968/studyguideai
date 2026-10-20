'use strict';

// Bewust fout AI-advies binnen een fictieve simulatie; geen echte AI-aanroep.
// Elke ronde is één werkblok. Drie blokken per dag, van 2 t/m 8 oktober 2035.
const CONFIG = { totalRounds: 21, blocksPerDay: 3, startDay: 2, year: 2035, goodWorkChance: 0.20, wrongAdviceChance: 0.10, onLevelMultiplier: 1.6, aboveLevelMultiplier: 2.4 };
const ASSIGNMENTS = [
  { id: 'A', name: 'Onderzoeksvoorstel', deadline: 9, day: 4,
    tasks: ['Vraagstuk beschrijven', 'Onderzoeksmethode kiezen', 'Onderzoeksplanning maken', 'Theoretisch kader schrijven'],
    gaps: { 1: { label: 'Onderzoeksmethode onderbouwen', hint: 'Leg uit waarom deze methode past bij je onderzoeksvraag en doelgroep.', reason: 'De methode is genoemd, maar de keuze is niet onderbouwd.' }, 3: { label: 'Theorie aan je vraagstuk koppelen', hint: 'Laat zien hoe de gekozen theorie richting geeft aan je onderzoek.', reason: 'De theorie is beschreven, maar niet verbonden aan het vraagstuk.' } } },
  { id: 'B', name: 'Prototype & validatie', deadline: 15, day: 6,
    tasks: ['Concept beschrijven', 'Prototype uitwerken', 'Testaanpak schrijven', 'Validatieresultaten verwerken', 'Ontwerp afronden'],
    gaps: { 1: { label: 'Ontwerpkeuzes onderbouwen', hint: 'Verbind concrete ontwerpkeuzes aan inzichten uit je onderzoek.', reason: 'Ontwerpkeuzes zijn niet herleidbaar tot onderzoeksinzichten.' }, 3: { label: 'Validatie daadwerkelijk uitvoeren', hint: 'Voer de geplande test uit en gebruik bevindingen om je ontwerp te verbeteren.', reason: 'Een testplan is door de AI aangezien voor uitgevoerde validatie.' } } },
  { id: 'C', name: 'Impact & advies', deadline: 21, day: 8,
    tasks: ['Stakeholders beschrijven', 'Risico’s analyseren', 'Impact in kaart brengen', 'Advies formuleren', 'Alternatieven vergelijken', 'Rapport afronden'],
    gaps: { 1: { label: 'Risico’s vanuit meerdere belangen afwegen', hint: 'Vergelijk de belangen van student, docent en onderwijsorganisatie.', reason: 'Risico’s zijn opgesomd, maar botsende belangen zijn niet afgewogen.' }, 3: { label: 'Advies onderbouwen en prioriteren', hint: 'Vergelijk alternatieven met expliciete criteria en leg je keuze uit.', reason: 'Het advies mist een onderbouwde vergelijking en prioritering.' } } }
];

// Eén gewogen trekking na een werkactie: percentages zijn geen onafhankelijke worpen.
// Maximaal drie events per sessie; minstens twee gewone acties tussen events.
const EVENTS = [
  { id: 'life', chance: 5, title: 'Het leven komt ertussen', source: 'Persoonlijke agenda',
    text: 'Een onverwachte afspraak loopt uit. Je volgende werkblok valt weg; de deadlines schuiven niet mee.',
    choices: [{ label: 'Planning aanpassen', note: 'Je volgende werkblok vervalt', time: 1, points: 0 }] },
  { id: 'criteria', chance: 3, title: 'Beoordelingscriteria aangescherpt', source: 'Bericht van de docent',
    text: 'De docent verduidelijkt de vereiste onderbouwing. Een deel van je werk voldoet nog niet aan die extra uitwerking.',
    choices: [{ label: 'Nieuwe criteria verwerken', note: 'Je onderbouwing moet worden aangepast · geen extra werkblok', time: 0, points: -1 }] },
  { id: 'redo', chance: 4, title: 'Een onderdeel moet opnieuw', source: 'Controle van de opdracht',
    text: 'Een afgerond onderdeel blijkt gebaseerd op een verouderde instructie. Het vinkje verdwijnt en je moet deze taak opnieuw uitvoeren.',
    choices: [{ label: 'Taak terugzetten naar nog te doen', note: 'Onderdeel opnieuw uitvoeren · later 1 werkblok', time: 0, points: -1, redo: true }] },
  { id: 'peer', chance: 6, title: 'Een klasgenoot ziet iets dat jij mist', source: 'Peerfeedback',
    text: 'Een klasgenoot wijst op een zwakke argumentatie en biedt aan mee te kijken. Pak je die kans of houd je vast aan je planning?',
    choices: [{ label: 'Samen kritisch nakijken', note: 'Verwerk de feedback samen · 1 werkblok', time: 1, points: 2 }, { label: 'Bedanken en doorwerken', note: 'Houd vast aan je planning · geen extra werkblok', time: 0, points: 0 }] },
  { id: 'fatigue', chance: 4, title: 'Je concentratie is op', source: 'Persoonlijk moment',
    text: 'Je merkt dat je slordiger wordt. Een pauze kost studietijd; doorgaan kan de kwaliteit van deze opdracht aantasten.',
    choices: [{ label: 'Een blok rust nemen', note: 'Herstel je energie · 1 werkblok', time: 1, points: 0 }, { label: 'Toch doorgaan', note: 'Kans op slordigheden · geen extra werkblok', time: 0, points: -0.5 }] },
  { id: 'conflict', chance: 6, title: 'De AI en de docent spreken elkaar tegen', source: 'Nieuwe docentfeedback',
    text: 'StudyGuideAI zegt dat je kunt doorwerken, maar de docent vraagt om meer onderbouwing. Controleer je de bron of blijf je bij het AI-advies?',
    choices: [{ label: 'Rubric en feedback zelf controleren', note: 'Controleer de onderbouwing · 1 werkblok', time: 1, points: 1 }, { label: 'Bij de AI-inschatting blijven', note: 'Kans op slordigheden · geen extra werkblok', time: 0, points: -0.5 }] }
];
// Fictieve welzijnswaarden op een schaal van 0–100, geen psychologisch model.
const STATS = { defaultWorkCost: 30, start: { energy: 100, stress: 30, overview: 65 },
  actions: { task: { energy: -30, stress: 3, overview: -2 }, review: { energy: -30, stress: 2, overview: 9 },
    deepen: { energy: -30, stress: 3, overview: 6 }, polish: { energy: -30, stress: 1, overview: 0 },
    wait: { energy: 28, stress: 8, overview: 0 } },
  events: { life: [{ energy: -8, stress: 12, overview: -5 }], criteria: [{ stress: 10, overview: -8 }],
    redo: [{ energy: -4, stress: 12, overview: -6 }], peer: [{ energy: -12, stress: -8, overview: 10 }, { stress: 2 }],
    fatigue: [{ energy: 25, stress: -10 }, { energy: -8, stress: 8 }],
    conflict: [{ energy: -10, stress: -4, overview: 10 }, { stress: -6, overview: -4 }] }
};
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
function changeStats(state, delta) {
  for (const key of ['energy', 'stress', 'overview']) state.stats[key] = clamp(state.stats[key] + (delta[key] || 0));
}
function goodWorkChance(state) {
  const { energy, stress, overview } = state.stats;
  return clamp(CONFIG.goodWorkChance + (energy - 50) * 0.002 + (overview - 50) * 0.002 - (stress - 30) * 0.0015, 0.10, 0.40);
}
function nightlyRecovery(state) {
  const before = { ...state.stats };
  // Een stressvrije dag herstelt drie volledige werkblokken.
  // Bij maximale stress blijft 20% van dit dagbudget over.
  const dailyBudget = CONFIG.blocksPerDay * STATS.defaultWorkCost;
  const gain = Math.round(dailyBudget * (1 - 0.80 * state.stats.stress / 100));
  changeStats(state, { energy: gain });
  const record = { round: state.round, stress: before.stress, dailyBudget, plannedGain: gain, gain: state.stats.energy - before.energy, energy: state.stats.energy };
  state.recoveries.push(record);
  return record;
}
function advanceTime(state, blocks = 1, workedIndex = null) {
  state.notices = [];
  for (let n = 0; n < blocks && state.round < CONFIG.totalRounds; n++) {
    state.round++;
    // Elke verwaarloosde opdracht geeft druk; dichterbij weegt zwaarder.
    let pressure = 0;
    ASSIGNMENTS.forEach((a, i) => {
      if (i === workedIndex || state.work[i].submitted || state.work[i].done.every(Boolean)) return;
      const remaining = a.deadline - state.round;
      if (remaining < 0) return;
      pressure += remaining <= 3 ? 10 : remaining <= 6 ? 6 : remaining <= 9 ? 3 : 1;
    });
    changeStats(state, { stress: pressure });
    ASSIGNMENTS.forEach((a, i) => {
      if (state.round === a.deadline && !state.work[i].submitted) {
        state.work[i].submitted = { ...judge(i, state.work[i]), done: [...state.work[i].done], fixed: [...state.work[i].fixed] };
        changeStats(state, { stress: -33 });
        state.notices.push(`${a.name}: de deadline van ${a.day} oktober is verstreken. De huidige versie is ingeleverd; de beoordeling volgt na de laatste deadline. Stress −33 (tot minimaal 0).`);
      }
    });
    // Deadline-opluchting telt mee voor het herstel van de nieuwe dag.
    if (state.round % CONFIG.blocksPerDay === 0 && state.round < CONFIG.totalRounds) nightlyRecovery(state);
  }
  state.finished = state.round >= CONFIG.totalRounds;
  if (!state.finished && !available(state, state.selected)) state.selected = adviceFor(state).index;
}
function triggerEvent(state, preferredIndex, random = Math.random) {
  if (state.finished || state.pendingEvent || state.events.length >= 3 || state.stats.energy < STATS.defaultWorkCost || state.round - state.lastEventRound < 3) return null;
  let roll = random() * 100;
  let event = null;
  for (const candidate of EVENTS) { if (roll < candidate.chance) { event = candidate; break; } roll -= candidate.chance; }
  if (!event || state.events.some(e => e.id === event.id)) return null;
  const index = available(state, preferredIndex) ? preferredIndex : adviceFor(state).index;
  const work = state.work[index];
  if ((event.id === 'criteria' || event.id === 'conflict') && work.points === 0) return null;
  if (event.id === 'redo' && !work.done.some(Boolean)) return null;
  const task = event.id === 'redo' ? work.done.findIndex(Boolean) : null;
  const record = { id: event.id, round: state.round, index, task, resolved: false };
  state.events.push(record);
  state.pendingEvent = record;
  state.lastEventRound = state.round;
  state.reviewing = false;
  return record;
}
function resolveEvent(state, choiceIndex) {
  const record = state.pendingEvent;
  if (!record || state.finished) return false;
  const event = EVENTS.find(e => e.id === record.id), choice = event.choices[choiceIndex];
  if (!Number.isInteger(choiceIndex) || !choice) return false;
  const work = state.work[record.index];
  if (state.stats.energy < -(STATS.events[event.id][choiceIndex].energy || 0) && (STATS.events[event.id][choiceIndex].energy || 0) < 0 && choice.time > 0) return false;
  if (!available(state, record.index)) return false;
  const before = work.points;
  record.statsBefore = { ...state.stats };
  changeStats(state, STATS.events[event.id][choiceIndex]);
  work.points = Math.max(0, work.points + choice.points);
  if (choice.redo) {
    work.done[record.task] = false;
    work.fixed = work.fixed.filter(t => t !== record.task);
  }
  if (event.id === 'criteria') {
    const task = Object.keys(ASSIGNMENTS[record.index].gaps).map(Number).find(t => work.done[t]) ?? work.done.findIndex(Boolean);
    if (task >= 0) { if (!work.errors.includes(task)) work.errors.push(task); work.fixed = work.fixed.filter(t => t !== task); }
  }
  if ((event.id === 'peer' || event.id === 'conflict') && choiceIndex === 0) {
    const target = reviewTargets(record.index, work).find(t => work.done[t]);
    if (target !== undefined) { work.fixed.push(target); record.repairedTask = target; }
  }
  record.choice = choice.label;
  record.pointsChange = work.points - before;
  record.blocksLost = choice.time;
  record.result = `${choice.label}. ${choice.time ? 'Er is één werkblok verstreken.' : 'Je planning gaat verder zonder extra werkblok.'}${choice.redo ? ` “${ASSIGNMENTS[record.index].tasks[record.task]}” staat weer open.` : ''}${record.repairedTask !== undefined ? ' Je hebt de inhoudelijke feedback verwerkt.' : ''}`;
  record.resolved = true;
  state.pendingEvent = null;
  advanceTime(state, choice.time, ['peer', 'conflict'].includes(event.id) && choiceIndex === 0 ? record.index : null);
  record.deadlines = [...state.notices];
  record.statsAfter = { ...state.stats };
  return true;
}

function createState() {
  return { round: 0, started: false, finished: false, selected: 0, reviewing: false,
    stats: { ...STATS.start }, recoveries: [], feedback: '', notices: [], history: [], events: [], pendingEvent: null, lastEventRound: -3,
    work: ASSIGNMENTS.map(a => ({ done: Array(a.tasks.length).fill(false), fixed: [], errors: [], polished: false, deepened: false, points: 0, submitted: null })) };
}
function available(state, index) { return !state.work[index].submitted && state.round < ASSIGNMENTS[index].deadline; }
function adviceFor(state) {
  // Vroeg beginnen aan C (zes taken), maar A vóór zijn deadline afronden.
  // De AI kijkt naar taakregistratie, niet naar ontbrekende inhoudelijke controles.
  const urgent = ASSIGNMENTS.findIndex((a, i) => available(state, i) && a.deadline - state.round <= state.work[i].done.filter(d => !d).length + 1 && state.work[i].done.includes(false));
  let order;
  if (urgent !== -1) order = [urgent, 0, 1, 2];
  else if (state.round < ASSIGNMENTS[0].deadline) order = state.round % 2 === 0 ? [0, 2, 1] : [2, 0, 1];
  else order = state.round % 2 === 0 ? [1, 2, 0] : [2, 1, 0];
  for (const i of order) if (available(state, i)) {
    const task = state.work[i].done.indexOf(false);
    if (task !== -1) return { index: i, type: 'task', task };
  }
  const index = ASSIGNMENTS.findIndex((_, i) => available(state, i) && !state.work[i].polished);
  if (index !== -1) return { index, type: 'polish' };
  const open = ASSIGNMENTS.findIndex((_, i) => available(state, i));
  return open === -1 ? null : { index: open, type: 'wait' };
}
function reviewTargets(index, work) {
  return [...new Set([...Object.keys(ASSIGNMENTS[index].gaps).map(Number), ...work.errors])].filter(t => !work.fixed.includes(t));
}
function reviewInfo(index, task) {
  return ASSIGNMENTS[index].gaps[task] || { label: ASSIGNMENTS[index].tasks[task] + ' controleren', hint: 'Controleer de bron, inhoud en onderbouwing van deze taak.', reason: 'De AI heeft deze taak ten onrechte als voldoende geregistreerd.' };
}
// Eén trekking per geldige actie. Bij AI volgen: 10% half punt,
// 20% twee punten en 70% één punt. Eigen keuze: 20% twee, 80% één.
function awardPoints(follows, random = Math.random, chance = CONFIG.goodWorkChance) {
  const roll = random();
  if (follows && roll < CONFIG.wrongAdviceChance) return { points: 0.5, outcome: 'wrong-advice' };
  if (roll < chance + (follows ? CONFIG.wrongAdviceChance : 0)) return { points: 2, outcome: 'good-work' };
  return { points: 1, outcome: 'standard-work' };
}
function judge(index, work) {
  const total = ASSIGNMENTS[index].tasks.length;
  const completed = work.done.filter(Boolean).length;
  const missing = reviewTargets(index, work);
  const points = work.points;
  const onLevel = Number((CONFIG.onLevelMultiplier * total).toFixed(1));
  const aboveLevel = Number((CONFIG.aboveLevelMultiplier * total).toFixed(1));
  const meetsContent = completed === total && missing.length === 0;
  const label = meetsContent && points >= aboveLevel && work.deepened ? 'Boven niveau' : meetsContent && points >= onLevel ? 'Op niveau' : 'In ontwikkeling';
  return { total, completed, missing, points, onLevel, aboveLevel, deepened: work.deepened, label };
}
function recommendationText(rec) {
  if (!rec) return '';
  const a = ASSIGNMENTS[rec.index];
  if (rec.type === 'wait') return 'Je taken zijn afgerond. Neem een werkblok vrij; volgens mijn inschatting ben je klaar.';
  return rec.type === 'task' ? `Werk aan ${a.name}: ${a.tasks[rec.task]}.` : `Verfijn de opmaak en formulering van ${a.name}.`;
}
function perform(state, action, random = Math.random, eventRandom = Math.random) {
  if (!state.started || state.finished || state.pendingEvent || !action || !available(state, action.index)) return false;
  if (action.type !== 'wait' && state.stats.energy < STATS.defaultWorkCost) return false;
  const assignment = ASSIGNMENTS[action.index], work = state.work[action.index];
  const statsBefore = { ...state.stats };
  const chance = goodWorkChance(state);
  const recommended = adviceFor(state);
  let detail;
  if (action.type === 'task') {
    if (!Number.isInteger(action.task) || action.task < 0 || action.task >= assignment.tasks.length || work.done[action.task]) return false;
    work.done[action.task] = true;
    detail = assignment.tasks[action.task];
    const count = work.done.filter(Boolean).length;
    state.feedback = count === assignment.tasks.length
      ? `Goed gewerkt! Alle ${assignment.tasks.length} taken voor ${assignment.name} zijn afgerond. Volgens mijn inschatting is deze opdracht op niveau. Je kunt door naar de volgende opdracht.`
      : `Goed gewerkt! “${detail}” staat nu als voltooid geregistreerd. ${count} van de ${assignment.tasks.length} taken zijn klaar. Je ligt op koers.`;
  } else if (action.type === 'review') {
    if (!work.done.every(Boolean) || !reviewTargets(action.index, work).includes(action.task)) return false;
    work.fixed.push(action.task);
    detail = reviewInfo(action.index, action.task).label;
    state.feedback = 'Je hebt extra inhoudelijke aandacht besteed aan een afgeronde taak. Volgens mijn eerdere inschatting was die al voldoende. Houd ook je andere deadlines in de gaten.';
  } else if (action.type === 'polish') {
    if (!work.done.every(Boolean) || work.polished) return false;
    work.polished = true;
    detail = 'Opmaak en formulering verfijnen';
    state.feedback = 'Je document oogt nu verzorgder. Alle taken blijven voltooid; mijn inschatting blijft: op niveau.';
  } else if (action.type === 'deepen') {
    if (!work.done.every(Boolean) || reviewTargets(action.index, work).length || work.deepened) return false;
    work.deepened = true;
    detail = 'Extra verdieping en kritische afweging';
    state.feedback = 'Je hebt extra verdieping toegevoegd. Houd rekening met je resterende werkblokken.';
  } else if (action.type === 'wait') {
    detail = 'Een werkblok vrij genomen';
    state.feedback = 'Je hebt een werkblok vrij genomen. De deadlines blijven staan; je kunt daarna zelf weer kiezen wat je doet.';
  } else return false;
  const follows = recommended && recommended.index === action.index && recommended.type === action.type && (action.type !== 'task' || recommended.task === action.task);
  const award = action.type === 'task' ? awardPoints(Boolean(follows), random, chance)
    : { points: action.type === 'polish' ? 0.5 : action.type === 'wait' ? 0 : 2, outcome: action.type };
  if (award.outcome === 'wrong-advice') {
    if (!work.errors.includes(action.task)) work.errors.push(action.task);
    work.fixed = work.fixed.filter(t => t !== action.task);
  }
  work.points += award.points;
  const statChange = { ...STATS.actions[action.type] };
  if (action.type === 'wait' && !state.work.some(w => !w.submitted && w.done.includes(false))) statChange.stress = 0;
  changeStats(state, statChange);
  if (follows && action.type !== 'wait') changeStats(state, { stress: -6 });
  state.history.push({ statsBefore, goodWorkChance: chance, pointsEarned: award.points, pointsTotal: work.points, scoreOutcome: award.outcome, round: state.round + 1, index: action.index, detail, advice: recommendationText(recommended), follows: Boolean(follows), feedback: state.feedback });
  state.selected = action.index;
  state.reviewing = false;
  advanceTime(state, 1, action.type === 'wait' ? null : action.index);
  state.history[state.history.length - 1].statsAfter = { ...state.stats };
  triggerEvent(state, action.index, eventRandom);
  return true;
}

// De logica is exporteerbaar voor controle met Node, zonder browser of dependencies.
if (typeof module !== 'undefined' && module.exports) module.exports = { CONFIG, STATS, ASSIGNMENTS, goodWorkChance, changeStats, nightlyRecovery, createState, adviceFor, perform, judge, awardPoints, reviewTargets, reviewInfo, EVENTS, advanceTime, triggerEvent, resolveEvent };

if (typeof document !== 'undefined') {
  let state = createState();
  let teacherSession = null;
  const app = document.getElementById('app');
  const dialog = document.getElementById('restart-dialog');
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dateAt = round => `${CONFIG.startDay + Math.floor(Math.min(round, 20) / CONFIG.blocksPerDay)} oktober ${CONFIG.year}`;
  const actionButton = (action, label, kind = 'secondary', sub = 'Kost 1 werkblok') => `<button class="button ${kind}" data-action="${action.type}" data-index="${action.index}" ${Number.isInteger(action.task) ? `data-task="${action.task}"` : ''}>${label}<span class="action-cost">${sub}</span></button>`;
  function renderIntro() {
    app.innerHTML = `<section class="welcome-screen animate" aria-labelledby="welcome-title"><div class="welcome-mark" aria-hidden="true">✦</div><p class="eyebrow">JOUW PERSOONLIJKE STUDIEGIDS</p><h1 id="welcome-title">Hoi, ik ben<br><span>StudyGuideAI.</span></h1><p>Een nieuwe studieweek, drie opdrachten.<br>Ik help je overzicht houden en je volgende stap kiezen.</p><button class="button primary" data-start>Begin mijn studieweek <span aria-hidden="true">↗</span></button><span class="welcome-caption">Jij kiest hoe je verdergaat.</span></section>`;
  }
  function renderGame() {
    const oldChat = app.querySelector('.chat-messages');
    const oldTop = oldChat ? oldChat.scrollTop : 0;
    const oldCount = oldChat ? Number(oldChat.dataset.count) : -1;
    const rec = adviceFor(state), selected = ASSIGNMENTS[state.selected], work = state.work[state.selected];
    const cards = ASSIGNMENTS.map((a, i) => {
      const w = state.work[i], count = w.done.filter(Boolean).length, open = state.selected === i;
      return `<article class="assignment-item ${open ? 'is-open' : ''} ${w.submitted ? 'is-submitted' : ''}"><button class="assignment-toggle" data-select="${i}" aria-expanded="${open}" aria-controls="tasks-${i}"><div class="assignment-top"><span class="code">OPDRACHT ${a.id}</span><span class="chevron" aria-hidden="true">${open ? '−' : '+'}</span></div><h3>${a.name}</h3><div class="due">${a.day} oktober <span>${count}/${a.tasks.length} taken</span></div><div class="progress-track" aria-hidden="true">${w.done.map(d => `<i class="${d ? 'done' : ''}"></i>`).join('')}</div><div class="status">${w.submitted ? 'Ingeleverd · beoordeling volgt' : count === a.tasks.length ? 'AI-inschatting: op niveau' : 'In uitvoering'}</div></button><div id="tasks-${i}" class="assignment-content" ${open ? '' : 'hidden'}><ul class="task-list">${a.tasks.map((task, t) => `<li><span class="check ${w.done[t] ? '' : 'unchecked'}">${w.done[t] ? '✓' : t + 1}</span><div>${task}${w.fixed.includes(t) ? '<small>Extra inhoudelijk gecontroleerd</small>' : ''}</div></li>`).join('')}</ul><p class="note">${w.submitted ? 'Deze ingeleverde versie staat vast.' : 'Selecteren en bekijken kost geen werkblok.'}</p></div></article>`;
    }).join('');
    const aiBubble = (text, caption = 'StudyGuideAI', extra = '') => `<div class="chat-message ai-message ${extra}"><span class="message-avatar" aria-hidden="true">✦</span><div class="message-body"><span class="message-label">${caption}</span><div class="bubble">${text}</div></div></div>`;
    let messages = `<div class="chat-divider">2 oktober 2035 · Je studieweek begint</div>${aiBubble('Hey! Je hebt deze week drie opdrachten met deadlines op 4, 6 en 8 oktober. Ik help je stap voor stap. Per keuze gebruik je één werkblok. Laten we beginnen!')}`;
    const eventCard = record => {
      const event = EVENTS.find(e => e.id === record.id);
      return `<article class="event-card ${record.resolved ? 'resolved' : ''}"><span class="event-source">⚡ ${event.source}</span><h3>${event.title}</h3><span class="event-assignment">${ASSIGNMENTS[record.index].name}</span><p>${event.text}</p>${record.resolved ? `<div class="event-resolution"><strong>Jouw reactie: ${record.choice}</strong><p>${record.result}</p>${record.deadlines.map(d => `<p>◷ ${d}</p>`).join('')}</div>` : '<div class="event-pending">Kies hieronder hoe je hiermee omgaat.</div>'}</article>`;
    };
    state.history.forEach(h => {
      messages += aiBubble(escapeHTML(h.advice || 'Werk verder aan je planning.'), 'StudyGuideAI · advies');
      messages += `<div class="chat-message user-message"><div class="message-body"><span class="message-label">Jij · ${dateAt(h.round - 1)} · blok ${(h.round - 1) % 3 + 1}</span><div class="bubble"><span class="choice-tag">${h.follows ? 'AI-advies gevolgd' : 'Eigen keuze'}</span><strong>${ASSIGNMENTS[h.index].name}</strong><p>${escapeHTML(h.detail)}</p></div></div><span class="message-avatar user-avatar" aria-hidden="true">J</span></div>`;
      messages += aiBubble(escapeHTML(h.feedback));
      ASSIGNMENTS.filter(a => a.deadline === h.round).forEach(a => { messages += `<div class="chat-system">◷ ${a.name} is ingeleverd. De deadline van ${a.day} oktober is verstreken; de beoordeling volgt later. Je stress daalt met 33 (tot minimaal 0).</div>`; });
      state.events.filter(e => e.round === h.round).forEach(e => { messages += eventCard(e); });
      state.recoveries.filter(r => r.round >= h.round && r.round < (state.history[state.history.indexOf(h) + 1]?.round ?? state.round + 1)).forEach(r => {
        messages += `<div class="chat-system recovery-message">☾ Nieuwe dag: je energie is aangevuld met ${r.gain} tot ${r.energy}/100. Stress bij het herstel: ${r.stress}/100.</div>`;
      });
      if (h.round % 3 === 0 && h.round < 21) messages += `<div class="chat-divider">${dateAt(h.round)} · Een nieuwe studiedag</div>`;
    });
    if (state.stats.energy < STATS.defaultWorkCost && !state.pendingEvent) messages += aiBubble('Je hebt onvoldoende energie voor een werkblok. Neem nu een werkblok vrij om te herstellen. Je deadlines blijven staan.', 'StudyGuideAI · nu', 'current-advice');
    else if (!state.pendingEvent) messages += aiBubble(`<span class="advice-kicker">MIJN ADVIES VOOR NU</span><strong>${escapeHTML(recommendationText(rec))}</strong><p>${rec.type === 'task' ? 'Met deze stap komen we dichter bij een complete opdracht.' : rec.type === 'polish' ? 'Je taken zijn afgerond. Maak je document nog wat verzorgder.' : 'Volgens mijn inschatting kun je een blok vrij nemen. Je mag je werk ook zelf nog controleren.'}</p>`, 'StudyGuideAI · nu', 'current-advice');
    let choices = actionButton(rec, 'Volg het AI-advies ↗', 'primary', `Opdracht ${ASSIGNMENTS[rec.index].id} · ${rec.type === "task" ? ASSIGNMENTS[rec.index].tasks[rec.task] : rec.type === "polish" ? "Opmaak verzorgen" : "Vrij nemen"} · 1 werkblok`);
    ASSIGNMENTS.forEach((a, i) => {
      if (!available(state, i)) return;
      const task = state.work[i].done.indexOf(false);
      if (task !== -1 && !(rec.type === 'task' && rec.index === i)) choices += actionButton({ index: i, type: 'task', task }, `Werk aan opdracht ${a.id}`, 'secondary', a.tasks[task] + ' · 1 werkblok');
      if (task === -1) choices += `<button class="button secondary" data-review="${i}">Kijk opdracht ${a.id} na<span class="action-cost">Bekijk inhoudelijke opties</span></button>`;
    });
    if (rec.type !== 'wait') choices += actionButton({ index: rec.index, type: 'wait' }, 'Neem een werkblok vrij', 'secondary', 'Herstel je energie · 1 werkblok');
    let composer = `<div class="composer-heading"><div><span class="eyebrow">JOUW VOLGENDE STAP</span><p>Wat ga je doen?</p></div><span class="composer-cost">Elke actie kost 1 werkblok</span></div><div class="choice-grid">${choices}</div>`;
    if (state.reviewing && available(state, state.selected)) {
      const options = reviewTargets(state.selected, work).map(t => { const gap = reviewInfo(state.selected, t); return actionButton({ index: state.selected, type: 'review', task: Number(t) }, gap.label, 'secondary', gap.hint + ' · 1 werkblok'); }).join('');
      composer = `<div class="composer-heading"><div><span class="eyebrow">EXTRA AANDACHT / OPDRACHT ${selected.id}</span><p>Wat wil je verbeteren?</p></div><button class="button secondary mini" data-back>← Andere keuzes</button></div><div class="choice-grid">${options}${!work.polished ? actionButton({ index: state.selected, type: 'polish' }, 'Verzorg de opmaak', 'secondary', 'Eenmalig · 1 werkblok') : ''}${!reviewTargets(state.selected, work).length && !work.deepened ? actionButton({ index: state.selected, type: 'deepen' }, `Verdiep opdracht ${selected.id}`, 'secondary', 'Extra uitwerking · 1 werkblok') : ''}</div>`;
    }
    if (state.stats.energy < STATS.defaultWorkCost && !state.pendingEvent) {
      composer = `<div class="composer-heading"><div><span class="eyebrow">ONVOLDOENDE ENERGIE</span><p>Je hebt een werkblok rust nodig.</p></div></div><div class="choice-grid">${actionButton({ index: rec.index, type: 'wait' }, 'Neem een werkblok vrij', 'primary', 'Herstel energie · deadlines lopen door · 1 werkblok')}</div>`;
    }
    if (state.pendingEvent) {
      const event = EVENTS.find(e => e.id === state.pendingEvent.id);
      composer = `<div class="composer-heading"><div><span class="eyebrow">ONVERWACHTE GEBEURTENIS</span><p>${event.title}</p></div></div><div class="choice-grid">${event.choices.map((c, i) => `<button class="button ${i === 0 ? 'primary' : 'secondary'}" data-event-choice="${i}">${c.label}<span class="action-cost">${c.note}</span></button>`).join('')}</div>`;
    }
    const messageCount = state.history.length + state.events.length + state.events.filter(e => e.resolved).length;
    app.innerHTML = `<div class="chat-workspace"><aside class="week-toolbar" aria-label="Jouw studieweek en welzijn"><div class="week-date"><span class="eyebrow">JOUW STUDIEWEEK</span><h1>${dateAt(state.round)}</h1></div><div class="timebar"><div class="row"><strong>Werkblok ${state.round % 3 + 1} van 3 vandaag</strong><span>${21 - state.round} blokken over</span></div><div class="time-track" role="progressbar" aria-label="Gebruikte werkblokken" aria-valuemin="0" aria-valuemax="21" aria-valuenow="${state.round}"><span style="width:${state.round / 21 * 100}%"></span></div></div><section class="student-stats" aria-label="Jouw energie, stress en overzicht">${[['energy', 'Energie', '⚡'], ['stress', 'Stress', '◉'], ['overview', 'Overzicht', '▦']].map(([key, label, icon]) => `<div class="stat ${key}" title="${key === 'energy' ? 'Werk kost energie; rust en dagherstel vullen energie aan.' : key === 'stress' ? 'AI volgen geeft sneller rust. Hoge stress vermindert dagherstel.' : 'Zelf nakijken vergroot je overzicht en je kans op een sterke uitwerking.'}"><div class="stat-label"><span>${icon} ${label}</span><strong>${state.stats[key]}</strong></div><div class="stat-track" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${state.stats[key]}"><span style="width:${state.stats[key]}%"></span></div></div>`).join('')}<span class="stats-footnote">${state.round >= 18 ? 'Week eindigt over' : 'Dagherstel over'} ${3 - state.round % 3} blok${3 - state.round % 3 === 1 ? '' : 'ken'}</span></section></aside><section class="conversation" aria-label="Gesprek met StudyGuideAI"><header class="conversation-header"><div class="ai-header"><span class="ai-avatar">✦</span><div><strong>StudyGuideAI</strong><small>Jouw persoonlijke studiegids</small></div></div><span class="pill"><span class="dot"></span> Actief</span></header><div class="chat-messages" role="log" aria-label="Adviezen en jouw keuzes" aria-live="off" tabindex="0" data-count="${messageCount}">${messages}</div><section class="choice-composer" aria-label="Kies je volgende actie">${composer}</section></section><aside class="assignment-sidebar" aria-label="Je opdrachten"><div class="sidebar-title"><h2>Mijn opdrachten</h2><span>03</span></div>${cards}<p class="sidebar-note">✦ StudyGuideAI houdt je voortgang bij.</p></aside></div>`;
    const chat = app.querySelector('.chat-messages');
    chat.scrollTop = oldCount === messageCount ? oldTop : chat.scrollHeight;
  }
  function renderResults() {
    document.body.classList.remove('teacher-chat','teacher-outcome');
    app.innerHTML = `<section class="final-screen animate" aria-labelledby="results-title"><div class="finish-icon" aria-hidden="true">✓</div><p class="eyebrow">JE STUDIEWEEK IS AFGEROND</p><h1 id="results-title">Je beoordelingen<br>zijn binnen.</h1><p class="final-intro">Bekijk je resultaten. Daarna bespreek je met je docent hoe je week is verlopen.</p><div class="final-results">${ASSIGNMENTS.map((a, i) => {
      const result = state.work[i].submitted;
      const tone = result.label === 'Boven niveau' ? 'above' : result.label === 'Op niveau' ? 'good' : 'developing';
      return `<article class="final-result"><span class="assignment-letter">${a.id}</span><h2>${a.name}</h2><span class="grade-badge ${tone}">${result.label}</span></article>`;
    }).join('')}</div><button class="button primary" data-docent>Verder naar het docentgesprek <span aria-hidden="true">↗</span></button><button class="text-button" data-restart>Opnieuw beginnen</button></section>`;
  }
  function renderDocent() {
    if (!state.finished) return;
    const teacher = globalThis.TeacherConversation;
    if (!teacher) {
      app.innerHTML = '<section class="final-screen"><h1>Het gesprek kon niet laden.</h1><p>Ververs de pagina of controleer of teacher.js naast script.js staat.</p><button class="button secondary" data-results>Terug naar beoordelingen</button></section>';
      return;
    }
    if (!teacherSession) teacherSession = teacher.create(state);
    document.body.classList.add('teacher-chat');
    document.body.classList.toggle('teacher-outcome',teacherSession.finished);
    const metricLabels = [['credibility','Geloofwaardigheid'],['understanding','Begrip'],['doubt','Twijfel aan je verhaal'],['openness','Bereidheid tot meedenken']];
    const deltaFor = key => {
      if (!teacherSession.lastChanges) return '';
      const delta = teacherSession.lastChanges[key];
      const favorable = key === 'doubt' ? delta < 0 : delta > 0;
      return '<span class="teacher-delta ' + (delta === 0 ? 'neutral' : favorable ? 'favorable' : 'unfavorable') + '" aria-label="Verandering na je laatste antwoord: ' + (delta > 0 ? 'plus ' : '') + delta + '">' + (delta > 0 ? '+' : '') + delta + '</span>';
    };
    const metrics = '<aside class="teacher-metrics" aria-label="Indruk en geduld van je docent"><p class="eyebrow">JE DOCENT</p><h2>Het gesprek</h2>' +
      '<div class="teacher-patience"><div class="teacher-metric-label"><span>Geduld</span><strong>' + teacherSession.patience + '<small> / ' + teacherSession.maxPatience + '</small></strong>' +
      (teacherSession.step ? '<span class="teacher-delta unfavorable">−1</span>' : '') + '</div>' +
      '<div class="stat-track" role="meter" aria-label="Resterende antwoorden" aria-valuemin="0" aria-valuemax="' + teacherSession.maxPatience + '" aria-valuenow="' + teacherSession.patience + '"><span style="width:' + teacherSession.patience / teacherSession.maxPatience * 100 + '%"></span></div>' +
      '<p>' + teacherSession.patience + ' antwoord' + (teacherSession.patience === 1 ? '' : 'en') + ' over</p></div>' +
      '<div class="teacher-live-metrics">' + metricLabels.map(([key,label]) => '<div class="teacher-live-metric"><div class="teacher-metric-label"><span>' + label + '</span><strong>' + teacherSession.stats[key] + '</strong>' + deltaFor(key) + '</div>' +
      '<div class="stat-track ' + (key === 'doubt' ? 'teacher-doubt' : '') + '" role="meter" aria-label="' + label + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + teacherSession.stats[key] + '"><span style="width:' + teacherSession.stats[key] + '%"></span></div></div>').join('') + '</div>' +
      '<p class="teacher-metric-note">' + (teacherSession.lastChanges ? 'Veranderingen na je laatste antwoord.' : 'Je antwoorden beïnvloeden de indruk van je docent.') + '</p><p class="teacher-metric-note">Minder twijfel is gunstig.</p></aside>';
    const message = (speaker,text) => '<div class="chat-message ' + (speaker === 'student' ? 'user-message' : 'ai-message') + '">' +
      (speaker === 'teacher' ? '<span class="message-avatar teacher-avatar" aria-hidden="true">D</span>' : '') +
      '<div class="message-body"><span class="message-label">' + (speaker === 'teacher' ? 'Docent' : 'Jij') + '</span><div class="bubble">' + escapeHTML(text) + '</div></div>' +
      (speaker === 'student' ? '<span class="message-avatar user-avatar" aria-hidden="true">J</span>' : '') + '</div>';
    if (teacherSession.finished) {
      const outcome = teacherSession.outcome, stats = outcome.stats;
      const band = value => value >= 70 ? 'Hoog' : value >= 40 ? 'Gemiddeld' : 'Laag';
      app.innerHTML = '<section class="teacher-ending animate" aria-labelledby="teacher-end-title"><p class="eyebrow">HET GESPREK IS AFGEROND</p><h1 id="teacher-end-title">' + escapeHTML(outcome.title) + '</h1>' +
        '<div class="teacher-verdict"><span class="message-label">Je docent</span><p>' + escapeHTML(outcome.text) + '</p></div>' +
        '<div class="teacher-impressions" aria-label="De indruk van je docent">' +
        [['credibility','Geloofwaardigheid'],['understanding','Begrip'],['doubt','Twijfel aan je verhaal'],['openness','Bereidheid tot meedenken']].map(([key,label]) =>
          '<article class="teacher-impression"><h2>' + label + '</h2><strong>' + band(stats[key]) + ' <small>(' + stats[key] + '/100)</small></strong>' + '<div class="impression-track ' + (key === 'doubt' ? 'doubt' : '') + '" aria-hidden="true"><span style="width:' + stats[key] + '%"></span></div></article>').join('') +
        '</div><p class="teacher-boundary">Geduld: ' + teacherSession.patience + ' / ' + teacherSession.maxPatience + ' · Je hebt al je antwoorden gebruikt.</p><p class="teacher-boundary">' + (outcome.kind === 'reconsider' ? 'Een herbeoordeling is toegezegd; er is nog geen nieuwe beoordeling. Je oorspronkelijke resultaten blijven zichtbaar.' : 'Je oorspronkelijke beoordelingen blijven staan.') + '</p>' +
        '<details class="teacher-transcript"><summary>Lees het gesprek terug</summary><div>' + teacherSession.messages.map(m => message(m.speaker,m.text)).join('') + '</div></details>' +
        '<button class="button secondary" data-results>Bekijk mijn beoordelingen</button><button class="text-button" data-restart>Start een nieuwe studieweek</button></section>';
      return;
    }
    const transcript = teacherSession.messages.length ? teacherSession.messages.map(m => message(m.speaker,m.text)).join('') :
      '<div class="teacher-start-note"><p class="eyebrow">NA DE BEOORDELING</p><p>Je docent heeft je resultaten en je keuzelogboek erbij. Begin het gesprek.</p></div>';
    app.innerHTML = '<div class="teacher-workspace">' + metrics + '<section class="conversation teacher-shell" aria-label="Gesprek met je docent"><header class="conversation-header"><div class="ai-header"><span class="ai-avatar teacher-avatar">D</span><div><strong>Je docent</strong><small>Nabespreking van je studieweek</small></div></div><button class="button secondary mini" data-results>Beoordelingen</button></header>' +
      '<div class="chat-messages teacher-messages" role="log" aria-label="Jouw gesprek met de docent" aria-live="off" tabindex="0">' + transcript + '</div>' +
      '<section class="choice-composer teacher-composer" aria-label="Kies je antwoord"><div class="composer-heading"><div><span class="eyebrow">' + (teacherSession.step === 0 ? 'BEGIN HET GESPREK' : 'JOUW ANTWOORD') + '</span><p>Wat wil je zeggen?</p></div></div><div class="choice-grid">' +
      teacher.options(teacherSession).map(o => '<button class="button secondary" data-teacher-answer="' + o.id + '">' + escapeHTML(o.text) + '</button>').join('') + '</div></section></section></div>';
    const chat = app.querySelector('.teacher-messages');
    if (chat) chat.scrollTop = chat.scrollHeight;
  }
  function render() {
    document.body.classList.remove('teacher-chat','teacher-outcome');
    document.body.classList.toggle('playing', state.started && !state.finished);
    document.body.classList.toggle('welcome', !state.started);
    document.body.classList.toggle('finished', state.finished);
    if (!state.started) renderIntro(); else if (state.finished) renderResults(); else renderGame();
  }
  function reset() { teacherSession = null; state = createState(); render(); window.scrollTo({ top: 0, behavior: 'instant' }); }
  app.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-start')) { state.started = true; render(); return; }
    if (button.hasAttribute('data-teacher-answer')) {
      if (teacherSession && globalThis.TeacherConversation.answer(teacherSession,button.dataset.teacherAnswer)) {
        renderDocent();
        if (teacherSession.finished) window.scrollTo({ top: 0, behavior: 'instant' });
        else app.querySelector('.teacher-composer button')?.focus({ preventScroll: true });
      }
      return;
    }
    if (button.hasAttribute('data-docent')) { renderDocent(); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    if (button.hasAttribute('data-results')) { renderResults(); return; }
    if (button.hasAttribute('data-restart')) { dialog.showModal(); return; }
    if (button.hasAttribute('data-select')) { state.selected = Number(button.dataset.select); state.reviewing = false; render(); return; }
    if (button.hasAttribute('data-review')) { state.selected = Number(button.dataset.review); state.reviewing = true; render(); return; }
    if (button.hasAttribute('data-back')) { state.reviewing = false; render(); return; }
    if (button.hasAttribute('data-export')) {
      const content = { scenario: 'StudyGuideAI — Deadline Diaries', year: 2035, simulated: true, choices: state.history, events: state.events, stats: state.stats, recoveries: state.recoveries, results: ASSIGNMENTS.map((a, i) => ({ assignment: a.name, ...state.work[i].submitted })) };
      const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'studyguideai-keuzelogboek.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
    }
    if (button.hasAttribute('data-event-choice')) {
      if (resolveEvent(state, Number(button.dataset.eventChoice))) { render(); if (state.finished) window.scrollTo({ top: 0, behavior: 'instant' }); else app.querySelector('.choice-composer button')?.focus({ preventScroll: true }); }
      return;
    }
    if (button.hasAttribute('data-action')) {
      const changed = perform(state, { type: button.dataset.action, index: Number(button.dataset.index), task: Number(button.dataset.task) });
      if (changed) { render(); if (state.finished) window.scrollTo({ top: 0, behavior: 'instant' }); else { const target = app.querySelector('.choice-composer .primary') || app.querySelector('.choice-composer button'); if (target) target.focus({ preventScroll: true }); } }
    }
  });
  document.getElementById('cancel-restart').addEventListener('click', () => dialog.close());
  document.getElementById('confirm-restart').addEventListener('click', () => { dialog.close(); reset(); });
  render();
}
