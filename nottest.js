const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  
})

ws.on('message', (data) => {
  console.log(data);
})

const axios = require('axios')

axios({
    method: 'post',
    url: 'http://localhost:3000/register',
    data: {
      username: 'username',
      password: 'password'
    }
}).then((resp) => {
    console.log(resp.data)

    axios({
        method: 'post',
        url: 'http://localhost:3000/login',
        data: {
          username: 'username',
          password: 'password'
        }
    }).then((resp) => {
        console.log(resp.data)

        ws.send(JSON.stringify({
          token: resp.data.token
        }));

        ws.send(JSON.stringify({
          message: "AAA"
        }));

        axios({
            method: 'get',
            url: 'http://localhost:3000/info',
            headers: { 
                authorization: `Bearer ${resp.data.token}` 
            }
        }).then((resp) => console.log(resp.data))

    })
    
})