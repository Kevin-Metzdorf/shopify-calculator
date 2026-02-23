# 🚀 Shopify Project Estimator | Kevin Metzdorf Ltd.

Ein internes, dynamisches Kalkulations-Tool für Shopify-Agenturen und Freelancer. Dieses Programm wandelt Projektanforderungen in Calls in Echtzeit in präzise Stunden- und Preis-Schätzungen um, verhindert systematisch den berüchtigten "Scope Creep" und standardisiert die Preisgestaltung.

## 🎯 Das Problem & Die Lösung

**Das Problem:** Zu oft werden Aufwände für Datenmigrationen, komplexe App-Setups (z.B. B2B, ERP) oder fehlenden Content unterschätzt. Das Resultat: Unbezahlte Mehrarbeit.

**Die Lösung:** Eine strikte, modulare Berechnungs-Matrix. Das Tool zwingt dazu, alle relevanten Shopify-Parameter vorab abzufragen und berechnet automatisch Puffer und Steuern.

## ✨ Kern-Features

* **Projekt-Typ-Basis:** Automatische Grundgebühren je nach Projektart (Audit, Tweaks, Neubau, Migration, Custom App).
* **Modulare Zuschläge:** Exakte Stundenberechnung für Custom Code, komplexe Datenmigrationen (CSV, Metafields), App-Stacks und Internationalisierung (Shopify Markets).
* **Content-Delegation:** Berücksichtigt, ob der Kunde Content liefert oder ein "Full-Service"-Pauschalbetrag für Partner-Agenturen fällig wird.
* **Risiko-Puffer:** Ein dynamischer Slider (0-30%), um schwer einschätzbare Kunden oder unklare Anforderungen direkt in den Preis einzukalkulieren.
* **Finanz-Dashboard:** Live-Berechnung von Netto, MwSt. (inkl. Reverse-Charge-Logik für B2B EU / Drittland) und Brutto mit flexiblem Stundensatz.

## 🛠 Tech Stack & UI

* **Frontend:** HTML5 & Vanilla JavaScript (ES6 Modules). Keine schweren Frameworks.
* **Styling:** Tailwind CSS via CDN.
* **Design-System:** Eigene Implementierung des **Shopify Polaris Design Systems** für einen nahtlosen, nativen Look & Feel.

## 📂 Clean Architecture (Ordnerstruktur)

Das Projekt trennt UI, Daten und Logik strikt voneinander, um maximale Skalierbarkeit für zukünftige Preisanpassungen zu gewährleisten:

```text
/
├── index.html         # Die Benutzeroberfläche (Polaris UI)
└── js/
    ├── config.js      # Statische Agentur-Daten (Basisstunden, Multiplikatoren)
    ├── logic.js       # Reine Mathematik & Pure Functions (Kalkulations-Logik)
    └── app.js         # Controller, DOM-Manipulation & Event Listener
```

## 🚀 Setup & Nutzung

1. Repository klonen: `git clone [deine-repo-url]`
2. Die Datei `index.html` lokal im Browser öffnen.
3. *Alternativ:* Das Projekt wird über **GitHub Pages** gehostet und ist von jedem Endgerät für Sales-Calls abrufbar.

**Wartung:** Um Stundensätze oder Basis-Aufwände (z.B. für 2027) anzupassen, muss lediglich die Datei `/js/config.js` bearbeitet werden. Die restliche Logik passt sich automatisch an.

### 💻 Local Development (Tailwind CSS)

Dieses Projekt verwendet einen **lokalen Tailwind CSS Build-Prozess** anstelle eines CDN-Links – für bessere Performance, keine externe Abhängigkeit und volle Kontrolle über das generierte CSS.

```bash
# 1. Abhängigkeiten installieren (einmalig)
npm install

# 2. Watch-Modus während der Entwicklung
npm run watch

# 3. Finales CSS für Produktion bauen (vor jedem Commit)
npm run build
```

| Befehl | Beschreibung |
|---|---|
| `npm install` | Installiert die notwendigen Abhängigkeiten (Tailwind CSS CLI). |
| `npm run watch` | Startet den Tailwind CLI im Watch-Modus – `./css/output.css` wird bei jeder Änderung automatisch neu gebaut. |
| `npm run build` | Kompiliert und minifiziert das finale CSS für die Produktion. |

> ⚠️ **Wichtig:** Immer `npm run build` ausführen, bevor Änderungen auf GitHub gepusht werden – nur so sind die aktuellen Styles in `output.css` enthalten und auf GitHub Pages korrekt sichtbar.

---
*Developed by Kevin Metzdorf Ltd.*
