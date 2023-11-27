import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "K3lvin2023",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var lastUserId = 0;

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM multi_tracker");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function checkUsers(){
  const lotResult = await db.query("SELECT * FROM users");
  const result = lotResult.rows;
  let users =[];
  for (let index = 0; index < result.length; index++) {
  users.push(result[index])
  }
  return users;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const users = await checkUsers();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: "teal",
  });
  
});
app.get("/user",async(req,res)=>{
  var userId=req.query.user;
  lastUserId = userId;
  const users = await checkUsers();
  const result = await db.query("SELECT country_code FROM multi_tracker WHERE user_id = $1",[userId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: users[userId-1].color,
  });
});

app.get("/addUser", (req,res)=>{
  res.render("new.ejs")
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO multi_tracker (country_code, user_id) VALUES ($1,$2)",
      [countryCode,lastUserId]
      );

      res.redirect("/")
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color
  await db.query(
    "INSERT INTO users (user_name, color) VALUES ($1,$2)",
    [name,color]
  );
  res.redirect("/");
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
