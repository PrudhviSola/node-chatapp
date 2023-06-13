const socket=io()

/**Paramters passed in client will be available as callback parameter for clients
 * the order in which they are passed matters not the name of parameters
 */
// socket.on('countUpdated',(count)=>{
//     console.log('The count has been updated',count)
// })

// document.querySelector('#increment').addEventListener('click',()=>{
//     console.log('clicked')
//     socket.emit('increment')
// })

// Elements ($is used just for convention)
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML


//Options
//location search is global parameter which will have access to search parameters
/*>location.search
>'?Username=prudhvi&room=1'*/
const {username,room}=Qs.parse(location.search,{
    ignoreQueryPrefix:true //This will remove ? 
})
// console.log('test',username)
// console.log('test',room)

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage',(message)=>{
    console.log(message.url)
    const html = Mustache.render(locationMessageTemplate, {
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    //console.log(message.url)
    const html = Mustache.render(sidebarTemplate, {
       room,
       users
    })
    document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    //Below line of code disables form once it is submitted
    $messageFormButton.setAttribute('disabled', 'disabled')
    //const message=document.querySelector('input').value
    //Alternative way
    const message=e.target.elements.message.value//message is the name defined for input in html file
    //console.log(e.target.elements.message)
    socket.emit('sendMessage', message, (error) => {
        //This is for reenabling for sending form
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation)
        return alert('Geolocation is not supported by your browser')
    /**
     * This function is a asynchronous function but doesnt support promises async/await
     * So we have defined normal function
     */
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        //console.log(position)
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')  
        })
    })
})

socket.emit('join',{
    username,
    room
},(error)=>{
    if (error) {
        alert(error)
        location.href = '/'
    }
})