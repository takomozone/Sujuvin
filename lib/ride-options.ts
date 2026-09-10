export const rideOptions = [
 {id:'economy',name:'Säästö',car:'Toyota Corolla',pickup:7,price:18.90,premium:false},
 {id:'standard',name:'Sujuvin',car:'Škoda Octavia',pickup:4,price:23.90,premium:false},
 {id:'express',name:'Nopea nouto',car:'Toyota Camry',pickup:2,price:29.90,premium:false},
 {id:'premium',name:'Premium',car:'Mercedes-Benz E-sarja',pickup:3,price:39.90,premium:true},
];
export const formatFare=(price:number)=>new Intl.NumberFormat('fi-FI',{style:'currency',currency:'EUR'}).format(price);
