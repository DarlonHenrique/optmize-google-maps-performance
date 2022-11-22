import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import {
  Cluster,
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer"
import trees from "../data/trees"

export default function Home() {
  const googlemap = useRef(null)
  const markers = []
  const [mapIsMounted, setMapIsMounted] = useState(false)
  const [map, setMap] = useState()

  // mount the map
  useEffect(() => {
    // load the map script and put map in the useRef googlemap
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY,
      version: "weekly",
    })

    loader.load().then(() => {
      const mapConfig = {
        center: { lat: 43.68, lng: -79.43 },
        zoom: 12,
        mapId: process.env.NEXT_PUBLIC_MAP_ID,
      }

      setMap(new google.maps.Map(googlemap.current, mapConfig))
      setMapIsMounted(true)
    })
  }, [])

  function createClusterer() {
    return new MarkerClusterer({
      map,
      algorithm: new SuperClusterAlgorithm({ radius: 500 }),
    })
  }

  let makerCluster

  function RenderMarkers(markers) {
    if (mapIsMounted) {
      if (makerCluster == undefined) {
        makerCluster = createClusterer()
      }

      if (makerCluster) {
        // const isClusterHaveMarkers = makerCluster.getMarkers()

        function cleanMarkers() {
          var i = 0,
            l = markers.length
          for (i; i < l; i++) {
            markers[i].setMap(null)
          }
          markers = []
        
          makerCluster.clearMarkers()
        }

        function updateMarkers() {
          const markersInsideTheMap = makerCluster.markers.filter(marker =>
            map
              .getBounds()
              .contains({
                lat: marker.position.lat(),
                lng: marker.position.lng(),
              })
          )
          console.log(markersInsideTheMap)
          makerCluster.addMarkers(markersInsideTheMap)

          const markersOutsideMap = makerCluster.markers.filter(marker =>
            !map.getBounds().contains({
                lat: marker.position.lat(),
                lng: marker.position.lng(),
              })
          )
          console.log(markersOutsideMap)
          makerCluster.removeMarkers(markersOutsideMap)
        }

        if (makerCluster.markers.length == 0) {
          makerCluster.addMarkers(markers)
        }

        if (makerCluster.markers.length > 0) {
          updateMarkers()
        }
      }
    }
  }

  // create listners in the map
  useEffect(() => {
    if (mapIsMounted) {
      map.addListener("dragend", () => {
        const infoWindow = new google.maps.InfoWindow()
        const filteredTrees = trees.filter(([name, lat, lng]) =>
          map.getBounds().contains({ lat, lng })
        )
        const treeMarkers = filteredTrees.map(([name, lat, lng]) => {
          const marker = new google.maps.Marker({ position: { lat, lng } })

          marker.addListener("click", () => {
            infoWindow.setPosition({ lat: lat, lng: lng })
            infoWindow.setContent(`
            <div class="info-window">
              <h2>${name}</h2>
            </div>
          `)
            infoWindow.open({ map })
          })

          return marker
        })
        RenderMarkers(treeMarkers)
      })
    }
  }, [map])

  return (
    <>
      <div id='map' ref={googlemap} />
    </>
  )
}
