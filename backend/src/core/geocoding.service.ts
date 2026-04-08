import { Injectable } from '@nestjs/common';

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

@Injectable()
export class GeocodingService {
  private googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  private googleMapsBaseUrl = 'https://maps.googleapis.com/maps/api';

  constructor() {
    console.log('GeocodingService: API key loaded:', !!this.googleMapsApiKey);
  }

  /**
   * Geocode an address to get latitude and longitude
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!address || !address.trim()) {
      return null;
    }

    if (!this.googleMapsApiKey) {
      console.warn('GOOGLE_MAPS_API_KEY not configured');
      return null;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.googleMapsBaseUrl}/geocode/json?address=${encodedAddress}&key=${this.googleMapsApiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        const { lat, lng } = firstResult.geometry.location;
        const formattedAddress = firstResult.formatted_address;

        return {
          address: address,
          latitude: lat,
          longitude: lng,
          formattedAddress: formattedAddress
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Get address suggestions using Google Places API
   */
  async getAddressSuggestions(input: string): Promise<any[]> {
    if (!input || input.length < 3 || !this.googleMapsApiKey) {
      console.log('Geocoding: Missing input or API key', { input: !!input, inputLength: input?.length, apiKey: !!this.googleMapsApiKey });
      return [];
    }

    try {
      const encodedInput = encodeURIComponent(input);
      const url = `${this.googleMapsBaseUrl}/place/autocomplete/json?input=${encodedInput}&key=${this.googleMapsApiKey}&components=country:us|country:ca`;

      console.log('Geocoding: Making request to:', url.replace(this.googleMapsApiKey, '[API_KEY]'));

      const response = await fetch(url);
      const data = await response.json();

      console.log('Geocoding: Response status:', response.status, 'Data status:', data.status);
      console.log('Geocoding: Response data:', JSON.stringify(data, null, 2));
      console.log('Geocoding: First prediction:', data.predictions?.[0]);

      if (data.predictions) {
        return data.predictions.map((prediction: any) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting?.main_text || prediction.description,
          secondaryText: prediction.structured_formatting?.secondary_text || ''
        }));
      }

      return [];
    } catch (error) {
      console.error('Places autocomplete error:', error);
      return [];
    }
  }

  /**
   * Get coordinates for a place ID from Google Places API
   */
  async getCoordinatesFromPlaceId(placeId: string): Promise<GeocodeResult | null> {
    if (!placeId || !this.googleMapsApiKey) {
      return null;
    }

    try {
      const url = `${this.googleMapsBaseUrl}/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${this.googleMapsApiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;
        const formattedAddress = data.result.formatted_address;

        return {
          address: formattedAddress,
          latitude: lat,
          longitude: lng,
          formattedAddress: formattedAddress
        };
      }

      return null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }
}
