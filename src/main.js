#!/usr/bin/env node
const chalk = require("chalk")

const flags = require("./flags.json")
const zlib = require("zlib");
const {name, version} = require('../package.json')
const BLOCK = "█"
const STRING_LEN = process.stdout.columns
const TERMINAL_HEIGHT = process.stdout.rows
const MINI_FLAG_DISTANCE = 10
const NAZI_GERMANY_PRIDE_FLAG = zlib.gunzipSync(Buffer.from("1f8b0800000000000003ed5ccb8ee4360cbcef2fcc25b75c1681a8872dc79fb0c8e698007b4c6e8991eb7e7e48d1729ab49ce987dd700f08b37a1685865fdb2a9125da6fdfdcf4f62de4d18fdec3e84637fdf8669c71c61967dcbbdca7b39d9071c61967dcab7026a0c65dc785113c8662d3e8078c69146c37e23f425eb1d16128368d216028368e30604c9fd579e1e749ee8771c699987e400ec56bc0908214d208ce13a67f2ef9885cea08d3af82c74fe708d3974b3ed1be0261fa4df028a42912a65fc47e5285f83ec4a162faf3927743c5f4b3964ec6f4fbeab805f2b8742eb1409d275e134482dc0f7e17fa40989cb86f3dce19347584e9bbe0ddd8458ce90f71967eecc7fe24bf03e35e8a33f13d0b47b2812173b722049120850045cc43205c294c3bf1f4c990c28ae23c63fa5b9ce77c513f5c90ae5cfcff331d6d82019c5e66c8b9e4e84bdee443f356f0dc9609726ec38c1f6964f50c739e9fa071a6bf1f8e6b56e045483a82d4d592c0ad13c7c3c584ec00c6f4f552f4a0af10291f248e9b7575cde01597987ebadc3f27a52531fd4b8b1ee371f1dc653f3bf1117f0bb927c8c2c3f7630c18ca6739d3efdb3813e35372dd88d96be8e5d0299570223c3771f50bc471b72a7f008e9be5146893a9ecc021ee0ee45421b3447633d68ec6cd82d657c8441df73d433820f85142cc025dc7a1ce7cc131677eabb7826547ce18b2f038d54830cee4f8a91c656e18d24b20e9f56c667e15fcd19ec15021066e060e71926bf9bc33ab4d1c42cf3cde94198f4d3e112a940bb26151648e1daeab71a5c0a1f277577150fe4e1cfdf5eaff1ac63e639818bf3267c27b271771c891ff17bd1a76370e2f5e032beb60725d282ceb608748b8cb15a20c1ee610a97ca2ed66b98ab40926470e390ff0ea5759011352021c3b0867cc1c728ae838f6d8ff1c529837f26f3220665c693cf9a661646b812fc699d4dec915238156c19463ba519e7681438cc6f5a06dd6fd000bd4c27b5f718c1c7b57a14c8bbe429816036d8724996ba6793f21bb0a35ff6d78031baa0769c1fb2ec57de75ffaefa8054f9c7f0c15aa5f25544875a6353d0a5bd37b15cef4f611bde5da59e8ede02a84de62f15942ece4beea3ed326051973e31972e4b1b37cbdbbcc3d59a52f4be4bb0387d8795f12abe7a86bea385451bf40a9eb82078b7aa8103c74b1422c96c6c4f18e1a87c4a1f26057715d1e4c4adb6398d2be0a674a7b27571cc44c78d044081552dc806387623ed0f6be70adbf765586b96a016bda10105c85740a12c71e957ce4500a3654a8d6bc5cf1600b49dbaa852157486f885a0219571e17dac58b2fb7fe1c43c138d3d9e3b8303751ad56c91a79ee6e353de40a55d32f1029ce3af9bd4fc3d6dec0968b40f765c683ab64a9fd10067415c24dd92b776e57f638e5cd505d0b47379cc5664e5d16ca02863294ce343c8c33ed7d2a875522268b32bde3271d4893dd931bc6dadeee5647eea23ad238ce156a9ce78a274f3250b183b5b17673fac8214d9f0d87e878e90de5610c846a18c35995c27a143e1a67727c345712496557a0bef902f528456836493d27e33ab00fd5a50a61abe48143cc5eeb6e87ab3258daa4055e254b942aa8e433a41370f81d4eed3b8cc93ef403419ecfc68b2dcef4bb36ce44f8c371cdb7c184ffaa6fb9f09217595be7d947b6f56fc9ec022126c171dcdc02d03240da96cbfc607579b8facb332f3971728a504f14c3b25626160470d6453a395b1333cef4f763714d2f24c4714818aa39099697da0879883d8a3fd5df5ec91894940ca1cc0752794750695d6e2e68cd2ff0292ff1112fd3d97248f8988de36ecd30a1cc5608258734537504f5329d3042d711a4cfb035e36db41494acfd24bf02e35e8a33e935ee3aae745cacd2755f1e6d902f6fc4890030d6af7f5c4f0fb487d2f2f0591d8b5b9acf71e5c61967526a9c71c61967026a9c71c619773aeed3bfc3a2ed3e666c0000", "hex"))

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

if (ARGS[0].toLowerCase() == "swastika") {
	console.log(NAZI_GERMANY_PRIDE_FLAG.toString())
	return
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
