import React, { Component } from "react";
import mapboxgl from "mapbox-gl";
import Geocode from "react-geocode";
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
    // set Google Maps Geocoding API for purposes of quota management. Its optional but recommended.
    Geocode.setApiKey("AIzaSyDaIa8mdT93tt85NoVvA9Pq1H8AO6CNB8A");

    // set response language. Defaults to english.
    Geocode.setLanguage("en");

    const mapBoxApi = `${BASE_URL}?access_token=${mapboxgl.accessToken}`;

    //response from twitter API
    const response = await axios.post(
      "https://photos-mapping.firebaseapp.com/twitterapi"
    );
    // console.log(response.data.statuses);
    // console.log(response.data.statuses[0].entities.media[0].media_url);
    // console.log(response.data.statuses[0].place.bounding_box.coordinates[0][0]);

    this.setState({
      dataFromTwitter: response.data.statuses
    });

    let style = {};
    try {
      style = await fetch(mapBoxApi).then(res => {
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
        console.log("This is data from twitter API");
        console.log(data);
        const truncateCreatedDate = () => {
          const date = data.created_at.substring(4, 10);
          const year = data.created_at.substring(26, 30);
          return `${date}, ${year}`;
        };

        const latlngArray = data.place.bounding_box.coordinates[0][0];
        const lat = latlngArray[1];
        const lng = latlngArray[0];

        let addressFromGeoCode;

        // Get address from latidude & longitude.
        Geocode.fromLatLng(lat, lng).then(
          response => {
            addressFromGeoCode = response.results[0].formatted_address;
            console.log(addressFromGeoCode);
          },
          error => {
            console.error(error);
          }
        );

        const photoURL = `https://twitter.com/MariewoqE/status/${data.id_str}`;
        this.map.loadImage(
          //load an image from twitterAPI
          data.entities.media[0].media_url,
          (error, image) => {
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
                          description: `
                          <p>Date: ${truncateCreatedDate()}</p>
                          <p>Place Name: ${data.place.name} </p>
                          <p>Country: ${data.place.country} </p>
                          <p>Address: ${addressFromGeoCode}</p>
                          <p>Jump to twitter</p>
                          <a href=${photoURL} target="_blank" title="Opens in a new window"><em>Twitter</em></a>`
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

              // Change the cursor to a pointer when the mouse is over the places layer.
              this.map.on("mouseenter", photoId, () => {
                this.map.getCanvas().style.cursor = "pointer";
              });

              // Change it back to a pointer when it leaves.
              this.map.on("mouseleave", photoId, () => {
                this.map.getCanvas().style.cursor = "";
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
