// Turn an input array of Numbers into an array of cumulative weights
function toCumulativeWeights(inputArray, mode = null) {
    // copy the input
    let input = [...inputArray]
    let result = []

    let accumulator = 0
    if (mode === 'gradient') {
        input.unshift(0)
        input.pop()
    }
    const sum = input.reduce((a, x) => a + x)

    for (const x of input) {
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
        percentage = 1 - percentage
        const temp = color1RGB
        color1RGB = color2RGB
        color2RGB = temp
    }

    // Interpolate colors using the adjusted percentage
    const r = Math.round(color1RGB.r + (color2RGB.r - color1RGB.r) * percentage)
    const g = Math.round(color1RGB.g + (color2RGB.g - color1RGB.g) * percentage)
    const b = Math.round(color1RGB.b + (color2RGB.b - color1RGB.b) * percentage)
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
        }))
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
    return "#" + hexR + hexG + hexB
}

class ColorStop {
    constructor(data) {
        this.pos = data[0];
        this.colorCode = data[1];
    }
}
class FlagColors {
    constructor(flag) {
        this.blockColors = toCumulativeWeights(flag.stripes.map(stripe => stripe.height), 'block').map((x, i) => new ColorStop([x, flag.stripes[i].code]));
        this.gradientColors = toCumulativeWeights(flag.stripes.map(stripe => stripe.height), 'gradient').map((x, i) => new ColorStop([x, flag.stripes[i].code]))
        // Sort color stops in reverse order, so getColor checks for the highest value that the input is "to the right" of.
        this.blockColors.sort((a, b) => a.pos > b.pos ? -1 : a.pos < b.pos ? 1 : 0);
        this.gradientColors.sort((a, b) => a.pos > b.pos ? -1 : a.pos < b.pos ? 1 : 0);
    }
    getColor(pos, mode = 'block') {
        if (mode === 'block') {
            for (const stop of this.blockColors) {
                if (pos >= stop.pos) {
                    return stop.colorCode;
                }
            }
        }
        else if (mode === 'gradient') {
            for (const i in this.gradientColors) {
                if (pos === this.gradientColors[i].pos) {
                    return this.gradientColors[i].colorCode;
                }
                else if (pos >= this.gradientColors[i].pos) {
                    const leftColorStop = this.gradientColors[i];
                    const rightColorStop = this.gradientColors[i - 1] ?? leftColorStop;

                    const dPos = rightColorStop.pos - leftColorStop.pos;
                    const percentage = ((pos - leftColorStop.pos) / dPos);

                    return interpolateColor(leftColorStop.colorCode, rightColorStop.colorCode, percentage);
                }
            }
        }
        return null
    }

}

module.exports = { toCumulativeWeights, FlagColors }