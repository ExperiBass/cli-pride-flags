#!/usr/bin/env node

const chalk = require("chalk")
const flags = require("./flags.json")
const { name, version } = require('../package.json')
const { toCumulativeWeights, FlagColors } = require('./util')
const BLOCK = "█"
const MINI_FLAG_DISTANCE = 12 // spaces from the left
const { args, options } = parseArgs(process.argv.slice(2))
const CHOSEN_FLAG = args[0]

// basic cli arg parser
function parseArgs(args) {
    let result = {
        args: [],
        options: {
            help: false,
            keepalive: false,
            vertical: false,
            gradient: false
        }
    }
    for (const arg of args) {
        if (arg.startsWith('-')) {
            switch (arg) {
                case '-h': {
                    result.options.help = true
                    break
                }
                case '-l': {
                    result.options.keepalive = true
                    break
                }
                case '-v': {
                    result.options.vertical = true
                    break
                }
                case '-g': {
                    result.options.gradient = true
                    break
                }
                default: {
                    break
                }
            }
        } else {
            result.args.push(arg)
        }
    }
    return result
}

function help() {
    console.log(`Usage: ${chalk.green(name)} ${chalk.blue("[options...]")} ${chalk.yellow("[flag]")}`)
    console.log("Options:")
    // honestly ill just hardcode these
    console.log("  -h    Display this help text")
    console.log("  -l    Hold the terminal open and redraw the flag upon resize, closing when any key is pressed")
    console.log("  -v    Display the flag, but vertically")
    console.log("Flags:")
    let flagList = ""
    const flagKeys = Object.keys(flags).sort()
    for (const flag of flagKeys) {
        // we want all the mini-flags to be at the same distance,
        // so figure out how many spaces we need to add
        const spaces = MINI_FLAG_DISTANCE - flag.length
        let s = `  ${flag}` // indent flag...
        s = s.padEnd(s.length + spaces, " ") // ...add calculated spaces...
        for (const color of flags[flag].stripes) {
            s += chalk.hex(color.code)(BLOCK) // and then make the flag
        }
        flagList += `${s}\n`
    }
    console.log(chalk.green(flagList))
    console.log(chalk.green(`${name} ${chalk.yellow(`v${version}`)}\n${chalk.reset("Flag count:")} ${chalk.blue(flagKeys.length)}`))
}


function createFlag() {
    const colors = new FlagColors(flag)
    const flagHeight = flag.stripes.reduce((a, stripe) => a + stripe.height, 0)
    const maxScale = Math.floor(process.stdout.rows / flagHeight)
    const availableWidth = process.stdout.columns
    const availableHeight = (options.keepalive ? flagHeight * maxScale : process.stdout.rows)
    const stripeHeights = flag.stripes.map(stripe => stripe.height)
    const stripeRowNumbers = toCumulativeWeights(stripeHeights) // map each stripe height to a percentage...
    .map(weight => weight * availableHeight) // ...map back to line numbers in the available space...
    .map(Math.floor) // ...and err on the side of caution, floor it to whole numbers (unless you have a fancy terminal that has half-lines?)
    const stripeHeightsFinal = stripeRowNumbers.map((e, i, a) => e - a[i - 1] || e) // now squash to the screen
    let finishedFlag = ""
    let currLine = 0
    for (const stripeIndex in flag.stripes) {
        const stripeHeight = stripeHeightsFinal[stripeIndex]

        for (let stripeLine = 0; stripeLine < stripeHeight; stripeLine++) {
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

function createVerticalFlag(scale = 1, height) {
    // just createFlag but v
    //                     e
    //                     r
    //                     t
    //                     i
    //                     c
    //                     a
    //                     l
    let finishedFlag = ""
    // outer loop fills the screen
    for (let i = 0; i < height; i++) {
        for (const stripe of flag.stripes) {
            for (let j = 0; j < (stripe.height * scale); j++) {
                finishedFlag += chalk.hex(stripe.code)(BLOCK)
            }
        }
        finishedFlag += "\n" // here we append a newline instead, to keep the flag vertical
    }
    return finishedFlag.trim()
}


function draw() {
    let termHeight;
    let FLAG_WIDTH;
    if (options.vertical) {
        termHeight = process.stdout.columns
        FLAG_WIDTH = process.stdout.rows
    } else {
        termHeight = process.stdout.rows
        FLAG_WIDTH = process.stdout.columns
    }
    if (options.keepalive) {
        // Go to (0,0), clear screen, and hide cursor
        process.stdout.write("\x1b[0;0f\x1b[2J\x1b[?25l")
    }
    const builtFlag = options.vertical ? createVerticalFlag(flagScale, FLAG_WIDTH) : createFlag()
    process.stdout.write(builtFlag)

    if (!options.keepalive) {
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

if (options.keepalive) {
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
