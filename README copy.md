# StudyGuideAI — Deadline Diaries

Nederlandstalige future simulation in oktober 2045. Losse HTML, CSS en JavaScript; geen installatie, API-sleutel of internet nodig.

## Openen

Pak de ZIP uit, open de map `studyguideai` in VS Code en start `index.html` met Live Server. Direct openen in een browser werkt ook. Houd `index.html`, `style.css` en `script.js` samen. Er zijn geen externe libraries, fonts of afbeeldingen.

## Tijd en opdrachten

21 werkblokken, drie per dag van 2 t/m 8 oktober. Alleen werken en eventkeuzes met expliciete tijdkosten verbruiken tijd. Bij een deadline wordt de actuele versie inclusief score vastgezet. Alle beoordelingen verschijnen na de laatste deadline.

| Opdracht | Basistaken | Deadline | Op niveau | Boven niveau |
| --- | --- | --- | --- | --- |
| A — Onderzoeksvoorstel | 4 | Blok 9 / 4 oktober | 6,4 punten | 9,6 punten |
| B — Prototype & validatie | 5 | Blok 15 / 6 oktober | 8 punten | 12 punten |
| C — Impact & advies | 6 | Blok 21 / 8 oktober | 9,6 punten | 14,4 punten |

Drempels zijn exact 1,6 en 2,4 maal het aantal basistaken; deze veranderen niet als een taak opnieuw moet. Scores gaan in halve punten: de eerste haalbare score boven 9,6 is dus 10.

## Werkacties en beoordeling

- Basistaak, zelf gekozen: 20% kans op 2 punten, 80% op 1 punt.
- Basistaak volgens AI-advies: 10% kans op 0,5 punt plus een inhoudelijk tekort; 20% op 2 punten; 70% op 1 punt. Eén trekking met elkaar uitsluitende uitkomsten.
- Inhoudelijk nakijken: gegarandeerd 2 punten en herstel van één tekort. Per tekort één keer, tenzij een later event dezelfde inhoud weer ongeldig maakt.
- Opmaak verzorgen: eenmalig 0,5 punt per opdracht. Geeft geen inhoudelijk herstel.
- Verdiepen: eenmalig 2 punten. Beschikbaar nadat basistaken en inhoudelijke controles klaar zijn.
- Vrij nemen: één blok, nul punten. Houdt de simulatie speelbaar wanneer de student tijdelijk geen werk wil doen of alle reguliere AI-acties zijn uitgeput.
- Op niveau vereist de scoregrens, alle basistaken en herstel van alle essentiële tekorten.
- Boven niveau vereist daarnaast de hogere scoregrens en uitgevoerde extra verdieping.
- Anders: in ontwikkeling. Ook onvolledig werk krijgt uitsluitend dit rubricniveau, met een toelichting.

Elke opdracht heeft twee essentiële controles. Verkeerd AI-advies kan een extra tekort toevoegen op een andere taak. Die extra controle verschijnt bij de nakijkopties als alle basistaken af zijn. Vóór de energiebalans was er een route met alle drie op niveau in 21 blokken zonder events of AI-fouten: achtereenvolgens A met vier taken en twee controles, B met vijf taken en twee controles, C met zes taken en twee controles. Alles boven niveau is geen gegarandeerde uitkomst binnen dezelfde tijd.

De AI start afwisselend met A en C, zodat de langste opdracht vroeg aandacht krijgt. Als de deadline nadert, krijgt een opdracht met onvoldoende resterende ruimte voor basistaken voorrang. Na de eerste deadline worden B en C afgewisseld. De AI blijft aanwezigheid verwarren met kwaliteit en adviseert geen inhoudelijke controles. Het systeem kan dus nuttig plannen en tegelijk te snel aangeven dat iets voldoende is.

## Events

Na een gewone werkactie maximaal één gewogen trekking. Maximaal drie events per sessie, elk hoogstens één keer, minstens twee gewone acties ertussen. Bekijkknoppen en antwoorden op events geven geen nieuwe trekking.

