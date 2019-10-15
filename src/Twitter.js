const Twitter = require("twitter");

const client = new Twitter({
  consumer_key: "7CD8PvPaL1BZ73qp7TQuS5zv6",
  consumer_secret: "tJrtWncusxkJWNNAqTV2JwWrF8HDDNyMKBLmqejEK6RB1FJe0C",
  access_token_key: "1157001502587645952-NI1ZRkhm3x09w9SAp1dWDijCD2sRXZ",
  access_token_secret: "rHmuaNraDZD3xH0ivN0wLyoPfz3F5OBQXXSmq5pxEWEhX"
});

// Load your image
const data = require("fs").readFileSync("../public/image.jpg");

// Make post request on media endpoint. Pass file data as media parameter
client.post("media/upload", { media: data }, function(error, media, response) {
  if (!error) {
    // If successful, a media object will be returned.
    console.log(media);

    // Lets tweet it
    var status = {
      status: "This photo has been posted by using API. #photomap",
      media_ids: media.media_id_string // Pass the media id string
    };

    client.post("statuses/update", status, function(error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
    });
  }
});
