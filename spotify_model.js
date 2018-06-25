const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/cs591summer')
const db = mongoose.connection
db.once('open', function () {
    console.log('Connection successful.')
})

const Schema = mongoose.Schema

const artistSchema = new Schema({
    artist: String,
    track: String
})
//console.log(artistSchema)
module.exports = mongoose.model('spotify_info', artistSchema)

