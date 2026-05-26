---
sidebar_position: 2
---

# Внести вклад

👍🎉 Во-первых, спасибо, что нашли время внести свой вклад! 🎉👍

Files в настоящее время находится в стадии интенсивной разработки. Мы приветствуем участников для совместной работы над Files.

## Вовлекитесь

Есть много способов внести свой вклад в Files, и многие из них не требуют написания кода. Вот пару идей для начала:

- Начните использовать Files! Ознакомьтесь с учебными руководствами. Работает ли что-нибудь так, как ожидалось? Если нет, мы всегда ищем то, что можно улучшить. Дайте нам знать об этом, открыв тему.
- Посмотрите [проблемы Files](https://github.com/softeng/Files/issues). Если вы нашли проблему, которую хотели бы исправить, [создайте pull request](#first-pull-request). Проблемы помеченные как ['good first issue'](https://github.com/softeng/Files/labels/good%20first%20issue) хорошие места для начала.
- Помогите сделать документацию лучше. Создайте 'issue' если вы нашли что-то непонятное, грамматическую ошибку, или что-то что можно улучшить.
- Взгляните на [GitHub дискуссии](https://github.com/softeng/Files/discussions) и выскажите свое мнение в дискуссии или подумайте о том что бы создать pull request если вы видите что-то интересное для вас.

Мы рады вкладам в развитие!

## Наш процесс разработки

Files использует [GitHub](https://github.com/softeng/Files) в качестве источника истины. Основная команда работает там. Все изменения будут публичны с самого начала.

### Сообщения о новых проблемах/багов. {#issues}

Когда [открываете новую проблему](https://github.com/softeng/Files/issues) убедитесь что вы заполнили 'issue' шаблон. Мы используем GitHub для отслеживания общих багов. Пожалуйста, убедитесь что описание вашей проблемы является четким и содержит достаточно информации для воспроизведения проблемы.

- _Одно сообщение, один баг_: Пожалуйста сообщайте об одной проблеме в сообщении.
- _Представьте все шаги по воспроизведению проблемы_: Перечислите все шаги для воспроизведения проблемы. Человек читающий вашу проблемы, должен выполнить эти шаги для того, чтобы воспроизвести вашу проблему с минимальными усилиями.

### Предложения о функционале {#feat}

Мы используем [Github дискуссии](https://github.com/softeng/Files/discussions) и [Проблемы](https://github.com/softeng/Files) для отслеживания идей от пользователей. Предлагайте свои идеи о функционале [здесь](https://github.com/softeng/Files/discussions/new)! Хорошие предложения о функционале обычно имеют:

- Краткое изложение идеи.
- Зачем & почему вы хотите добавления конкретной функции.
- Дополнительные ссылки, такие как изображения, ссылки на ресурсы о функции и т.д.

## Работа над исходным кодом Files

### Обязательное знание

- [Окружение Tauri](https://tauri.studio/en/docs/getting-started/intro#setting-up-your-environment)
- [Node JS](https://nodejs.org/en/)
- [Git](https://git-scm.com/)
- [yarn](https://yarnpkg.com/)
- Редактор кода, мы рекомендуем вам использовать [VS Code](https://code.visualstudio.com/)

### Установка

1. После клонирования репозитория, запустите команду `yarn` в корне репозитория и запустите команду `yarn` в папке `docs` (Если вы хотите работать с документацией Files).
2. Что бы запустить Files локально, запустите команду `yarn dev`.

    Что бы запустить локальный сервер разработки, документацию Docusaurus, перейдите в папку `docs` и запустите команду `yarn start`

### Gitpod для разработки Files {#gitpod-env}

Самый простой способ запустить Files в Gitpod - использовать сервис [Gitpod](https://gitpod.io/), все что от вас нужно это нажать на кнопку ниже и зайти в свой Github аккаунт. После этого вы увидите VS Code - подобную среду, где вы можете начать свою работу и вносить изменения. Обратите внимание на то что вам может потребоваться подождать несколько минут, чтобы Files работал на всплывающей вкладке VNC.

## [![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#/https://github.com/softeng/Files)

### Описание для коммитов {#commit-msg}

Посмотрите, как мелкие изменения в вашем стиле описания коммитов может сделать вас лучше.

Format: `<type>(<scope>): <subject>`

`<scope>` is optional

#### Example

```
feat: allow overriding of webpack config
^--^  ^------------^
|     |
|     +-> Summary in present tense.
|
+-------> Type: chore, docs, feat, fix, refactor, style, or test.
```

the various types of commits:

- `feat`: new feature for the user
- `fix`: bug fix for the user
- `docs`: changes to the documentation
- `style`: formatting, missing semi-colons, etc.
- `refactor`: refactoring production code, eg. renaming a variable
- `test`: adding missing tests, refactoring tests.
- `chore`: updating grunt tasks etc

Use lower case not the upper case!

## Working on Files docs

Files documentation website is built using [Docusaurus 2](https://docusaurus.io/), and its code is located at [`docs`](https://github.com/softeng/Files/tree/master/docs) folder.

### Prerequisite

- [node js](https://nodejs.org/en/)
- [git](https://git-scm.com/downloads)
- [yarn](https://yarnpkg.com/getting-started/install#about-global-installs)
- Code Editor, we recommend you to use [VS Code](https://code.visualstudio.com/)

### Installation

After cloning the repository, run `yarn` in the `docs` folder (you can go into the `docs` folder by running the `cd docs` command).

If you want to use Gitpod, click [here](#gitpod-env) for the guide on how to use Gitpod.

### Local development

1. Run the `yarn start` command in the `docs` folder.
2. Edit some markdown texts in the `docs` folder and the website will be hot reloaded.

## Pull requests

### Your first pull request. {#first-pull-request}

So you have decided to contribute code back to upstream by opening a pull request. You've invested a good chunk of time, and we appreciate it. We will do our best to work with you and get the PR looked at.

Working on your first Pull Request? You can learn how from this free video series:

How to Contribute to an Open Source Project on GitHub

We have a list of [beginner-friendly issues](https://github.com/softeng/Files/labels/good%20first%20issue) to help you get your feet wet in the Files codebase and familiar with our contribution process. This is a great place to get started.

### Proposing a change

If you would like to request a new feature or enhancement but are not yet thinking about opening a pull request, you can also [open a discussion](#feat) and others will code it!

If you intend to fix a bug, please discuss it through [Issues](#issues) before submitting a pull request.

If you intend to add a new feature, please discuss it through [GitHub Discussions](#feat) to avoid multiple people working on the same feature request.

### Sending a Pull Request

make sure the PR does only one thing, otherwise please split it. It is recommended to follow this [commit message style](#commit-msg).

1. Fork [the repository](https://github.com/softeng/Files) and create your branch from `master`.
2. Make changes and ensure your commit message is understandable.
3. Open a [PR](https://github.com/softeng/Files/pulls) and ensure to describe your pull request clearly.

## Working on Files resources

### Locales

We host our locales on the [crowdin](https://crwd.in/Files). To translate it, please follow these steps:

- Sign up on [Crowdin](https://crowdin.com) and Join our project [here](https://crwd.in/Files).
- Make sure your locale exists there, if it does not exist, leave a comment in [this discussion](https://github.com/softeng/Files/discussions/30) and I'll add the language option :)
- Get familiar with the Crowdin translation UI, as you will need to use it to translate JSON and Markdown files
- Translate the content!

#### Priority Files to translate on Crowdin

1. `src-ui/Locales` files
2. `docs/` files

#### Production

Once the files on `src-ui/Locales` have been translated for more than 80%, we will add it into the Files app, and for the docs, we will add it into production once the translation looks good!

Please comment [here](https://github.com/softeng/Files/discussions/30) if you have any questions!

### File Library

The json library of file types and thumbnail are found under `lib` folder and the icons are found under `src-ui/Icons` folder. You may add file types and icons for file extensions you want to use and submit a PR.
