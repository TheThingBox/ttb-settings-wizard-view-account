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
    cipheredPassword: '',
    firstname: '',
    lastname: ''
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
    } else if(data.createNew === 'true' || data.createNew === true){
      if(!data.email || data.email === '' || !data.firstname || data.firstname === '' || !data.lastname || data.lastname === ''){
        allGood = false
      }
    }

    if(allGood){
      interface_utils.localCipher(data.password).then(cipheredPassword => {
        if(data.reachable && data.reachable.zoib === true && data.reachable.coldfacts === true){
          interface_utils.ZOIB.setAccount(data.login, data.password)
          interface_utils.ZOIB.login()
          .then(login => {
            if(login !== null){
              stats.zoib.login = data.login
              stats.zoib.cipheredPassword = cipheredPassword
              stats.zoib.firstname = login.user.firstname.value
              stats.zoib.lastname = login.user.lastname.value
              stats.zoib.linked = true
              stats.zoib.error = null
              syncStats(true)
              res.json({message: "OK", key: "answer_accepted_loged", params: {
                firstname: login.user.firstname.value,
                lastname: login.user.lastname.value
              }})
            } else {
              res.json({message: "Error", key: "wrong_zoib_login", params: {}})
            }
          })
          .catch(err => {
            stats.zoib.error="no network"
            stats.zoib.login = data.login
            stats.zoib.cipheredPassword = cipheredPassword
            stats.zoib.firstname = ''
            stats.zoib.lastname = ''
            stats.zoib.linked = false
            syncStats(true)
            res.json({message: "Error", key: "answer_accepted_not_loged", params: {err}})
          })
        } else {
          stats.zoib.error="no network"
          stats.zoib.login = data.login
          stats.zoib.cipheredPassword = cipheredPassword
          stats.zoib.firstname = ''
          stats.zoib.lastname = ''
          stats.zoib.linked = false
          syncStats(true)
          res.json({message: "OK", key: "answer_accepted_not_loged", params: {}})
        }
      })
    } else {
      res.json({message: "Error", key: "answer_not_accepted", params: {}})
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
