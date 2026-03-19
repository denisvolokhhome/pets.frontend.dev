import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { BreederMarker, Coordinates } from '../../models/search';
import { getPetTypeIcon } from '../../models/pet-type';

@Component({
  standalone: false,
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() center: Coordinates = { latitude: 39.8283, longitude: -98.5795 };
  @Input() markers: BreederMarker[] = [];
  @Input() radius: number = 40;

  @Output() markerClick = new EventEmitter<string>();
  @Output() markerHover = new EventEmitter<string>();

  private map!: L.Map;
  private markerClusterGroup!: L.MarkerClusterGroup;
  private radiusCircle?: L.Circle;
  private markerMap = new Map<string, L.Marker>();
  private isInitialized = false;

  /**
   * Create a divIcon label showing animal kind emojis for a breeder
   */
  private createAnimalKindIcon(breederMarker: BreederMarker): L.DivIcon {
    // Get unique animal kinds from the breeder's breeds
    const kinds = new Set<string>();
    breederMarker.breeder.available_breeds.forEach(b => {
      if (b.breed_kind) {
        kinds.add(b.breed_kind);
      }
    });

    // Build emoji string from kinds
    const emojis = Array.from(kinds).map(k => getPetTypeIcon(k)).join('');
    const label = emojis || '🐾';

    return L.divIcon({
      className: 'animal-kind-marker',
      html: `<div class="marker-label">${label}</div>`,
      iconSize: [40, 32],
      iconAnchor: [20, 32],
      popupAnchor: [0, -30]
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isInitialized) {
      if (changes['markers']) {
        this.updateMarkers();
      }
      if (changes['radius'] || changes['center']) {
        this.updateRadiusCircle();
      }
      if (changes['center']) {
        this.updateMapCenter();
      }
    }
  }

  private initializeMap(): void {
    // Guard against double initialization
    if (this.isInitialized || this.map) {
      return;
    }
    
    // Initialize Leaflet map with OpenStreetMap tiles
    this.map = L.map('map', {
      center: L.latLng(this.center.latitude, this.center.longitude),
      zoom: 12,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: true
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Initialize marker cluster group with 80px radius
    this.markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    });

    this.map.addLayer(this.markerClusterGroup);

    // Draw initial radius circle
    this.drawRadiusCircle(this.center, this.radius);

    this.isInitialized = true;

    // Force Leaflet to recalculate size after the layout has settled
    // Fixes gray tiles when the container size isn't final at init time
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);

    // Update markers if they were set before initialization
    if (this.markers.length > 0) {
      this.updateMarkers();
    }
  }

  private updateMapCenter(): void {
    if (this.map && this.center) {
      this.map.setView(L.latLng(this.center.latitude, this.center.longitude), this.map.getZoom());
    }
  }

  private updateMarkers(): void {
    if (!this.map || !this.markerClusterGroup) {
      return;
    }

    // Clear existing markers
    this.markerClusterGroup.clearLayers();
    this.markerMap.clear();

    // Add new markers with offset positions for privacy
    this.markers.forEach(breederMarker => {
      // Offset position by ~0.5-1.5 miles randomly for privacy
      const offsetPosition = this.offsetPosition(
        breederMarker.position.latitude,
        breederMarker.position.longitude
      );

      const marker = L.marker(
        L.latLng(offsetPosition.latitude, offsetPosition.longitude),
        { icon: this.createAnimalKindIcon(breederMarker) }
      );

      // Add click event
      marker.on('click', () => {
        this.markerClick.emit(breederMarker.id);
      });

      // Add hover events
      marker.on('mouseover', () => {
        this.markerHover.emit(breederMarker.id);
      });

      // Add popup with breeder info (approximate location notice)
      marker.bindPopup(`
        <div class="breeder-popup">
          <h4>${breederMarker.breeder.breeder_name}</h4>
          <p>~${breederMarker.breeder.distance.toFixed(1)} miles away</p>
          <p class="approx-notice">📍 Approximate location</p>
          ${breederMarker.breeder.available_breeds.length > 0 
            ? `<p>Breeds: ${breederMarker.breeder.available_breeds.map(b => b.breed_name).join(', ')}</p>` 
            : ''}
        </div>
      `);

      this.markerClusterGroup.addLayer(marker);
      this.markerMap.set(breederMarker.id, marker);
    });
  }

  private drawRadiusCircle(center: Coordinates, radiusMiles: number): void {
    // Remove existing circle
    if (this.radiusCircle) {
      this.map.removeLayer(this.radiusCircle);
    }

    // Convert miles to meters (1 mile = 1609.34 meters)
    const radiusMeters = radiusMiles * 1609.34;

    // Create new circle
    this.radiusCircle = L.circle(L.latLng(center.latitude, center.longitude), {
      radius: radiusMeters,
      color: '#3388ff',
      fillColor: '#3388ff',
      fillOpacity: 0.1,
      weight: 2
    });

    this.radiusCircle.addTo(this.map);
  }

  private updateRadiusCircle(): void {
    if (this.map && this.center) {
      this.drawRadiusCircle(this.center, this.radius);
    }
  }

  /**
   * Offset a position by a random amount (~0.5-1.5 miles) for privacy.
   * Uses a seeded random based on lat/lng so the offset is consistent per location.
   */
  private offsetPosition(lat: number, lng: number): { latitude: number; longitude: number } {
    // Simple hash from coordinates for consistent offset per breeder
    const seed = Math.abs(Math.sin(lat * 12345.6789 + lng * 98765.4321)) * 10000;
    const angle = (seed % 360) * (Math.PI / 180);
    // Random offset between 0.005 and 0.015 degrees (~0.3-1 mile)
    const distance = 0.005 + (seed % 100) / 10000;
    return {
      latitude: lat + distance * Math.cos(angle),
      longitude: lng + distance * Math.sin(angle)
    };
  }

  /**
   * Zoom to a specific marker by breeder ID
   */
  public zoomToMarker(breederId: string): void {
    const marker = this.markerMap.get(breederId);
    if (marker && this.map) {
      this.map.setView(marker.getLatLng(), 15, {
        animate: true,
        duration: 0.5
      });
      marker.openPopup();
    }
  }

  /**
   * Trigger bounce animation on a marker
   */
  public bounceMarker(breederId: string): void {
    const marker = this.markerMap.get(breederId);
    if (marker) {
      // Add bounce animation class
      const icon = marker.getElement();
      if (icon) {
        icon.classList.add('marker-bounce');
        
        // Remove class after animation completes
        setTimeout(() => {
          icon.classList.remove('marker-bounce');
        }, 600);
      }
    }
  }
}
