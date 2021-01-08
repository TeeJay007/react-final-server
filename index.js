const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const tokenSecret = "somesecretpasswordornot"
const mongoose = require('mongoose');
mongoose.connect('mongodb://192.168.1.236:27017/database', {useNewUrlParser: true, useUnifiedTopology: true});

const User = mongoose.model('User', {
    username: String,
    password: String
})

const Message = mongoose.model('Message', {
    message: String,
    user: String,
    type: String,
    data: String,
    date: {type: Date, default: Date.now}
})


const express_port = 3000 //TODO: convert to .env
const ws_port = 8080

app.use(bodyParser.json())

app.post('/register', async (req, res) => { //username, password
    const {username, password} = req.body

    if(!username || !password){
        res.json({
            "success": false,
            "error": "Missing password or username."
        })
        return
    }

    if(username.length < 7 || password.length < 7 ||
        username.length > 20 || password.length > 100){
        res.json({
            "success": false,
            "error": "Username length must be:\n> 7, < 20,\n Password length must be:\n> 7, < 100."
        })
        return
    }

    if(!await User.findOne({username}).exec()){
        await new User({
            username, password
        }).save().then(() => {
            res.json({
                "success": true,
                "token": jwt.sign({username}, tokenSecret)
            })
        }).catch(() => {
            res.json({
                "success": false,
                "error": "Failed to create a new user."
            })
        })
    }else{
        res.json({
            "success": false,
            "error": "User already exists."
        })
    }
})

app.post('/login', async (req, res) => { //username, password
    const {username, password} = req.body

    if(!username || !password){
        res.json({
            "success": false,
            "error": "Missing password or username."
        })
        return
    }

    if(await User.findOne({username, password}).exec()){
        res.json({
            "success": true,
            "token": jwt.sign({username}, tokenSecret)
        })
        return
    }

    res.json({
        "success": false,
        "error": "Failed to login."
    })
})

const checkAuth = (req, res, next) => {
    const authHeader = req.headers.authorization

    if(authHeader){
        const token = authHeader.split(' ')[1]

        jwt.verify(token, tokenSecret, (err, usr) => {
            if(err) {
                return res.json({
                    "success": false,
                    "error": "Login failed."
                })
            }

            console.log(`Access granted`)
            console.log(usr)
            req.user = usr

            next()
        })
    }else{
        res.json({
            "success": false,
            "error": "Login failed."
        })
    }
}

app.listen(express_port, () => {
    console.log(`Listening express on ${express_port}!`)
})


//----------------------------

const WebSocket = require('ws')

class Server{
    constructor(port){
        this.wss = 
        new WebSocket.Server({
            port, clientTracking: true
        }, () => console.log(`Listening ws on ${port}!`))

        this.wss.on('connection', (ws) => {
            ws.on('message', (msg) => this.handleMessage(ws, msg))
            ws.on('close', () => this.handleClose(ws))

            const server = this
            Message.find({}).sort({date: 'asc'}).limit(10).exec((err, messages) => {
                for(const m of messages){
                    const data = JSON.parse(m.data)
                    ws.send(JSON.stringify({
                        username: m.user,
                        type: m.type,
                        data: data.data
                    }))
                }
            });
        })
    }

    handleClose(ws){
        if(ws.user)
            console.log(`User ${ws.user.username} disconnected.`)
        else
        console.log(`Some client disconnected..\n
        Currently connected ${wss.clients.size}`)
    }

    broadcastMessage(username, type, payload){
        this.wss.clients.forEach(c => {
            c.send(JSON.stringify({
                username,
                type,
                ...payload
            }))
        })
    }

    handleMessage(ws, message){
        try{
            const {type, data} = JSON.parse(message)

            if(ws.user){
                if(type === 'message'){
                    this.broadcastMessage(ws.user.username, type, {data})
                    new Message({
                        user: ws.user.username,
                        type,
                        data: JSON.stringify({data})
                    }).save()
                }
                if(type === 'location'){
                    this.broadcastMessage(ws.user.username, type, {data})
                    new Message({
                        user: ws.user.username,
                        type,
                        data: JSON.stringify({data})
                    }).save()
                }
            }else{
                if(type === 'auth')
                    jwt.verify(data, tokenSecret, (err, usr) => {
                        if(err) {
                            ws.send(JSON.stringify({
                                type: 'error',
                                error: 'Failed to login.',
                            }))
                            ws.close()
                            return
                        }
                        ws.user = usr
                        
                        console.log(`User ${usr.username} logged in.`)
                        ws.send(JSON.stringify({
                            type: 'login',
                            username: usr.username,
                        }))
                    })
                else{
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: 'Failed to login.'
                    }))
                    ws.close()
                }
            }
        }catch(e){console.error(e)}
    }
}

new Server(ws_port)