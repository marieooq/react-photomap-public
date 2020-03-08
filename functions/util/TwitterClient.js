const Twitter = require('twitter');

class TwitterClient {
  constructor() {
    this.client = new Twitter({
      consumer_key: '*********',
      consumer_secret: '*********',
      access_token_key: '*********-*********',
      access_token_secret: '*********'
    });
  }

  getTweets() {
    return this.client.get('search/tweets', { q: '#photomap' });
  }

  getTimeline() {
    return this.client.get('statuses/user_timeline', {
      user_id: '*********'
    });
  }
}

module.exports = TwitterClient;
