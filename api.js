const bodyParser = require('body-parser');
const path = require('path')
const fs = require('fs')
const InterfaceUtils = require('ttbd-interface-utils')
const interface_utils = new InterfaceUtils()

const name = 'account'
var settingsPath = null

var stats = {
  initialized: false,
  status: 'nok',
  validateAction: 'none',
  coldfacts: {
    linked: false,
    mail: '',
    account: ''
  },
  zoib: {
    linked: false,
    login: '',
    cipheredPassword: ''
  }
}

function init(app, apiToExpose, persistenceDir) {
  settingsPath = path.join(persistenceDir, name)
  try {
    fs.mkdirSync(settingsPath, { recursive: true })
  } catch(e){}
  settingsPath = path.join(settingsPath, 'settings.json')
  syncStats()

  app.use(apiToExpose, bodyParser.json());
  app.get(apiToExpose, function(req, res){
    syncStats()
    res.json(stats)
  });

  app.post(apiToExpose, function(req, res){
    var data = req.body;
    var allGood = true

    if(!data.login || data.login === '' || !data.password || data.password === '' || !data.deviceName || data.deviceName === ''){
      allGood = false
    } else if(data.useAlreadyExist === 'false' || data.useAlreadyExist === false){
      if(!data.email || data.email === '' || !data.firstname || data.firstname === '' || !data.lastname || data.lastname === ''){
        allGood = false
      }
    }

    if(allGood){
      interface_utils.ZOIB.setAccount(data.login, data.password)
      interface_utils.ZOIB.login()
      .then(status => {
        if(status.message.toUpperCase() === 'OK'){
          return interface_utils.localCipher(data.password)
        } else {
          throw new Error(status.message)
        }
      })
      .then( cipheredPassword => {
        res.json(stats)
      })
      .catch( err => {
        var message = err
        if(err instanceof Error){
          message = err.message
        } else if(typeof err.toString === 'function'){
          message = err.toString()
        }
        res.status(500).json({ message: message })
      })

    } else {
      res.status(403).json({ message: "wrong params" })
    }
  });
}

function syncStats(update){
  if(!settingsPath){
    return
  }
  var statsFromFile
  try {
    statsFromFile = JSON.parse(fs.readFileSync(settingsPath))
    if(update === true){
      stats = Object.assign({}, statsFromFile, stats)
    } else {
      stats = Object.assign({}, stats, statsFromFile)
    }
  } catch(e){
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(stats, null, 4), { encoding: 'utf8'})
    } catch(e){}
  }
  if(stats.initialized === false || update === true){
    stats.initialized = true
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(stats, null, 4), { encoding: 'utf8'})
    } catch(e){}
  }
}

function getStats(){
  return stats
}

module.exports = {
  init: init,
  getStats: getStats,
  syncStats: syncStats,
  order: 30,
  canIgnore: true
}
