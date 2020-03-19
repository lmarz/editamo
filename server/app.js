const PORT = 4242;

const express = require("express");
const app = express();
const path = require("path");
const body_parser = require("body-parser");

/* CONFIGURE EXPRESS */
app.use(express.static(path.join(__dirname, "/../client"))); /* Client-requests */
app.use("/cds", express.static(path.join(__dirname, "/../cds"))); /* Content-requests */
app.use(body_parser.text());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "../client/index.html");
});

app.get("/login", (req, res) => {
    res.send("Test.");
});

app.post("/upload", (req, res) => {
    console.log(JSON.parse(req.body));
    res.end();
});

app.listen(PORT, () => {
    console.log("Start server", PORT);
});