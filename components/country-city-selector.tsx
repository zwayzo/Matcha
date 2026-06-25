"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2 } from "lucide-react"

// Major countries and their cities
const COUNTRIES_CITIES: Record<string, string[]> = {
  "United States": [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "San Francisco", "Charlotte", "Indianapolis",
    "Seattle", "Denver", "Washington", "Boston", "El Paso", "Nashville", "Detroit"
  ],
  "Canada": [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa",
    "Winnipeg", "Quebec City", "Hamilton", "Kitchener", "London", "Halifax"
  ],
  "United Kingdom": [
    "London", "Manchester", "Birmingham", "Glasgow", "Liverpool", "Newcastle",
    "Sheffield", "Bristol", "Cardiff", "Belfast", "Edinburgh", "Leicester"
  ],
  "Germany": [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart",
    "Düsseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden"
  ],
  "France": [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes",
    "Montpellier", "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims"
  ],
  "Spain": [
    "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga",
    "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba"
  ],
  "Italy": [
    "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa",
    "Bologna", "Florence", "Bari", "Catania", "Venice", "Verona"
  ],
  "Netherlands": [
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen",
    "Tilburg", "Almere", "Breda", "Nijmegen", "Enschede", "Haarlem"
  ],
  "Australia": [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast",
    "Newcastle", "Canberra", "Sunshine Coast", "Wollongong", "Geelong", "Hobart"
  ],
  "Japan": [
    "Tokyo", "Osaka", "Yokohama", "Nagoya", "Sapporo", "Fukuoka",
    "Kobe", "Kawasaki", "Kyoto", "Saitama", "Hiroshima", "Sendai"
  ],
  "Brazil": [
    "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte",
    "Manaus", "Curitiba", "Recife", "Porto Alegre", "Belém", "Goiânia"
  ],
  "Mexico": [
    "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León",
    "Juárez", "Torreón", "Querétaro", "San Luis Potosí", "Mérida", "Mexicali"
  ],
  "India": [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata",
    "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur"
  ],
  "China": [
    "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Tianjin", "Wuhan",
    "Dongguan", "Chengdu", "Nanjing", "Xi'an", "Hangzhou", "Foshan"
  ],
  "South Korea": [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju",
    "Suwon", "Ulsan", "Changwon", "Goyang", "Yongin", "Seongnam"
  ],
  "Russia": [
    "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Nizhniy Novgorod", "Kazan",
    "Chelyabinsk", "Omsk", "Samara", "Rostov-on-Don", "Ufa", "Krasnoyarsk"
  ],
  "Morocco": [
    "Casablanca", "Rabat", "Fes", "Marrakech", "Agadir", "Tangier",
    "Meknes", "Oujda", "Kenitra", "Tetouan", "Safi", "El Jadida"
  ],
  "Algeria": [
    "Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna",
    "Djelfa", "Sétif", "Sidi Bel Abbès", "Biskra", "Tébessa", "Béjaïa"
  ],
  "Tunisia": [
    "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès",
    "Aryanah", "Gafsa", "Monastir", "Ben Arous"
  ],
  "Egypt": [
    "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez",
    "Luxor", "Mansoura", "El Mahalla El Kubra", "Tanta", "Asyut", "Ismailia"
  ],
  "Nigeria": [
    "Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Benin City",
    "Maiduguri", "Zaria", "Aba", "Jos", "Ilorin", "Ogun"
  ],
  "South Africa": [
    "Cape Town", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth",
    "Bloemfontein", "Nelspruit", "East London", "Polokwane", "Kimberley"
  ],
  "Kenya": [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika",
    "Malindi", "Kitale", "Garissa", "Kakamega"
  ],
  "Ghana": [
    "Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Obuasi",
    "Tema", "Sunyani", "Koforidua", "Ho"
  ],
  "United Arab Emirates": [
    "Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah",
    "Fujairah", "Umm Al Quwain"
  ],
  "Saudi Arabia": [
    "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar",
    "Tabuk", "Buraidah", "Khamis Mushait", "Hail"
  ],
  "Turkey": [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Gaziantep",
    "Konya", "Antalya", "Kayseri", "Mersin", "Diyarbakır", "Eskişehir"
  ],
  "Israel": [
    "Tel Aviv", "Jerusalem", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod",
    "Netanya", "Beersheba", "Holon", "Bnei Brak"
  ],
  "Lebanon": [
    "Beirut", "Tripoli", "Sidon", "Tyre", "Jounieh", "Zahle"
  ],
  "Pakistan": [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan",
    "Hyderabad", "Gujranwala", "Peshawar", "Quetta"
  ],
  "Bangladesh": [
    "Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Comilla",
    "Mymensingh", "Barishal", "Rangpur", "Narayanganj"
  ],
  "Vietnam": [
    "Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Can Tho",
    "Bien Hoa", "Hue", "Nha Trang", "Vung Tau", "Da Lat"
  ],
  "Thailand": [
    "Bangkok", "Chiang Mai", "Chiang Rai", "Pattaya", "Hat Yai",
    "Nakhon Ratchasima", "Khon Kaen", "Udon Thani", "Phuket", "Surin"
  ],
  "Malaysia": [
    "Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Shah Alam",
    "Petaling Jaya", "Kota Kinabalu", "Kuching", "Subang Jaya", "Malacca"
  ],
  "Indonesia": [
    "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar",
    "Palembang", "Depok", "Tangerang", "Bekasi"
  ],
  "Philippines": [
    "Manila", "Quezon City", "Caloocan", "Davao", "Cebu City",
    "Zamboanga", "Antipolo", "Taguig", "Pasig", "Cagayan de Oro"
  ],
  "Singapore": ["Singapore"],
  "Argentina": [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata",
    "San Miguel de Tucumán", "Mar del Plata", "Salta", "Santa Fe", "San Juan"
  ],
  "Colombia": [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena",
    "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué"
  ],
  "Chile": [
    "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta",
    "Temuco", "Rancagua", "Talca", "Arica", "Iquique"
  ],
  "Peru": [
    "Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura",
    "Iquitos", "Cusco", "Chimbote", "Huancayo", "Tacna"
  ],
  "Poland": [
    "Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk",
    "Szczecin", "Bydgoszcz", "Lublin", "Katowice"
  ],
  "Sweden": [
    "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås",
    "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping"
  ],
  "Norway": [
    "Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen",
    "Fredrikstad", "Kristiansand", "Sandnes", "Tromsø", "Sarpsborg"
  ],
  "Denmark": [
    "Copenhagen", "Aarhus", "Odense", "Aalborg", "Frederiksberg",
    "Esbjerg", "Gentofte", "Gladsaxe", "Randers", "Kolding"
  ],
  "Finland": [
    "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu",
    "Turku", "Jyväskylä", "Lahti", "Kuopio", "Pori"
  ],
  "Austria": [
    "Vienna", "Graz", "Linz", "Salzburg", "Innsbruck",
    "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn"
  ],
  "Switzerland": [
    "Zürich", "Geneva", "Basel", "Bern", "Lausanne",
    "Winterthur", "Lucerne", "St. Gallen", "Lugano", "Biel"
  ],
  "Belgium": [
    "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège",
    "Bruges", "Namur", "Leuven", "Mons", "Aalst"
  ],
  "Portugal": [
    "Lisbon", "Porto", "Braga", "Coimbra", "Funchal",
    "Setúbal", "Aveiro", "Viseu", "Leiria", "Évora"
  ],
  "Greece": [
    "Athens", "Thessaloniki", "Patras", "Piraeus", "Larissa",
    "Heraklion", "Peristeri", "Kallithea", "Acharnes", "Kalamaria"
  ],
  "Czech Republic": [
    "Prague", "Brno", "Ostrava", "Plzeň", "Liberec",
    "Olomouc", "Ústí nad Labem", "České Budějovice", "Hradec Králové", "Pardubice"
  ],
  "Hungary": [
    "Budapest", "Debrecen", "Miskolc", "Szeged", "Pécs",
    "Győr", "Nyíregyháza", "Kecskemét", "Székesfehérvár", "Szombathely"
  ],
  "Romania": [
    "Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța",
    "Craiova", "Brașov", "Galați", "Ploiești", "Oradea"
  ],
  "Ukraine": [
    "Kyiv", "Kharkiv", "Odessa", "Dnipro", "Donetsk",
    "Zaporizhzhia", "Lviv", "Kryvyi Rih", "Mykolaiv", "Mariupol"
  ],
  "New Zealand": [
    "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga",
    "Napier-Hastings", "Dunedin", "Palmerston North", "Nelson", "Rotorua"
  ],
  "Ireland": [
    "Dublin", "Cork", "Limerick", "Galway", "Waterford",
    "Drogheda", "Dundalk", "Swords", "Bray", "Navan"
  ],
}

