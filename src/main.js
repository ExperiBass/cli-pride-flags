#!/usr/bin/env node
const chalk = require("chalk")

const flags = require("./flags.json")
const {name, version} = require('../package.json')
const BLOCK = "█"
const STRING_LEN = process.stdout.columns

function help() {
    console.log(`Usage: ${chalk.green(name)} ${chalk.yellow("[flag]")}`)
    console.log("Flags:")
    console.log("    " + chalk.green(Object.keys(flags).sort().join('\n    ')))
    console.log(chalk.green(`${name} v${version}`))
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

let mainString = ""
for (let color of flag) {
    for (let i = 0; i < color.height; i++) {
        let string = ""

        for (let j = 0; j < STRING_LEN; j++) {
            string += `${BLOCK}`
        }
        mainString += chalk.hex(color.code)(string) // no newline at the end, makes for better blending if the terminal is resized
    }
}
console.log(mainString)