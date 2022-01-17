#!/usr/bin/env node
const chalk = require("chalk")

const flags = require("./flags.json")
const {name, version} = require('../package.json')
const BLOCK = "█"
const STRING_LEN = process.stdout.columns
const TERMINAL_HEIGHT = process.stdout.rows
const MINI_FLAG_DISTANCE = 10

function help() {
    console.log(`Usage: ${chalk.green(name)} ${chalk.yellow("[flag]")}`)
    console.log("Flags:")
    let flagList = ""
    const flagKeys = Object.keys(flags).sort()
    for (const flag of flagKeys) {
        // we want all the mini-flags to be at the same distance,
        // so figure out how many spaces we need to add
        const spaces = MINI_FLAG_DISTANCE - flag.length
        let s = `    ${flag}`
        s = s.padEnd(s.length + spaces, " ")
        for (color of flags[flag]) {
            s += chalk.hex(color.code)(BLOCK)
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
const ARGS = process.argv.slice(2)
if (!ARGS[0] || !Object.keys(flags).includes(ARGS[0].toLowerCase())) {
    help()
}

const flag = Object.values(flags[ARGS[0].toLowerCase()])

// determine if the terminal is larger or smaller than the flag
let FLAG_HEIGHT = 0
for (let color of flag) {
    FLAG_HEIGHT += color.height
}
if (TERMINAL_HEIGHT > FLAG_HEIGHT) {
    const flag = createFlag(Math.floor(TERMINAL_HEIGHT / FLAG_HEIGHT))
    console.log(flag)
} else {
    // terminal smol, use the hardcoded minimum height
    console.log(createFlag())
}


function createFlag(multiplier = 1) {
    let flagColor = ""
    for (let color of flag) {
        for (let i = 0; i < color.height * multiplier; i++) {
            let string = ""
            for (let j = 0; j < STRING_LEN; j++) {
                string += `${BLOCK}`
            }
            flagColor += chalk.hex(color.code)(string) // no newline at the end, makes for better blending if the terminal is resized
        }
    }
    return flagColor
}
