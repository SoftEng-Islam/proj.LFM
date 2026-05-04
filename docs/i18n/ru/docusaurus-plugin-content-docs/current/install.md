---
sidebar_position: 2
---

# Установка

## Для Windows и MacOS

Вы можете скачать Files [здесь](https://github.com/softeng/Files/releases).

## Для Linux

### AppImages

Скачайте **.AppImage** файл из [страницы выпусков](https://github.com/softeng/Files/releases) и следуйте этому [руководству](https://docs.appimage.org/introduction/quickstart.html#how-to-run-an-appimage).

### Дистрибутивы на базе Debian и Ubuntu

Скачайте **.deb** файл из [страницы выпусков](https://github.com/softeng/Files/releases).

Вы можете установить это с помощью:

```bash
sudo dpkg -i /path/to/deb/file.deb
```

**или**

```bash
sudo apt install /path/to/deb/file.deb
```

### Дистрибутивы на основе Arch Linux

> Use your favorite [aur helper](https://wiki.archlinux.org/title/AUR_helpers).

```bash
yay -S Files-bin

#или для manjaro

pacman build Files-bin
```

**или**

Скачайте **.pacman** файл из [страницы выпусков](https://github.com/softeng/Files/releases).

Вы можете установить это с помощью:

```bash
sudo pacman -U /path/to/deb/file.pacman
```

**или**

сборка из [исходника](https://aur.archlinux.org/Files-bin.git)

```bash
git clone https://aur.archlinux.org/Files-bin.git

cd Files-bin

makepkg -si
```

## Распространенные проблемы

<details>
<summary>
Срабатывает Защитник Windows?
</summary>

На самом деле это не ошибка. Это решение Microsoft, что бы защитить тех, кто не разбирается в технологиях (т.е. ваших друзей) от вирусов. Не беспокойтесь об безопасности Files, это проект с [открытым исходным кодом](https://github.com/softeng/Files) и вы можете сами это проверить или даже создать собственную версию Files!

Чтобы продолжить, просто нажмите `Подробнее`, затем нажмите Выполнить в любом случае.

1. ![Шаг 1](/img/docs/windows-defender-1.webp)
2. ![Шаг 2](/img/docs/windows-defender-2.webp)

:::note Источники

Источник [Stack Overflow](https://stackoverflow.com/questions/65488839/how-can-i-avoid-windows-protected-your-pc-problem-when-my-friends-try-to-use-m).

:::

</details> <details>
<summary>
<code>"Files" не может быть установлен потому что разработчик не может быть проверен.</code> Ошибка на macOS
</summary>

Пожалуйста, посмотрите [официальную документацию](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac) Apple.

</details> <details>
<summary>
Здесь нет моего установщика.
</summary>

Пожалуйста, обратитесь с этой проблемой [сюда](https://github.com/softeng/Files/issues/new/choose).

</details>
