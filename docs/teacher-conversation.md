# Docentgesprek

Na de beoordelingen opent een gecentreerde chat zonder zijpanelen. De student begint zelf en kiest zes keer uit drie antwoorden. Alle tekst is Nederlands, net als de bestaande simulatie.

## Context uit de studieweek

De docent gebruikt de echte beoordelingen, gevolgde adviezen, inhoudelijke controles, hulp-events, vrije werkblokken en het energieniveau vóór herstel. Verplicht herstel bij minder dan 30 energie wordt onderscheiden van andere vrije blokken. Het gesprek verandert nooit de opgeslagen opdrachten of beoordelingen.

Claims over controles en tijdgebruik worden vergeleken met het logboek. Noodzakelijk herstel wordt niet als luiheid behandeld. Het gesprek benoemt zowel de eigen verantwoordelijkheid voor ingeleverd werk als de verantwoordelijkheid van aanbieder en opleiding voor de begeleiding.

## Verborgen indrukken

Vier waarden van 0 tot 100: geloofwaardigheid, begrip, twijfel en bereidheid tot meedenken. Beginwaarden volgen uit het spelverloop; antwoorden veranderen de indrukken. Deze zijn tijdens de chat onzichtbaar. Pas aan het einde verschijnen vier korte indicaties (laag, gemiddeld, hoog) en balkjes.

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

Alle 729 antwoordpaden zijn doorlopen voor vier verschillende geschiedenisprofielen: 2.916 gesprekken. Getest: eerlijke en onjuiste claims, noodzakelijke pauzes, scoregrenzen, alle-opdrachten-gehaald, de zeldzame heroverweging, onveranderde beoordelingen en een echte afgeronde spelroute. Daarnaast is de loting gecontroleerd over 10.000 vaste waarden.

De integratiecontrole omvatte resultaten → zes chatbeurten → vier eindindrukken → terug naar resultaten → heropenen zonder nieuwe loting → nieuwe studieweek. Er was in deze werksessie geen bruikbare uitvoeromgeving; browserweergave en visuele layout zijn nog niet gecontroleerd.