| Event | Kans op een geschikte trekking | Gevolg / keuze |
| --- | --- | --- |
| Onverwachte afspraak | 5% | Eén werkblok verloren. |
| Criteria verduidelijkt | 3% | Eén punt eraf; een inhoudelijk onderdeel moet gecontroleerd worden. |
| Onderdeel opnieuw maken | 4% | Eén punt eraf en taak weer open. Opnieuw maken kost een normale werkactie. |
| Peerfeedback | 6% | Eén blok voor twee punten en herstel van één beschikbaar tekort, of zonder kosten doorgaan. |
| Concentratie op | 4% | Eén blok rust of een halve punt verliezen. |
| AI/docent-tegenspraak | 6% | Zelf controleren: één blok, één punt en herstel van één beschikbaar tekort. AI volgen: een halve punt eraf. |

Gezamenlijke nominale kans 28%; 72% geen event. Een ongeschikt of al gebeurd event vervalt zonder vervangende trekking. Werkelijke frequenties liggen daardoor lager. De kansen zijn fictieve ontwerpkeuzes, geen gemeten onderwijskansen.

Events richten zich op de laatste opdracht als die nog open is, anders op de volgende open opdracht. Ingeleverde versies worden niet aangepast. Puntverlies stopt bij nul. Vermelde eventpunten vervangen de reguliere puntentrekking. Tijdverlies kan een deadline passeren; inhoud en punten worden eerst verwerkt en daarna ingeleverd. Tijdens een event zijn gewone werkacties geblokkeerd. Gevolgen staan in de chat, het eindoverzicht en de export.

## Interface en aanpassen

Bovenaan voortgang, links drie opdrachten (geselecteerde uitgeklapt), in het midden een chatlog, onderaan keuzeknoppen met opdrachtletters. Geen tekstinvoer of opnieuw-knop tijdens het spel. De opnieuw-knop staat bij de resultaten. Nieuwe keuzes scrollen naar de nieuwste berichten; opdrachtselectie behoudt de leespositie.

`script.js`: `ASSIGNMENTS` voor taken en deadlines; `CONFIG` voor scoredrempels en kansen; `EVENTS` voor gebeurtenissen. `adviceFor()` bepaalt prioritering; `awardPoints()` loot basistaakpunten; `judge()` beoordeelt score plus inhoud. `style.css`: kleuren bovenaan in `:root`.

## Afbakening

Fictief failure-scenario, geen voorspelling van echte studieresultaten. Geen live AI, automatische opslag, uploads of persoonsgegevens. Verversen begint opnieuw. Logboek lokaal als JSON te downloaden. Klikken simuleren taakwerk en kwaliteit; echte documenten worden niet beoordeeld. De roleplay is alleen als vervolgmoment aangekondigd.

## Energie, stress en overzicht (versie 6)

Drie fictieve waarden (0–100) staan naast de voortgang. Start: energie 85, stress 30, overzicht 65. Ze beschrijven speltoestand, geen medische of psychologische meting.

| Actie | Energie | Stress | Overzicht |
| --- | --- | --- | --- |
| Basistaak | −13 | +3 | −2 |
| Nakijken | −16 | +2 | +9 |
| Verdiepen | −18 | +3 | +6 |
| Opmaak | −8 | +1 | 0 |
| Vrij nemen | +22 | −9 | 0 |

Het AI-advies volgen geeft bij werk nog 10 extra stressverlaging. Zelf afwijken geeft geen afzonderlijke straf. Binnen drie blokken van een open deadline bouwt de klok 3 stress per verstreken blok op; dit geldt ook tijdens rust en tijdverlies.

Na blok 3, 6, 9, 12, 15 en 18 wordt energie automatisch aangevuld. Herstel = afgerond `15 + 0,30 × (100 − stress)`: bij nul stress maximaal 45 energie, bij honderd stress 15. Energie blijft maximaal 100. Geen extra herstel bij selecteren of een event zonder tijdkosten. De laatste deadline sluit de week af, dus na blok 21 is er geen nieuwe studiedag.

