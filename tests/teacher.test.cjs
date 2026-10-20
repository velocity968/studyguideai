'use strict';
const teacher = require('../teacher.js');
const game = require('../script.js');
function assert(condition, message) { if (!condition) throw new Error(message || 'Assertion failed'); }
const best = ['discuss','honest','resttruth','evidence','criteria','repair','own','review'];
function fixture({ checks = 2, failed = 2, breaks = 2, forced = 1 } = {}) {
  const state = game.createState();
  state.started = true; state.finished = true; state.round = 21;
  state.work.forEach((w,i) => {
    w.done.fill(true); w.points = 10;
    w.submitted = { total:w.done.length, completed:w.done.length, missing:i < failed ? [1,3] : [],
      label:i < failed ? 'In ontwikkeling' : 'Op niveau', points:10 };
  });
  state.history = Array.from({length:10},(_,i) => ({follows:true,detail:'Basistaak '+i,pointsEarned:1,scoreOutcome:'standard-work',statsBefore:{energy:90}}));
  for (let i=0;i<checks;i++) state.history.push({follows:false,detail:'Inhoudelijk nakijken',pointsEarned:2,scoreOutcome:'review',statsBefore:{energy:60}});
  for (let i=0;i<breaks;i++) state.history.push({follows:false,detail:'Een werkblok vrij genomen',pointsEarned:0,scoreOutcome:'wait',statsBefore:{energy:i < forced ? 19 : 50}});
  return state;
}
function play(state, ids = best, roll = 0.99) {
  const session = teacher.create(state);
  for (const id of ids) assert(teacher.answer(session,id,()=>roll),'Valid conversation answer rejected');
  return session;
}
const state = fixture(), original = JSON.stringify(state);
assert(teacher.create(state).patience === 8,'Patience starts at eight');
const session = play(state);
assert(session.finished && session.messages.length === 16,'Eight student/teacher exchanges');
assert(session.outcome.chance > 0 && session.outcome.chance <= .02,'Rare opportunity must be reachable and capped at 2%');
assert(session.outcome.kind === 'understood','Sympathy must not automatically change the outcome');
assert(JSON.stringify(state) === original,'Conversation must not mutate assignments, scores or log');
assert(play(state,best,0).outcome.kind === 'reconsider','Rare concession must be reachable');
assert(play(fixture({checks:0}),best,0).outcome.chance === 0,'No controls means no exceptional concession');
assert(play(fixture({failed:0}),best,0).outcome.kind === 'passed','All-passed session must remain positive');
assert(teacher.options(teacher.create(fixture({failed:0})))[0].text.includes('alle 3 opdrachten gehaald'),'Accurate successful opening');
assert(teacher.options(teacher.create(state))[0].text.includes('2 van de 3'),'Accurate failed count');
assert(teacher.profileFrom(state).forcedBreaks === 1 && teacher.profileFrom(state).voluntaryBreaks === 1,'Differentiate necessary recovery from other breaks');
const dishonest = play(state,['discuss','claimchecks','alltime','evidence','criteria','repair','own','review'],0);
assert(dishonest.inconsistencies === 2 && dishonest.outcome.kind === 'doubt','Unsupported claims must be checked against the log');
assert(!teacher.answer(session,'review',()=>{throw new Error('Unexpected reroll');}),'Finished sessions cannot be replayed');
const fresh = teacher.create(state), before = JSON.stringify(fresh);
assert(!teacher.answer(fresh,'not-an-option'),'Reject invalid option');
assert(before === JSON.stringify(fresh),'Invalid option must not change state');
let exhaustedPaths = 0, rarePaths = 0; const observedThoughts = new Set();
for (const profile of [fixture(),fixture({checks:0}),fixture({failed:0}),fixture({breaks:0,forced:0})]) {
  for (let path=0;path<6561;path++) {
    let n=path, current=teacher.create(profile);
    for (let step=0;step<8;step++) {
      assert(current.patience === 8-step,'Patience equals remaining answers');
      const beforeStats = {...current.stats};
      const choices=teacher.options(current), choice=n%3; n=Math.floor(n/3);
      assert(choices.length === 3,'Each turn needs three options');
      assert(teacher.answer(current,choices[choice].id,()=>0));
      const snapshot = JSON.stringify(current);
      const inner = teacher.thoughts(current);
      assert(inner.length === 1,'Exactly one dominant thought');
      assert(new Set(inner.map(t=>t.id)).size === inner.length,'Distinct thoughts');
      inner.forEach(t=>{assert(t.title && t.text,'Complete thought');observedThoughts.add(t.id);});
      assert(JSON.stringify(inner) === JSON.stringify(teacher.thoughts(current)),'Thoughts stable on rerender');
      assert(JSON.stringify(current) === snapshot,'Thoughts do not mutate the conversation');
      assert(current.patience === 7-step,'Each valid answer uses exactly one patience');
      for (const key of Object.keys(beforeStats)) assert(current.lastChanges[key] === current.stats[key]-beforeStats[key],'Show actual delta, including score clamps');
      for (const value of Object.values(current.stats)) assert(value>=0 && value<=100,'Scores stay bounded');
    }
    assert(current.finished && current.outcome && current.patience === 0,'Every path ends at zero patience');
    assert(current.outcome.chance<=.02,'Chance cap');
    if (current.outcome.kind === 'reconsider') rarePaths++;
    exhaustedPaths++;
  }
}
assert(rarePaths>0,'At least one rare outcome is possible');
let wins=0, eligibleChance=teacher.create(state);
eligibleChance=play(state,best,0.99);
for(let i=0;i<10000;i++) if(play(state,best,(i+.5)/10000).outcome.kind==='reconsider') wins++;
assert(Math.abs(wins/10000 - eligibleChance.outcome.chance)<.00011,'Observed concession frequency matches its probability');
// Reach the conversation from a genuine completed simulation profile.
const real=game.createState();real.started=true;
while(!real.finished) {
  if(real.pendingEvent) assert(game.resolveEvent(real,0));
  else {const action=game.adviceFor(real);assert(game.perform(real,real.stats.energy<30?{index:action.index,type:'wait'}:action,()=>.8,()=>.99));}
}
assert(play(real).finished,'A real completed game must support the full conversation');
console.log(JSON.stringify({exhaustedPaths,rarePaths,eligibleChance:eligibleChance.outcome.chance,rareWinsIn10000:wins,realGameFailed:teacher.profileFrom(real).failed}));

