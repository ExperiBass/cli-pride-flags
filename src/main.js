#!/usr/bin/env node

// import deps
const chalk = require("chalk")
const columns = require('cli-columns')
// import local files
const flags = require("./flags.json")
const { name, version } = require('../package.json')
const { interpolateColor, FlagColors, ArgParser } = require('./util')
const BLOCK = "█"
const argparser = new ArgParser({
    'help': { type: 'boolean', short: 'h', description: 'Display this help text' },
    'gradient': { type: 'boolean', short: 'g', description: 'Make the flag a smooth gradient' },
    'live': { type: 'boolean', short: 'l', description: 'Hold the terminal and redraw the flag upon resize, closing when any key is pressed' },
    'vertical': { type: 'boolean', short: 'v', description: 'Display the flag, but vertically' },
    'blend': { type: 'string', short: 'b', description: 'Blend two flags together, with an optional decimal factor', argName: 'flag[,factor]' }
})

// setup
const { args, options } = argparser.parse()
const CHOSEN_FLAG = args[0]
const availableHeight = process.stdout.rows
const availableWidth = process.stdout.columns

function help() {
    let flagList = []
    const flagNames = Object.keys(flags).sort()
    const MINI_FLAG_DISTANCE = 12
    for (const flagName of flagNames) {
        // we want all the mini-flags to be at the same starting distance from the left,
        // so figure out how many spaces we need to add after the flags name
        const spaces = MINI_FLAG_DISTANCE - flagName.length
        let flagLine = `${flagName}` // indent the line...
        flagLine = flagLine.padEnd(flagLine.length + spaces, " ") // ...add calculated spaces...
        for (const color of flags[flagName].stripes) {
            flagLine += chalk.hex(color.code)(BLOCK) // ..and then add the miniflag
        }
        flagList.push(flagLine)
    }

    console.log(`Usage: ${chalk.green(name)} ${chalk.blue("[options...]")} ${chalk.yellow("flag")}`)
    console.log(`Options:\n${argparser.listOptions()}`)
    console.log(`Flags:\n${chalk.greenBright(columns(flagList))}`)
    console.log(chalk.green(`${name} ${chalk.yellow(`v${version}`)}\n${chalk.reset("Flag count:")} ${chalk.blue(flagNames.length)}`))
}

function createFlag(availableWidth, availableHeight, options) {
    const colors = new FlagColors(flag)
    let blendColors = null
    let blendFactor = 0
    let finishedFlag = ""
    let position = 0

    if (options.blend) {
        const [flag, factor] = options.blend.split(',')
        if (!flag || !Object.keys(flags).includes(flag)) {
            console.log(`The flag "${flag}" doesn't exist!`)
            process.exit(1)
        }
        blendFactor = parseFloat(factor)
        if (isNaN(blendFactor)) {
            blendFactor = 0.5
        }
        blendColors = new FlagColors(flags[flag])
    }

    if (options.vertical) {
        // building a single row :3
        let currPos = 0 // position in line
        while (position < 1) {
            currPos++ // need to increment first for vertical flags, ig the offset is wonky?
            position = (currPos / availableWidth).toFixed(3)
            let color = colors.getColor(position, options.gradient ? 'gradient' : null)

            if (blendColors) {
                const color2 = blendColors.getColor(position, options.gradient ? 'gradient' : null)
                color = interpolateColor(color, color2, blendFactor)
            }
            finishedFlag += chalk.hex(color)(BLOCK)
        }
        return finishedFlag.repeat(availableHeight)
    }

    // clearly its not a vertical flag, proceed with horizontal
    let currLine = 0
    while (position < 1) {
        //console.log(position)
        position = (currLine / availableHeight).toFixed(3)
        let color = colors.getColor(position, options.gradient ? 'gradient' : null)

        if (blendColors) {
            const color2 = blendColors.getColor(position, options.gradient ? 'gradient' : null)
            color = interpolateColor(color, color2, blendFactor)
        }
        finishedFlag += chalk.hex(color)(BLOCK.repeat(availableWidth))
        currLine++
    }
    return finishedFlag
}

function draw() {
    if (options.live) {
        // Go to (0,0), clear screen, and hide cursor
        process.stdout.write("\x1b[0;0f\x1b[2J\x1b[?25l")
    }
    const builtFlag = createFlag(availableWidth, availableHeight, options)
    process.stdout.write(builtFlag)

    if (!options.live) {
        process.stdout.write("\n")
    }
}


//

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
    // clear screen and scrollback
    process.stdout.write("\x1b[2J\x1b[3J\x1b[1;1H")
    // Make sure process doesn't exit when finished
    process.stdout.once("data", () => {
        process.stdout.write("\x1b[?25h") // Show cursor
        process.stdout.write("\x1b[2J\x1b[1;1H") // MAYBE: clear scrollback with [3J?
        process.exit()
    })
    // Redraw if dimensions change
    process.stdout.on("resize", () => {
        draw()
    })
}

// woo, build the flag!
draw()
