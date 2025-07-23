export interface Country {
  name: string;
  states: string[];
}

export const countries: Country[] = [
  {
    name: 'Venezuela',
    states: [
      "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar",
      "Carabobo", "Cojedes", "Delta Amacuro", "Distrito Capital", "Falcón",
      "Guárico", "Lara", "Mérida", "Miranda", "Monagas", "Nueva Esparta",
      "Portuguesa", "Sucre", "Táchira", "Trujillo", "Vargas", "Yaracuy", "Zulia"
    ],
  },
  {
    name: 'Colombia',
    states: [
      "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá",
      "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba",
      "Cundinamarca", "Distrito Capital", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena",
      "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda",
      "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca",
      "Vaupés", "Vichada"
    ],
  },
  {
    name: 'Ecuador',
    states: [
      "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro",
      "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos",
      "Manabí", "Morona Santiago", "Napo", "Orellana", "Pastaza", "Pichincha",
      "Santa Elena", "Santo Domingo de los Tsáchilas", "Sucumbíos", "Tungurahua",
      "Zamora Chinchipe"
    ],
  },
  {
    name: 'Peru',
    states: [
      "Amazonas", "Ancash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca",
      "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad",
      "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco",
      "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"
    ],
  },
  {
    name: 'Bolivia',
    states: [
      "Beni", "Chuquisaca", "Cochabamba", "La Paz", "Oruro", "Pando", "Potosí",
      "Santa Cruz", "Tarija"
    ],
  },
  {
    name: 'Panama',
    states: [
      "Bocas del Toro", "Chiriquí", "Coclé", "Colón", "Darién", "Herrera",
      "Los Santos", "Panamá", "Panamá Oeste", "Veraguas"
    ],
  },
];