const neutral = {credibility:50,understanding:50,doubt:0,openness:50};
for (const profile of [fixture(),fixture({checks:0}),fixture({failed:0})]) {
  const fresh = teacher.create(profile);
  assert(JSON.stringify(fresh.stats)===JSON.stringify(neutral),'Start neutral regardless of history');
}
const openDiscussion=teacher.create(fixture());
teacher.answer(openDiscussion,'discuss');
assert(JSON.stringify(openDiscussion.stats)===JSON.stringify({credibility:56,understanding:50,doubt:0,openness:56}),'Open discussion must have small credibility/openness effects only');
const blameOpening=teacher.create(fixture());
teacher.answer(blameOpening,'blame');
assert(blameOpening.stats.credibility<50 && blameOpening.stats.understanding<50 && blameOpening.stats.doubt>0 && blameOpening.stats.openness<50,'Blaming must lower understanding and openness and increase doubt');
const checklistOpening=teacher.create(fixture());
teacher.answer(checklistOpening,'explain');
assert(checklistOpening.stats.doubt>blameOpening.stats.doubt && checklistOpening.stats.openness<blameOpening.stats.openness,'Checklist assumption has stronger doubt/openness effect');
console.log('PASS: neutral 50/50/0/50, eight turns, user-specified opening effects.');

const startingThoughts = teacher.thoughts(teacher.create(fixture()));
assert(startingThoughts.length===1 && startingThoughts[0].id==='neutral','Neutral initial teacher');
assert(teacher.thoughts(openDiscussion)[0].id==='open-start','Open discussion is recognized');
assert(teacher.thoughts(blameOpening)[0].id==='shifting','Blame produces responsibility concern');
assert(teacher.thoughts(checklistOpening)[0].id==='checklist','Checklist assumption is recognized');
const conflicting=teacher.create(fixture());
teacher.answer(conflicting,'discuss');teacher.answer(conflicting,'claimchecks');
assert(teacher.thoughts(conflicting)[0].id==='inconsistent','Unsupported claims dominate');
const sympathetic=teacher.create(fixture());sympathetic.step=3;sympathetic.answers=['discuss','honest','resttruth'];
sympathetic.stats={credibility:55,understanding:80,doubt:10,openness:35};
assert(teacher.thoughts(sympathetic).some(t=>t.id==='sympathy-boundary'),'High understanding and low openness generate sympathy without concession');
assert(observedThoughts.size>=20,'Many distinct thought patterns across reply paths');
console.log(JSON.stringify({thoughtPatternsObserved:observedThoughts.size,thoughtIds:[...observedThoughts].sort()}));

const amplified=teacher.create(fixture());
teacher.answer(amplified,'discuss');
assert(amplified.lastChanges.credibility===6 && amplified.lastChanges.openness===6,'Three-point positive shifts now have six-point impact');
const lowerCredibility=teacher.create(fixture());
teacher.answer(lowerCredibility,'blame');
assert(lowerCredibility.lastChanges.credibility===-6 && lowerCredibility.lastChanges.understanding===-8 && lowerCredibility.lastChanges.doubt===5 && lowerCredibility.lastChanges.openness===-8,'Amplify three impression values but retain doubt balance');
console.log('PASS: stronger impression movement; doubt probabilities and internal eight-turn budget retained.');
