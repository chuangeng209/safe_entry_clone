const moment = require('moment');

const logger = (req, res, next) => {
    console.log(`${req.protocol}://${req.get('host')}${req.originalUrl}: ${moment().format()}`) //Log req from url 
    next() // to move to next middleware function 
}

module.exports = logger;