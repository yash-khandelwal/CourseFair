require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

// custome functions and variables
const formatQuery = (query) => {
    return query.replace(" ", "+").substring(0, 100);
}
var items = [];
var videos = [];
var search = "";
app.get("/", (req, res) => {
    // res.sendFile("/index.html");
    console.log("GET Request");
    res.render("index", {items: items, videos: videos, search:search});
});

app.post("/", (req, res) => {
    console.log("POST Request");
    var reqData = req.body;
    console.log("post: ");
    console.log(reqData);
    var query = reqData.query;
    search = query;
    query = formatQuery(query) + "+course";
    var key = process.env.KEY;
    console.log(key);
    var type = "video";
    var maxResults = 32;
    var part = "snippet";
    var endPoint = "https://www.googleapis.com/youtube/v3/search";
    var url = endPoint + "?part=" + part + "&q=" + query + "&maxResults=" + maxResults + "&type=" + type + "&key=" + key;
    console.log(url);
    // res.send("Thanks for posting!");
    https.get(url, (response) => {
        console.log(response.statusCode);
        if(response.statusCode != 200){
            res.send("Invalid query!");
            return;
        }
        var chunks = [];
        response.on("data", (data) => {
            console.log(data);
            chunks.push(data);
            // var searchData = JSON.parse(data);
            // var items = searchData.items;
            // for(let i = 0; i < length(items); i++){
            // }
            // console.log(searchData);
            // res.sendFile("/results.html");
        }).on("end", () => {
            var data = Buffer.concat(chunks);
            var searchData = JSON.parse(data);
            // console.log(searchData);
            items = searchData.items;
            part = "statistics";
            endPoint = "https://www.googleapis.com/youtube/v3/videos";
            ids = "";
            for(let i = 0; i < items.length; i++){
                console.log(items[i].id.videoId);
                ids = ids + items[i].id.videoId;
                ids = ids + ",";
            }
            url = endPoint + "?part=" + part + "&id=" + ids + "&key=" + key;
            console.log(url);
            https.get(url, (videoResponse) => {
                console.log(videoResponse.statusCode);
                if(videoResponse.statusCode != 200){
                    res.send("Resource not found!!");
                    return;
                }
                chunks = [];
                videoResponse.on("data", (videoData) => {
                    chunks.push(videoData);
                }).on("end", () => {
                    videoData = Buffer.concat(chunks);
                    videoData = JSON.parse(videoData);
                    // console.log(videoData);
                    videos = videoData.items;
                    console.log(videos);
                    res.redirect("/")
                })
            });
            // console.log(items);
            // res.redirect("/");
            // res.send();
        })
    });
});

app.listen(3000, () => {
    console.log("Server running on port number: 3000");
});