interface CountryCitySelectorProps {
  selectedCountry: string
  selectedCity: string
  onCountryChange: (country: string) => void
  onCityChange: (city: string) => void
  onLocationDetect?: () => void
  isDetectingLocation?: boolean
}

export function CountryCitySelector({
  selectedCountry,
  selectedCity,
  onCountryChange,
  onCityChange,
  onLocationDetect,
  isDetectingLocation = false
}: CountryCitySelectorProps) {
  const [availableCities, setAvailableCities] = useState<string[]>([])

  const hasKnownCities = selectedCountry
    ? selectedCountry in COUNTRIES_CITIES
    : false

  useEffect(() => {
    if (selectedCountry && COUNTRIES_CITIES[selectedCountry]) {
      setAvailableCities(COUNTRIES_CITIES[selectedCountry])
    } else {
      setAvailableCities([])
    }
  }, [selectedCountry])

  const countries = Object.keys(COUNTRIES_CITIES).sort()
  // Include the detected country even if not in our list
  const allCountries = selectedCountry && !countries.includes(selectedCountry)
    ? [...countries, selectedCountry].sort()
    : countries

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Country</label>
          <Select value={selectedCountry} onValueChange={(val) => { onCountryChange(val); onCityChange("") }}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {allCountries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City — dropdown if known cities exist, free-text otherwise */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">City</label>
          {hasKnownCities ? (
            <Select
              value={selectedCity}
              onValueChange={onCityChange}
              disabled={!selectedCountry}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white disabled:opacity-50">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder={selectedCountry ? "Enter your city" : "Select country first"}
              disabled={!selectedCountry}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 disabled:opacity-50"
            />
          )}
        </div>
      </div>

      {/* GPS Detection Button */}
      {onLocationDetect && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={onLocationDetect}
            disabled={isDetectingLocation}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {isDetectingLocation ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Use My Location
              </>
            )}
          </Button>
        </div>
      )}

      <p className="text-xs text-white/50 text-center">
        Select your country and city, or use GPS to detect your location
      </p>
    </div>
  )
}