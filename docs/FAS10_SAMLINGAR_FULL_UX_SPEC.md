# FAS 10: Samlingar – Full UX Specification

**Status:** 🟡 In Progress (spec complete; implementation follows existing copy + this doc)  
**Fas:** Dokumentation endast. Ingen kod ändras i denna fas.

**Context:**  
Samlingar är inte group chat. Samlingar = social depth + gemensam riktning. All design ska följa MÄÄK-filosofin: låg press, relation före aktivitet, ingen social noise.

---

## DEL 1 — Purpose & Philosophy

### Vad en Samling är

- **Gemensam riktning** – människor som vill åt samma håll, inte bara "samma chatt".
- **Ett sammanhang** – namngivet, med syfte (t.ex. Söndagspromenader, Djupa samtal).
- **Plats för att lära känna varandra** – relation först, aktivitet som stöd.
- **Något man delar** – inte en kanal man "hör av sig i" för att hålla sig uppdaterad.

### Vad en Samling inte är

- ❌ En gruppchatt (många meddelanden = värde).
- ❌ En meme-kanal eller aktivitetsfeed.
- ❌ En plats där "antal meddelanden" eller "senast aktiv" styr känslan.
- ❌ Ett rum där notiser ska trigga snabba svar.

### Känsla användaren ska ha

- **Lugn** – det är OK att inte svara direkt; samlingen väntar.
- **Meningsfullhet** – "vi är här för något gemensamt", inte "jag måste kolla notiser".
- **Trygghet** – kontext och relation är tydliga; ingen känsla av att prestera eller hänga med.

---

## DEL 2 — List View (Samlingar på Chat-sidan)

### Kortets innehåll

- **GroupAvatar** – visar medlemmar (överlappande eller samlad representation). Ingen "X medlemmar" som huvudinfo om det känns räknefokuserat.
- **Namn** – samlingens namn (t.ex. "Söndagspromenader 🌿").
- **Under namn:**  
  - Om det finns innehåll: **"Senast delat: [kort citat eller sammanfattning]"** – t.ex. "Senast delat: en tanke om helgen".  
  - Om inget har skrivits: **"Ett gemensamt sammanhang"**.
- **Ingen unread-stress** – ingen röd siffra, ingen "3 nya meddelanden". Eventuell ny aktivitet: diskret (t.ex. liten indikator eller ingen siffra).

### Visuella states

| State | Beskrivning | Copy / beteende |
|-------|-------------|------------------|
| **Ny aktivitet** | Någon har skrivit sedan användaren såg listan | Diskret. Ingen siffra som skriker. T.ex. liten punkt eller ingen badge; listan kan sorteras på "senast aktiv" men utan "5 nya"-känsla. |
| **Inget innehåll** | Samlingen finns men ingen har skrivit | "Ett gemensamt sammanhang". Kortet ska inte kännas tomt eller misslyckat. |
| **Aktiv samling** | Konversation pågår | "Senast delat: …" med relationell ton (inte bara senaste meddelandet rakt av som i Messenger). |

### Vad som ALDRIG får finnas

- ❌ Unread-badges som skriker (stora röda siffror).
- ❌ Online-grid ("X är online nu").
- ❌ Formuleringar där aktivitet = värde (t.ex. "Mest aktiva samlingar", "Populära grupper").

---

## DEL 3 — Header i Samling

### Innehåll

- **Namn** – samlingens namn, tydligt och läsbart.
- **Syfte / kontext-rad** – en kort rad som förklarar *varför* samlingen finns, om det finns utrymme. T.ex. "En plats för er att lära känna varandra tillsammans" eller namnet räcker om det redan bär kontext.
- **Medlemmar** – tillgång till vilka som ingår (members access), utan att det känns som en "deltagarlista" eller online-status. Fokus på *vem ni är*, inte "vem är online".
- **Video-knapp** – synlig för creator/skaparen; inte nödvändigtvis för alla. Tydlig men inte dominant.

### Emotionellt mål

- Skärmen ska **kännas som ett rum** – ett sammanhang ni delar – inte som en **kanal** eller en chatttråd i en app.

### Copy-exempel header

- Titel: *[Samlingens namn]*
- Underrubrik (valfri): *"Ni samlas kring: [namn]"* eller *"Ett gemensamt sammanhang"*

---

## DEL 4 — Tomt rum (tre nivåer)

### 1. Ingen har skrivit än

