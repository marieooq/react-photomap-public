const Twitter = require("twitter");

class TwitterClient {
  constructor() {
    this.client = new Twitter({
      consumer_key: "7CD8PvPaL1BZ73qp7TQuS5zv6",
      consumer_secret: "tJrtWncusxkJWNNAqTV2JwWrF8HDDNyMKBLmqejEK6RB1FJe0C",
      access_token_key: "1157001502587645952-NI1ZRkhm3x09w9SAp1dWDijCD2sRXZ",
      access_token_secret: "rHmuaNraDZD3xH0ivN0wLyoPfz3F5OBQXXSmq5pxEWEhX"
    });
  }

  getTweets() {
    return this.client.get("search/tweets", { q: "#photomap" });
  }
}

module.exports = TwitterClient;
