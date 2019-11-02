import React, { Component } from "react";
import mapboxgl from "mapbox-gl";
import Geocode from "react-geocode";
import "./App.css";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
// import { greatCircle, point } from "@turf/turf";
// // Alternatively you can import the whole lot using
import * as turf from "@turf/turf";

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
    // console.log(response.data.statuses[0].entities.media[0].media_url);
    // console.log(response.data.statuses[0].place.bounding_box.coordinates[0][0]);

    this.setState({
      dataFromTwitter: response.data
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
      style: "mapbox://styles/mapbox/streets-v11"
      // style: "mapbox://styles/marie-woq/ck1w9kk6y074f1cpj90nyztag"
    });

    this.setState({ style });

    this.map.on("load", () => {
      this.state.dataFromTwitter.forEach((data, index) => {
        const truncateCreatedDate = () => {
          const date = data.created_at.substring(4, 10);
          const year = data.created_at.substring(26, 30);
          return `${date}, ${year}`;
        };

        if (data.place === null) {
          // Some tweets have no place data
          return;
        }

        const latlngArray = data.place.bounding_box.coordinates[0][0];
        const lat = latlngArray[1];
        const lng = latlngArray[0];

        console.log(`lat: ${lat}`);
        console.log(`lng: ${lng}`);

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
                          <p>Tweet: ${data.text}</p>
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

      ///////////////////addition///////////////////
      // vancouver
      const origin = [-123.133181, 49.272811];

      // thailand
      const destination = [100.568242, 13.730361];

      // A simple line from origin to destination.
      const route = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [origin, destination]
            }
          }
        ]
      };

      // A single point that animates along the route.
      // Coordinates are initially set to origin.
      const point = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: origin
            }
          }
        ]
      };

      // Calculate the distance in kilometers between route start/end point.
      const lineDistance = turf.lineDistance(route.features[0], {
        units: "kilometers"
      });

      let arc = [];

      // Number of steps to use in the arc and animation, more steps means
      // a smoother arc and animation, but too many steps will result in a
      // low frame rate
      const steps = 300;

      // Draw an arc between the `origin` & `destination` of the two points
      for (let i = 0; i < lineDistance; i += lineDistance / steps) {
        const segment = turf.along(route.features[0], i, {
          units: "kilometers"
        });
        arc.push(segment.geometry.coordinates);
      }

      // Update the route with calculated arc coordinates
      route.features[0].geometry.coordinates = arc;

      // Used to increment the value of the point measurement against the route.
      let counter = 0;

      // Add a source and layer displaying a point which will be animated in a circle.
      this.map.addSource("route", {
        type: "geojson",
        data: route
      });

      this.map.addSource("point", {
        type: "geojson",
        data: point
      });

      this.map.addLayer({
        id: "route",
        source: "route",
        type: "line",
        paint: {
          "line-width": 2,
          "line-color": "#007cbf"
        }
      });

      this.map.addLayer({
        id: "point",
        source: "point",
        type: "symbol",
        layout: {
          "icon-image": "airport-15",
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true
        }
      });

      const animate = () => {
        // Update point geometry to a new position based on counter denoting
        // the index to access the arc.
        point.features[0].geometry.coordinates =
          route.features[0].geometry.coordinates[counter];

        // Calculate the bearing to ensure the icon is rotated to match the route arc
        // The bearing is calculate between the current point and the next point, except
        // at the end of the arc use the previous point and the current point

        // console.log("-----");
        // console.log(point.features[0].properties.bearing);
        // console.log("-----");

        point.features[0].properties.bearing = turf.bearing(
          turf.point(
            route.features[0].geometry.coordinates[
              counter >= steps ? counter - 1 : counter
            ]
          ),
          turf.point(
            route.features[0].geometry.coordinates[
              counter >= steps ? counter : counter + 1
            ]
          )
        );

        // Update the source with this new data.
        this.map.getSource("point").setData(point);

        // Request the next frame of animation so long the end has not been reached.
        if (counter < steps - 2) {
          // console.log(`This is steps ${steps}`);
          // console.log(`This is counter ${counter}`);
          requestAnimationFrame(animate);
        } else {
          return;
        }

        counter = counter + 1;
      };

      document.getElementById("replay").addEventListener("click", () => {
        // Set the coordinates of the original point back to origin
        point.features[0].geometry.coordinates = origin;

        // Update the source layer
        this.map.getSource("point").setData(point);

        // Reset the counter
        counter = 0;

        // Restart the animation.
        animate(counter);
      });

      // Start the animation.
      animate(counter);

      ///////////////////addition///////////////////
    }); //inside on "load"
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
    return (
      <div>
        <div className={"map"} ref={e => (this.container = e)}></div>
        <div className="overlay">
          <button id="replay">Replay</button>
        </div>
      </div>
    );
  }
}

export default App;
