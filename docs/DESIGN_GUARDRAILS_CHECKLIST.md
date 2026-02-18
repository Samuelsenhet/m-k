# MÄÄK Design Guardrails – Checklista för nya features

Använd denna checklista vid **nya features, A/B-tester och PR som rör matchning, chat, profil, landing eller Samlingar**.  
Om något kryssas som "nej" → justera eller dokumentera medvetet undantag.

---

## 1. Ingen dopamin-loop

- [ ] Finns **like**-knapp eller liknande? → **Nej.**
- [ ] Finns **swipe**-gester (vänster/höger)? → **Nej.**
- [ ] Visas **match-procent** eller **score**? → **Nej.**
- [ ] Finns **ranking** ("Top match", "Rekommenderad", "Bäst för dig")? → **Nej.**
- [ ] Triggas **celebration/konfetti** ofta eller på många tillfällen? → **Nej.**

---

## 2. Coral = relation

- [ ] Används **coral** på discovery/feed/landing/navigation? → **Nej.** (Coral = chat, relation, status i konversation.)
- [ ] Används coral för "Se fler", "Utforska", "Nya användare"? → **Nej.**

---

## 3. CTA-hierarki

- [ ] Är **Chatta** (eller starta samtal) den **primära** CTA där det är relevant? → **Ja.**
- [ ] Är **Passa** tydlig men **sekundär** (t.ex. Ghost)? → **Ja.**
- [ ] Är **Se profil** sekundär efter Chatta? → **Ja.**

---

## 4. Copy – ingen FOMO eller optimering

- [ ] Nämns **procent** eller "bättre chans"/"bästa matchningarna" i vänt-/onboarding-copy? → **Nej.**
- [ ] Låter texterna **lugn och meningsfulla** (relation, tid, dig själv) snarare än prestation? → **Ja.**

---

## 5. Samlingar (om feature berör grupp/samling)

- [ ] Fokus på **relation och kontext** (namn, syfte) mer än på antal meddelanden/online? → **Ja.**
- [ ] Undviks **unread-counters** eller **online-grid** som huvudbudskap? → **Ja.**

---

## 6. Landing (om ändring på landingsida)

- [ ] Säljer vi **transformation** ("Slipp marknadsplatsen", relation) mer än **funktion** ("Hitta matchningar")? → **Ja.**
- [ ] Är CTA lugn ("Kom igång", "Lär känna dig") och inte stress ("Swipa nu", "Se vilka som gillar dig")? → **Ja.**

---

## Snabbreferens

| Gör | Gör inte |
|-----|----------|
| Passa → Chatta → Se profil | Like, swipe, %, score |
| Coral = relation/chat | Coral = discovery/nav |
| Lugn copy, mening | FOMO, optimering, procent |
| Empty states + mascot | Tomhet utan trygghet |
| Chat = produkten | Match-feed = produkten |

---

*Vid undantag: dokumentera i PR eller i `docs/ANTI_TINDER_AUDIT_AND_RELEASE_READINESS.md` varför undantaget är medvetet.*
