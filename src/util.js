const chalk = require('chalk')
const { parseArgs } = require('node:util')

// Turn an input array of Numbers into an array of cumulative weights
function toCumulativeWeights(inputArray, mode = null) {
    /// copy the input
    let input = [...inputArray]
    let result = []

    let accumulator = 0
    if (mode === 'gradient') {
        /// needs to start at 0 and lose the last weight,
        /// or you lose the first and have a w i d e last
        input.unshift(0)
        input.pop()
    }
    const sum = input.reduce((a, x) => a + x)

    for (const x of input) {
        /// likewise, order matters here for block and gradient modes
        /// precision of 3 is needed for smaller flags
        if (mode === 'block') {
            result.push((accumulator / sum).toFixed(3))
            accumulator += x
        } else {
            accumulator += x
            result.push((accumulator / sum).toFixed(3))
        }
    }
    return result
}
function interpolateColor(color1, color2, percentage) {
    // Convert colors to RGB
    let color1RGB = hexToRGB(color1)
    let color2RGB = hexToRGB(color2)

    // Determine which color is lighter and adjust the percentage
    const lightness1 = color1RGB.r * 0.299 + color1RGB.g * 0.587 + color1RGB.b * 0.114
    const lightness2 = color2RGB.r * 0.299 + color2RGB.g * 0.587 + color2RGB.b * 0.114
    if (lightness1 > lightness2) {
        // flip
        ;[color2RGB, color1RGB] = [color1RGB, color2RGB]
        percentage = 1 - percentage
    }

    // Interpolate colors using the adjusted percentage
    const r = Math.round(color1RGB.r + (color2RGB.r - color1RGB.r) * percentage)
    const g = Math.round(color1RGB.g + (color2RGB.g - color1RGB.g) * percentage)
    const b = Math.round(color1RGB.b + (color2RGB.b - color1RGB.b) * percentage)

    return RGBToHex(
        ...[r, g, b].map((v) => {
            /// clamp dem numbers!
            v = Math.max(0, Math.min(v, 255))
            return v
        })
    )
}
function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r: r, g: g, b: b }
}
function RGBToHex(r, g, b) {
    const hexR = r.toString(16).padStart(2, '0')
    const hexG = g.toString(16).padStart(2, '0')
    const hexB = b.toString(16).padStart(2, '0')
    return `#${hexR}${hexG}${hexB}`
}

function randNum(max) {
    return Math.floor(Math.random() * Math.floor(max++))
}

class ColorStop {
    constructor(data) {
        this.pos = data[0]
        this.colorCode = data[1]
    }
}
class FlagColors {
    constructor(flag) {
        /// grab the weights furst
        let weights = flag.weights
        if (!weights) {
            /// no weights? its a uniform flag!
            weights = Array(flag.stripes.length).fill(1, -flag.stripes.length)
        }

        /// create the cumulative weights~
        this.blockColors = toCumulativeWeights(weights, 'block').map((x, i) => new ColorStop([x, flag.stripes[i]]))
        this.gradientColors = toCumulativeWeights(weights, 'gradient').map(
            (x, i) => new ColorStop([x, flag.stripes[i]])
        )

        /// Sort color stops in reverse order, so getColor checks for the highest value that the input is "to the right" of.
        this.blockColors.sort((a, b) => (a.pos > b.pos ? -1 : a.pos < b.pos ? 1 : 0))
        this.gradientColors.sort((a, b) => (a.pos > b.pos ? -1 : a.pos < b.pos ? 1 : 0))
    }
    getColor(pos, mode = 'block') {
        if (mode === 'gradient') {
            for (const i in this.gradientColors) {
                if (pos === this.gradientColors[i].pos) {
                    return this.gradientColors[i].colorCode
                } else if (pos >= this.gradientColors[i].pos) {
                    const leftColorStop = this.gradientColors[i]
                    const rightColorStop = this.gradientColors[i - 1] ?? leftColorStop

                    // + 0.01 cause dPos = 0 at the end of the flag
                    const dPos = 0.01 + (rightColorStop.pos - leftColorStop.pos)
                    const percentage = (pos - leftColorStop.pos) / dPos

                    return interpolateColor(leftColorStop.colorCode, rightColorStop.colorCode, percentage)
                }
            }
        }
        // not a gradient, default to blocc
        for (const stop of this.blockColors) {
            if (pos > stop.pos) {
                return stop.colorCode
            }
        }
        return null
    }
}

/// tfw nobody has what you need so you roll your own
class ArgParser {
    #options = {}
    constructor(options) {
        this.#options = options
    }
    listOptions() {
        let output = []
        const SPACES = 20 /// option starting distance from the left
                          /// keep this
        for (const [long, info] of Object.entries(this.#options).sort((a,b) => a[0].localeCompare(b[0]))) {
            let optionHelpString = '  '
            console.log(long)
            if (info.short) {
                optionHelpString += `-${info.short}, `
            }
            else {
                optionHelpString += ' '.repeat(4) /// bruh
                /// so it doesnt like when a option doesnt have a short flag
                /// give it spacing of the same amount so its happy
            }
            optionHelpString += `--${long}`
            optionHelpString = chalk.blueBright(optionHelpString) // make the options blue before continuing
            if (info.type !== 'boolean') {
                optionHelpString += chalk.yellow(` ${info.argName}`)
            }
            /// funky math
            optionHelpString = optionHelpString.padEnd(
                optionHelpString.length + (SPACES - (long.length + (info.argName ? info.argName.length + 1 : 0))),
                ' '
            )
            optionHelpString += `${info.description}`
            output.push(optionHelpString)
        }
        return output.join('\n').trim()
    }
    parse() {
        const inputArgs = process.argv.slice(2)
        try {
            const { values, positionals } = parseArgs({
                args: inputArgs,
                options: this.#options,
                allowPositionals: true,
            })
            return { args: positionals, options: values }
        } catch (e) {
            console.log(e.message)
            process.exit(1)
        }
    }
}

module.exports = { randNum, interpolateColor, FlagColors, ArgParser }