**Mål:** Inbjudan utan press. Börja när det känns rätt.

**Systemcopy:**

- Rad 1: *"Ingen har sagt något än."*
- Rad 2: *"Börja när det känns rätt."*
- Systemmeddelande / ton: *"Här börjar något gemensamt."*

**Mascot:** Idle / mjukt leende. Närvaro, inte "kom igen nu". Ingen animation som stressar.

**CTA:** Input-placeholder t.ex. *"Skriv första meddelandet"* – inbjudande, inte krav.

---

### 2. Någon har lämnat samlingen

**Mål:** Tydligt utan dramatik. Sammanhanget består.

**Systemcopy (exempel):**

- *"[Namn] har lämnat sammanhanget."*

**Vad vi undviker:**  
- ❌ "X left the group" (känns tekniskt).  
- ❌ Emojis som 🎉 eller dramatisk ton.

**Mascot:** Lugn. Eventuellt ingen mascot här; kort systemrad räcker.

---

### 3. Ny medlem har gått med

**Mål:** Välkommen in i *sammanhanget*, inte "en till i gruppen".

**Systemcopy (exempel):**

- *"[Namn] är med i samlingen nu."*  
eller  
- *"[Namn] delar nu sammanhanget med er."*

**Vad vi undviker:**  
- ❌ "X joined the group" (kanal-känsla).  
- ❌ Välkomstparty-emojis eller "Say hi!".

**Mascot:** Valfri; om mascot visas – lugn, inbjudande, inte festlig.

---

## DEL 5 — Första meddelandet

### Två varianter

**A. Systemgenererat (när samlingen skapas)**

- Syfte: Sätta tonen – relation, inte funktion.
- **Alternativ 1:** *"Den här samlingen skapades för att dela något tillsammans."*
- **Alternativ 2 (om namn finns):** *"Ni samlas kring: [Samlingens namn]."*
- **Alternativ 3:** *"Här börjar något gemensamt."*

**B. Skapat av creator (användaren som skapade)**

- Om skaparen skickar första meddelandet: det ska få kännas som en inbjudan till samtal, inte en "grupphälsning".
- Ton: personlig, inbjudande, kort. Ingen standardiserad "Välkommen till gruppen!"-text.

### Ton – relation, inte funktion

- ✅ "Tillsammans", "ni", "sammanhang", "dela".
- ❌ "Gruppen är skapad", "Du kan nu chatta", "Starta konversationen".

---

## DEL 6 — Skapa samling-flow

### Steg (konceptuellt)

1. **Välj kontext** – Vad handlar samlingen om? (namn, syfte.)
2. **Välj personer** – Vilka vill du dela detta med? (personer som passar i samma sammanhang.)
3. **Bekräfta känsla** – Tydlig bekräftelse att det är en samling med syfte, inte bara "grupp skapad".

### Mikrocopy

| Element | Copy | Syfte |
|--------|------|--------|
| Steg 1 – Namn | Label: *"Vad handlar samlingen om?"* | Kontext först. |
| Placeholder | *"t.ex. Söndagspromenader, Djupa samtal, Vin & filosofi"* | Ge riktning, inte "Gruppnamn". |
| Preview under namn | *"En plats för er att lära känna varandra tillsammans."* | Bekräfta känsla. |
| Steg 2 – Personer | Titel: *"Vilka vill du dela detta med?"* | Relation, inte "lägg till deltagare". |
| Helper | *"Välj personer som passar i samma sammanhang."* | Kvalitet över kvantitet. |
| Primär knapp | *"Skapa samling"* | Inte "Create group" eller "Start chat". |

### Validering

- Minst två personer (utöver skaparen om det är relevant).  
- Valideringstext: *"Du behöver minst två matchningar."* – lugn, informativ, inte straffande.

### Empty state (inga matcher att välja)

- Rubrik/brödtext: Koppla till relation – t.ex. att samlingar börjar med matchningar, och att man kan återkomma när fler finns.  
- Ingen FOMO-copy ("Skaffa fler matcher nu!").

---

## DEL 7 — Video i samling

### När video får användas

- Video i samling = **delad tid tillsammans** – t.ex. när ni vill prata eller se varandra i samma sammanhang.
- **Inte** en "video-chattkanal" som man "joinar" för att vara med i aktivitet.

### Hur det presenteras emotionellt

