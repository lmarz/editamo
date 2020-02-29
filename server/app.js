const PORT = 4242;

const express = require("express");
const app = express();
const path = require("path");

/* CONFIGURE EXPRESS */
app.use(express.static(path.join(__dirname, "/../client"))); /* Client-requests */
app.use("/cds", express.static(path.join(__dirname, "/../cds"))); /* Content-requests */

app.get("/", (req, res) => {
    res.sendFile(__dirname + "../client/index.html");
});

app.get("/login", (req, res) => {
    res.send("Test.");
});

app.listen(PORT, () => {
    console.log("Start server", PORT);
});