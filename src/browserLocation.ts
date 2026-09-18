import type {Coordinates} from './locationService'
export function deviceLocation():Promise<Coordinates> {
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation) {reject(new Error('Location services are not supported on this device.'));return}
    navigator.geolocation.getCurrentPosition(position=>resolve({latitude:position.coords.latitude,longitude:position.coords.longitude}),
      error=>reject(new Error(error.code===1?'Location permission is required for route information.':'Current location unavailable.')),
      {enableHighAccuracy:true,timeout:12000,maximumAge:30000})
  })
}
