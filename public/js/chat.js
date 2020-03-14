const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;


// Options
//location get the query string
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

//auto scroll down
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    //height of the last message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //height of messages container
    const containerHeight = $messages.scrollHeight;

    //how far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }

};

//Event handler
socket.on("message", (msg) => {
    const html = Mustache.render(messageTemplate, {
        username: msg.username, 
        message: msg.text,
        createdAt: moment(msg.createdAt).format("h:mm a"),
    });

    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});



socket.on("locationMessage", (urlMsg) => {
    const html = Mustache.render(location, {
        username: urlMsg.username, 
        url: urlMsg.url,
        createdAt: moment(urlMsg.createdAt).format("h:mm a"),
    });
    
    $messages.insertAdjacentElement("beforeend", html);
    autoscroll();
});


socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room: room, 
        users: users, 
    });

    document.querySelector("#sidebar").innerHTML = html;
});


//Query form
$messageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    $messageFormButton.setAttribute("disabled", "disabled");
    //disable

    // Get the message from the form with name
    const msg = event.target.elements.message.value;

    socket.emit("sendMessage", msg, (error) => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();
        //enable

        if (error) {
            return console.log(error);
        }
        console.log("Message delivered!");
    });
});


$sendLocationButton.addEventListener("click", (event) => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser!");
    }

    $sendLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longtitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute("disabled");
            console.log("Location shared!");
        });
    });
});

socket.emit("join", { username, room}, (error) => {
    if (error){
        alert(error);
        location.href = "/";
    }
});

