#!/usr/bin/env node

const chalk = require("chalk")
const flags = require("./flags.json")
const { name, version } = require('../package.json')
const BLOCK = "█"
let STRING_LEN = process.stdout.columns
const MINI_FLAG_DISTANCE = 10 // spaces from the left
const ARGS = process.argv.slice(2)
const FLAG_TYPE = ARGS[0]
const FILL_TERM = ARGS[1] === "true" || ARGS[1] === "True"

function help() {
    console.log(`Usage: ${chalk.green(name)} ${chalk.yellow("[flag]")} ${chalk.blue("[fill]")}`)
    console.log("Flags:")
    let flagList = ""
    const flagKeys = Object.keys(flags).sort()
    for (const flag of flagKeys) {
        // we want all the mini-flags to be at the same distance,
        // so figure out how many spaces we need to add
        const spaces = MINI_FLAG_DISTANCE - flag.length
        let s = `    ${flag}` // indent flag...
        s = s.padEnd(s.length + spaces, " ") // ...add calculated spaces...
        for (const color of flags[flag]) {
	    if(typeof color === "number") break; // Last item in array is flag height
            s += chalk.hex(color.code)(BLOCK) // and then make the flag
        }
        flagList += `${s}\n`
    }
    console.log(chalk.green(flagList))
    console.log(chalk.green(`${name} ${chalk.yellow(`v${version}`)}\n${chalk.reset("Flag count:")} ${chalk.blue(flagKeys.length)}`))
    process.exit()
}

// Check terminal environment
if (!chalk.supportsColor) {
    console.log("Your terminal doesn't support color!")
    process.exit(1)
}
chalk.level = 3 // try to use truecolor


// run
if (FLAG_TYPE === undefined || !Object.keys(flags).includes(ARGS[0].toLowerCase())) {
    help()
}

const flag = Object.values(flags[ARGS[0].toLowerCase()])

function draw() {
    let termHeight = process.stdout.rows;
    STRING_LEN = process.stdout.columns
    let FLAG_HEIGHT = flag[flag.length - 1]
    // if the terminal is larger, scale the flag up
    if(FILL_TERM) {
        // Go to 0,0, clear screen, and hide cursor
        process.stdout.write("\x1b[0;0f\x1b[2J\x1b[?25l")
    }
    if (termHeight > FLAG_HEIGHT) {
        const flag = createFlag(Math.floor(termHeight / FLAG_HEIGHT))
        process.stdout.write(flag)
    } else {
        // terminal smol, use the hardcoded minimum height
        process.stdout.write(createFlag())
    }
    if(!FILL_TERM) process.stdout.write("\n")
}

if(FILL_TERM) {
    // Ensure any keypress will close program
    process.stdin.setRawMode(true);
    // Make sure process doesn't exit when finished
    process.stdout.once("data", () => {
	process.stdout.write("\x1b[?25h") // Show cursor
	process.exit()
    });
    // Redraw if dimensions change
    process.stdout.on("resize", () => {
        draw()
    });
}
draw();

// woo, build the flag!
function createFlag(scale = 1) {
    let finishedFlag = ""
    for (const color of flag) {
        // for each color, create its rows
	if(!(color instanceof Object)) break // Last item in array is flag height
        for (let i = 0; i < color.height * scale; i++) {
            // instead of creating each row and putting it on its own line,
            // we string every row together. this keeps the flag from
            // looking like a jumbled mess when the terminal is resized.
            let string = ""
            for (let j = 0; j < STRING_LEN; j++) {
                string += BLOCK
            }
            finishedFlag += chalk.hex(color.code)(string)
        }
    }
    return finishedFlag
}
