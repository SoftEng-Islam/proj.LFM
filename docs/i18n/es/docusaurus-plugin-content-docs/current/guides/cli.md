# Ejecutar Files desde la terminal

## Comandos

Files CLI:

```bash
Files <options> [dir1] [dir2] [dir3]
```

Files abrirá `dir`, `dir2`, `dir3` como pestañas en Files. Si no se pasa ningún directorio(dir) en el comando, Files iniciará en la página inicial.

Opciones:

| Comando      | Alias | Descripción                                           |
| ------------ | ----- | ----------------------------------------------------- |
| `--reveal`   | `-r`  | Abre la carpeta que contiene y selecciona el archivo  |
| `--theme`    | `-t`  | Usar tema personalizado (para el desarrollo del tema) |
| `--xtension` | `-x`  | Instalar extensión desde tipo de archivo `xtension`   |

## Subcomandos

### Extensiones

#### Instalar

Instalar extensión desde tipo de archivo `xtension`. Comando:

```bash
Files extensions install <packaged xtension path/URL>
```

#### Desinstalar

Desinstalar una extensión instalada. Comando:

```bash
Files extensions install <extension identifier>
```

#### Tema

##### Compilar

Paquete y compilar el tema en el archivo `themes.xtension` para distribuir. Comando:

```bash
Files extensions theme build
```

##### Instalar

Instalar extensión desde tipo de archivo `xtension`.

```
Files extensions theme install
```
