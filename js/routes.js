// Ruteregister — legg til nye ruter her.
//
// 1. Legg GPX-fila i routes/  (fra Strava, Garmin, Outdooractive, Gaia …)
// 2. Legg til en oppføring under med navn, vanskelighet og beskrivelse.
// difficulty: "gronn" | "rod" | "sort"
//
// Nedfartene er hentet fra Trailguide (trailguide.net, snapshot i
// data/trailguide_kongsberg.json — regenerer med tools/trailguide_routes.py).
// Vanskelighet følger Trailguides MTB-gradering: gronn | bla | rod | sort.
// «Heimaten» fra prosjektsamtalen er ikke funnet på Trailguide — trolig
// feilhøring i transkripsjonen; mangler fortsatt.

const ROUTES = [
  {
    file: "routes/telefonlopa.gpx",
    name: "Telefonløypa",
    difficulty: "rod",
    description:
      "Nedfart fra ca. 590 til 380 moh, 1,9 km. Ekte GPX fra Strava-løpetur " +
      "2024-08-29. Rød gradering bekreftet av Trailguide.",
  },
  {
    file: "routes/telefonlopa_helt_ned.gpx",
    name: "Telefonløypa helt ned (Ollebakkene til Funkelia)",
    difficulty: "rod",
    description: "Fortsettelsen av Telefonløypa ned til Funkelia. Fra Trailguide.",
  },
  {
    file: "routes/gule_sva.gpx",
    name: "Gule Sva",
    difficulty: "rod",
    description:
      "Nedfart 1,6 km, 131 m fall, over det gule svaberget ved Kongens gruve. " +
      "Terrengsykkel.no trekker den fram som en av klassikerne. Fra Trailguide.",
  },
  {
    file: "routes/sachsen_2.gpx",
    name: "Sachsen 2",
    difficulty: "bla",
    description: "Nedfart fra Sachsen-området. Fra Trailguide.",
  },
  {
    file: "routes/sachsen_3.gpx",
    name: "Sachsen 3",
    difficulty: "rod",
    description: "Nedfart fra Sachsen-området. Fra Trailguide.",
  },
  {
    file: "routes/jernbordet.gpx",
    name: "Jernbordet (Knutehytta–Sachsen)",
    difficulty: "rod",
    description:
      "Stien fra Knutehytta som ender på Sachsen — den blåmerkede stien fra " +
      "prosjektsamtalen. Fra Trailguide.",
  },
  {
    file: "routes/gruvesafari.gpx",
    name: "Gruvesafari",
    difficulty: "bla",
    description: "Tur gjennom gruveområdet i Gruveåsen. Fra Trailguide.",
  },
  {
    file: "routes/storaasen_afterbike.gpx",
    name: "Storåsen Afterbike",
    difficulty: "bla",
    description: "Afterbike-løypa på Storåsen. Fra Trailguide.",
  },
  {
    file: "routes/gruvaasen_st_anger.gpx",
    name: "Gruveåsen (St. Anger)",
    difficulty: "rod",
    description:
      "4,4 km nedfart gjennom Gruveåsen — inneholder St. Anger-segmentene. " +
      "Bekreftet syklet (MTB-tur 2022-07-21). Fra Trailguide.",
  },
  {
    file: "routes/bakerommen.gpx",
    name: "Bakerommen",
    difficulty: "rod",
    description:
      "Nedfart 884 m. Området kalles også Bakerovnen — her ligger «Gorms Surprise» " +
      "med bygde elementer og dropp helt ned til skisenteret (terrengsykkel.no). " +
      "Bekreftet syklet (MTB-tur 2022-07-21). Fra Trailguide.",
  },
  {
    file: "routes/bergmannsstien.gpx",
    name: "Bergmannsstien",
    difficulty: "rod",
    description:
      "Nedfart 1,8 km med klopper og høydedrag — følges gjerne rett fra Gule Sva. " +
      "Bekreftet syklet (MTB-tur 2022-05-12). Fra Trailguide.",
  },
  {
    file: "routes/knuteveien.gpx",
    name: "Knuteveien",
    difficulty: "gronn",
    transport: true,
    description: "Grusvei-klatring 8,9 km / 573 hm opp til Knutefjell. Fra Trailguide.",
  },
  {
    file: "routes/korsveien.gpx",
    name: "Korsveien til Korset",
    difficulty: "gronn",
    transport: true,
    description:
      "Transport opp: grusveien fra byen, tvers gjennom slalåmbakken og opp til " +
      "Korset-monumentet. 3,9 km / ca. 190 hm. Geometri fra OSM, høyder fra Kartverket.",
  },

  {
    file: "routes/eriksloypa.gpx",
    name: "Eriksløypa",
    difficulty: "rod",
    description:
      "Hovednedturen fra baksiden av Knutehytta mot Sachsen — svabergkjøring, " +
      "crux ved Jerntjern og naturtrapp med dropp (kilde: terrengsykkel.no). " +
      "2,9 km. Geometri fra OSM, høyder fra Kartverket.",
  },
  {
    file: "routes/heimaten.gpx",
    name: "Heimaten (ubekreftet trasé)",
    difficulty: "bla",
    description:
      "Fra Rundtjern langs kanten, parallelt med lysløypa, ned til Funkelia. " +
      "UBEKREFTET: traseen er tegnet etter beskrivelse og må sjekkes på bakken. " +
      "Gradering ikke bekreftet.",
  },
  {
    file: "routes/funkelia_korsveien.gpx",
    name: "Funkelia til Korsveien",
    difficulty: "gronn",
    transport: true,
    description:
      "Fra parkeringen i Funkelia, forbi tavla der lysløypa slutter, og opp i " +
      "grusveien Korsveien midt i slalåmbakken. Kobler Funkelia på Korset-klatringen.",
  },

  // --- Gruveåsen/Funkelia/Saggrenda-utvidelsen (2026-08-28) ---
  {
    file: "routes/knoffemyrstien.gpx",
    name: "Knoffemyrstien",
    difficulty: "bla",
    description: "Nedfart ved Knoffemyr, rett ved Funkelia. Fra Trailguide.",
  },
  {
    file: "routes/knoffemyr_flyt.gpx",
    name: "Knoffemyr Flyt",
    difficulty: "bla",
    description: "Flytsti ved Knoffemyr. Fra Trailguide.",
  },
  {
    file: "routes/knoffemyr_enduro.gpx",
    name: "Knoffemyr Enduro",
    difficulty: "rod",
    description: "Bratteste Knoffemyr-varianten. Fra Trailguide.",
  },
  {
    file: "routes/helvetesdalen.gpx",
    name: "Helvetesdalen",
    difficulty: "rod",
    description: "Nedfart sør i Gruveåsen. Fra Trailguide.",
  },
  {
    file: "routes/justitsen.gpx",
    name: "Justitsen",
    difficulty: "bla",
    description: "Starter samme sted som Gule Sva — blå-alternativet. Fra Trailguide.",
  },
  {
    file: "routes/tommerrenna.gpx",
    name: "Tømmer-renna",
    difficulty: "rod",
    description: "Kort nedfart ved Saggrenda, samme start som Bergmannsstien. Fra Trailguide.",
  },
  {
    file: "routes/saggrenda_spesial.gpx",
    name: "Saggrenda spesial",
    difficulty: "rod",
    description: "Lang variant ved Saggrenda. Fra Trailguide.",
  },
  {
    file: "routes/malmkleiva.gpx",
    name: "Malmkleiva",
    difficulty: "bla",
    description: "Nedfart på vestsiden av Knuteområdet. Fra Trailguide.",
  },
  {
    file: "routes/henchensetra.gpx",
    name: "Henchensetra",
    difficulty: "gronn",
    description: "Rolig sti i Sachsen-området. Fra Trailguide.",
  },
  {
    file: "routes/sachsen_granatdammen.gpx",
    name: "Sachsen – Granatdammen",
    difficulty: "bla",
    description: "Kort forbindelse i Sachsen-området. Fra Trailguide.",
  },
  {
    file: "routes/speiderroa_1.gpx",
    name: "Speiderroa 1",
    difficulty: "bla",
    description: "Nybegynnervennlig flytområde. Fra Trailguide.",
  },
  {
    file: "routes/speiderroa_2.gpx",
    name: "Speiderroa 2",
    difficulty: "bla",
    description: "Nybegynnervennlig flytområde. Fra Trailguide.",
  },
  {
    file: "routes/speiderroa_3.gpx",
    name: "Speiderroa 3 (Steinbordet)",
    difficulty: "bla",
    description: "Lengste Speiderroa-varianten, ned til Steinbordet. Fra Trailguide.",
  },
  {
    file: "routes/speiderroa_opp.gpx",
    name: "Opp til Speiderroa",
    difficulty: "gronn",
    transport: true,
    description: "Grusklatring opp til Speiderroa-stiene. Fra Trailguide.",
  },
  {
    file: "routes/hogda.gpx",
    name: "Høgda",
    difficulty: "bla",
    description: "Kort sti ved Storåsen. Fra Trailguide.",
  },
  {
    file: "routes/rundtjern_storaasen.gpx",
    name: "Rundtjern – Storåsen over Høgda",
    difficulty: "bla",
    description: "Forbindelse Rundtjern–Storåsen. Fra Trailguide.",
  },
  {
    file: "routes/tangentjern_rundtjern.gpx",
    name: "Tangentjern – Rundtjern",
    difficulty: "bla",
    description: "Kort sti ved Storåsen. Fra Trailguide.",
  },
  {
    file: "routes/perslokka_rundvann.gpx",
    name: "Persløkka – Rundvann",
    difficulty: "bla",
    description: "Fra Funkelia-parkeringen opp mot Rundvann. Fra Trailguide.",
  },
  {
    file: "routes/briskemyrrunden.gpx",
    name: "Briskemyrrunden",
    difficulty: "bla",
    description: "Rundtur 5,1 km sør for Knuteveien. Fra Trailguide.",
  },

  // --- Østsiden: Madsebakken/Langevann/Sulusåsen (2026-08-28) ---
  {
    file: "routes/lailastien.gpx",
    name: "Lailastien",
    difficulty: "rod",
    description: "Klassikeren på østsiden — 2,5 km, 298 m fall. Fra Trailguide.",
  },
  {
    file: "routes/langevannstoppen.gpx",
    name: "Langevannstoppen",
    difficulty: "rod",
    description: "Lang nedfart fra Langevannstoppen, 309 m fall. Fra Trailguide.",
  },
  {
    file: "routes/langevannstoppen_opp.gpx",
    name: "Langevannstoppen klatringen",
    difficulty: "gronn",
    transport: true,
    description: "Grusklatring opp til Langevannstoppen. Fra Trailguide.",
  },
  {
    file: "routes/langevann_enduro.gpx",
    name: "Langevann Enduro",
    difficulty: "rod",
    description: "Kort og bratt ved Langevann. Fra Trailguide.",
  },
  {
    file: "routes/langevannskleiva.gpx",
    name: "Langevannskleiva",
    difficulty: "rod",
    description: "Kort og bratt ved Langevann. Fra Trailguide.",
  },
  {
    file: "routes/kampestad.gpx",
    name: "Kampestad",
    difficulty: "bla",
    description: "Kort nedfart ved Kampestad. Fra Trailguide.",
  },
  {
    file: "routes/kampestad_travers.gpx",
    name: "Kampestad travers",
    difficulty: "sort",
    description: "Kartets første sortrute — ekspertnedfart ved Kampestad. Fra Trailguide.",
  },
  {
    file: "routes/fugleplassen.gpx",
    name: "Fugleplassen",
    difficulty: "rod",
    description: "Nedfart ved Fugleplassen. Fra Trailguide.",
  },
  {
    file: "routes/fugleplassen_ovre.gpx",
    name: "Fugleplassen øvre",
    difficulty: "bla",
    description: "Øvre del av Fugleplassen. Fra Trailguide.",
  },
  {
    file: "routes/sulusaasen.gpx",
    name: "Sulusåsen",
    difficulty: "bla",
    description: "Nedkjøring gjennom barskog mot Bevergrenda. Fra Trailguide.",
  },
  {
    file: "routes/afc.gpx",
    name: "AFC",
    difficulty: "rod",
    description: "Nedfart nord for Kampestad. Fra Trailguide.",
  },
];
