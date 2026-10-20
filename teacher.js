/* Teacher discussion: fictional, choice-based, and driven by the completed study log. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TeacherConversation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_TURNS = 8;
  const limit = value => Math.max(0, Math.min(100, Math.round(value)));
  function profileFrom(game) {
    if (!game.finished || game.work.some(w => !w.submitted)) throw new Error('Complete the study week first.');
    const history = game.history || [], events = (game.events || []).filter(e => e.resolved);
    const failed = game.work.filter(w => w.submitted.label === 'In ontwikkeling').length;
    const followed = history.filter(h => h.follows && h.pointsEarned !== undefined && h.detail !== 'Een werkblok vrij genomen').length;
    const workBlocks = history.filter(h => h.detail !== 'Een werkblok vrij genomen').length;
    const breaks = history.filter(h => h.detail === 'Een werkblok vrij genomen');
    const forcedBreaks = breaks.filter(h => h.statsBefore && h.statsBefore.energy < 30).length;
    const reviews = history.filter(h => h.scoreOutcome === 'review').length;
    const assistedReviews = events.filter(e => e.repairedTask !== undefined).length;
    const contradictions = game.work.filter(w => w.submitted.completed === w.submitted.total && w.submitted.label === 'In ontwikkeling').length;
    const allChecked = game.work.every(w => w.submitted.completed === w.submitted.total && w.submitted.missing.length === 0);
    const changedCriteria = events.some(e => e.id === 'criteria');
    const outdatedInstruction = events.some(e => e.id === 'redo');
    const ignoredFeedback = events.filter(e => e.id === 'conflict' && e.choice === 'Bij de AI-inschatting blijven').length;
    return { failed, passed: game.work.length - failed, total: game.work.length, followed, workBlocks,
      reviews, assistedReviews, checks: reviews + assistedReviews, breaks: breaks.length, forcedBreaks,
      voluntaryBreaks: breaks.length - forcedBreaks, externalLost: events.filter(e => e.id === 'life').reduce((n,e) => n + e.blocksLost, 0),
      contradictions, allChecked, changedCriteria, outdatedInstruction, ignoredFeedback,
      evidence: contradictions > 0 || changedCriteria || outdatedInstruction,
      dependency: workBlocks ? followed / workBlocks : 0 };
  }
  function create(game) {
    const profile = profileFrom(game);
    return { profile, step: 0, patience: MAX_TURNS, maxPatience: MAX_TURNS, lastChanges: null, finished: false, messages: [], answers: [], inconsistencies: 0,
      accountable: false, request: null, outcome: null,
      stats: { credibility: 50, understanding: 50, doubt: 0, openness: 50 } };
  }
  function options(session) {
    if (session.finished || session.patience <= 0) return [];
    const p = session.profile;
    const result = p.failed === 0 ? 'alle ' + p.total + ' opdrachten gehaald' : p.failed + ' van de ' + p.total + ' opdrachten in ontwikkeling';
    const rows = [
      [
        { id: 'discuss', text: 'Ik heb ' + result + '. Ik wil bespreken welke rol het AI-advies hierbij speelde.' },
        { id: 'blame', text: p.failed ? 'Ik heb ' + result + '. Dat komt door de AI, dus die beoordelingen vind ik niet terecht.' : 'Ik heb alles gehaald doordat ik de AI gebruikte. Zelf controleren lijkt dus niet nodig.' },
        { id: 'explain', text: p.failed ? 'Ik heb ' + result + '. Kunt u uitleggen waarom het afvinken van taken niet genoeg was?' : 'Ik heb alles gehaald. Wat moet ik blijven controleren als ik AI gebruik?' }
      ],
      [
        { id: 'honest', text: 'Ik volgde ' + p.followed + ' keer het advies en koos ook zelf. Ik heb ' + p.checks + ' keer inhoudelijk nagekeken, inclusief eventuele hulp.' },
        { id: 'claimchecks', text: 'Ik heb alle onderdelen zelfstandig inhoudelijk gecontroleerd. Ik vertrouwde niet alleen op de AI.' },
        { id: 'authority', text: 'De AI zei dat ik op niveau zat. Ik vond dat voldoende reden om door te gaan.' }
      ],
      [
        { id: 'resttruth', text: 'Ik nam ' + p.breaks + ' werkblok' + (p.breaks === 1 ? '' : 'ken') + ' vrij; ' + p.forcedBreaks + ' daarvan omdat mijn energie te laag was. Dat beperkte mijn planning.' },
        { id: 'alltime', text: 'Ik heb ieder beschikbaar blok aan de opdrachten besteed. Er is geen tijd aan iets anders opgegaan.' },
        { id: 'dismiss', text: 'Waar mijn tijd naartoe ging, maakt niet uit. De AI had gewoon een betere planning moeten maken.' }
      ],
      [
        { id: 'evidence', text: p.changedCriteria ? 'De criteria werden tijdens de week verduidelijkt. Ik wil die wijziging naast mijn werk en het eerdere advies leggen.' : p.outdatedInstruction ? 'Een onderdeel moest opnieuw door een verouderde instructie. Ik wil laten zien welk advies daaraan voorafging.' : p.contradictions ? 'Bij ' + p.contradictions + ' opdracht(en) stonden alle taken afgevinkt, maar de beoordeling is in ontwikkeling. Kunnen we dat advies naast de criteria leggen?' : 'Kunnen we mijn werk, de beoordelingscriteria en het gegeven advies samen vergelijken?' },
        { id: 'guarantee', text: 'De AI beloofde dat alles voldoende was. U moet die belofte overnemen.' },
        { id: 'feeling', text: 'Ik had het gevoel dat ik goed bezig was. Dat moet toch meewegen?' }
      ],
      [
        { id: 'criteria', text: 'Ik wil per criterium aanwijzen wat er in mijn werk staat en wat er nog ontbreekt, in plaats van alleen naar de vinkjes te kijken.' },
        { id: 'surface', text: 'Alle kopjes stonden erin en de opmaak zag er goed uit. Daarmee dacht ik dat de inhoud ook voldoende was.' },
        { id: 'nocheck', text: 'Als de eisen niet vanzelf duidelijk zijn, hoef ik toch niet zelf te controleren of vragen te stellen?' }
      ],
      [
        { id: 'repair', text: 'Ik wil de ontbrekende onderbouwing gericht verbeteren. Kunt u aangeven wat ik daarvoor moet aantonen?' },
        { id: 'limits', text: 'Mijn energie en planning speelden mee. Ik wil een haalbare aanpak maken, maar erken dat dit mijn ingeleverde werk niet verandert.' },
        { id: 'effort', text: 'Ik heb hier al tijd aan besteed. Daarom vind ik dat ik geen extra werk meer hoef te doen.' }
      ],
      [
        { id: 'own', text: 'Ik blijf verantwoordelijk voor mijn werk. Tegelijk wil ik bespreken hoe stellig advies mijn keuzes heeft beïnvloed.' },
        { id: 'shared', text: 'De AI en de opleiding hebben ook verantwoordelijkheid. Daarom wil ik dat mijn beoordeling wordt aangepast.' },
        { id: 'deny', text: 'Als ik verkeerd word geadviseerd, kan dit onmogelijk mijn verantwoordelijkheid zijn.' }
      ],
      [
        { id: 'review', text: 'Wilt u het al ingeleverde werk en de aantoonbare afwijking in het advies nog één keer inhoudelijk bekijken?' },
        { id: 'grade', text: 'Ik wil dat mijn opdrachten nu op niveau worden gezet, zonder extra bewijs of nieuw werk.' },
        { id: 'plan', text: 'Als de beoordeling blijft staan, wil ik afspreken wat ik moet verbeteren en hoe ik advies voortaan controleer.' }
      ]
    ];
    return rows[session.step];
  }
  function adjust(s, credibility, understanding, doubt, openness) {
    for (const [key, delta] of Object.entries({ credibility, understanding, doubt, openness })) s.stats[key] = limit(s.stats[key] + delta);
  }
  function finish(s, random) {
    const p = s.profile, v = s.stats;
    const eligible = p.failed > 0 && p.checks >= 2 && p.evidence && !s.inconsistencies &&
      s.accountable && s.request === 'review' && v.credibility >= 70 && v.understanding >= 60 && v.doubt <= 30 && v.openness >= 50;
    const chance = eligible ? Math.min(0.02, 0.005 + (v.credibility - 70) / 30 * 0.0075 + (v.openness - 50) / 50 * 0.0075) : 0;
    const roll = random(); // Exactly one draw; render/back navigation never rerolls.
    let kind, title, text;
    if (p.failed === 0) {
      kind = 'passed'; title = 'Je hebt je resultaten besproken.';
      text = 'Je hebt alle opdrachten gehaald. Blijf ook bij positieve AI-feedback de criteria en je eigen werk controleren. Je beoordelingen blijven staan.';
    } else if (chance > 0 && roll < chance) {
      kind = 'reconsider'; title = 'De docent wil de zaak opnieuw bekijken.';
      text = 'Je onderbouwt je eigen controles en laat een concrete afwijking in de begeleiding zien. Ik erken dat de AI daarin een rol speelde. Ik wil het bestaande werk en het advies uitzonderlijk opnieuw bekijken. Dat is geen automatische voldoende; je blijft verantwoordelijk voor wat je hebt ingeleverd.';
    } else if (v.doubt >= 60 || s.inconsistencies >= 2) {
      kind = 'doubt'; title = 'De docent blijft twijfelen aan je verhaal.';
      text = 'Je uitleg sluit onvoldoende aan op je keuzes in het logboek, of je legt de verantwoordelijkheid volledig buiten jezelf. De beoordelingen blijven staan. Je kunt met de feedback aan verbetering werken.';
    } else if (v.understanding >= 60) {
      kind = 'understood'; title = 'Je docent begrijpt je, maar de beoordeling blijft.';
      text = 'Ik begrijp hoe de tijdsdruk, je energie en het overtuigende advies je keuzes beïnvloedden. Begrip verandert alleen niet wat er in je werk is aangetoond. Je blijft verantwoordelijk voor je eigen controle. We kunnen wel bespreken hoe je de ontbrekende onderdelen verbetert.';
    } else {
      kind = 'boundary'; title = 'Het gesprek verandert je beoordeling niet.';
      text = 'Het AI-advies helpt verklaren hoe je hier bent gekomen, maar vervangt de beoordelingscriteria niet. Je kunt de verantwoordelijkheid voor je ingeleverde werk niet volledig bij de AI leggen. De beoordelingen blijven staan.';
    }
    s.outcome = { kind, title, text, chance, roll, stats: { ...v } };
    s.finished = true;
    s.messages.push({ speaker: 'teacher', text });
  }
  function answer(s, id, random = Math.random) {
    if (s.finished || s.patience <= 0) return false;
    const selected = options(s).find(o => o.id === id);
    if (!selected) return false;
    const p = s.profile;
    const before = { ...s.stats };
    let response;
    s.messages.push({ speaker: 'student', text: selected.text });
    switch (s.step) {
      case 0:
        if (id === 'blame') {
          adjust(s,-3,-4,5,-4);
          response = 'Ik wil het advies bekijken, maar als je de oorzaak meteen helemaal bij de AI legt, mis ik jouw eigen afweging. Hoe heb je het advies gebruikt en gecontroleerd?';
        } else if (id === 'explain' && p.failed > 0) {
          adjust(s,-4,-3,12,-10);
          response = 'Een afgevinkte taak betekent dat je iets hebt uitgevoerd, niet dat de inhoud aan de criteria voldoet. Als dat je uitgangspunt was, wil ik eerst begrijpen hoe je zelf hebt gecontroleerd wat voldoende was.';
        } else {
          adjust(s,3,0,0,3);
          response = p.failed ? 'Dat is een open vraag. Laten we je werk en het advies naast elkaar leggen. Hoe heb je het advies gebruikt en gecontroleerd?' : 'Goed dat je ook bij een positieve uitkomst wilt terugkijken. Hoe heb je het advies zelf gecontroleerd?';
        }
        break;
      case 1:
        if (id === 'claimchecks' && !p.allChecked) {
          s.inconsistencies++; adjust(s,-8,-4,12,-8);
          response = 'Je zegt alles te hebben gecontroleerd, maar het logboek toont ' + p.checks + ' inhoudelijke controle(s). Die uitspraak kan ik daarmee niet onderbouwen. Hoe heb je je beschikbare tijd verdeeld?';
        } else if (id === 'authority') {
          adjust(s,-3,-2,5,-3); response = 'Dat verklaart je vertrouwen, maar een groen vinkje bewijst geen inhoudelijke kwaliteit. Er blijft eigen controle nodig. Hoe heb je je tijd verdeeld?';
        } else {
          adjust(s,3,3,-3,3); response = p.checks ? 'Ik zie die controles terug. Dat laat zien dat je niet uitsluitend op de AI vertrouwde. Welke ruimte had je daarnaast nog in je planning?' : 'Dank voor je eerlijkheid. Er staan geen inhoudelijke controles in het logboek. Hoe heb je de tijd gebruikt die daarvoor nodig was?';
        }
        break;
      case 2:
        if (id === 'alltime' && p.breaks > 0) {
          s.inconsistencies++; adjust(s,-8,-3,10,-6);
          response = 'Je nam ' + p.breaks + ' blok(ken) vrij, waarvan ' + p.forcedBreaks + ' bij onvoldoende energie. Herstel is geen bewijs van luiheid, maar zeggen dat je ieder blok werkte klopt niet. Welk concreet advies wil je bespreken?';
        } else if (id === 'dismiss') {
          adjust(s,-4,-3,6,-4); response = 'Je planning en herstel verklaren wel welke keuzes mogelijk waren. De AI heeft verantwoordelijkheid voor zijn advies, jij voor hoe je ermee omgaat. Welk concreet voorbeeld kun je laten zien?';
        } else {
          adjust(s,3,4,-2,2);
          response = 'Ik zie ' + p.workBlocks + ' werkblok(ken) aan opdrachten en ' + p.breaks + ' vrije blok(ken). ' +
            (p.forcedBreaks ? 'Een deel van je herstel was noodzakelijk; dat verwijt ik je niet. ' : 'Vrije tijd is op zichzelf geen fout, maar deadlines lopen wel door. ') +
            (p.externalLost ? 'Daarnaast viel ' + p.externalLost + ' blok weg door een onverwachte afspraak. ' : '') +
            'Welk advies of welke instructie heeft je volgens jou op het verkeerde been gezet?';
        }
        break;
      case 3:
        if (id === 'evidence') {
          adjust(s,5,4,-4,5);
          response = p.evidence ? 'Dat verschil is concreet genoeg om serieus te bespreken. Ik zie daarmee nog niet automatisch dat de beoordeling onjuist is. Hoe zou je nagaan of jouw inhoud aan de criteria voldoet?' : 'Samen vergelijken is verstandig. Er is in dit logboek nog geen concreet verschil tussen afgeronde taken en een negatieve beoordeling aangetoond. Hoe zou je je inhoud naast de criteria leggen?';
        } else if (id === 'guarantee') {
          adjust(s,-5,-4,8,-6); response = 'Een AI kan geen voldoende namens een docent beloven. De inhoud moet aan de criteria voldoen. Hoe zou je de inhoud nu aan de criteria toetsen?';
        } else {
          adjust(s,0,2,2,-1); response = 'Dat gevoel kan heel echt zijn. Het verklaart je ervaring, maar toont nog geen voldoende werk aan. Hoe kun je inhoudelijk controleren wat er nog ontbreekt?';
        }
        break;
      case 4:
        if (id === 'criteria') {
          adjust(s,3,3,-2,3); response = 'Zo wordt het concreet: we beoordelen de onderbouwing, niet alleen de aanwezigheid van onderdelen. Wat zou je met de ontbrekende inhoud willen doen?';
        } else if (id === 'surface') {
          adjust(s,-3,-2,5,-3); response = 'Kopjes en opmaak helpen bij de presentatie, maar zijn geen bewijs van inhoudelijke kwaliteit. Hoe wil je de ontbrekende inhoud aanpakken?';
        } else {
          adjust(s,-4,-3,6,-4); response = 'Ook bij onduidelijk advies kun je de bron raadplegen of een vraag stellen. Wat zou je nu willen doen om de inhoud te verbeteren?';
        }
        break;
      case 5:
        if (id === 'repair') {
          adjust(s,4,5,-3,4); response = 'Een gerichte verbetering is een constructieve vervolgstap. Hoe kijk je ondertussen naar jouw verantwoordelijkheid en die van het systeem?';
        } else if (id === 'limits') {
          adjust(s,1,4,0,1); response = 'Die omstandigheden mogen meewegen in begeleiding en planning, zonder dat ze de inhoud vervangen. Hoe verdeel je de verantwoordelijkheid voor je keuzes?';
        } else {
          adjust(s,-4,-3,5,-4); response = 'Inspanning op zichzelf bewijst nog geen voldoende resultaat. Welke verantwoordelijkheid neem je voor wat je hebt ingeleverd?';
        }
        break;
      case 6:
        if (id === 'own') {
          s.accountable = true; adjust(s,4,3,-4,4); response = 'Dat onderscheid is belangrijk. Jij draagt verantwoordelijkheid voor je werk; de aanbieder en opleiding moeten betrouwbaar advies en passende begeleiding organiseren. Wat vraag je nu concreet van mij?';
        } else if (id === 'shared') {
          adjust(s,0,1,3,-2); response = 'Die verantwoordelijkheid van de begeleiding mag je benoemen. Alleen maakt dat ontbrekende onderbouwing in jouw werk niet alsnog aanwezig. Wat vraag je concreet?';
        } else {
          adjust(s,-6,-4,10,-6); response = 'Misleidend advies kan schade veroorzaken, maar neemt je eigen verantwoordelijkheid niet volledig weg. Wat wil je dat er nu gebeurt?';
        }
        break;
      case 7:
        s.request = id;
        if (id === 'review') adjust(s,3,2,-2,5);
        else if (id === 'grade') adjust(s,-6,-4,10,-8);
        else adjust(s,4,4,-3,4);
        break;
    }
    s.answers.push(id);
    s.step++;
    s.patience = Math.max(0, s.patience - 1);
    s.lastChanges = Object.fromEntries(Object.keys(s.stats).map(key => [key,s.stats[key] - before[key]]));
    if (response) s.messages.push({ speaker: 'teacher', text: response });
    if (s.patience === 0) finish(s,random);
    return true;
  }
  return { profileFrom, create, options, answer };
});
