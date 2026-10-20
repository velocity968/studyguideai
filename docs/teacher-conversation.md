# Docentgesprek

Na de beoordelingen opent een chat met docentwaarden en geduld links; de rechterzijde blijft leeg. De student begint zelf en kiest acht keer uit drie antwoorden. Alle tekst is Nederlands, net als de bestaande simulatie.

## Context uit de studieweek

De docent gebruikt de echte beoordelingen, gevolgde adviezen, inhoudelijke controles, hulp-events, vrije werkblokken en het energieniveau vóór herstel. Verplicht herstel bij minder dan 30 energie wordt onderscheiden van andere vrije blokken. Het gesprek verandert nooit de opgeslagen opdrachten of beoordelingen.

Claims over controles en tijdgebruik worden vergeleken met het logboek. Noodzakelijk herstel wordt niet als luiheid behandeld. Het gesprek benoemt zowel de eigen verantwoordelijkheid voor ingeleverd werk als de verantwoordelijkheid van aanbieder en opleiding voor de begeleiding.

## Docentwaarden en geduld

Vier waarden van 0 tot 100: geloofwaardigheid, begrip, twijfel en bereidheid tot meedenken. Iedere docent start neutraal: geloofwaardigheid 50, begrip 50, twijfel 0 en bereidheid tot meedenken 50. Het spelverloop wordt pas bij de bespreking van antwoorden als context gebruikt. Deze staan tijdens het gesprek in een linkerkolom als waarden van 0 tot 100 met balkjes. Na elk antwoord tonen badges de werkelijke stijging of daling; minder twijfel wordt als gunstig gemarkeerd. De eindpagina behoudt de vier indrukken en toont ook hun eindwaarden.

## Uitkomsten

- Alles gehaald: positieve reflectie, zonder onterechte klacht.
- De docent twijfelt aan het verhaal.
- De docent begrijpt de student, maar de beoordeling blijft staan.
- Het gesprek verandert de beoordeling niet.
- Zeldzame uitzondering: de docent erkent de rol van misleidende begeleiding en zegt toe het bestaande werk en advies opnieuw te bekijken. Dit levert geen automatische voldoende op.

Een uitzondering vereist minstens twee controles, concreet bewijs van tegenstrijdige begeleiding, geen vastgestelde inconsistenties in het gesprek, erkenning van eigen verantwoordelijkheid en een verzoek om inhoudelijke herbeoordeling. Daarnaast: geloofwaardigheid minstens 70, begrip minstens 60, twijfel hoogstens 30 en bereidheid minstens 50.

Alleen dan is de kans 0,5–2%, afhankelijk van de indrukken. Dit is een fictieve spelregel, geen voorspelling van echte docenten. Er is precies één loting na het laatste antwoord. Teruggaan en opnieuw openen bewaart het gesprek en de uitkomst. Een volledige nieuwe studieweek wist het gesprek.

## Bestanden

- `teacher.js`: pure gesprekslogica, zonder netwerk of live AI.
- `script.js`: resultatenkoppeling, chat, afsluiting en navigatie.
- `style.css`: styling beperkt tot docentgesprek en afsluiting.
- `index.html`: laadt teacher.js vóór script.js.
- `tests/teacher.test.cjs`: uitvoeren met `node tests/teacher.test.cjs`.

## Validatie

Alle 6.561 antwoordpaden zijn doorlopen voor vier verschillende geschiedenisprofielen: 26.244 gesprekken. Getest: eerlijke en onjuiste claims, noodzakelijke pauacht, scoregrenzen, alle-opdrachten-gehaald, de zeldzame heroverweging, onveranderde beoordelingen en een echte afgeronde spelroute. Daarnaast is de loting gecontroleerd over 10.000 vaste waarden.

De integratiecontrole omvatte resultaten → acht chatbeurten → vier eindindrukken → terug naar resultaten → heropenen zonder nieuwe loting → nieuwe studieweek. Er was in deze werksessie geen bruikbare uitvoeromgeving; browserweergave en visuele layout zijn nog niet gecontroleerd.


## Antwoordbudget

Geduld begint op acht antwoorden en neemt per geldig antwoord precies één af. Bij nul volgt direct de afsluiting en zijn geen nieuwe antwoorden mogelijk. Ongeldige antwoorden en navigeren kosten geen geduld. Teruggaan naar beoordelingen en heropenen herstellen geen pogingen en wijzigen de uitkomst niet. Een nieuwe studieweek wist het gesprek.

`patience`, `maxPatience` en `lastChanges` staan in de gesprekstoestand. `lastChanges` bevat de daadwerkelijke verschillen na begrenzing van de waarden op 0–100. De linkerkolom volgt de indeling van de studieweek; de rechterzijde blijft leeg. Op smalle schermen staat het paneel boven het gesprek. Er worden geen invloedsscores vooraf op de antwoordknoppen getoond.

De geautomatiseerde controles omvatten ook het aflopen van acht naar nul, daadwerkelijke delta's op alle 26.244 testpaden en de aansluiting van de linkerkolom op het chatverloop. Visuele browsercontrole blijft nodig.


## Afstemming van de gesprekseffecten

Er zijn acht beurten met drie opties: opening, gebruik van AI, tijdverdeling, bewijs, inhoudelijke criteria, verbetering, verantwoordelijkheid en concreet verzoek. Kleine verschuivingen liggen gewoonlijk rond 1–5; grotere negatieve effecten rond 8–12 volgen bijvoorbeeld op onbewezen claims of het afschuiven van verantwoordelijkheid.

De openingskeuze om AI-advies open te bespreken geeft +3 geloofwaardigheid, 0 begrip, 0 twijfel en +3 bereidheid. AI de schuld geven geeft −3, −4, +5 en −4. Bij een negatieve beoordeling vragen waarom alleen afvinken niet voldoende was geeft −4, −3, +12 en −10. Bij een volledig positieve beoordeling blijft een reflectieve vraag over controleren constructief.

Tijdens het gesprek blijven de werkelijke delta's zichtbaar. Het eindscherm toont uitsluitend de eindwaarden en de conclusie: geen plus- of minbadges. De kansvoorwaarden en beoordeling van het oorspronkelijke werk zijn ongewijzigd. Alle 6.561 antwoordpaden voor vier profielen (26.244 gesprekken) zijn gecontroleerd, plus de loting en schermnavigatie.
