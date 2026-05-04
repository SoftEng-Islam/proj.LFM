# Launch Files from Terminal

## Commands

Files CLI:

```bash
Files <options> [dir1] [dir2] [dir3]
```

Files will open `dir`, `dir2`, `dir3` as tabs on Files. If there's no directory(dir) passed into the command, Files will start at the Home page.

Options:

| Command      | Alias | Description                                     |
| ------------ | ----- | ----------------------------------------------- |
| `--reveal`   | `-r`  | Open the containing folder and select the file  |
| `--theme`    | `t`   | Use custom theme (for developing theme purpose) |
| `--xtension` | `x`   | Install extension from `xtension` file type     |

## Subcommands

### Extensions

#### Install

Install an extension from `xtension` file type. Command:

```bash
Files extensions install <packaged xtension path/URL>
```

#### Uninstall

Uninstall an installed extension. Command:

```bash
Files extensions uninstall <extension identifier>
```

#### Theme

##### Build

Package and build theme into `themes.xtension` file to distribute. Command:

```bash
Files extensions theme build
```

##### Install

Install an extension from `xtension` file type.

```
Files extensions theme install
```
