
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Music4, Search, Star, Sparkles, BookOpen, Radio, Users, ChevronRight, X, Heart, Landmark, Award } from "lucide-react";
import arpaImg from "@/assets/arpa-llanera.jpg";

export const Route = createFileRoute("/artistas")({
  head: () => ({
    meta: [
      { title: "Artistas · Puro Llano Radio" },
      {
        name: "description",
        content:
          "Descubre a los baluartes de la música llanera: leyendas consagradas, voces en consolidación y la generación de relevo del folklore colombo-venezolano.",
      },
      { property: "og:title", content: "Artistas · Puro Llano Radio" },
      {
        property: "og:description",
        content: "Biografías y trayectoria de las leyendas del llano y nuevos talentos criollos.",
      },
    ],
    links: [{ rel: "canonical", href: "https://purollanoradio.lovable.app/artistas" }],
  }),
  component: Artistas,
});

interface Artist {
  name: string;
  country: "Venezuela" | "Colombia" | "Ambos" | "";
  bio: string;
  category: "consagrados" | "crecimiento" | "emergentes" | "plataformas";
  subcategory: string;
  badge?: string;
  isImmortal?: boolean;
}

const ARTISTS_DATA: Artist[] = [
  // 1. BALUARTES CONSAGRADOS - Maestros Inmortales
  {
    name: "Simón Díaz",
    country: "Venezuela",
    bio: "Simón Narciso Díaz Márquez nació en Barbacoas, Aragua, el 8 de agosto de 1928 y falleció en Caracas el 19 de febrero de 2014. Conocido mundialmente como el 'Tío Simón', fue un cantante, compositor, actor y poeta. Máximo exponente de la música venezolana, su obra 'Caballo Viejo' es la canción llanera más versionada en el mundo (traducida a decenas de idiomas). Recibió el Premio Grammy Latino a la Trayectoria en 2008.",
    category: "consagrados",
    subcategory: "Maestros Inmortales",
    badge: "Tío Simón",
    isImmortal: true
  },
  {
    name: "Eneas Perdomo",
    country: "Venezuela",
    bio: "Eneas Perdomo Carrillo nació en El Yagual, Apure, el 11 de julio de 1930 y falleció en Caracas el 25 de febrero de 2011. Cantautor insigne y fiel retratista del llano profundo, grabó más de 40 producciones discográficas. Su tema legendario 'Fiesta en Elorza' es considerado un himno popular y oficial del estado Apure.",
    category: "consagrados",
    subcategory: "Maestros Inmortales",
    badge: "General del Canto",
    isImmortal: true
  },
  {
    name: "Juan de los Santos Contreras",
    country: "Venezuela",
    bio: "Nació en Palmarito, Apure, el 7 de abril de 1928 y falleció en Barinas el 10 de diciembre de 2002. Inmortalizado como 'El Carrao de Palmarito', fue un cantautor insigne del canto recio. Su mítica interpretación en la pieza contrapunteada 'Florentino y el Diablo' lo consagró en la historia llanera. Galardonado con el Premio Nacional de Cultura Popular en 1998.",
    category: "consagrados",
    subcategory: "Maestros Inmortales",
    badge: "El Carrao de Palmarito",
    isImmortal: true
  },
  {
    name: "Elisa Guerrero",
    country: "Venezuela",
    bio: "Elisa del Carmen Guerrero Brizuela, conocida cariñosamente como 'La Veguera', nació el 21 de septiembre de 1979 en Puerto de Nutrias, Barinas. Destacada intérprete y compositora de voz recia y gran arrastre popular, prima del también cantautor Jorge Guerrero. Su vida fue trágicamente truncada el 6 de julio de 2015 en Tinaquillo, Cojedes.",
    category: "consagrados",
    subcategory: "Maestros Inmortales",
    badge: "La Veguera",
    isImmortal: true
  },
  {
    name: "Julio Pantoja",
    country: "Venezuela",
    bio: "Julio Romero Moronta Pantoja nació el 24 de mayo de 1964 en el caserío Monasterio, Guárico, y falleció el 1 de junio de 2017 en Valencia, Carabobo. Fue un cantautor criollo de voz recia que narró de forma inigualable las vivencias y faenas del campesino llanero. Ganador de múltiples festivales en Colombia y Venezuela; su tema 'Llanero que canta y silba' es una insignia del folklore.",
    category: "consagrados",
    subcategory: "Maestros Inmortales",
    badge: "Voz del Llano",
    isImmortal: true
  },
  {
    name: "Francisco Montoya",
    country: "Venezuela",
    bio: "José Francisco Montoya, conocido artísticamente como 'El Tigre de Payara', nació el 20 de julio de 1943 en San Juan de Payara, Apure. Con una trayectoria impecable y una de las voces más recias, claras y características del folklore llanero, es una referencia absoluta para los nuevos cantantes del género.",
    category: "consagrados",
    subcategory: "Maestros Inmortales",
    badge: "El Tigre de Payara",
    isImmortal: false
  },
  {
    name: "Ángel Custodio Loyola",
    country: "Venezuela",
    bio: "Nació el 4 de septiembre de 1926 en Mata Arzolera, Guárico, y falleció el 24 de septiembre de 1985 en Cagua, Aragua. Pionero indiscutible del joropo cantado y el pasaje criollo, recordado por su canto auténtico, altanero y recio que definió el estilo clásico del joropo de mediados de siglo.",
    category: "consagrados",
    subcategory: "Maestros Inmortales",
    badge: "El Pajarillo",
    isImmortal: true
  },
  {
    name: "Juan Harvey Caicedo",
    country: "Colombia",
    bio: "Juan Harvey Caycedo Velasco nació en Santander de Quilichao, Cauca, el 3 de julio de 1937, y falleció en Bogotá el 21 de octubre de 2003. Eminente periodista, locutor y declamador de inigualable modulación. Considerado una de las voces radiales más importantes de Colombia, inmortalizó la declamación de la poesía y el poema sabanero llanero.",
    category: "consagrados",
    subcategory: "Maestros Inmortales",
    badge: "La Voz de la Poesía",
    isImmortal: true
  },

  // 1. BALUARTES CONSAGRADOS - Leyendas Vivas en Vigencia
  {
    name: "Reynaldo Armas",
    country: "Venezuela",
    bio: "Reynaldo Armas Enguaima nació el 4 de agosto de 1953 en Santa María de Ipire, Guárico. Cantante, compositor y ganador del Grammy Latino. Es la figura clave de la modernización del pasaje llanero, con centenares de éxitos grabados y miles de presentaciones internacionales.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Cardenal Sabanero"
  },
  {
    name: "Cholo Valderrama",
    country: "Colombia",
    bio: "Wilson Orlando 'Cholo' Valderrama Aguilar nació en Sogamoso, Boyacá, el 23 de agosto de 1951, pero se crió y formó en las sabanas de San Luis de Palenque, Casanare. Primer cantautor llanero en ganar un Premio Grammy Latino (2008), es la máxima insignia de la música llanera en Colombia.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Cholo"
  },
  {
    name: "Vitico Castillo",
    country: "Venezuela",
    bio: "Víctor Ramón Castillo Flores nació el 1 de junio de 1969 en La Candelaria, Apure. Cantante, compositor y abogado. Con un estilo enérgico, festivo y muy criollo, es el indiscutible rey de la parranda llanera contemporánea con éxitos emblemáticos como 'Corazón de Concreto'.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "Lo Amarillo de la Ñema"
  },
  {
    name: "Luis Silva",
    country: "Venezuela",
    bio: "Luis Felipe Silva Pérez nació el 5 de diciembre de 1962 en Santa Rosa de Barinas. Revolucionó el pasaje romántico dándole un matiz estilizado y moderno de enorme éxito radial. Representó a Venezuela en el Festival OTI de la Canción en 1994, internacionalizando el folklore.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Barinés de Oro"
  },
  {
    name: "Walter Silva",
    country: "Colombia",
    bio: "Nació el 28 de marzo de 1973 en La Plata, Casanare. Aclamado cantautor nominado en dos oportunidades al Grammy Latino. Sus letras cotidianas, descriptivas y costumbristas lo han consagrado como 'el cronista musical del llano' en la actualidad.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Chino de los Mandados"
  },
  {
    name: "Reyna Lucero",
    country: "Venezuela",
    bio: "Reina Romero García nació el 6 de enero de 1950 en Santa Cruz de Aragua. Con más de 25 producciones discográficas e infinidad de galardones, es una de las voces femeninas más influyentes y queridas de la música criolla venezolana.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "La Reina de la Canción Criolla"
  },
  {
    name: "Jorge Guerrero",
    country: "Venezuela",
    bio: "Jorge Fernando Guerrero Sánchez nació el 14 de febrero de 1965 en Elorza, Apure. Autodidacta, poeta y compositor de profundo arraigo popular, sus canciones describen el llano tradicional con una melancolía y sentimiento únicos. Es un ícono absoluto de la copla sabanera.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Guerrero del Folklore"
  },
  {
    name: "Rummy Olivo",
    country: "Venezuela",
    bio: "Rumualda Olivo nació el 22 de enero de 1964 en Zaraza, Guárico. Es una de las cantautoras más versátiles y dinámicas de la música llanera. Destaca por su potente canto recio y su extraordinaria agilidad mental para el contrapunteo y la improvisación.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "La Flor de Zaraza"
  },
  {
    name: "Aries Vigoth",
    country: "Colombia",
    bio: "Nació el 29 de agosto de 1957 en Hato Corozal, Casanare. Conocido internacionalmente por interpretar pasajes románticos inmortales como 'Predestinación'. Es uno de los precursores del posicionamiento comercial de la música llanera colombiana.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Romántico del Llano"
  },
  {
    name: "Teo Galíndez",
    country: "Venezuela",
    bio: "Teófilo Antonio Galíndez Cordero nació el 12 de octubre de 1958 en Tinaquillo, Cojedes. Poseedor de una de las voces más melodiosas, limpias y afinadas del pasaje llanero, su música es sumamente respetada en ambos países hermanos.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Ruiseñor de Venezuela"
  },
  {
    name: "Nancy Vargas",
    country: "Colombia",
    bio: "Nació el 14 de julio en la vereda El Cardoncito, Casanare. Cantante y coplera recia de gran temperamento. Es considerada una de las pioneras y voces femeninas más respetadas del joropo tradicional en el oriente colombiano.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "La Legendaria"
  },
  {
    name: "Cristóbal Jiménez",
    country: "Venezuela",
    bio: "Cristóbal Leobardo Jiménez Farfán nació el 18 de enero de 1956 en Mantecal, Apure. Destacado cantautor, arpista y político. Licenciado en Letras y Magíster en Literatura Venezolana, ha sabido conjugar la lírica popular con la academia.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Coplero de Oro"
  },
  {
    name: "José Gregorio Oquendo",
    country: "Venezuela",
    bio: "Nació en Calabozo, Guárico, el 4 de julio de 1981. Cantautor de gran éxito comercial, creador de una corriente romántica sumamente melódica que conecta con el público juvenil de la música llanera contemporánea.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "Voz Romántica"
  },
  {
    name: "Armando Martínez",
    country: "Venezuela",
    bio: "Nació en Valle de la Pascua, Guárico, el 31 de diciembre de 1957. Famoso por su afinación perfecta y su potente voz que brilla tanto en golpes recios como en pasajes lentos. Su elegancia interpretativa lo sitúa entre los favoritos de la audiencia.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Cantaclaro"
  },
  {
    name: "Santiago Rojas",
    country: "Venezuela",
    bio: "Nació en Guardatinajas, Guárico, el 6 de agosto de 1952. Con un estilo jocoso, picaresco y lleno de chispa criolla, es recordado por grandes clásicos del folklore satírico y costumbrista como 'La viuda millonaria'.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Turpial de Guardatinaja"
  },
  {
    name: "Tirso Ávila",
    country: "Venezuela",
    bio: "Eminente cantautor y declamador de San Carlos, Cojedes. Su estilo sobrio, poético y apegado a la descripción del paisaje y las tradiciones del llano lo posicionan como uno de los compositores y declamadores de culto del folklore.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Mocho de Oro"
  },
  {
    name: "Juan Farfán",
    country: "Colombia",
    bio: "Juan Fernando Farfán Carrillo nació el 2 de noviembre de 1947 en Arauca. Famoso cantautor colombiano de gran trayectoria y estilo costumbrista marcado por el sentimiento araucano y la vivencia campesina.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "El Coplero Sentimental"
  },
  {
    name: "Víctor Véliz",
    country: "Venezuela",
    bio: "Nació en Biruaca, Apure. Inició su carrera musical componiendo sus propias líricas desde los 10 años, consolidándose como una de las plumas y voces respetables del pasaje llanero tradicional.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "Pluma de Oro"
  },
  {
    name: "La Negra Linares",
    country: "Venezuela",
    bio: "Una de las voces más sentimentales y apasionadas del pasaje romántico llanero, de constante rotación y popularidad en las ferias y eventos folklóricos de la frontera colombo-venezolana.",
    category: "consagrados",
    subcategory: "Leyendas Vivas",
    badge: "La Negra Linares"
  },

  // 2. BALUARTES EN CRECIMIENTO Y CONSOLIDACIÓN - Voces Masculinas
  {
    name: "Fernando Tovar",
    country: "Venezuela",
    bio: "Nació el 2 de junio de 1981 en San Fernando de Apure. Ingeniero de profesión y cantante de vocación. Con un arrastre impresionante en la taquilla de eventos llaneros, es uno de los líderes indiscutibles del joropo y pasaje moderno.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "El Alcaraván"
  },
  {
    name: "Alberto Castillo",
    country: "Venezuela",
    bio: "Rafael Alberto Castillo Castillo nació el 19 de noviembre de 1971. Con cuatro décadas de carrera y más de 16 producciones, resalta por la pulcritud de sus grabaciones y su estilo de canto romántico y parranda limpia.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "El Canta Bonito"
  },
  {
    name: "Jhon Onofre",
    country: "Colombia",
    bio: "Nació el 18 de mayo de 1978 en Granada, Meta. Saltó a la fama a nivel nacional en Colombia tras ganar el concurso televisivo 'A Otro Nivel', ganándose al público con sus impresionantes arreglos de joropo fusión y potencia de voz.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "Voz de Vanguardia"
  },
  {
    name: "Manolo Guerrero",
    country: "Venezuela",
    bio: "Manuel Alfredo Guerrero Machado nació el 11 de agosto de 1981 en Araure, Portuguesa. Exponente de parrandas criollas llenas de energía y joropo recio que goza de enorme popularidad y vigencia en los escenarios actuales.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "Parrandero de Oro"
  },
  {
    name: "Ignacio Rondón",
    country: "Venezuela",
    bio: "Nació el 1 de febrero de 1968 en Pariaguán, Anzoátegui. Pionero indiscutible del pasaje estilizado con tintes de balada llanera, logrando calar en mercados internacionales gracias a su lírica romántica contemporánea.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "El Precursor Romántico"
  },
  {
    name: "Daniel Gualdrón",
    country: "Colombia",
    bio: "Nació el 16 de diciembre de 1974 en San Luis de Palenque, Casanare. Consolidado cantautor del llano oriental colombiano, portador de una voz criolla muy arraigada al sentir casanareño.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "Voz del Pauto"
  },
  {
    name: "Alejandro Rondón",
    country: "Venezuela",
    bio: "Alejandro José Rondón López nació el 2 de enero de 1970 en Pariaguán, Anzoátegui. Prolífico compositor de éxitos para múltiples intérpretes, poseedor de una voz recia impregnada de sentimiento sabanero.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "El Cantautor de Oro"
  },
  {
    name: "Julio Camacho",
    country: "Venezuela",
    bio: "Julio Ysmael Camacho Correa nació en el caserío Maicito, Portuguesa. Defensor a ultranza del orgullo y costumbres del campesino llanero, su canto recio es muy valorado en festivales de música llanera.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "El Indio"
  },
  {
    name: "El Mocho Pérez",
    country: "Venezuela",
    bio: "Carlos Gabriel Pérez Patino, conocido como 'El Mocho Pérez', es un cantautor respetado por los tradicionalistas por su apego absoluto al sonido de arpa clásico y letras de faena.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "Defensor del Tradicionalismo"
  },
  {
    name: "Hipólito Arrieta",
    country: "Venezuela",
    bio: "Nació el 18 de octubre de 1962 en Santa Cruz de Guacas, Barinas. Leyenda activa de la improvisación en el contrapunteo rápido y rudo, respetado en cada festival de copleros.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "Titán del Contrapunteo"
  },
  {
    name: "Milton Cruz",
    country: "Venezuela",
    bio: "Coplero y virtuoso de la bandola llanera que destaca por su apego a las raíces de la música llanera instrumental y cantada.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "El Jeruilito"
  },
  {
    name: "Jesús Daniel Quintero",
    country: "Venezuela",
    bio: "Jesús Daniel Quintero, 'El Tigrito de Mata Negra', nació el 29 de enero de 1976 en Pedraza, Barinas. Heredero directo del legendario cantautor Jesús Quintero ('El Tigre de Mata Negra'), continúa el legado familiar con orgullo.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "El Tigrito de Mata Negra"
  },
  {
    name: "Rafael Garrido",
    country: "Venezuela",
    bio: "Cantautor llanero consolidado en los circuitos de música criolla del centro y llano venezolano, reconocido por sus pasajes tradicionales de gran factura poética.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "Voz Sabanera"
  },
  {
    name: "Yesid Ortiz",
    country: "Colombia",
    bio: "Nació el 11 de enero de 1978 en Orocué, Casanare. Destacado compositor e intérprete muy querido en los departamentos de Meta, Arauca y Casanare por su lírica sincera.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "El saucelito"
  },
  {
    name: "Leonel Araujo",
    country: "Venezuela",
    bio: "Intérprete del pasaje costumbrista llanero, cuyas canciones rinden tributo constante a la fauna, flora y costumbres de la vida de llano adentro.",
    category: "crecimiento",
    subcategory: "Voces Masculinas",
    badge: "Cantautor Costumbrista"
  },

  // 2. BALUARTES EN CRECIMIENTO Y CONSOLIDACIÓN - Voces Femeninas
  {
    name: "Milena Benites",
    country: "Colombia",
    bio: "Nació el 1 de diciembre de 1994 en Villavicencio, Meta. Hija del reconocido maestro Yesid Benítes. Con una elegancia excepcional sobre el escenario y una potente capacidad vocal, es la voz femenina colombiana con mayor impacto internacional hoy en día.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "La Voz de Oro Colombiana"
  },
  {
    name: "Scarlett Linares",
    country: "Venezuela",
    bio: "Jenny Scarlett Linares Flores nació el 13 de septiembre de 1969 en Ciudad Bolívar. Marcó un hito histórico en el folklore llanero romántico femenino con su inolvidable e icónico tema 'En carne viva', abriendo el paso para la internacionalización radial del género.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "La Guayanesa de Oro"
  },
  {
    name: "Norelkys Rondón",
    country: "Venezuela",
    bio: "Nacida en Aragua de Barcelona, Anzoátegui. Fuerte representante del canto recio femenino, respetada por su capacidad de contrapuntear de igual a igual con cualquier coplero del circuito.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "Voz Recia de Oriente"
  },
  {
    name: "Virginia Rocha",
    country: "Colombia",
    bio: "Nació el 20 de octubre de 1970 en El Castillo, Meta. Con un estilo enérgico y letras cargadas de coraje llanero, es una cantante, coplera y compositora referente del joropo recio colombiano.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "La Corocora del Llano"
  },
  {
    name: "Fabiana Ochoa",
    country: "Venezuela",
    bio: "Ruth Fabián Ochoa Carrero nació el 15 de marzo de 1978. Destacada cantante y compositora de voz fresca e impecable técnica, con un repertorio estilizado que ha alcanzado gran difusión en la radiodifusión nacional.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "Estilo y Sentimiento"
  },
  {
    name: "Andrea Mesa",
    country: "Colombia",
    bio: "Destacada exponente del joropo y el pasaje llanero estilizado, aplaudida por sus cuidadas puestas en escena y la elegancia interpretativa que imprime a cada una de sus melodías.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "Joropo Estilizado"
  },
  {
    name: "Araima Amézquita",
    country: "Venezuela",
    bio: "Yoselin Araima Amézquita Batista nació el 16 de abril de 1995 en Cúa, Miranda. Formada académicamente en canto popular en la Escuela Superior de Música José Ángel Lamas, combina técnica pulcra y alma llanera.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "La Flor de Cúa"
  },
  {
    name: "Adriana Boada",
    country: "Venezuela",
    bio: "Intérprete que destaca por su carisma y presencia escénica, fusionando la fuerza de la música llanera con la frescura y estética contemporánea.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "Nueva Imagen"
  },
  {
    name: "Rosangela Belisario",
    country: "Venezuela",
    bio: "Nacida en Maracay, Aragua, es hija del reconocido músico de folklore Enrique Belisario. Ha heredado y pulido el arte de interpretar el pasaje criollo con gran dulzura y fidelidad melódica.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "Heredera del Folklore"
  },
  {
    name: "Dameira Sánchez",
    country: "Venezuela",
    bio: "Cantante de San Sebastián de Los Reyes, Guárico, dueña de una voz melodiosa especializada en pasajes románticos de alta aceptación.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "Voz de Guárico"
  },
  {
    name: "Luvicmar Blanco",
    country: "Venezuela",
    bio: "Joven intérprete de gran proyección y frescura en el canto llanero tradicional, ganándose el aplauso en festivales de renombre.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "La Princesa del Joropo"
  },
  {
    name: "Mayra Tovar",
    country: "Venezuela",
    bio: "Nació el 19 de abril de 1973 en Elorza, Apure. Reconocida como una de las voces femeninas más potentes, enérgicas y recias de la nueva generación del folklore tradicional.",
    category: "crecimiento",
    subcategory: "Voces Femeninas",
    badge: "La Recia de Elorza"
  },

  // 3. JÓVENES TALENTOS Y VOCES EMERGENTES - Fenómenos Digitales e Innovadores
  {
    name: "El Cartelu",
    country: "Venezuela",
    bio: "Yorman Ratia nació en el caserío Chorroco abajo, Arizmendi, Barinas. Es un fenómeno viral en redes sociales (TikTok e Instagram) que ha sabido conectar a millones de jóvenes con el llano profundo a través de su carisma, coplas humorísticas y autenticidad del campo.",
    category: "emergentes",
    subcategory: "Fenómenos Digitales",
    badge: "El Cartelu / Yorman Ratia"
  },
  {
    name: "Duilfer Bona",
    country: "Venezuela",
    bio: "Nació el 22 de agosto de 2000 en Mantecal, Apure. Representante juvenil enfocado en refrescar el pasaje romántico llanero con arreglos modernos adaptados a las nuevas audiencias.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "Pasaje Moderno"
  },
  {
    name: "Soy Francisco Mercado",
    country: "Venezuela",
    bio: "Cantante y compositor llanero conocido como el 'Romancero de Apure'. Utiliza las plataformas digitales para difundir con humor y orgullo la cotidianidad y costumbres del hombre de sabana.",
    category: "emergentes",
    subcategory: "Fenómenos Digitales",
    badge: "Romancero de Apure"
  },

  // 3. JÓVENES TALENTOS Y VOCES EMERGENTES - Promesas Femeninas
  {
    name: "Rosmely Ledezma",
    country: "Venezuela",
    bio: "Joven intérprete que destaca por una afinación milimétrica y una calidez de voz impecable, ganándose rápidamente el apodo y respeto del público criollo.",
    category: "emergentes",
    subcategory: "Promesas Femeninas",
    badge: "La Dinamita del Canto"
  },
  {
    name: "Duglanny Sosa",
    country: "Venezuela",
    bio: "Nació el 2 de septiembre de 1990 en el caserío Cañadón, Barinas. Cuenta con una valiosa trayectoria de más de 10 años en escenarios locales, defendiendo el pasaje criollo y el golpe recio.",
    category: "emergentes",
    subcategory: "Promesas Femeninas",
    badge: "La Patrona"
  },
  {
    name: "Nakary Perdomo",
    country: "Venezuela",
    bio: "Nació el 25 de octubre en Ciudad Bolívar. Hija de los reconocidos intérpretes Mayira Anzoátegui e Iver Perdomo, representa la continuidad natural del folklore de pura cepa.",
    category: "emergentes",
    subcategory: "Promesas Femeninas",
    badge: "Sangre Criolla"
  },
  {
    name: "Ámbar Montilla",
    country: "Venezuela",
    bio: "Joven y talentosa cantante que utiliza de forma exitosa plataformas como TikTok e Instagram para dar una visual fresca, estética y renovada a la música llanera.",
    category: "emergentes",
    subcategory: "Promesas Femeninas",
    badge: "Talento TikTok"
  },
  {
    name: "Neymar Pantoja",
    country: "Venezuela",
    bio: "Una de las promesas infantiles y juveniles más llamativas de la música criolla, asombrando por su madurez vocal y puesta en escena a su corta edad.",
    category: "emergentes",
    subcategory: "Promesas Femeninas",
    badge: "Revelación Infantil"
  },

  // 3. JÓVENES TALENTOS Y VOCES EMERGENTES - Promesas Masculinas y Copleros
  {
    name: "Jhorvis Corrales",
    country: "Venezuela",
    bio: "Cantante y compositor de la nueva camada del folklore, originario de las históricas tierras de San Juan de Payara, Apure.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "Relevo Apureño"
  },
  {
    name: "Luis Andrés Bianchi",
    country: "Venezuela",
    bio: "Luis Andrés Bianchi Suárez nació en Tacarigua de Mamporal, Miranda. De raíces barloventeñas pero con un alma y modulación enteramente llaneras, destaca por su pasión por el arpa.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "El Barloventeño Llanero"
  },
  {
    name: "José Escobar",
    country: "Venezuela",
    bio: "Promesa musical que apuesta por integrar letras y temáticas contemporáneas bajo la estructura del joropo y pasaje tradicional.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "Tradición y Evolución"
  },
  {
    name: "Ariel Leal",
    country: "Colombia",
    bio: "Ariel Leal Romero nació en Paz de Ariporo, Casanare. Crecido en el campo profundo de la finca 'La Lejanía', su canto está impregnado de la sabana colombiana pura.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "Alma de Casanare"
  },
  {
    name: "Manuel Prisco",
    country: "Venezuela",
    bio: "Voz emergente de timbre sumamente criollo y afinado que se abre paso con fuerza en los festivales nacionales de pasaje.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "Voz Criolla"
  },
  {
    name: "Alexander Galdames",
    country: "Venezuela",
    bio: "Nació el 5 de abril en San Cristóbal, Táchira. Apuesta por la modernización del género a través de producciones audiovisuales cuidadas y de alta definición.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "Folklore Visual"
  },
  {
    name: "Adrián de Jesús Guarán",
    country: "Venezuela",
    bio: "Joven cantante guariqueño defensor del joropo recio, con destacada soltura en el contrapunteo improvisado.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "El Guariqueño"
  },
  {
    name: "Cristian Castillo",
    country: "Venezuela",
    bio: "Nació el 12 de abril de 1982 en Santa María de Ipire, Guárico. Cantautor autogestionado que utiliza la tecnología y plataformas de streaming para autogestionar su carrera musical.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "Cantautor Independiente"
  },
  {
    name: "Neyer Oropeza",
    country: "Colombia",
    bio: "Nació el 1 de enero de 1985 en Pore, Casanare. Cantautor que plasma con gran devoción la vida y las faenas de los hatos colombianos.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "Sentir Casanareño"
  },
  {
    name: "Leonard Reyes",
    country: "Venezuela",
    bio: "Nació el 27 de octubre de 1980 en Puerto Ordaz, Bolívar. Cantante, abogado, locutor y presentador de eventos. Su imponente estampa y voz le han valido reconocimiento en festivales nacionales.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "La Voz Gigante de Venezuela"
  },
  {
    name: "Reinaldo Acuña",
    country: "Venezuela",
    bio: "Cantautor nacido en Maturín, Monagas. Se destaca por interpretar de forma magistral tanto el joropo llanero tradicional como otros ritmos folklóricos orientales.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "Voz de Monagas"
  },
  {
    name: "Robenis González",
    country: "Venezuela",
    bio: "Cantante zuliana de nacimiento pero con un alma y pasión llanera indiscutibles. Creadora de contenido digital y conductora de su propio espacio radial.",
    category: "emergentes",
    subcategory: "Promesas Femeninas",
    badge: "Zuliana Llanera"
  },
  {
    name: "Roberci Hernández",
    country: "Venezuela",
    bio: "Joven intérprete oriundo de El Yagual, Apure, que destaca por el sentimiento rural de sus interpretaciones.",
    category: "emergentes",
    subcategory: "Promesas Masculinas",
    badge: "Voz Apureña"
  },

  // 4. PLATAFORMAS DE DIFUSIÓN Y ARCHIVO CULTURAL
  {
    name: "Puro Llano Radio",
    country: "Ambos",
    bio: "Emisora de radio online de vanguardia fundada en 2022. Es una de las plataformas líderes dedicadas a la promoción, archivo digital y difusión continua 24/7 en alta definición del folklore llanero colombo-venezolano.",
    category: "plataformas",
    subcategory: "Plataformas",
    badge: "Nuestra Casa"
  },
  {
    name: "Patio Sonoro",
    country: "Ambos",
    bio: "Destacada productora audiovisual y discográfica (asociada con Marmaz Records). Especialistas en capturar el joropo en directo a través de sesiones acústicas en vivo con calidad de estudio de clase mundial.",
    category: "plataformas",
    subcategory: "Plataformas",
    badge: "Sesiones en Vivo"
  },
  {
    name: "La Flor de Palavecino",
    country: "Venezuela",
    bio: "Comunidad digital y proyecto de difusión folklórica asociado al realce de talentos larenses y emergentes del canto criollo venezolano.",
    category: "plataformas",
    subcategory: "Plataformas",
    badge: "Comunidad Digital"
  },
  {
    name: "Corazón Llanero",
    country: "Venezuela",
    bio: "Fundación y plataforma multimedia que ha operado como canal de televisión abierta, producciones de gran escala y festivales nacionales buscando la masificación del joropo en Venezuela.",
    category: "plataformas",
    subcategory: "Plataformas",
    badge: "Masificación del Joropo"
  }
];

