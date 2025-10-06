import utils from "../src/Utils.js"
import fs from "fs"

class Token {
    constructor(type, value) {
        this.type = type
        this.value = value
    }
}

class Nitro {
    #__tokens = []
    #__filePath = ""

    #__fileContent = ""
    
    // To be used later.
    #__errorStack = []
    #__error = false

    constructor(filePath) {
        this.#__filePath = filePath;
    }

    #__getSubstring(string, start, end) {
        return string.substring(string.indexOf(start) + 1, string.lastIndexOf(end))
    }

    #__isTag(stringToCheck) {
        return (this.#__getSubstring(stringToCheck, "[", "]").length != 0)
    }

    #__fetchTagType(stringToCheck) {
        return stringToCheck.includes("!") && "Closing" || "Opening"
    }

    #__fetchEndingTagIndex(splitArray, startIndex) {
        for (let i = startIndex; i < splitArray.length; i++) {
            let isTag = this.#__isTag(splitArray[i])
            let tagType = this.#__fetchTagType(splitArray[i])

            if (isTag && tagType == "Closing") {
                return [splitArray[i], i]
            }
        }

        return []
    }

    #__fetchAllValuesBetween(splitArray, start, end) {
        let foundValues = []

        for (let i = start; i <= end; i++) {
            let isTag = this.#__isTag(splitArray[i])

            if (isTag) {
                continue
            }

            foundValues.push(splitArray[i])
        }

        return foundValues
    }

    #__returnTagSettings(tag) {
        let settingsDictionary = {}

        tag = tag.replace(/\s+/g, "")
        tag = tag.replace(/\[/g, "")
        tag = tag.replace(/]/g, "")

        let splitTable = tag.split(",")

        for (let i = 0; i < splitTable.length; i++) {
            let key = splitTable[i].split("=")[0]
            let value = splitTable[i].split("=")[1]

            settingsDictionary[key] = value
        }
        
        return settingsDictionary
    }

    #__getTokensUntilEnd(start) {
        let foundTokens = []

        for (let i = start; i < (this.#__tokens.length - 1); i++) {
            if (this.#__tokens[i].type == "Tag") {
                break
            }

            foundTokens.push(this.#__tokens[i])
        }

        return foundTokens
    }

    #__convertTokensToText(tokens, ignoreLineBreaks) {
        let finalString = ignoreLineBreaks && "" || "\n"

        for (let i = 0; i < tokens.length; i++) {
            finalString += tokens[i].value.token
            
            if (!ignoreLineBreaks && i != (tokens.length - 1)) {
                finalString += "\n<br>\n"
            } else if (!ignoreLineBreaks && i == (tokens.length - 1)) {
                finalString += "\n"
            }
        }

        return finalString
    }

    #__readFile() {
        this.#__fileContent = fs.readFileSync(this.#__filePath).toString('utf-8')
    }

    #__processFile() {
        this.#__fileContent = this.#__fileContent.split('\n')
    }

    #__tokenise() {
        for (let i = 0; i < this.#__fileContent.length; i++) {
            let currentChunk = this.#__fileContent[i]
            let isTag = this.#__isTag(currentChunk)

            if (!isTag) {
                continue
            }

            let tagType = this.#__fetchTagType(currentChunk)

            if (tagType != "Opening") {
                continue
            }

            let endingData = this.#__fetchEndingTagIndex(this.#__fileContent, i + 1)
            let endingTag = endingData[0]
            let endingIndex = endingData[1]
            let textBetween = this.#__fetchAllValuesBetween(this.#__fileContent, i + 1, endingIndex - 1)

            if (!endingTag) {
                this.#__error = true
                utils.messageLog(`Ending tag not found for tag at line ${i + 1}`, "Error") // Be more detailed later (add to error stack)
                continue
            }

            this.#__tokens.push(new Token("Tag", {name: "Opening", token: currentChunk}))

            for (let index = 0; index < textBetween.length; index++) {
                this.#__tokens.push(new Token("Text", {name: "Text", token: textBetween[index]}))
            }

            this.#__tokens.push(new Token("Tag", {name: "Ending", token: endingTag}))
        }
    }

    #__applyStyle(elementId, styleOptions) {
        for (const [styleName, styleValue] of Object.entries(styleOptions)) {
            if (styleName == "colour") {
                let styleString

                if (styleOptions.tag == "background") {
                    styleString = `
                    body {
                        background-color: ${styleValue};
                    }
                    `
                } else {
                    styleString = `
                    #${elementId} {
                        color: ${styleValue};
                    }
                    `
                }

                utils.appendData("build/index.css", styleString)
            }

            if (styleName == "image" && styleOptions.tag == "background") {
                let styleString = `
                body {
                    background-image: url('${styleValue}');
                    background-repeat: no-repeat;
                    background-attachment: fixed;
                    background-size: 100% 100%;
                }
                `
                utils.appendData("build/index.css", styleString)
            } 

            if (styleName == "italics") {
                let styleString = `
                #${elementId} {
                    font-style: italic;
                }
                `
                utils.appendData("build/index.css", styleString)
            }

            if (styleName == "bold") {
                let styleString = `
                #${elementId} {
                    font-weight: bold;
                }
                `
                utils.appendData("build/index.css", styleString)
            }

            if (styleName == "fontSize") {
                let styleString = `
                #${elementId} {
                    font-size: ${styleValue};
                }
                `
                utils.appendData("build/index.css", styleString)
            }

            if (styleName == "underline") {
                let styleString = `
                #${elementId} {
                    text-decoration: underline;
                }
                `
                utils.appendData("build/index.css", styleString)
            }

            if (styleName == "strike") {
                let styleString = `
                #${elementId} {
                    text-decoration: line-through;
                }
                `
                utils.appendData("build/index.css", styleString)
            }

            if (styleName == "center") {
                let styleString = `
                #${elementId} {
                    text-align: center;
                }
                `
                utils.appendData("build/index.css", styleString)
            }
        }
    }

    #__parse() {
        if (this.#__error) {
            return utils.messageLog("Failed to compile due to errors.", "Error")
        }

        for (let i = 0; i < this.#__tokens.length; i++) {
            let currentToken = this.#__tokens[i]

            if (currentToken.type != "Tag") {
                continue
            }

            if (currentToken.value.name != "Opening") {
                continue
            }

            let tagOptions = this.#__returnTagSettings(currentToken.value.token)
            
            if (!tagOptions.tag) {
                return utils.messageLog("Error when parsing, tag name missing.", "Error")
            }

            let tokensBetween = this.#__getTokensUntilEnd(i + 1)
            this.#__applyStyle(`id_${i.toString()}`, tagOptions)

            let text = this.#__convertTokensToText(tokensBetween)
            let id = `id_${i.toString()}`

            if (tagOptions.tag == "title") {
                utils.appendData("build/index.html", `<h1 id = ${id}>${text}</h1>`)
            }

            if (tagOptions.tag == "movingTitle") {
                utils.appendData("build/index.html", `<marquee id = ${id} scrollamount = ${tagOptions.speed || 10}>${text}</marquee>`)
            }

            if (tagOptions.tag == "list") {
                text = this.#__convertTokensToText(tokensBetween, true).trimStart().trimEnd().split("  ")
                let dataToAppend = `
                <ul>
                `
                
                for (let i = 0; i < text.length; i++) {
                    if (text[i].length <= 0) {
                        continue
                    }

                    dataToAppend += `\n<li>${text[i]}</li>\n`
                }

                dataToAppend += `\n</ul>`
                utils.appendData("build/index.html", dataToAppend)
            }

            if (tagOptions.tag == "paragraph") {
                utils.appendData("build/index.html", `<p id = ${id}>${text}</p>`)
            }

            if (tagOptions.tag == "highlight") {
                utils.appendData("build/index.html", `<mark id = ${id}>${text}</mark>`)
            }

            if (tagOptions.tag == "url") {
                utils.appendData("build/index.html", `<a id = ${id} href = "${text}">${tagOptions.text}</a>`)
            }

            if (tagOptions.tag == "break") {
                utils.appendData("build/index.html", "<br>")
            }

            if (tagOptions.tag == "image") {
                text = this.#__convertTokensToText(tokensBetween, true)
                utils.appendData("build/index.html", `<img id = ${id} src = "${text}">`)
            }

            if (tagOptions.tag == "executeJS") {
                utils.appendData("build/index.html", `<script>eval(${this.#__convertTokensToText(tokensBetween, true)})</script>`)
            }
        }
    }

    compile() {
        utils.createBuildFiles()

        this.#__readFile()
        this.#__processFile()
        this.#__tokenise()
        this.#__parse()
    }
}

export default Nitro
