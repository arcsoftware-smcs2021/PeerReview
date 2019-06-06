const express = require('express')
const http = require('http')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')

const fs = require('fs')
const path = require('path')

const config = {
    cookieSecret: process.env.COOKIE_SECRET
}

// Create the Express application and import the routers (these contain the bulk of the logic)
const app = express()
const rootRouter = require('./routes/root.js')
const ltiRouter = require('./routes/lti.js')

function normalizePort(val) {
    // Validates the port number, mostly boilerplate
    let port = parseInt(val, 10)

    if (isNaN(port)) {
        // named pipe
        return val
    }

    if (port >= 0) {
        // port number
        return port
    }

    return false
}

function onError(error) {
    // Error handling for the server, again just boilerplate to catch a few things

    if (error.syscall !== 'listen') {
        throw error
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges')
            process.exit(1)
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use')
            process.exit(1)
            break;
        default:
            throw error
    }
}


function onListening() {
    // Output a status message when listening

    const addr = server.address()
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port
    console.log('Listening on ' + bind)
}

// Set the port number, default to 3001
const port = normalizePort(process.env.PORT || '3001')
app.set('port', port)

// Set the directory for views, these are templated using pug (https://pugjs.org)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// Trust the Heroku proxy
app.set('trust proxy', true)

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Use the session library, this functions similar to PHP sessions and stores a reference to data
// using a unique cookie for each user
app.use(session({
    secret: config.cookieSecret
}))
app.use(cookieParser())

// Set the directory where static files are stored
app.use(express.static(path.join(__dirname, '..', 'public')))

// Use the routers
app.use('/', rootRouter)
app.use('/lti', ltiRouter)

// Start the server
const server = http.createServer(app)
server.listen(port)
server.on('error', onError);
server.on('listening', onListening);
