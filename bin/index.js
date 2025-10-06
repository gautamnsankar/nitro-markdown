#!/usr/bin/env node
import { hideBin } from "yargs/helpers"
import utils from "../src/Utils.js"
import yargs from "yargs"
import Nitro from "../src/Nitro.js"

yargs(hideBin(process.argv)).command('compile [filePath]', 'compiles nitro file to HTML', (yargs) => {
    return yargs.positional('filePath', {
        describe: 'path to file to compile',
        default: undefined
    })
}, (argv) => {
    if (!argv.filePath) {
        return utils.messageLog("File not provided.", "Error")
    }

    let startTime = Date.now()

    new Nitro(argv.filePath).compile()
    utils.messageLog(`Compilation completed in ${Date.now() - startTime}ms`, "Warn")
}).parse()
