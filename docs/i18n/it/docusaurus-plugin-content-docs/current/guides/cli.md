# Avviare Files dal terminale

## Comandi

CLI di Files:

```bash
Files <options> [dir1] [dir2] [dir3]
```

Files aprirà `dir`, `dir2`, `dir3` come schede su Files. Se non c'è alcuna cartella(dir) passata nel comando, Files inizierà dalla pagina iniziale.

Opzioni:

| Comando      | Alias | Descrizione                                            |
| ------------ | ----- | ------------------------------------------------------ |
| `--reveal`   | `-r`  | Apre la cartella contenente e seleziona il file        |
| `--theme`    | `t`   | Usa tema personalizzato (a scopo di sviluppo dei temi) |
| `--xtension` | `x`   | Installa le estensioni dal tipo di file `xtension`     |

## Sottocomandi

### Estensioni

#### Installazione

Installa un'estensione dal tipo di file `xtension`. Comando:

```bash
Files extensions install <packaged xtension path/URL>
```

#### Disinstallazione

Disinstallare un' estensione installata. Comando:

```bash
Files extensions uninstall <extension identifier>
```

#### Tema

##### Compilazione

Impacchettare e compilare il tema nel file `themes.xtension` da distribuire. Comando:

```bash
Files extensions theme build
```

##### Installazione

Installare un'estensione dal tipo di file `xtension`.

```
Files extensions theme install
```
