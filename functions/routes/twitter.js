var express = require("express");
var router = express.Router();
var TwitterClient = require("../util/TwitterClient");

/* GET users listing. */
router.post("/", (req, res, next) => {
  const twitterClient = new TwitterClient();
  twitterClient
    .getTimeline()
    .then(response => {
      return res.json(response);
    })
    .catch(err => {
      console.log(err);
      return res.json({
        status: "error"
      });
    });
});

module.exports = router;
