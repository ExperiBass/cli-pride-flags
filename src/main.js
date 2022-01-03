#!/usr/bin/env node
const chalk = require("chalk")

const flags = require("./flags.json")
const {name, version} = require('../package.json')
const BLOCK = "█"
const STRING_LEN = process.stdout.columns
const TERMINAL_HEIGHT = process.stdout.rows

function help() {
    console.log(`Usage: ${chalk.green(name)} ${chalk.yellow("[flag]")}`)
    console.log("Flags:")
    console.log("    " + chalk.green(Object.keys(flags).sort().join('\n    ')))
    console.log(chalk.green(`${name} v${version}\nFlag count: ${Object.keys(flags).length}`))
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
    // just gonna leave this here, might implement scaling down in the future
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
