#!/usr/bin/env node

// import deps
const chalk = require('chalk')
const columns = require('cli-columns')
// import local files
const flags = require('./flags.json')
const { name, version } = require('../package.json')
const { randNum, interpolateColor, FlagColors, ArgParser } = require('./util')

/////
// setup
/////

const argparser = new ArgParser({
    help: { type: 'boolean', short: 'h', description: 'Display this help text' },
    gradient: {
        type: 'boolean',
        short: 'g',
        description: 'Make the flag a smooth gradient',
    },
    vertical: {
        type: 'boolean',
        short: 'v',
        description: 'Display the flag, but vertically',
    },
    live: {
        type: 'boolean',
        short: 'l',
        description: 'Hold the terminal and redraw the flag upon resize, closing when any key is pressed',
    },
    blend: {
        type: 'string',
        short: 'b',
        description: 'Blend two flags together, with an optional decimal factor',
        argName: 'flag[,factor]',
    },
    character: {
        type: 'string',
        short: 'c',
        description: 'Character to use to draw the flag',
        argName: 'char',
    },
    random: {
        type: 'boolean',
        short: 'r',
        description: 'Displays a random flag! This ignores any passed flags.',
    },
})

const { args, options } = argparser.parse()
const CHAR = options.character?.trim().substring(0, 1) || '█'
const CHOSEN_FLAG = args[0]?.toLowerCase()
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
        flagLine = flagLine.padEnd(flagLine.length + spaces, ' ') // ...add calculated spaces...
        for (const color of flags[flagName].stripes) {
            flagLine += chalk.hex(color.code)(CHAR) // ..and then add the miniflag
        }
        flagList.push(flagLine)
    }

    console.log(`Usage: ${chalk.green(name)} ${chalk.blueBright('[options...]')} ${chalk.yellow('flag')}`)
    console.log(`Options:\n${argparser.listOptions()}`)
    console.log(`Flags:\n${chalk.greenBright(columns(flagList))}`)
    console.log(chalk.green(`${name} ${chalk.blueBright(`v${version}`)}`))
}

function createFlag(availableWidth, availableHeight, options) {
    const colors = new FlagColors(flag)
    let blendColors = null
    let blendFactor = 0
    let finishedFlag = ''
    let position = 0

    if (options.blend) {
        let [blendFlag, factor] = options.blend.split(',')
        blendFlag = blendFlag.toLowerCase()

        if (!Object.keys(flags).includes(blendFlag)) {
            console.log(`The flag "${blendFlag}" doesn't exist!`)
            process.exit(1)
        }

        blendFactor = parseFloat(factor)
        if (isNaN(blendFactor)) {
            blendFactor = 0.5
        }

        blendColors = new FlagColors(flags[blendFlag])
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
            finishedFlag += chalk.hex(color)(CHAR)
        }
        return finishedFlag.repeat(availableHeight)
    }

    // clearly its not a vertical flag, proceed with horizontal
    let currLine = 0
    while (position < 1) {
        position = (currLine / availableHeight).toFixed(3)
        let color = colors.getColor(position, options.gradient ? 'gradient' : null)

        if (blendColors) {
            const color2 = blendColors.getColor(position, options.gradient ? 'gradient' : null)
            color = interpolateColor(color, color2, blendFactor)
        }
        finishedFlag += chalk.hex(color)(CHAR.repeat(availableWidth))
        currLine++
    }
    return finishedFlag
}

function draw() {
    if (options.live) {
        // Go to (0,0), clear screen, and hide cursor
        process.stdout.write('\x1b[0;0f\x1b[2J\x1b[?25l')
    }
    const builtFlag = createFlag(availableWidth, availableHeight, options)
    process.stdout.write(builtFlag)

    if (!options.live) {
        process.stdout.write('\n')
    }
}

// Check terminal environment
if (!chalk.supportsColor) {
    console.log("Your terminal doesn't support color!")
    process.exit(1)
}
chalk.level = 3 // try to use truecolor

/////
// run
/////

if (options.help || (!options.random && (CHOSEN_FLAG === undefined || !Object.keys(flags).includes(CHOSEN_FLAG)))) {
    // this is cursed lol
    help()
    process.exit()
}

let flag
if (options.random) {
    const flagKeys = Object.keys(flags)
    flag = flags[flagKeys[randNum(flagKeys.length - 1)]]
} else {
    flag = flags[CHOSEN_FLAG]
}

if (options.live) {
    // Ensure any keypress will close program
    process.stdin.setRawMode(true)
    // Make sure process doesn't exit when finished
    process.stdout.once('data', () => {
        process.stdout.write('\x1b[2J\x1b[1;1H') // clear screen
        process.stdout.write('\x1b[?25h') // Show cursor
        // MAYBE: clear scrollback with [3J?
        process.exit()
    })
    // Redraw if dimensions change
    process.stdout.on('resize', () => {
        draw()
    })
}

// woo, build the flag!
draw()
