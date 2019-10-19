import React, { Component } from "react";
import mapboxgl from "mapbox-gl";
import "./App.css";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

const BASE_URL = "https://api.mapbox.com/styles/v1/mapbox/streets-v9";

class App extends Component {
  state = {
    style: false,
    dataFromTwitter: []
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
      dataFromTwitter: response.data.statuses
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
      // style: "mapbox://styles/mapbox/streets-v11"
      style: "mapbox://styles/marie-woq/ck1w9kk6y074f1cpj90nyztag"
    });

    this.setState({ style });

    this.map.on("load", () => {
      this.state.dataFromTwitter.forEach((data, index) => {
        console.log(data);
        const photoURL = `https://twitter.com/MariewoqE/status/${data.id_str}`;
        this.map.loadImage(
          //load an image from twitterAPI
          data.entities.media[0].media_url,
          (error, image) => {
            console.log("--------");
            //twitter.com/MariewoqE/status/1184762822229495809
            console.log(data.user);
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
                        properties: {
                          description: `<p>Sample Description</p><a href=${photoURL} target="_blank" title="Opens in a new window"><em>Twitter</em></a>`
                        },
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

              this.map.on("click", photoId, e => {
                console.log(e.features[0].properties.description);
                const coordinates = e.features[0].geometry.coordinates.slice();
                const description = e.features[0].properties.description;
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                  coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                new mapboxgl.Popup()
                  .setLngLat(coordinates)
                  .setHTML(description)
                  .addTo(this.map);
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
