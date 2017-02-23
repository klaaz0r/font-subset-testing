const subset = require('subsetty')
const converter = require('font-converter')
const fs = require('fs')
const path = require('path')
const handlebars = require('handlebars')
const uuid = require('node-uuid')

//all the fonts from the font folder
const fonts = fs.readdirSync('fonts')
const fontTemplate = fs.readFileSync('templates/font.hbs').toString()
const overviewTemplate = fs.readFileSync('templates/overview.hbs').toString()
//subset text
const text = `
  Hello world! how are you doing? I am doing
  great!
  are you very fat..?
  `

try {
  fs.mkdirSync('html')
  fs.mkdirSync('.tmp')
  fs.mkdirSync('html/fonts')
} catch (e) {
  console.log('folder already exsists')
}
//map the fonts to an object for handlebars
const fontsObj = fonts.map(font => {
  const name = font.replace('.ttf', '')
  const subsetFontName = `subset.${name}.woff`
  const completeFontName = `complete.${name}.woff`
  const subsetFontPath = `fonts/${subsetFontName}`
  const completeFontPath = `fonts/${completeFontName}`

  return {
    name,
    text,
    completeFontPath,
    subsetFontPath,
    subsetFontName,
    completeFontName
  }
})

createFontPage(fontsObj)
createOverviewPage(fontsObj)

function createFontPage(fontsObj) {
  const template = handlebars.compile(fontTemplate)
  fontsObj.forEach(font => {
    const html = template(font)
    fs.writeFile(`html/${font.name}.html`, html)
  })
}

function createOverviewPage(fontsObj) {
  const template = handlebars.compile(overviewTemplate)
  const names = fontsObj.map(font => {
    return { url: `${font.name}.html`, name: font.name }
  })
  const html = template({ link: names })
  fs.writeFile(`html/index.html`, html)
}

fonts.forEach(font => {
  return subsetFont('fonts/' + font, text)
})

fonts.forEach(font => {
  const input = 'fonts/' + font
  const output = 'html/fonts/complete.' + font.replace('.ttf', '.woff')
  return convertFont(input, output)
})

function subsetFont(fontPath, text) {
  const buffer = fs.readFileSync(fontPath)
  return subset.fromBuffer(buffer, text)
    .then(function handle(buffer) {
      const newFontName = 'html/fonts/subset.' + path.basename(fontPath).replace('.ttf', '.woff')
      const tmpPath = './.tmp/' + uuid.v4()
      fs.writeFileSync(tmpPath, buffer)
      return convertFont(tmpPath, newFontName)
    })
}

function convertFont(inputFont, outputFont) {
  return converter(inputFont, outputFont, function(err) {
    if (err) {
      console.log('something went wrong with the converter');
    } else {
      return outputFont
    }
  })
}
