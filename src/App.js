import React, { Component } from "react";
import mapboxgl from "mapbox-gl";
import "./App.css";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

const BASE_URL = "https://api.mapbox.com/styles/v1/mapbox/streets-v9";

class App extends Component {
  state = {
    style: false,
    dataFromTwitter: [],
    imageFromTwitter: "",
    placeFromTwitter: []
  };

  componentDidMount = async () => {
    const url = `${BASE_URL}?access_token=${mapboxgl.accessToken}`;

    const response = await axios.post(
      "https://photos-mapping.firebaseapp.com/twitterapi"
    );
    // console.log(response.data.statuses);
    // console.log(response.data.statuses[0].entities.media[0].media_url);
    // console.log(response.data.statuses[0].place.bounding_box.coordinates[0][0]);

    this.setState({
      dataFromTwitter: response.data.statuses,
      imageFromTwitter: response.data.statuses[0].entities.media[0].media_url,
      placeFromTwitter:
        response.data.statuses[0].place.bounding_box.coordinates[0][0]
    });

    // console.log(this.state);

    let style = {};
    try {
      style = await fetch(url).then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("error");
        }
      });
    } catch (e) {
      return;
    }

    this.map = new mapboxgl.Map({
      container: this.container,
      style: "mapbox://styles/mapbox/streets-v11"
    });

    this.setState({ style });

    this.map.on("load", () => {
      this.state.dataFromTwitter.forEach((data, index) => {
        this.map.loadImage(
          //load an image from twitterAPI
          data.entities.media[0].media_url,
          (error, image) => {
            console.log("--------");
            console.log(data);
            console.log(data.entities.media[0].media_url);
            console.log(data.place.bounding_box.coordinates[0][0]);
            console.log("--------");
            const photoId = `photo${data.id}`;

            if (error) throw error;
            if (
              data.entities.media[0].media_url !== null &&
              data.place !== null
            ) {
              this.map.addImage(photoId, image);
              this.map.addLayer({
                id: photoId,
                type: "symbol",
                source: {
                  type: "geojson",
                  data: {
                    type: "FeatureCollection",
                    features: [
                      {
                        type: "Feature",
                        geometry: {
                          type: "Point",
                          //[latitude, longitude] from twitter API
                          coordinates: data.place.bounding_box.coordinates[0][0]
                        }
                      }
                    ]
                  }
                },
                layout: {
                  "icon-image": photoId,
                  "icon-size": 0.1
                }
              });
            }
          }
        );
      });
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.style !== this.state.style) {
      this.map.setStyle(this.state.style);
    }
  }

  componentWillUnmount() {
    this.map.remove();
  }

  render() {
    return <div className={"map"} ref={e => (this.container = e)}></div>;
  }
}

export default App;
