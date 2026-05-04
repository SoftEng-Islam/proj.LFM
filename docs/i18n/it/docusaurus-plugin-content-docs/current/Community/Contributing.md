---
sidebar_position: 2
---

# Dona il tuo contributo

👍🎉 In primo luogo, grazie per aver impiegato il tuo tempo per contribuire! 🎉👍

Files è attualmente in forte sviluppo. Accogliamo con piacere i collaboratori per collaborare su Files.

## Partecipa

Ci sono molti modi per contribuire a Files, e molti di loro non comportano la scrittura di alcun codice. Ecco alcune idee per iniziare:

- Inizia a usare Files! Dai un'occhiata ai Tutorial. Funziona tutto come previsto? In caso contrario, siamo sempre alla ricerca di miglioramento. Faccelo sapere creando una segnalazione.
- Visita la pagina dei [problemi di Files](https://github.com/softeng/Files/issues). Se trovi un problema che desideri risolvere, [apri una richiesta di pull](#first-pull-request). I problemi etichettati come [buon primo problema](https://github.com/softeng/Files/labels/good%20first%20issue) sono un buon punto da cui iniziare.
- Aiutaci a migliorare la documentazione. Segnala un problema se trovi qualcosa di confusionario, qualsiasi errore grammaticale, o che può essere migliorato.
- Dai un'occhiata alle [Discussioni di GitHub](https://github.com/softeng/Files/discussions) e dai la tua opinione in una discussione o considera di aprire una richiesta di pull se vedi qualcosa su cui vuoi lavorare.

I contributi sono i benvenuti!

## Il nostro processo di sviluppo

Files usa [GitHub](https://github.com/softeng/Files) come fonte di verità. Il team principale lavorerà direttamente lì. Tutte le modifiche saranno rese pubbliche fin dall'inizio.

### Segnalare nuovi problemi/bug. {#issues}

Quando [segnali un nuovo problema](https://github.com/softeng/Files/issues), assicurati sempre di completare il modello di problema. Usiamo la sezione problemi di GitHub per monitorare i bug pubblici. Assicurati che la tua descrizione sia chiara e abbia istruzioni sufficienti per riprodurre il problema.

- _Un problema, un bug_: Si prega di segnalare un singolo bug per problema.
- _Fornisci i passaggi di riproduzione_: Elenca tutti i passaggi necessari per riprodurre il problema. La persona che legge la segnalazione di bug dovrebbe essere in grado di seguire questi passaggi per riprodurre il problema impiegando il minimo sforzo.

### Richiedi Feature {#feat}

Usiamo la [Sezione Discussioni di GitHub](https://github.com/softeng/Files/discussions) e [Problemi di GitHub](https://github.com/softeng/Files) per tenere traccia delle idee dagli utenti. Suggerisci una nuova funzionalità [qui](https://github.com/softeng/Files/discussions/new)! Le grandi richieste di funzionalità hanno solitamente:

- Un rapido riepilogo dell'idea.
- Che cosa e perché si voleva aggiungere la caratteristica specifica.
- Riferimenti aggiuntivi come immagini, link di risorse sulla funzionalità, ecc.

## Lavorare sul codice di Files

### Prerequisiti

- [Ambiente Tauri](https://tauri.studio/en/docs/getting-started/intro#setting-up-your-environment)
- [Node JS](https://nodejs.org/en/)
- [Git](https://git-scm.com/)
- [yarn](https://yarnpkg.com/)
- Editor di codice, ti consigliamo di utilizzare [VS Code](https://code.visualstudio.com/)

### Installazione

1. Dopo aver clonato il repository, esegui `yarn` nella root del repository ed esegui `yarn` nella cartella `docs` (se si desidera lavorare sulla Documentazione di Files).
2. Per avviare Files localmente, esegui `yarn dev`.

    Per avviare un server di sviluppo locale che lavora sulla documentazione di Docusaurus, vai nella directory `docs` ed esegui `yarn start`

### Gitpod per lo sviluppo di Files {#gitpod-env}

Il modo più semplice per eseguire Files in Gitpod è utilizzare il servizio [Gitpod](https://gitpod.io/), tutto quello che devi fare è fare clic sul pulsante qui sotto e accedere con il tuo account GitHub. Successivamente, vedrai un ambiente VS Code-like in cui potrai iniziare a sviluppare e confermare i tuoi cambiamenti. Si prega di notare che potrebbe essere necessario attendere fino a minuti per ottenere Files in esecuzione sulla scheda VNC comparsa.

## [![Apri su Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#/https://github.com/softeng/Files)

### Messaggi di commit semantici {#commit-msg}

Scopri come una minima modifica allo stile del tuo commit message può renderti un programmatore migliore.

Formato: `<type>(<scope>): <subject>`

`<scope>` è opzionale

#### Esempio

```
feat: permetti di sovrascrivere la configurazione del webpack
^--^ ^------------^
<unk> <unk>
<unk> +-> Riassunto in tempo reale.
<unk>
+-------> Tipo: chore, docs, feat, fix, refactor, style o test.
```

i vari tipi di commit:

- `feat`: nuova funzionalità per l'utente
- `fix`: correzione di bug per l'utente
- `docs`: modifiche alla documentazione
- `style`: formattazione, punti e virgola mancanti, ecc.
- `refactor`: refactoring del codice, es. rinominazione di una variabile
- `test`: aggiunta di test mancanti, test di refactoring.
- `chore`: aggiornamento dei task di grunt ecc

Usa le minuscole, non le maiuscole!

## Lavorare sulla documentazione di Files

Il sito di documentazione di Files è stato costruito utilizzando [Docusaurus 2](https://docusaurus.io/), e il suo codice si trova nella cartella [`docs`](https://github.com/softeng/Files/tree/master/docs).

### Prerequisiti

- [node js](https://nodejs.org/en/)
- [git](https://git-scm.com/downloads)
- [yarn](https://yarnpkg.com/getting-started/install#about-global-installs)
- Editor di codice, ti consigliamo di utilizzare [VS Code](https://code.visualstudio.com/)

### Installazione

Dopo la clonazione del repository, esegui `yarn` nella cartella `docs` (puoi entrare nella cartella `docs` eseguendo il comando `cd docs`).

Se vuoi usare Gitpod, clicca [qui](#gitpod-env) per la guida su come usare Gitpod.

### Sviluppo locale

1. Esegui il comando `yarn start` nella cartella `docs`.
2. Modifica alcuni documenti markdown nella cartella `docs` e il sito web verrà ricaricato a caldo.

## Richieste di pull

### La tua prima richiesta di pull. {#first-pull-request}

Dunque hai deciso di contribuire al codice ripartendo da zero creando una richiesta di pull. Hai dedicato una buona fetta di tempo e lo appreziamo. Faremo del nostro meglio per lavorare con te e ottenere il PR che desideri.

Stai lavorando alla tua prima Richiesta di Pull? Puoi imparare come da questa serie video gratuita:

Come contribuire a un progetto Open Source su GitHub

Abbiamo un elenco di [problemi per principianti](https://github.com/softeng/Files/labels/good%20first%20issue) per aiutarti a sbattere la testa nel codice di Files e a familiarizzare con il nostro processo di contributo. Questo è un punto ideale per iniziare.

### Proporre una modifica

Se desideri richiedere una nuova funzionalità o miglioramento, ma non stai ancora pensando di aprire una richiesta di pull, puoi anche [aprire una discussione](#feat) e altri lo programmeranno!

Se hai intenzione di risolvere un bug, per favore discutine attraverso la [Sezione Problemi](#issues) prima di inviare una richiesta di pull.

Se hai intenzione di aggiungere una nuova funzionalità, si prega di discuterne attraverso la [Sezione Discussioni](#feat) per evitare che più persone lavorino sulla stessa richiesta di funzionalità.

### Inviare una richiesta di Pull

assicurarsi che la PR faccia solo una cosa, altrimenti si prega di dividerla. Si raccomanda di seguire questo [stile del messaggio di commit](#commit-msg).

1. Esegui un Fork del [repository](https://github.com/softeng/Files) e crea il tuo ramo da `master`.
2. Fai delle modifiche e assicurati che il tuo messaggio di commit sia comprensibile.
3. Apri un [PR](https://github.com/softeng/Files/pulls) e assicurati di descrivere la tua Richiesta di Pull con chiarezza.

## Lavorare sulle risorse di Files

### Locale

Ospitiamo le nostre risorse locali su [crowdin](https://crwd.in/Files). Per tradurle, segui questi passaggi:

- Iscriviti su [Crowdin](https://crowdin.com) e Unisciti al nostro progetto [qui](https://crwd.in/Files).
- Assicurati che la tua risorsa locale esista, se non esiste, lascia un commento in [questa discussione](https://github.com/softeng/Files/discussions/30) e aggiungerò l'opzione di lingua :)
- Familiarizza con l'interfaccia utente di traduzione Crowdin in quanto dovrai usarla per tradurre file JSON e Markdown
- Traduci il contenuto!

#### File di priorità da tradurre su Crowdin

1. Files della cartella `src/Locales`
2. Files della cartella `docs`

#### Produzione

Una volta che i file della cartella `src/Locales` sono stati tradotti per oltre l'80%, li aggiungeremo nell'app Files, e per i docs, li aggiungeremo in produzione una volta che la traduzione sembra buona!

Per favore commenta [qui](https://github.com/softeng/Files/discussions/30) se hai domande!

### Libreria File

La libreria json dei tipi di file e delle miniature si trova nella cartella `lib` e le icone si trovano nella cartella `src/Icons`. È possibile aggiungere tipi di file e icone per le estensioni di file che si desidera utilizzare e inviare una PR.
