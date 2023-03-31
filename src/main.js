#!/usr/bin/env node

const chalk = require("chalk")
const flags = require("./flags.json")
const { name, version } = require('../package.json')
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
function interpolateColor(color1, color2, percentage) {
    // Convert colors to RGB
    let color1RGB = hexToRGB(color1);
    let color2RGB = hexToRGB(color2);

    // Determine which color is lighter and adjust the percentage
    const lightness1 = (color1RGB.r * 0.299 + color1RGB.g * 0.587 + color1RGB.b * 0.114);
    const lightness2 = (color2RGB.r * 0.299 + color2RGB.g * 0.587 + color2RGB.b * 0.114);
    if (lightness1 > lightness2) {
        percentage = 1 - percentage;
        const temp = color1RGB;
        color1RGB = color2RGB;
        color2RGB = temp;
    }

    // Interpolate colors using the adjusted percentage
    const r = Math.round(color1RGB.r + (color2RGB.r - color1RGB.r) * percentage);
    const g = Math.round(color1RGB.g + (color2RGB.g - color1RGB.g) * percentage);
    const b = Math.round(color1RGB.b + (color2RGB.b - color1RGB.b) * percentage);
    return RGBToHex(...[r,
        g,
        b].map(v => {
            if (v > 255) {
                v = 255
            }
            if (v < 0) {
                v = 0
            }
            return v
        }));
}


function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r: r, g: g, b: b };
}

function RGBToHex(r, g, b) {
    const hexR = r.toString(16).padStart(2, "0");
    const hexG = g.toString(16).padStart(2, "0");
    const hexB = b.toString(16).padStart(2, "0");
    return "#" + hexR + hexG + hexB;
}


function createFlag(width) {
    
    const flagHeight = flag.stripes.reduce((a, stripe) => a + stripe.height, 0)
    const stripeHeights = flag.stripes.map(stripe => stripe.height)
    const stripeWeights = toCumulativeWeights(stripeHeights)
    const availableWidth = process.stdout.columns
    const availableHeight = options.keepalive ? process.stdout.rows : process.stdout.rows - 2
    const stripeRowNumbers = stripeWeights.map(weight => weight * availableHeight)
        .map(Math.round)
    const stripeHeightsFinal = stripeRowNumbers.map((e, i, a) => e - a[i-1] || e)
    
    let finishedFlag = ""
    
    for (let i = 0; i < stripeHeightsFinal.length; i++) {
        const stripe = flag.stripes[i]
        const nextStripe = flag.stripes[i+1] || stripe
        const stripeHeight = stripeHeightsFinal[i]
        
        for (let j = 0; j < stripeHeight; j++) {
            let color = stripe.code
            // TODO: add gradient logic
            
            finishedFlag += chalk.hex(color)(BLOCK).repeat(availableWidth)
        }
    }
    
    return finishedFlag
}


// Turn an input array of Numbers into an array of cumulative weights
function toCumulativeWeights(inputArray) {
    
    let result = []
    
    let accumulator = 0
    const sum = inputArray.reduce((a, x) => a + x)
    
    for (x of inputArray) {
        accumulator += x
        result.push(accumulator / sum)
    }
        
    return result
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
    // if the terminal is larger, scale the flag up
    if (options.keepalive) {
        // Go to (0,0), clear screen, and hide cursor
        process.stdout.write("\x1b[0;0f\x1b[2J\x1b[?25l")
    }
    // since || triggers on a fals*y* value, if Math.floor returns a 0,
    // it'll trigger and snap the value back to 1. nifty!
    const flagScale = Math.floor(termHeight / flag.height) || 1
    // TODO: maybe scale better? vertical leaves a gap...
    // how will i add precision?
    const builtFlag = options.vertical ? createVerticalFlag(flagScale, FLAG_WIDTH) : createFlag(flagScale)
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
