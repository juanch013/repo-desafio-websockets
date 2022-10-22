const express = require("express");
const handlebars = require("express-handlebars")
const productosRouter = require("./routes/productos")
const fs = require('fs');
const app = express()

const {Server} = require('socket.io');

//Donde cargar archivos estaticos
app.use(express.static('public'))

//Contenedor
const co = require("./script")
const conte = new co("productos.txt")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const server = app.listen(8080, ()=>console.log("server is listening on port 8080"))

const io = new Server(server);

app.use(express.static(__dirname+"/public"));
let mensajes
if(fs.readFileSync("./data/mensajes.txt")==""){
    mensajes = [];
}else{
    mensajes = JSON.parse(fs.readFileSync("./data/mensajes.txt"));
}

//creo el socket del server
io.on("connection",async (sock)=>{
    console.log("nuevo cliente");

    sock.emit("messageFromServer","se conecto bien de bien che")


    let historico = fs.readFileSync('./data/mensajes.txt');
    io.sockets.emit("chat",JSON.parse(historico));
    sock.on("message",(data)=>{
        mensajes.push(data)
        try {
            fs.writeFileSync('./data/mensajes.txt',JSON.stringify(mensajes))
        } catch (error) {
            console.log(error);
        }

        let historico = fs.readFileSync('./data/mensajes.txt');
        io.sockets.emit("chat",JSON.parse(historico));
    })

    let allProducts = await conte.getAll();
    io.sockets.emit("todoProductos",allProducts);
    sock.on("product",async (data)=>{
        await conte.save(data);

        let allProducts = await conte.getAll();
        io.sockets.emit("todoProductos",allProducts);
    })
})

app.use("/productos", productosRouter)

//Defino el motor de plantillas
app.engine("handlebars",handlebars.engine())

//Ubico la carpeta o directorio donde ubico los templates .handlebars
app.set("views", "./views")

//Defino el motor para express
app.set("view engine", "handlebars")