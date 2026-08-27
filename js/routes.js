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
    description: "Nedfart 1,6 km, 131 m fall, over det gule svaberget. Fra Trailguide.",
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
    file: "routes/kommune_sykkelsti_1.gpx",
    name: "Sykkelrute på sti (kommunedata)",
    difficulty: "rod",
    description: "Merket sykkelrute på sti fra kommunens friluftskart. Skal erstattes/døpes om.",
  },
  {
    file: "routes/kommune_sykkelvei_1.gpx",
    name: "Sykkelrute på vei 1 (kommunedata)",
    difficulty: "gronn",
    description: "Merket sykkelrute på vei fra kommunens friluftskart.",
  },
  {
    file: "routes/kommune_sykkelvei_2.gpx",
    name: "Sykkelrute på vei 2 (kommunedata)",
    difficulty: "gronn",
    description: "Merket sykkelrute på vei fra kommunens friluftskart.",
  },
  {
    file: "routes/kommune_sykkelvei_3.gpx",
    name: "Sykkelrute på vei 3 (kommunedata)",
    difficulty: "gronn",
    description: "Merket sykkelrute på vei fra kommunens friluftskart.",
  },
];
