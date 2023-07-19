'use strict'
        let map = L.map('map');
        map.setView([45.4643594, 9.1885912], 9); /* Il 13 modifica lo zoom della mappa */
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);

        const green = L.icon({
            iconUrl: '/images/Icons/pin-map-green.png',
            
            iconSize: [45, 50],
            // iconAnchor: [22, 94],
            popupAnchor: [0, -30]
        })

        const red = L.icon({
            iconUrl: '/images/Icons/pin-map-red.png',
            
            iconSize: [45, 50],
            // iconAnchor: [22, 94],
            popupAnchor: [0, -30]
        })

        const yellow = L.icon({
            iconUrl: '/images/Icons/pin-map-yellow3.png',
            
            iconSize: [45, 50],
            // iconAnchor: [22, 94],
            popupAnchor: [0, -30]
        })

        const blu = L.icon({
            iconUrl: '/images/Icons/pin-user.png',
            
            iconSize: [45, 50],
            // iconAnchor: [22, 94],
            popupAnchor: [0, -30]
        })
        
        navigator.geolocation.watchPosition(success, error);
        
        let marker, circle, zoomed;
        
        function success(pos){
            
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;

            if(marker){
                map.removeLayer(marker);
                map.removeLayer(circle);
            }

            marker = L.marker([lat, lng], { icon: blu }).bindPopup('<b>Io sono qui</b>').addTo(map);
            circle = L.circle([lat, lng], { radius: accuracy }).addTo(map);

            if(!zoomed){
                zoomed = map.fitBounds(circle.getBounds());
            }

            map.setView([lat, lng]);

            const risposta = fetch('https://carcharger.uniupo.click/archiver/', { /* Da cambiare e da fare una route specifica per prendere i dati dal db passando dall'archiver */
                method: 'GET',
                // header: 'Access-Control-Allow-Origin'
                header: {'Content-Type':'application/x-www-form-urlencoded'},
            }).then((res) => {return res.json()
            }).then((chargers) => {
                const mappa = chargers.body.chargers;
                mappa.forEach((punto) => {
                    // console.log('Questo è un punto');
                    // console.log(punto)
                    const id = punto.id_colonnina;
                    const nome = punto.nome_luogo;
                    const cerchia = punto.cerchia;
                    const longitude = punto.lng;
                    const latitudine = punto.lat;
                    const stato = punto.stato;
                    const tempo = punto.tempo;

                    // if(punto.stato === 'libera'){
                    //     punto.icona === green;
                    // }
                    // else if(punto.stato === 'prenotata'){
                    //     punto.icona === yellow;
                    // }
                    // else{
                    //     punto.icona === red;
                    // }

                    if(stato === 'libera'){
                        L.marker([latitudine, longitude], {
                            icon: green, /* da sostituire poi con punto.stato */
                            title: nome
                        }).bindPopup(`<b>${id}</b><br><b>${nome}</b><br>${cerchia}`).addTo(map)
                    }
                    else if(stato === 'prenotata'){
                        L.marker([latitudine, longitude], {
                            icon: yellow, /* da sostituire poi con punto.stato */
                            title: nome
                        }).bindPopup(`<b>${id}</b><br><b>${nome}</b><br>${cerchia}`).addTo(map)
                    }
                    else if(stato === 'occupata'){
                        L.marker([latitudine, longitude], {
                            icon: red, /* da sostituire poi con punto.stato */
                            title: nome
                        }).bindPopup(`<b>${id}</b><br><b>${nome}</b><br>${cerchia}<br><b>${tempo} minuti</b>`).addTo(map)
                    }
                    
                })
            })

            // setTimeout(function(){
            //     console.log('Questa è la mappa nel set timeout')
            //     console.log(mappa)
            // }, 3000)

        }

        function error(err){
            if(err.code === 1){
                alert("Please allow geolocation access");
            }
            else{
                alert("Cannot get current location");
            }
        }