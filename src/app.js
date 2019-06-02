const express = require('express')
const http = require('http')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')

const fs = require('fs')
const path = require('path')

const config = require('../config/config.json')

const app = express()
const rootRouter = require('./routes/root.js')
const ltiRouter = require('./routes/lti.js')

function normalizePort(val) {
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
    const addr = server.address()
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port
    console.log('Listening on ' + bind)
}

const port = normalizePort(process.env.PORT || '3001')
app.set('port', port)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(session({
    secret: config.cookieSecret
}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', rootRouter)
app.use('/lti', ltiRouter.router)

const server = http.createServer(app)
server.listen(port)
server.on('error', onError);
server.on('listening', onListening);
