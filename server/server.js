const mongoose = require('mongoose')
const Menu = require('../models/menu')

const PROTO_PATH="./restaurant.proto";

// Import environment variables
require('dotenv').config()

//var grpc = require("grpc");
var grpc = require("@grpc/grpc-js");

var protoLoader = require("@grpc/proto-loader");

var packageDefinition = protoLoader.loadSync(PROTO_PATH,{
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

var restaurantProto =grpc.loadPackageDefinition(packageDefinition);

const {v4: uuidv4}=require("uuid");

// Setup database
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true , useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))

const server = new grpc.Server();
// const menu=[
//     {
//         id: "a68b823c-7ca6-44bc-b721-fb4d5312cafc",
//         name: "Tomyam Gung",
//         price: 500
//     },
//     {
//         id: "34415c7c-f82d-4e44-88ca-ae2a1aaa92b7",
//         name: "Somtam",
//         price: 60
//     },
//     {
//         id: "8551887c-f82d-4e44-88ca-ae2a1ccc92b7",
//         name: "Pad-Thai",
//         price: 120
//     }
// ];

server.addService(restaurantProto.RestaurantService.service,{
    getAllMenu: async (_,callback)=>{
        const menus = await Menu.find()
        callback(null, {menu: menus});
    },
    get: async (call,callback)=>{
        const menuItem = await Subscriber.findById(call.request.id)

        if(menuItem) {
            callback(null, menuItem);
        }else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
    },
    insert: async (call, callback)=>{

        const menuItem = new Menu({
            name: call.request.name,
            price: call.request.price
        })

        try {
            const newMenu = await menuItem.save()
            callback(null, newMenu);
        } catch (err) {
            callback({
                code: grpc.status.BAD_REQUEST,
                details: "Bad request"
            });
        }
    },
    update: async (call,callback)=>{
        const existingMenuItem = await Menu.findById(call.request.id)

        if(existingMenuItem){
            if (call.request.name != null) {
                existingMenuItem.name = call.request.name
            }
            if (call.request.price != null) {
                existingMenuItem.price = call.request.price
            }
            const updatedMenuItem = await existingMenuItem.save()
            callback(null,updatedMenuItem);
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not Found"
            });
        }
    },
    remove: async (call, callback) => {
        try {
            const result = await Menu.findByIdAndDelete(call.request.id);
            callback(null,{});
        } catch (err) {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not Found"
            });
        }
    }
});

server.bindAsync("127.0.0.1:30043",grpc.ServerCredentials.createInsecure(), ()=>{server.start();});
console.log("Server running at http://127.0.0.1:30043");
