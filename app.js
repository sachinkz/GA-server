const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const artistRoutes = require('./routes/artistRoutes')
const userRoutes = require('./routes/usersRoutes')
const authRoutes = require('./routes/authRoutes')

const app = express();

app.use(cors({
  origin: ['https://ga-client-sachinkzs-projects.vercel.app/',"https://ga-client.vercel.app/"],
  methods:"GET,POST,PUT,PATCH,DELETE,OPTIONS",
}))

app.use(helmet());
app.use(bodyParser.json())

app.use("/artist", artistRoutes)
app.use("/user", userRoutes)
app.use("/auth", authRoutes)

app.use((error,req, res, next) => {
  res.json({ message: error.message || "An unknown error occurred!" })
})


mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.74thgvu.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
  .then(() => {
    app.listen(process.env.APP_PORT, () => {
      console.log("database connected")
      console.log(`server started on port ${process.env.APP_PORT}`);
    })

  }).catch(() => {
    console.log('could not connect to mongo')
  })
