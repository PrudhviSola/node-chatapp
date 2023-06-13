const express=require('express')
const http=require('http')
const sockeio=require('socket.io')
const path=require('path')
const Filter=require('bad-words')
const app=express()
const server=http.createServer(app)
const io=sockeio(server)
const {generateMessage,generateLocationMessage}=require('../src/utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const port=process.env.PORT || 3000
const publicDirectoryPath=path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

//let count=0


io.on('connection',(socket)=>{
   // console.log('New websocket connection')

    // socket.emit('countUpdated',count)
    // socket.on('increment',()=>{
    //     count++
    //     //socket.emit('countUpdated',count)
    //     io.emit('countUpdated',count)
    // })
   // socket.emit('message','Welcome')
    // socket.emit('message',generateMessage('Welcome!'))
    // socket.broadcast.emit('message',generateMessage('A new user has entered'))

    socket.on('join',({username,room},callback)=>{
        //either one property of this will be available
        const {error,user}=addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })
    socket.on('sendMessage',(message, cb)=>{
        const user=getUser(socket.id)
        const filter=new Filter()
        if(filter.isProfane(message))
            return cb('profanity is not allowed')

        io.to(user.room).emit('message',generateMessage(user.username,message))
        cb()
    })
    socket.on('sendLocation',(coords,cb)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        cb()
    })

    //Event for disconnecting,it should be used as a callback in connected client
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username}  has left.`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
             })
})



server.listen(port,()=>{
    console.log('Server is up and running on port!! ',port)
})