import React, { Component } from "react";
import mapboxgl from "mapbox-gl";
import "./App.css";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

const BASE_URL = "https://api.mapbox.com/styles/v1/mapbox/streets-v9";

class App extends Component {
  state = {
    style: false,
    imageFromTwitter: "",
    placeFromTwitter: []
  };

  componentDidMount = async () => {
    const response = await axios.post("http://localhost:3000/twitterapi");
    console.log(response.data.statuses[0].entities.media[0].media_url);
    console.log(response.data.statuses[0].place.bounding_box.coordinates[0][0]);

    this.setState({
      imageFromTwitter: response.data.statuses[0].entities.media[0].media_url,
      placeFromTwitter:
        response.data.statuses[0].place.bounding_box.coordinates[0][0]
    });

    const url = `${BASE_URL}?access_token=${mapboxgl.accessToken}`;

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

    console.log(this.map);
    this.setState({ style });

    this.map.on("load", () => {
      this.map.loadImage(
        //load an image from twitterAPI
        this.state.imageFromTwitter,
        (error, image) => {
          if (error) throw error;
          this.map.addImage("cat", image);
          this.map.addLayer({
            id: "points",
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
                      coordinates: this.state.placeFromTwitter
                    }
                  }
                ]
              }
            },
            layout: {
              "icon-image": "cat",
              "icon-size": 0.25
            }
          });
        }
      );
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

  // onClick = () => {
  //   const prevStyle = this.state.style;
  //   console.log(prevStyle);
  //   const nextStyle = {
  //     ...prevStyle,
  //     layers: prevStyle.layers.map(layer =>
  //       layer.id === "landcover_snow"
  //         ? { ...layer, paint: { ...layer.paint, "fill-color": "red" } }
  //         : layer
  //     )
  //   };
  //   this.setState({ style: nextStyle });
  // };

  render() {
    return <div className={"map"} ref={e => (this.container = e)}></div>;
  }
}

export default App;
