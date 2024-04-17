// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const helmet = require('helmet');
// const cors = require('cors');
// require('dotenv').config();

// const artistRoutes = require('./routes/artistRoutes')
// const userRoutes = require('./routes/usersRoutes')
// const authRoutes = require('./routes/authRoutes')

// const app = express();

// app.use(cors({
//   origin: 'https://www.grabarts.online',
//   methods:"GET,POST,PUT,PATCH,DELETE,OPTIONS",
// }))



// app.use(helmet());
// app.use(bodyParser.json())

// app.use("/artist", artistRoutes)
// app.use("/user", userRoutes)
// app.use("/auth", authRoutes)

// app.use((error,req, res, next) => {
//   res.json({ message: error.message || "An unknown error occurred!" })
// })


// mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.74thgvu.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
//   .then(() => {
//     app.listen(process.env.APP_PORT, () => {
//       console.log("database connected")
//       console.log(`server started on port ${process.env.APP_PORT}`);
//     })

//   }).catch(() => {
//     console.log('could not connect to mongo')
//   })


const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require("morgan");
const path = require("path");
//securty packges
const dbConnection = require("./dbConfig/index.js");

require('dotenv').config();

const artistRoutes = require('./routes/artistRoutes')
const userRoutes = require('./routes/usersRoutes')
const authRoutes = require('./routes/authRoutes')

const app = express();

const PORT = process.env.PORT || 8800;

dbConnection();

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use("/artist", artistRoutes)
app.use("/user", userRoutes)
app.use("/auth", authRoutes)

//error middleware
app.use((error, req, res, next) => {
  res.json({ message: error.message || "An unknown error occurred!" })
})

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});