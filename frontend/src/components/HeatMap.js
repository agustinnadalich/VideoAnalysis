// import React, { useState, useEffect } from 'react';
// import { MapContainer, ImageOverlay, useMap } from 'react-leaflet';
// import { LatLngBounds } from 'leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import 'leaflet.heat';

// const HeatMapLayer = ({ data }) => {
//     const map = useMap();

//     useEffect(() => {
//         if (!map || data.length === 0) return;

//         const heatLayer = L.heatLayer(data, {
//             radius: 18,
//             blur: 15,
//             maxZoom: 17,
//         }).addTo(map);

//         return () => {
//             map.removeLayer(heatLayer);
//         };
//     }, [map, data]);

//     return null;
// };

// const HeatMap = ({ data }) => {
//     const bounds = new LatLngBounds([[0, 0], [70, 100]]);
//     const [imageLoaded, setImageLoaded] = useState(false);
//     const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

//     const handleImageLoad = (e) => {
//         const { naturalWidth, naturalHeight } = e.target;
//         setImageSize({ width: naturalWidth, height: naturalHeight });
//         setImageLoaded(true);
//     };

//     return (
//         <div style={{ position: 'relative', width: '50%', height: imageSize.height, margin: '0 auto' }}>
//             <img
//                 src="/CANCHA-CORTADA.jpg"
//                 alt="Cancha"
//                 style={{ display: 'none' }}
//                 onLoad={handleImageLoad}
//             />
//             {imageLoaded && (
//                 <MapContainer
//                     style={{ height: '100%', width: '100%' }}
//                     center={[35, 50]}
//                     zoom={2.1}
//                     minZoom={2.1}
//                     maxZoom={2.1}
//                     zoomControl={false}
//                     dragging={false}
//                     scrollWheelZoom={false}
//                     doubleClickZoom={false}
//                     boxZoom={false}
//                     keyboard={false}
//                     crs={L.CRS.Simple}
//                     bounds={bounds}
//                 >
//                     <ImageOverlay
//                         url="/CANCHA-CORTADA.jpg"
//                         bounds={bounds}
//                         style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//                     />
//                     <HeatMapLayer data={data} />
//                 </MapContainer>
//             )}
//         </div>
//     );
// };

// export default HeatMap;
