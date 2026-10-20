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
  // Deterministic fictional inner monologue: never changes scores or outcomes.
  function thoughts(session) {
    if (session.step === 0) return [{ id:'neutral', title:'Ik luister.', text:'Ik ben benieuwd hoe je naar je resultaten kijkt. Eerst hoor ik graag wat je wilt bespreken.' }];
    const v = session.stats, p = session.profile, last = session.answers.at(-1);
    const recent = session.answers.slice(-3);
    const shifting = recent.some(id => ['blame','deny','dismiss','nocheck','effort'].includes(id));
    const accepting = session.accountable || ['own','repair','limits'].includes(last);
    const candidates = [];
    const add = (when,id,priority,title,text) => { if(when) candidates.push({id,priority,title,text}); };
    add(session.inconsistencies > 0,'inconsistent',110,'Klopt dit met het logboek?',
      session.inconsistencies > 1 ? 'Meerdere uitspraken komen niet overeen met je keuzes. Ik wil eerst helder krijgen wat er werkelijk is gebeurd.' : 'Je uitleg en het logboek sluiten nog niet op elkaar aan. Ik kan je verhaal niet zonder meer overnemen.');
    add(last === 'deny','denial',108,'Je eigen rol verdwijnt uit beeld.',
      'Je legt de verantwoordelijkheid volledig bij het advies. Ik mis erkenning dat je zelf keuzes hebt gemaakt over je werk.');
    add(v.doubt >= 60,'serious-doubt',103,'Mijn twijfel wordt groter.',
      'Ik weet niet goed welke delen van je verhaal ik kan vertrouwen. Meer druk zetten gaat die twijfel niet oplossen.');
    add(shifting && !accepting,'shifting',96,'Schuif je de verantwoordelijkheid af?',
      'Het klinkt alsof vooral de AI of de omstandigheden verantwoordelijk moeten zijn. Ik wil begrijpen welke rol je jezelf nog geeft.');
    add(last === 'guarantee' || last === 'grade','entitlement',99,'Advies is geen toezegging van een voldoende.',
      'Je vraagt me een uitspraak of verwachting over te nemen. Voor een andere beoordeling heb ik bewijs in het ingeleverde werk nodig.');
    add(last === 'explain' && p.failed > 0,'checklist',94,'Wat dacht je dat een vinkje betekende?',
      'Ik krijg de indruk dat je aanwezigheid en kwaliteit met elkaar verwarde. Ik wil weten of je de inhoudelijke eisen wel zelf hebt bekeken.');
    add(v.openness <= 30,'closed',88,'Ik wil duidelijke grenzen houden.',
      'Door de manier waarop dit gesprek loopt, word ik terughoudender. Ik wil wel uitleg geven, maar geen beoordeling beloven zonder onderbouwing.');
    add(v.understanding >= 60 && v.openness < 50,'sympathy-boundary',91,'Ik voel met je mee, maar zie nog geen grond voor aanpassing.',
      'Ik begrijp je situatie beter. Dat is iets anders dan aantonen dat de beoordeling van je werk niet klopt.');
    add(v.understanding >= v.credibility + 12,'sympathy-doubt',87,'Ik begrijp je gevoel beter dan je onderbouwing.',
      'Je frustratie is voorstelbaar, maar ik mis nog een samenhangende uitleg van wat je zelf hebt gecontroleerd.');
    add(last === 'evidence' && p.evidence,'concrete-evidence',98,'Dit is iets concreets om te bekijken.',
      'Er is een zichtbaar verschil in de begeleiding of tussen afgevinkte taken en de beoordeling. Dat verdient aandacht, zonder dat het werk daarmee automatisch voldoende is.');
    add(last === 'evidence' && !p.evidence,'compare',82,'Laten we eerst het werk vergelijken.',
      'Samen naar de criteria kijken kan helpen. Tot nu toe zie ik nog geen concreet bewijs dat het gegeven oordeel onjuist was.');
    add(last === 'shared','shared',92,'Wie stel je precies verantwoordelijk?',
      'Dat de begeleiding ook verantwoordelijkheid heeft, kan kloppen. Ik twijfel nog of je daarmee ook je eigen verantwoordelijkheid erkent.');
    add(last === 'authority' || last === 'surface','overreliance',93,'Je vertrouwde sterk op het signaal dat het klaar was.',
      'Een AI-inschatting, kopjes of opmaak leken voor jou voldoende bewijs. Ik mis nog hoe je de inhoud aan de criteria toetste.');
    add(last === 'nocheck','initiative',92,'Waarom liet je de controle helemaal liggen?',
      'Ook bij onduidelijke instructies kun je zelf controleren of vragen stellen. Ik hoor nog weinig initiatief om dat te doen.');
    add(last === 'honest' && !p.checks,'honest-unchecked',85,'Je bent eerlijk over wat je niet hebt gecontroleerd.',
      'Die openheid helpt je geloofwaardigheid. Tegelijk blijft het ontbreken van inhoudelijke controle relevant voor je resultaten.');
    add(last === 'resttruth' && p.forcedBreaks > 0,'recovery',89,'Die pauzes waren niet zomaar uitstel.',
      'Je energie maakte herstel noodzakelijk. Ik wil dat niet verwarren met onwil, maar de beschikbare tijd en de inhoud blijven wel van belang.');
    add(last === 'resttruth' && p.forcedBreaks === 0,'time-use',83,'Je maakt je tijdverdeling bespreekbaar.',
      'Vrije tijd is niet verkeerd. Ik wil vooral begrijpen hoe je herstel en deadlines tegen elkaar hebt afgewogen.');
    add(last === 'feeling','experience',84,'Je gevoel en de beoordeling lopen uiteen.',
      'Ik hoor dat je dacht goed bezig te zijn. Dat verklaart je teleurstelling, maar ik moet daarnaast naar het aangetoonde werk kijken.');
    add(last === 'limits','limits',90,'Je benoemt je grenzen zonder je werk te ontkennen.',
      'Dat helpt me je situatie te begrijpen. We kunnen over haalbare begeleiding praten zonder de inhoudelijke eisen los te laten.');
    add(last === 'repair','repair',94,'Je zoekt naar een inhoudelijke oplossing.',
      'Je vraagt wat er ontbreekt en hoe je dat kunt aantonen. Daardoor denk ik liever met je mee over de volgende stap.');
    add(last === 'criteria','criteria',94,'Je maakt onderscheid tussen af en voldoende.',
      'Door per criterium naar je werk te kijken, wordt duidelijker wat je hebt aangetoond en wat nog aandacht nodig heeft.');
    add(accepting && v.credibility >= 65,'ownership',97,'Je ziet je eigen verantwoordelijkheid.',
      'Je erkent je keuzes en wilt tegelijk de rol van het advies onderzoeken. Dat maakt het gesprek constructiever.');
    add(accepting && v.credibility < 65,'ownership-start',86,'Dit klinkt als een stap naar eigen verantwoordelijkheid.',
      'Ik hoor nu meer erkenning van je eigen keuzes. Ik wil nog zien hoe dat aansluit op de rest van je verhaal.');
    add(!session.accountable && session.step >= 4 && !shifting && last !== 'shared','unclear-role',69,'Je eigen aandeel is nog niet helemaal duidelijk.',
      'We hebben het over advies en omstandigheden gehad. Ik wil ook horen hoe je naar jouw beslissingen kijkt.');
    add(v.doubt >= 25 && v.doubt > v.understanding - 30,'uncertain',74,'Ik houd nog vragen bij je uitleg.',
      'Ik twijfel of je verklaring volledig is. Concrete voorbeelden helpen me meer dan alleen zeggen dat de AI het zo aangaf.');
    add(v.openness >= 65 && v.credibility >= 65 && v.doubt <= 15 && session.inconsistencies === 0,'constructive',77,'Er ontstaat ruimte om mee te denken.',
      'Je verhaal is duidelijker en je reageert constructief. Ik wil samen naar vervolgstappen kijken; dat is nog geen toezegging van een andere beoordeling.');
    add(v.understanding >= 60 && v.doubt <= 25,'understood',72,'Ik begrijp beter hoe je hier terechtkwam.',
      'Ik zie hoe advies, tijd en je eigen keuzes samen invloed hadden. Begrip betekent niet automatisch dat ik je beoordeling verander.');
    add(last === 'review' && session.accountable && p.evidence,'review-request',101,'Je vraagt om een onderbouwde heroverweging.',
      'Je wilt bestaand werk en een concrete afwijking laten bekijken. Ik kan dat serieus nemen zonder vooraf een voldoende te beloven.');
    add(last === 'plan','next-step',95,'Je wilt verder met wat je hebt geleerd.',
      'Dat maakt een concreet verbeterplan mogelijk. Ik kan helpen richting te geven, ook als de oorspronkelijke beoordeling blijft staan.');
    add(last === 'discuss' && v.doubt === 0,'open-start',90,'Je begint open, zonder meteen een schuldige aan te wijzen.',
      'Je wilt onderzoeken wat de rol van het advies was. Ik luister verder voordat ik daar een oordeel over vorm.');
    add(v.credibility >= 50 && v.doubt < 25 && session.inconsistencies === 0,'listening',50,'Ik luister naar je afweging.',
      'Ik heb nog geen reden om je verhaal zomaar af te wijzen. Ik wil eerst begrijpen hoe je keuzes tot stand kwamen.');
    add(true,'reserve',1,'Ik laat je uitleg bezinken.',
      'Ik wil nog scherper krijgen wat er gebeurde, wat je zelf deed en wat je nu van mij vraagt.');
    const ranked = candidates.sort((a,b) => b.priority-a.priority);
    const result = ranked.slice(0,3).map(({id,title,text}) => ({id,title,text}));
    return result;
  }
  return { profileFrom, create, options, answer, thoughts };
});
