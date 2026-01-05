import { PrismaClient } from "../generated/prisma/client";

/**
 * Service to handle Geocoding (Address -> Coordinates)
 * Uses OpenStreetMap Nominatim API (Free, requires User-Agent)
 */
export class GeocodingService {
    private readonly baseUrl = "https://nominatim.openstreetmap.org/search";
    private readonly userAgent = "OneNightCampingApp/1.0"; // Required by Nominatim

    constructor() {
    }

    /**
     * Get latitude and longitude from an address string.
     * Returns null if not found.
     */
    async getCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
        try {
            const url = new URL(this.baseUrl);
            url.searchParams.append("q", address);
            url.searchParams.append("format", "json");
            url.searchParams.append("limit", "1");

            const response = await fetch(url.toString(), {
                headers: {
                    "User-Agent": this.userAgent
                }
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon) // Nominatim uses 'lon', we use 'lng'
                };
            }

            return null;
        } catch (error) {
            return null;
        }
    }
} 