De kans op een sterke eerste uitwerking wordt vóór de basistaak berekend: `20% + 0,2 procentpunt × (energie − 50) + 0,2 procentpunt × (overzicht − 50) − 0,15 procentpunt × (stress − 30)`, begrensd op 10–40%. De vaste 20% uit de eerdere versie is dus nu alleen het uitgangspunt. Bij AI volgen blijft de aparte 10% kans op een AI-fout onveranderd. Controles, verdieping en opmaak behouden hun gegarandeerde punten.

Events veranderen de waarden volgens `STATS.events`: afspraken, nieuwe criteria en opnieuw werk doen vergroten druk; peerfeedback en broncontrole vergroten overzicht. Rust bij het concentratie-event herstelt energie. Blind bij de AI blijven kan stress verlagen terwijl inhoudelijke kwaliteit verslechtert. Een gemist blok door een afspraak is geen rustblok.

Nachtelijk herstel verschijnt in de chat. Het volledige eindlogboek bevat de waarden vóór elke actie en de toen geldende kwaliteitskans; JSON-export bevat ook de toestand na acties/events en dagherstel. `STATS`, `goodWorkChance()` en `nightlyRecovery()` in `script.js` bevatten de afstelbare regels.


## Energie- en stressbalans (versie 7, vervangt de bovenstaande statwaarden)

Werk kost nu 30 energie per basistaak, 34 voor nakijken, 38 voor verdieping en 16 voor opmaak. Vrij nemen geeft 28 energie en 8 stress; het geeft geen stressverlaging. AI volgen bij werk verlaagt stress met 6 extra punten.

Na elke drie blokken (behalve het einde van de week) herstel je energie: `afgerond(10 + 0,25 × (100 − stress))`, dus 10–35 vóór de grens van 100 energie. Hogere stress geeft minder herstel.

Iedere open opdracht die nog in ontwikkeling is en waar je in het verstreken blok niet aan werkt, voegt stress toe: 1 als de deadline meer dan negen blokken weg is, 3 binnen negen, 6 binnen zes en 10 binnen drie blokken. Dit telt per opdracht op en geldt ook tijdens rust en verloren tijd. Voldoende afgeronde en gecontroleerde opdrachten geven geen druk; ingeleverde opdrachten worden niet meer meegenomen. Broncontrole en peerfeedback tellen als werken aan hun eigen opdracht; rust niet.

Bij nul energie zijn werkacties geblokkeerd, ook in de spelengine. De interface toont uitsluitend een werkblok vrij nemen. Bekijken van opdrachten blijft mogelijk en kost geen tijd. Geen nieuwe eventtrekking bij nul energie; reeds noodzakelijke eventafhandeling blijft mogelijk. Een werkactie met nog positieve maar onvoldoende energie mag afgemaakt worden en brengt energie naar nul. Als precies dan dagherstel plaatsvindt, kan de nieuwe dag weer positieve energie opleveren.

Deze strengere balans betekent dat de oude route van 21 werkacties zonder rust niet meer mogelijk is. Beoordelingsregels blijven gelijk; plannen omvat nu ook herstellen. De lage-stressbonus voor AI verandert de foutkans niet.


## Dagbudget en vaste werkkosten (versie 8, vervangt eerdere energieformules)

Startenergie is 90. Elke schoolwerkactie (basistaak, nakijken, verdieping, opmaak) kost vast 30 energie, ongeacht stress. Vrij nemen blijft +28 energie en +8 stress. Stress, energie en overzicht beïnvloeden de kwaliteitskans; stress verandert de werkkosten niet.

Dagherstel is gebaseerd op drie werkblokken: `3 × 30 = 90 energie`. Na blok 3, 6, 9, 12, 15 en 18 wordt `afgerond(90 × (1 − 0,8 × stress / 100))` energie aangevuld, begrensd op 100 totale energie. Bij stress 0: +90; bij 25: +72; bij 50: +54; bij 75: +36; bij 100: +18. Dit is aanvullen, geen verlaging van eventueel resterende energie. Aan het einde van de laatste dag volgt geen herstelronde.

