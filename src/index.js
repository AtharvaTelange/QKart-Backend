const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");

let server = config.mongoose.url;
let PORT = config.port;
// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Create Mongo connection and get the express app to listen on config.port

mongoose
.connect(server, config.mongoose.options)
.then(()=>console.log("Connected to DB at", server))
.catch((error)=> console.log("Failed to connect to DB\n", error));

app.listen(PORT, ()=>{
    console.log("Server listening at", PORT);
})
