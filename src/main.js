#!/usr/bin/env node

const chalk = require("chalk")
const flags = require("./flags.json")
const { name, version } = require('../package.json')
const BLOCK = "█"
const STRING_LEN = process.stdout.columns
const TERMINAL_HEIGHT = process.stdout.rows
const MINI_FLAG_DISTANCE = 10 // spaces from the left
const ARGS = process.argv.slice(2)

function help() {
    console.log(`Usage: ${chalk.green(name)} ${chalk.yellow("[flag]")}`)
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
if (!ARGS[0] || !Object.keys(flags).includes(ARGS[0].toLowerCase())) {
    help()
}

const flag = Object.values(flags[ARGS[0].toLowerCase()])

// determine if the terminal is larger or smaller than the flag
// first get the total height of the flag
let FLAG_HEIGHT = 0
for (const color of flag) {
    FLAG_HEIGHT += color.height
}
// if the terminal is larger, scale the flag up
if (TERMINAL_HEIGHT > FLAG_HEIGHT) {
    const flag = createFlag(Math.floor(TERMINAL_HEIGHT / FLAG_HEIGHT))
    console.log(flag)
} else {
    // terminal smol, use the hardcoded minimum height
    console.log(createFlag())
}

// woo, build the flag!
function createFlag(scale = 1) {
    let finishedFlag = ""
    for (const color of flag) {
        // for each color, create its rows
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
