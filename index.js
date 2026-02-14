//NodeJS uses the CommonJS module system (i.e. the "require()")
//as opposed to ES6 modules (similar concept) but different syntax
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Use bodyParser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//can be placed anywhere
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("main");
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});