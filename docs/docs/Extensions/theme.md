# Themes (Beta)

## Get Started

![Theme demo](/img/docs/themed-Files.webp)

The Theme extension is a way to define the look of the Files. Files comes with a few default themes (which are `light`, `dark`, `light+`, and `dark+`), but you can also create your own, which is a great way to personalize your Files and is documented in [this guide](/docs/Extensions/create).

<details>
<summary>
How do I change between themes?
</summary>

You can switch between themes by opening settings and on the Preference page, you can see a dropdown menu with the available themes under `App Theme` section.

![Switching between themes](/img/docs/theme-switching.gif)

</details>

## Installing a theme

There are 2 ways to install a theme:

### Via `.xtension` file

You can download `.xtension` file from the theme developer and simply double clicking it on Files.

![Install theme via .xtension file](/img/docs/install-theme-via-xtension.gif)

### Install from public URL via Files CLI

You can also install a theme from a public URL via Files CLI by running following command:

```bash
Files extensions theme install <Theme URL>
```

#### Example

##### [Shades of Purple](https://github.com/softeng/Files/tree/master/example/themes/shades%20of%20purple)

Run following command to install [Shades of Purple](https://github.com/softeng/Files/tree/master/example/themes/shades%20of%20purple) theme:

```bash
Files extensions theme install https://raw.githubusercontent.com/softeng/Files/master/example/themes/shades%20of%20purple/dist/themes.xtension
```

##### [Winter](https://github.com/softeng/Files/tree/master/example/themes/winter)

Run following command to install [Winter](https://github.com/softeng/Files/tree/master/example/themes/shades%20of%20purple) theme:

```bash
Files extensions theme install https://raw.githubusercontent.com/softeng/Files/master/example/themes/winter/dist/themes.xtension
```

## Uninstalling a theme

To uninstall a theme, you can run following command:

```bash
Files extensions uninstall <Theme Identifier>
```

## Official Themes

There are currently 2 official themes:

- [Shades of Purple](https://github.com/softeng/Files/tree/master/example/themes/shades%20of%20purple)
- [Winter](https://github.com/softeng/Files/tree/master/example/themes/winter)

## Show yours! 👋

Our community is always looking for new themes. If you have a theme that you think would be a good fit, please [tell it to us](https://github.com/softeng/Files/discussions/new?category=show-and-tell).
