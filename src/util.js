const chalk = require("chalk")

// Turn an input array of Numbers into an array of cumulative weights
function toCumulativeWeights(inputArray, mode = null) {
    // copy the input
    let input = [...inputArray]
    let result = []

    let accumulator = 0
    if (mode === 'gradient') {
        // needs to start at 0 and lose the last stripe,
        // or you lose the first and have a w i d e last
        input.unshift(0)
        input.pop()
    }
    const sum = input.reduce((a, x) => a + x)

    for (const x of input) {
        // likewise, order matters here for block and gradient modes
        if (mode === 'block') {
            result.push((accumulator / sum).toFixed(2))
            accumulator += x
        } else {
            accumulator += x
            result.push((accumulator / sum).toFixed(2))
        }
    }
    return result
}
function interpolateColor(color1, color2, percentage) {
    // Convert colors to RGB
    let color1RGB = hexToRGB(color1)
    let color2RGB = hexToRGB(color2)

    // Determine which color is lighter and adjust the percentage
    const lightness1 = (color1RGB.r * 0.299 + color1RGB.g * 0.587 + color1RGB.b * 0.114)
    const lightness2 = (color2RGB.r * 0.299 + color2RGB.g * 0.587 + color2RGB.b * 0.114)
    if (lightness1 > lightness2) {
        // flip
        [color2RGB, color1RGB] = [color1RGB, color2RGB]
        percentage = 1 - percentage
    }

    // Interpolate colors using the adjusted percentage
    const r = Math.round(color1RGB.r + (color2RGB.r - color1RGB.r) * percentage)
    const g = Math.round(color1RGB.g + (color2RGB.g - color1RGB.g) * percentage)
    const b = Math.round(color1RGB.b + (color2RGB.b - color1RGB.b) * percentage)

    return RGBToHex(
        ...[r, g, b].map(v => {
            // clamp dem numbers!
            if (v > 255) {
                v = 255
            }
            if (v < 0) {
                v = 0
            }
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
    const hexR = r.toString(16).padStart(2, "0")
    const hexG = g.toString(16).padStart(2, "0")
    const hexB = b.toString(16).padStart(2, "0")
    return `#${hexR}${hexG}${hexB}`
}

class ColorStop {
    constructor(data) {
        this.pos = data[0]
        this.colorCode = data[1]
    }
}
class FlagColors {
    constructor(flag) {
        this.blockColors = toCumulativeWeights(flag.stripes.map(stripe => stripe.height), 'block').map((x, i) => new ColorStop([x, flag.stripes[i].code]))
        this.gradientColors = toCumulativeWeights(flag.stripes.map(stripe => stripe.height), 'gradient').map((x, i) => new ColorStop([x, flag.stripes[i].code]))
        // Sort color stops in reverse order, so getColor checks for the highest value that the input is "to the right" of.
        this.blockColors.sort((a, b) => a.pos > b.pos ? -1 : a.pos < b.pos ? 1 : 0)
        this.gradientColors.sort((a, b) => a.pos > b.pos ? -1 : a.pos < b.pos ? 1 : 0)
    }
    getColor(pos, mode = 'block') {
        if (mode === 'block') {
            for (const stop of this.blockColors) {
                if (pos >= stop.pos) {
                    return stop.colorCode
                }
            }
        }
        else if (mode === 'gradient') {
            for (const i in this.gradientColors) {
                if (pos === this.gradientColors[i].pos) {
                    return this.gradientColors[i].colorCode
                }
                else if (pos >= this.gradientColors[i].pos) {
                    const leftColorStop = this.gradientColors[i]
                    const rightColorStop = this.gradientColors[i - 1] ?? leftColorStop

                    // + 0.01 cause dPos = 0 at the end if the flag
                    const dPos = 0.01 + (rightColorStop.pos - leftColorStop.pos)
                    const percentage = ((pos - leftColorStop.pos) / dPos)

                    return interpolateColor(leftColorStop.colorCode, rightColorStop.colorCode, percentage)
                }
            }
        }
        return null
    }

}

// tfw nobody has what you need so you roll your own
class ArgParser {
    #options = {}
    #singleHyphenArgSplitter = /-(\w{2,})/ig
    constructor(options) {
        this.#options = options
    }
    #stripDashes(str) {
        return str.replace(/^-+/g, '')
    }
    #findOpt(potentialOption) {
        for (const [name, value] of Object.entries(this.#options)) {
            if (name === potentialOption || (value.aliases && value.aliases.includes(potentialOption))) {
                return { name: name, ...value }
            }
        }
        return null
    }
    listOptions() {
        let output = []
        const SPACES = 10
        for (const [name, value] of Object.entries(this.#options)) {
            let str = `  --${name}`
            if (value.aliases) {
                str += `, -${value.aliases.join(', -')}`
                str = chalk.blueBright(str) // make the options blue before continuing
                str = str.padEnd(str.length + (SPACES - name.length), " ")
                str += `  ${value.description}`
                output.push(str)
            }
        }
        return output.join('\n').trim()
    }
    parse() {
        let inputArray = [...process.argv.slice(2)] // copy

        // expand any grouped options ("-abc" -> ["-a", "-b", "-c"])
        // tbh its more like ["a", "b", "c"] but who cares? not this code
        for (const index in inputArray) {
            const arg = inputArray[index]
            const matches = [...arg.matchAll(this.#singleHyphenArgSplitter)][0] // matchAll is annoying...
            if (!matches || !matches[1]) {
                continue
            }
            const options = matches[1].split('')
            inputArray.splice(index, 1, ...options)
        }

        let args = []
        let options = {}
        // now start actually parsing
        for (const key in inputArray) {
            const index = parseInt(key)
            const input = inputArray[index]
            if (!input) {
                continue
            }
            const lowerCasedInput = input.toLowerCase()
            const potentialOption = this.#findOpt(this.#stripDashes(lowerCasedInput))
            if (potentialOption) {
                if (potentialOption.hasArg) {
                    // look forward
                    const optionArg = inputArray[index + 1]
                    if (optionArg && !optionArg.startsWith('-')) {
                        options[potentialOption.name] = optionArg.toLowerCase()
                    } else {
                        console.log(`--${potentialOption.name} is missing a value!`)
                        process.exit(1)
                    }
                } else {
                    options[potentialOption.name] = true
                }
            } else {
                args.push(lowerCasedInput)
            }
        }
        return { args, options }
    }
}

module.exports = { interpolateColor, FlagColors, ArgParser }