- Inbjudan till video ska kännas som *"vi tar en stund tillsammans"*, inte *"join call"*.
- Copy: relationell – t.ex. *"Starta en samtalstid"* eller *"Ni kan ses här när det passar er"* – inte "Join video" som enda budskap.

### Vad som inte får ske

- ❌ "Join fast"-känsla – ingen countdown eller press att gå in direkt.
- ❌ Lista "X är i samtalet nu" som huvudupplevelse (om det skapar FOMO).
- ❌ Video som standardläge; text och sammanhang ska kunna stå i centrum.

---

## DEL 8 — AI i samling

### AI:s roll

- **Fördjupa relation** – hjälpa till att reflektera, sammanfatta gemensamma teman.
- **Föreslå samtalsriktning** – t.ex. frågor eller ämnen som passar samlingen, inte generiska "icebreakers".
- **Stödja sammanhang** – AI ska känna av samlingens namn/syfte och tonen mellan medlemmarna (inom rimlighet).

### ALDRIG

- ❌ Skapa aktivitet för aktivitetens skull (t.ex. "Skicka ett meddelande nu!").
- ❌ Gamification – poäng, streak, "mest aktiva".
- ❌ Ton som "bot som underhåller gruppen" – AI ska understödja, inte ta över.

### Copy-exempel AI

- ✅ *"Vill ni att jag föreslår något att prata om utifrån vad ni delat?"*
- ✅ *"En tanke utifrån er samling: …"*
- ❌ *"3 nya meddelanden – svara nu!"*  
- ❌ *"Du har inte skrivit på 2 dagar."*

---

## DEL 9 — Notifications

### Vad som kan ge notis (princip)

- Någon har skrivit i en samling användaren tillhör – **om** användaren valt att få notiser för den samlingen.
- Formulering ska vara **lugn och relationell**.

### Vad som ska formuleras så här

- ✅ *"Någon har skrivit i [Samlingens namn]."*
- ✅ *"[Samlingens namn] väntar på dig."* (om ni vill använda "väntar" – mjukt.)
- ❌ *"3 nya meddelanden 🔥"*
- ❌ *"X har skickat 5 meddelanden"* (räkna inte upp för stress.)

### Vad som inte ska trigga notis (eller ska vara avstängbart)

- Varje enskilt meddelande i en mycket aktiv samling – risk för notis-spam. Överväg sammanfattning eller "Någon har skrivit i [namn]" utan antal.
- "X är online" eller "X har gått med i samlingen" – undvik som push om det inte är tydligt värdefullt för relationen.

### Copy-ton

- Lugn. Ingen urgency. Relation och sammanhang, inte aktivitet och antal.

---

## DEL 10 — Guardrails (checklista för framtida PR)

Använd denna vid ny Samling-feature eller ändring i befintlig Samling-UI:

- [ ] **Stärker relation** – Känns det som att featuren bygger "vi" och sammanhang, inte bara fler meddelanden?
- [ ] **Minskar brus** – Ökar vi inte notis-stress, unread-känsla eller "aktivitetsvärde"?
- [ ] **Kontext före aktivitet** – Är namn, syfte och känsla tydliga före antal meddelanden/medlemmar?
- [ ] **Lugn copy** – Undviker vi "X nya", "Join nu", "Du missar", "Mest aktiva"?
- [ ] **Ingen group-chat-känsla** – Ser vi till att det känns som *samling* (social depth) och inte som *gruppchatt* (kanaler, aktivitet)?

### Snabbreferens ord

**Använd:** tillsammans, sammanhang, riktning, dela, lära känna, ni, gemensamt.  
**Undvik:** grupp, deltagare, aktivitet, online, popular, meddelanden (som huvudvärde), notis-stress.

---

## Outputformat & användning

- Specen är **produkt-UX**: rubriker, punktlistor, copy-exempel. Ingen kod.
- **Användning:**  
  - När ni bygger nya Samling-features (video, AI, systemmeddelanden, notiser).  
  - Vid PR som rör Samlingar – jämför mot DEL 2 (list view), DEL 4 (tomt rum), DEL 9 (notifications) och DEL 10 (guardrails).  
  - För copy-review – alla texter ska kunna mätas mot "relation → inte funktion" och "lugn, ingen FOMO".

**Nästa steg (roadmap):**  
När denna spec är godkänd och inläst i teamet: FAS 11 — Landing V2 implementation (baserat på story-doc), så att Samlingar har sin emotionella roll i produkten innan ni satsar på fler ytor.
