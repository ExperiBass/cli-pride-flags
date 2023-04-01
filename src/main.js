#!/usr/bin/env node

// import deps
const chalk = require("chalk")
// import local files
const flags = require("./flags.json")
const { name, version } = require('../package.json')
const { scaleFlag, FlagColors, ArgParser } = require('./util')
const BLOCK = "█"
const argparser = new ArgParser({
    'help': { aliases: ['h'], description: 'Display this help text'},
    'gradient': { aliases: ['g'], description: 'Make the flag a smooth gradient'},
    'live': { aliases: ['l'], description: 'Hold the terminal open and redraw the flag upon resize, closing when any key is pressed'},
    'vertical': { aliases: ['v'], description: 'Display the flag, but vertically'}
})
const {args, options} = argparser.parse()
const CHOSEN_FLAG = args[0]

function help() {
    console.log(`Usage: ${chalk.green(name)} ${chalk.blue("[options...]")} ${chalk.yellow("[flag]")}`)
    console.log("Options:")
    console.log(argparser.listOptions())
    console.log("Flags:")
    let flagList = []
    const flagNames = Object.keys(flags).sort()
    const MINI_FLAG_DISTANCE = 12
    for (const flagName of flagNames) {
        // we want all the mini-flags to be at the same starting distance from the left,
        // so figure out how many spaces we need to add after the flags name
        const spaces = MINI_FLAG_DISTANCE - flagName.length
        let flagLine = `  ${flagName}` // indent the line...
        flagLine = flagLine.padEnd(flagLine.length + spaces, " ") // ...add calculated spaces...
        for (const color of flags[flagName].stripes) {
            flagLine += chalk.hex(color.code)(BLOCK) // ..and then add the miniflag
        }
        flagList.push(flagLine)
    }
    console.log(chalk.greenBright(flagList.join('\n')))
    console.log(chalk.green(`${name} ${chalk.yellow(`v${version}`)}\n${chalk.reset("Flag count:")} ${chalk.blue(flagNames.length)}`))
}

function createFlag() {
    const colors = new FlagColors(flag)
    const { availableHeight, stripeHeightsFinal, availableWidth } = scaleFlag(flag, options)
    let finishedFlag = ""
    let currLine = 0
    for (const stripeIndex in flag.stripes) {
        const stripeHeight = stripeHeightsFinal[stripeIndex]

        for (let i = 0; i < stripeHeight; i++) {
            const position = (currLine / availableHeight).toFixed(3)
            let color;
            if (options.gradient) {
                color = colors.getColor(position, 'gradient')
            } else {
                color = colors.getColor(position)
            }
            finishedFlag += chalk.hex(color)(BLOCK.repeat(availableWidth))
            currLine++
        }
    }
    return finishedFlag
}
function createVerticalFlag() {
    // just createFlag but v
    //                     e
    //                     r
    //                     t
    //                     i
    //                     c
    //                     a
    //                     l
    const colors = new FlagColors(flag)
    const { availableHeight, stripeHeightsFinal, availableWidth } = scaleFlag(flag, options, true)
    let finishedFlag = ""
    // outer loop fills the screen
    let currPos = 0
    for (const stripeIndex in flag.stripes) {
        const stripeWidth = stripeHeightsFinal[stripeIndex]
        for (let j = 0; j < stripeWidth; j++) {
            const position = (currPos / availableWidth).toFixed(3)
            let color;
            if (options.gradient) {
                color = colors.getColor(position, 'gradient')
            } else {
                color = colors.getColor(position)
            }
            finishedFlag += chalk.hex(color)(BLOCK)
            currPos++
        }
    }
    return finishedFlag.repeat(availableHeight)
}

function draw() {
    if (options.live) {
        // Go to (0,0), clear screen, and hide cursor
        process.stdout.write("\x1b[0;0f\x1b[2J\x1b[?25l")
    }
    const builtFlag = options.vertical ? createVerticalFlag() : createFlag()
    process.stdout.write(builtFlag)

    if (!options.live) {
        process.stdout.write("\n")
    }
}

// Check terminal environment
if (!chalk.supportsColor) {
    console.log("Your terminal doesn't support color!")
    process.exit(1)
}
chalk.level = 3 // try to use truecolor


// run
if (options.help || CHOSEN_FLAG === undefined || !Object.keys(flags).includes(CHOSEN_FLAG.toLowerCase())) {
    help()
    process.exit()
}

const flag = flags[CHOSEN_FLAG.toLowerCase()]

if (options.live) {
    // Ensure any keypress will close program
    process.stdin.setRawMode(true)
    // Make sure process doesn't exit when finished
    process.stdout.once("data", () => {
        process.stdout.write("\x1b[?25h") // Show cursor
        process.exit()
    })
    // Redraw if dimensions change
    process.stdout.on("resize", () => {
        draw()
    })
}

// woo, build the flag!
draw()
