import {useEffect,useRef,useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type {Coordinates} from './locationService'
import type {RoadRoute} from './routeService'
export type MapPoint=Coordinates & {label:string}
export function RescueMap({points,route}:{points:MapPoint[];route:RoadRoute|null}) {
  const container=useRef<HTMLDivElement>(null), map=useRef<L.Map|null>(null), layer=useRef<L.LayerGroup|null>(null)
  const [error,setError]=useState(false)
  useEffect(()=>{
    if (!container.current) return
    const instance=L.map(container.current);map.current=instance
    const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'})
    tiles.on('tileerror',()=>setError(true));tiles.on('tileload',()=>setError(false));tiles.addTo(instance)
    layer.current=L.layerGroup().addTo(instance)
    const observer=new ResizeObserver(()=>instance.invalidateSize());observer.observe(container.current)
    return ()=>{observer.disconnect();instance.remove();map.current=null;layer.current=null}
  },[])
  useEffect(()=>{
    if (!map.current || !layer.current || !points.length) return
    layer.current.clearLayers()
    const bounds=L.latLngBounds(points.map(p=>[p.latitude,p.longitude]))
    for (const [index,p] of points.entries()) L.circleMarker([p.latitude,p.longitude],{radius:8,color:['#b6802e','#285f56','#3b6332'][index%3],fillOpacity:0.8}).bindTooltip(p.label,{permanent:true,direction:'top'}).addTo(layer.current)
    if (route) {
      const line=L.polyline(route.coordinates.map(([lng,lat])=>[lat,lng]),{color:'#285f56',weight:4}).addTo(layer.current)
      bounds.extend(line.getBounds())
    }
    map.current.fitBounds(bounds,{padding:[35,35],maxZoom:15})
  },[points,route])
  return <><div ref={container} className="rescue-map" aria-label="Rescue location map" />{error && <p role="status">Map temporarily unavailable. Coordinates and rescue actions remain available.</p>}</>
}
