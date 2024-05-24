# cli-pride-flags

Displays pride flags in your terminal~

# Install
## NPM
```sh
npm i -g cli-pride-flags
```

## AUR
There's also a package in the AUR, maintained by `u/rhysperry111`! Install it with your favorite AUR helper: `cli-pride-flags`

## From cloned repo
```sh
npm i
npm link --global
```

# Usage

```
Usage: cli-pride-flags [options...] flag
Options:
  --blend, -b flag[,factor]   Blend two flags together, with an optional decimal factor
  --character, -c char        Character to use to draw the flag
  --gradient, -g              Make the flag a smooth gradient
  --height, -h int            The height of the flag, in characters. May not generate the exact specified height
  --help, -?                  Display this help text
  --install-completion        Install tabtab shell completion
  --live, -l                  Hold the terminal and redraw the flag upon resize, closing when any key is pressed
  --random, -r                Displays a random flag! This ignores any passed flags.
  --vertical, -v              Display the flag, but vertically
  --width, -w int             The width of the flag, in characters
```
Example: `cli-pride-flags -l trans` would display the trans flag and hold the terminal.

# Screenshots

Theres a page previewing all the flags on [my site :3](https://experibassmusic.eth.limo/flags.html)

Some screenshots are below!

![agen, bi, fluid](./screenies/1.png)

![bunch of flags and help text :D](./screenies/2.png)

# Issues

- minor: `cli-pride-flags --blend bi <TAB>` doesnt complete because it sees the flag passed to `--blend` as an arg; either figure out how to complete flags without tripping up on option args, or just dont bother ignoring completion once a flag is selected, as we ignore any others anyways

# TODO
- commit more crimes, but queerly
- conquer the world with the queer agenda