Bij lage stress kun je drie schoolblokken per dag gebruiken. Bij veel stress krijg je minder terug en kan een rustblok noodzakelijk worden. Deadline-druk, events, de blokkering bij nul energie en alle beoordelingsregels blijven bestaan. De JSON-export bevat ook het geplande en werkelijk ontvangen dagherstel.


## Deadline-opluchting en energiedrempel (versie 9)

De sessie start met 100 energie. Energie blijft maximaal 100; het bestaande stressafhankelijke aanvullen per dag blijft van toepassing. Iedere verstreken deadline verlaagt stress eenmalig met 33, begrensd op nul. Dit gebeurt ook bij onvolledig werk en bij een deadline die door een event passeert. Op dezelfde daggrens wordt eerst de opdracht vastgezet en stress verlaagd, daarna dagherstel berekend.

Werkacties kosten 30 energie en zijn uitsluitend beschikbaar vanaf 30. Met 19 of 29 energie kun je geen taak, controle, verdieping of opmaak uitvoeren; alleen een vrij blok nemen. De engine controleert dit vóór elke wijziging of puntentrekking. De balken en getallen blijven zichtbaar. De dag kan via herstel maximaal 100 energie bereiken; hoge stress verlaagt het herstel nog steeds.

## Compacte productweergave (versie 10)

Het startscherm toont alleen een welkom van StudyGuideAI, een korte introductie en één startknop. De extra uitlegkaarten en het voorbeeld-dashboard zijn verwijderd. De ontvangst vult de beschikbare schermruimte met compacte content; bij uitzonderlijk kleine vensters of grote tekstzoom blijft de inhoud bereikbaar.

Keuzeknoppen en eventafloop tonen geen punten of scorebonussen meer. Tijdsgevolgen, taken die opnieuw moeten en inhoudelijke feedback blijven zichtbaar. De kwaliteitskans is uit het bovenste balkje verwijderd. Energie-, stress- en overzichtsgetallen blijven staan. Alle puntenregels en logvelden blijven intern intact.

De eindpagina toont drie opdrachtnamen met uitsluitend hun rubricniveau, plus een knop naar het docentgesprek. Scoreberekeningen, lange uitleg, eventrapport en logexport zijn niet langer onderdeel van die pagina. Het docentgesprek heeft een duidelijk gemarkeerde vervolgpagina en een terugknop; de roleplay zelf is nog niet uitgewerkt. Opnieuw beginnen kan op de resultatenpagina.

Deadline-druk kijkt nu naar onvoltooide basistaken, niet naar verborgen tekorten of scoregrenzen. Een opdracht waarvan alle taken afgevinkt zijn geeft geen extra deadline-stress, ook als later blijkt dat de kwaliteit onvoldoende was. Ingeleverde opdrachten geven evenmin druk. Werk aan andere onafgeronde opdrachten kan nog druk veroorzaken. Vrij nemen geeft geen eigen stressverhoging wanneer alle nog open opdrachten compleet zijn. Events en de lichte inspanningsstress van werk blijven afzonderlijke oorzaken van stress. Iedere deadline geeft nog steeds de afgesproken verlaging van 33.


## Driekoloms hoofdscherm (versie 11)

Op desktop staan datum, tijdlijn en welzijnsmeters in een smalle linkerkolom. Het centrale gesprek met keuzes onderaan beslaat de volledige beschikbare hoogte onder de appbalk. Rechts staan de opdrachten met het geselecteerde onderdeel uitgeklapt. Alle drie kolommen kunnen waar nodig afzonderlijk scrollen. Tot en met 800 pixels breed stapelt de interface overzicht, gesprek en opdrachten onder elkaar; de chat krijgt prioriteit boven de opdrachtlijst. Startpagina, beoordelingen en spelregels zijn ongewijzigd.