function Artistas() {
  const [activeTab, setActiveTab] = useState<"todos" | "consagrados" | "crecimiento" | "emergentes" | "plataformas">("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const filteredArtists = useMemo(() => {
    return ARTISTS_DATA.filter((artist) => {
      const matchesTab = activeTab === "todos" || artist.category === activeTab;
      const matchesSearch =
        artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (artist.badge && artist.badge.toLowerCase().includes(searchQuery.toLowerCase())) ||
        artist.bio.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--crema)] bg-grain pb-24">
      {/* HEADER SECTION */}
      <section className="relative overflow-hidden bg-[var(--carbon)] py-20 text-[var(--crema)] sm:py-28">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url(${arpaImg})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--carbon)]/90 via-[var(--carbon)]/85 to-[var(--carbon)]" />
        
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--oro)]/30 bg-[var(--oro)]/10 px-4 py-1.5 backdrop-blur-sm">
            <Star className="h-4 w-4 text-[var(--oro)] fill-current animate-pulse" />
            <span className="font-display text-xs uppercase tracking-widest text-[var(--oro)]">El Elenco del Llano</span>
          </div>
          <h1 className="mt-4 font-display text-5xl leading-none text-white sm:text-7xl">Nuestros Artistas</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-xl">
            La vitrina oficial y archivo cultural del folklore llanero colombo-venezolano. Aquí conviven las leyendas inmortales, las voces de hoy y el futuro de la sabana.
          </p>
        </div>
      </section>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="sticky top-[72px] z-20 border-b border-[var(--sabana)]/10 bg-[var(--crema)]/90 py-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {[
              { id: "todos", label: "Todos", icon: Music4 },
              { id: "consagrados", label: "Élite Histórica", icon: Award },
              { id: "crecimiento", label: "Consolidados", icon: Star },
              { id: "emergentes", label: "Nuevos Talentos", icon: Sparkles },
              { id: "plataformas", label: "Plataformas", icon: Radio }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as never)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs uppercase tracking-wider transition ${
                    isActive
                      ? "bg-[var(--sabana)] text-[var(--crema)] shadow-md"
                      : "bg-white text-[var(--sabana)] border border-[var(--sabana)]/10 hover:bg-[var(--oro)]/15"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center text-[var(--muted-foreground)]">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar artista, copla o región..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[var(--sabana)]/10 bg-white py-2 pl-10 pr-4 font-body text-sm text-[var(--carbon)] placeholder-[var(--muted-foreground)] shadow-inner outline-none focus:border-[var(--oro)] focus:ring-1 focus:ring-[var(--oro)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--terracota)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ARTISTS GRID */}
      <section className="mx-auto mt-12 max-w-7xl px-6">
        {filteredArtists.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--oro)]/10 text-[var(--oro)]">
              <Music4 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-display text-2xl text-[var(--sabana)]">No se encontraron artistas</h3>
            <p className="mt-2 text-[var(--muted-foreground)]">Prueba escribiendo otro término de búsqueda o cambiando el filtro.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArtists.map((artist) => (
              <article
                key={artist.name}
                onClick={() => setSelectedArtist(artist)}
                className="group relative flex flex-col justify-between cursor-pointer overflow-hidden rounded-3xl border border-[var(--sabana)]/15 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--oro)] hover:shadow-md"
              >
                {/* Decorative left border stripe by category */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-2 ${
                    artist.category === "consagrados"
                      ? "bg-[var(--oro)]"
                      : artist.category === "crecimiento"
                        ? "bg-[var(--terracota)]"
                        : artist.category === "emergentes"
                          ? "bg-emerald-500"
                          : "bg-[var(--carbon)]"
                  }`}
                />

                <div className="pl-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[9px] uppercase tracking-widest text-[var(--terracota)]">
                      {artist.subcategory}
                    </span>
                    {artist.country && (
                      <span className="rounded bg-[var(--crema)] px-2 py-0.5 font-display text-[9px] uppercase tracking-wider text-[var(--sabana)]">
                        {artist.country}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 font-display text-2xl leading-tight text-[var(--sabana)] group-hover:text-[var(--terracota)] transition-colors">
                    {artist.name}
                  </h3>

                  {artist.badge && (
                    <div className="mt-1 font-body text-xs italic text-[var(--muted-foreground)]">
                      "{artist.badge}"
                    </div>
                  )}

                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[var(--foreground)]/80">
                    {artist.bio}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[var(--sabana)]/5 pl-2 pt-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--sabana)]/70 transition group-hover:text-[var(--terracota)]">
                    <BookOpen className="h-3.5 w-3.5" /> Leer biografía
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition group-hover:translate-x-1 group-hover:text-[var(--terracota)]" />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* DETAIL MODAL */}
      {selectedArtist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            onClick={() => setSelectedArtist(null)}
            className="absolute inset-0 bg-[var(--carbon)]/70 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl border border-[var(--oro)]/30 bg-[var(--crema)] p-6 shadow-2xl transition-all duration-300 sm:p-8 animate-[fade-in_0.3s_ease-out]">
            
            {/* Header decoration color bar */}
            <div
              className={`absolute left-0 right-0 top-0 h-3 ${
                selectedArtist.category === "consagrados"
                  ? "bg-[var(--oro)]"
                  : selectedArtist.category === "crecimiento"
                    ? "bg-[var(--terracota)]"
                    : selectedArtist.category === "emergentes"
                      ? "bg-emerald-500"
                      : "bg-[var(--carbon)]"
              }`}
            />

            {/* Close Button */}
            <button
              onClick={() => setSelectedArtist(null)}
              className="absolute right-4 top-5 rounded-full bg-white/60 p-2 text-[var(--sabana)] transition hover:bg-[var(--oro)]/20"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--terracota)]/10 px-3 py-1 font-display text-[10px] uppercase tracking-widest text-[var(--terracota)]">
                  {selectedArtist.subcategory}
                </span>
                {selectedArtist.country && (
                  <span className="rounded-full bg-[var(--sabana)]/10 px-3 py-1 font-display text-[10px] uppercase tracking-widest text-[var(--sabana)]">
                    Origen: {selectedArtist.country}
                  </span>
                )}
                {selectedArtist.isImmortal && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--oro)]/20 px-3 py-1 font-display text-[10px] uppercase tracking-widest text-[var(--carbon)]">
                    <Landmark className="h-3 w-3" /> Legado Eterno
                  </span>
                )}
              </div>

              <h2 className="mt-4 font-display text-3xl text-[var(--sabana)] sm:text-4xl">
                {selectedArtist.name}
              </h2>

              {selectedArtist.badge && (
                <div className="mt-1 font-display text-sm font-semibold tracking-wide text-[var(--terracota)] uppercase">
                  "{selectedArtist.badge}"
                </div>
              )}

              <div className="my-6 border-t border-[var(--sabana)]/10" />

              <div className="max-h-[350px] overflow-y-auto pr-2">
                <p className="font-body text-base leading-relaxed text-[var(--carbon)] whitespace-pre-line">
                  {selectedArtist.bio}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-[var(--sabana)]/10 pt-4 text-xs text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <Radio className="h-3.5 w-3.5 text-[var(--oro)]" /> Rotando en Puro Llano Radio
                </span>
                <button
                  onClick={() => {
                    setSelectedArtist(null);
                    window.dispatchEvent(new Event("pll:play"));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--oro)] px-4 py-2 font-display text-xs uppercase tracking-wider text-[var(--carbon)] transition hover:scale-105 active:scale-95"
                >
                  <Music4 className="h-3.5 w-3.5" /> Escuchar folklore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
