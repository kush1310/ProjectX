package com.charusat.canteen.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * MapController - Map Leaflet API for CHARUSAT University campus maps,
 * location points, Leaflet configuration, and delivery routing.
 */
@RestController
@RequestMapping("/api/map")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://127.0.0.1:5173"})
public class MapController {

    private final JdbcTemplate jdbc;

    // Static CHARUSAT campus locations list
    private static final List<Map<String, Object>> CAMPUS_LOCATIONS = Arrays.asList(
            createLocation("cspit", "CSPIT Engineering Building", "CSPIT", "building", 22.6005, 72.8201, "Faculty of Technology & Engineering"),
            createLocation("depstar", "DEPSTAR Tech Block", "DEPSTAR", "building", 22.6012, 72.8210, "Devang Patel Institute of Advance Tech"),
            createLocation("pdpias", "PDPIAS Applied Sciences", "PDPIAS", "building", 22.5990, 72.8198, "P.D. Patel Institute of Applied Sciences"),
            createLocation("cmpica", "CMPICA Computer Block", "CMPICA", "building", 22.6015, 72.8192, "Smt. Chandaben Mohanbhai Patel Inst."),
            createLocation("rpcp", "RPCP Pharmacy College", "RPCP", "building", 22.6000, 72.8188, "Ramanbhai Patel College of Pharmacy"),
            createLocation("patel_puff", "Patel Puff Canteen", "PUFF", "canteen", 22.5985, 72.8215, "Go Hunger - Patel Puff Outlet"),
            createLocation("gohunger", "Go Hunger Cafe", "GOHUNGER", "canteen", 22.5998, 72.8212, "Central Plaza Food Court"),
            createLocation("honest", "Honest Restaurant", "HONEST", "canteen", 22.6005, 72.8201, "CSPIT Ground Floor Outlet"),
            createLocation("campus_bites", "Campus Bites", "BITES", "canteen", 22.6012, 72.8210, "DEPSTAR First Floor Canteen"),
            createLocation("spice_junction", "Spice Junction", "SPICE", "canteen", 22.5990, 72.8198, "PDPIAS Food Court"),
            createLocation("boys_hostel", "Boys Hostel Complex", "BOYS_HOSTEL", "hostel", 22.6025, 72.8220, "Shreedeep, Nisarg, Ohm & Royal Care"),
            createLocation("girls_hostel", "Girls Hostel Complex (H1-H9)", "GIRLS_HOSTEL", "hostel", 22.5975, 72.8230, "CHARUSAT Girls Residency H1-H9"),
            createLocation("admin", "CHARUSAT Central Plaza Lawn", "ADMIN", "landmark", 22.5996, 72.8205, "Main Entrance & Administrative Lawn")
    );

    private static Map<String, Object> createLocation(String id, String name, String code, String type, double lat, double lng, String description) {
        Map<String, Object> loc = new HashMap<>();
        loc.put("id", id);
        loc.put("name", name);
        loc.put("code", code);
        loc.put("type", type);
        loc.put("lat", lat);
        loc.put("lng", lng);
        loc.put("description", description);
        return loc;
    }

    /**
     * GET /api/map/locations
     * Returns campus location coordinates and canteen locations.
     */
    @GetMapping("/locations")
    public ResponseEntity<?> getCampusLocations() {
        List<Map<String, Object>> result = new ArrayList<>(CAMPUS_LOCATIONS);

        // Optionally query canteens table to enhance canteen location list if available
        try {
            List<Map<String, Object>> dbCanteens = jdbc.queryForList(
                    "SELECT id, name, location FROM canteens WHERE is_open = true"
            );
            for (Map<String, Object> row : dbCanteens) {
                String id = "db_canteen_" + row.get("id");
                String name = (String) row.get("name");
                String locationDesc = (String) row.get("location");
                // check if not already present
                boolean exists = result.stream().anyMatch(l -> name.equalsIgnoreCase((String) l.get("name")));
                if (!exists) {
                    result.add(createLocation(id, name, "CANTEEN_" + row.get("id"), "canteen", 22.5998, 72.8212, locationDesc != null ? locationDesc : "CHARUSAT Campus Canteen"));
                }
            }
        } catch (Exception ignored) {
            // fallback to static list
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "campus", "CHARUSAT University, Changa, Anand",
                "center", Map.of("lat", 22.6005, "lng", 72.8201),
                "locations", result
        ));
    }

    /**
     * GET /api/map/config
     * Returns Leaflet configuration details (tile URLs, bounds, zoom levels).
     */
    @GetMapping("/config")
    public ResponseEntity<?> getMapConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("defaultCenter", Arrays.asList(22.6005, 72.8201));
        config.put("defaultZoom", 17);
        config.put("minZoom", 15);
        config.put("maxZoom", 19);

        Map<String, Object> tiles = new HashMap<>();
        tiles.put("standard", Map.of(
                "name", "OpenStreetMap",
                "url", "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "attribution", "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
        ));
        tiles.put("satellite", Map.of(
                "name", "Esri Satellite",
                "url", "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                "attribution", "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        ));

        config.put("tiles", tiles);
        config.put("bounds", Map.of(
                "southWest", Arrays.asList(22.5900, 72.8100),
                "northEast", Arrays.asList(22.6100, 72.8300)
        ));

        return ResponseEntity.ok(Map.of("success", true, "config", config));
    }

    /**
     * GET /api/map/route
     * Returns route waypoints, distance, and ETA between start and end coordinates.
     */
    @GetMapping("/route")
    public ResponseEntity<?> getRoute(
            @RequestParam(defaultValue = "22.5998") double startLat,
            @RequestParam(defaultValue = "72.8212") double startLng,
            @RequestParam(defaultValue = "22.6005") double endLat,
            @RequestParam(defaultValue = "72.8201") double endLng) {

        // Haversine distance in meters
        double earthRadius = 6371000; // meters
        double dLat = Math.toRadians(endLat - startLat);
        double dLng = Math.toRadians(endLng - startLng);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(startLat)) * Math.cos(Math.toRadians(endLat))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distanceMeters = earthRadius * c;

        // Estimated speed inside campus ~ 15 km/h (250 m/min) + 3 min prep time
        int etaMinutes = Math.max(3, (int) Math.ceil((distanceMeters / 250.0) + 3));

        // Generate intermediate waypoints for smooth polyline path
        List<List<Double>> waypoints = new ArrayList<>();
        int steps = 5;
        for (int i = 0; i <= steps; i++) {
            double ratio = (double) i / steps;
            // add slight curved offsets for realistic path rendering
            double latOffset = Math.sin(ratio * Math.PI) * 0.0001;
            double lngOffset = Math.cos(ratio * Math.PI) * 0.0001;
            double lat = startLat + (endLat - startLat) * ratio + latOffset;
            double lng = startLng + (endLng - startLng) * ratio + lngOffset;
            waypoints.add(Arrays.asList(lat, lng));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "distanceMeters", Math.round(distanceMeters),
                "distanceKm", Math.round((distanceMeters / 1000.0) * 100.0) / 100.0,
                "etaMinutes", etaMinutes,
                "waypoints", waypoints
        ));
    }
}
