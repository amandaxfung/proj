/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

    //make sure you have all this in app.js...
let express = require('express'); // Express web server framework
var router = express.Router();
let request = require('request'); // "Request" library
let cors = require('cors');
let querystring = require('querystring');
let cookieParser = require('cookie-parser');
const spotifyConfig = require('../config/spotifyConfig');
const spotify_info = require('./spotify_model')

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */


let app = express();

router.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());


let generateRandomString = function(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
let stateKey = 'spotify_auth_state';

router.get('/login', function(req, res) {

    let state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    let scope = 'playlist-read-collaborative';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: spotifyConfig.client_id,
            scope: scope,
            redirect_uri: spotifyConfig.redirect_uri,
            state: state
        }));
});


router.get('/callback', function(req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        let authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: spotifyConfig.redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(spotifyConfig.client_id + ':' + spotifyConfig.client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                let access_token = body.access_token,
                    refresh_token = body.refresh_token;
                url = 'https://api.spotify.com/v1/users/spotifycharts/playlists/1H6NwhJTyicXHBvEK9yIsp/tracks?limit=3'
//37i9dQZEVXbLRQDuF5jeBp - top charts
                //1H6NwhJTyicXHBvEK9yIsp
                let options = {
                    url: url,
                    headers: {'Authorization': 'Bearer ' + access_token},
                    json: true
                };

                let in_count = 0;
                for(let count = 0; count<3; count++) {
                    // use the access token to access the Spotify Web API
                    request.get(options, function (error, response, body) {
                        let artistfromSpotify = body.items[in_count].track.artists[0].name;
                        let  trackfromSpotify = body.items[in_count].track.name;

                        //console.log(artistfromSpotify)
                         //console.log(trackfromSpotify)

                            newArtist = new spotify_info({
                                artist: artistfromSpotify,
                                track: trackfromSpotify
                            })

                            newArtist.save(function(error) {
                                    console.log("artist saved")
                                if (error) {
                                    console.error(error)
                                }
                            })
                            console.log(newArtist.artist)

                        in_count = in_count + 1;
                    });
                }

                res.redirect('http://localhost:4200')

            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});


//end here for routes
//app.listen(8888)
module.exports = router;
