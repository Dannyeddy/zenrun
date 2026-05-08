import React, { useMemo, useState } from 'react';
import { LandmarkEntry } from '../data/landmarks';
import { CulturalRoute, GeoPoint } from '../domain/routes';
import { LocationSource } from '../services/useLocationService';

interface RouteMapProps {
  route: CulturalRoute;
  currentCoords: GeoPoint;
  source: LocationSource;
  activeLandmark: LandmarkEntry | null;
  mapDelta: GeoPoint;
}

const RouteMap = ({
  route,
  currentCoords,
  source,
  activeLandmark,
  mapDelta,
}: RouteMapProps) => {
  const [failedTileCount, setFailedTileCount] = useState(0);
  const mapCenter = useMemo<GeoPoint>(() => {
    if (source === 'gps' || source === 'controlled') {
      return currentCoords;
    }

    if (activeLandmark) {
      return {
        latitude: activeLandmark.lat,
        longitude: activeLandmark.lng,
      };
    }

    return route.center;
  }, [activeLandmark, currentCoords, route.center, source]);

  const tileView = useMemo(() => {
    // Display layer uses GaoDe/Amap web tiles for mainland China reliability.
    // Landmark trigger distance is calculated separately in proximityEngine with app route coordinates.
    const zoom = 15;
    const tileSize = 256;
    const worldSize = tileSize * 2 ** zoom;
    const clampLat = (latitude: number) => Math.max(-85.05112878, Math.min(85.05112878, latitude));
    const project = ({ latitude, longitude }: GeoPoint) => {
      const clampedLat = clampLat(latitude);
      const sinLat = Math.sin((clampedLat * Math.PI) / 180);

      return {
        x: ((longitude + 180) / 360) * worldSize,
        y:
          (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) *
          worldSize,
      };
    };

    const topLeft = project({
      latitude: mapCenter.latitude + mapDelta.latitude,
      longitude: mapCenter.longitude - mapDelta.longitude,
    });
    const bottomRight = project({
      latitude: mapCenter.latitude - mapDelta.latitude,
      longitude: mapCenter.longitude + mapDelta.longitude,
    });
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;
    const startX = Math.floor(topLeft.x / tileSize);
    const endX = Math.floor(bottomRight.x / tileSize);
    const startY = Math.floor(topLeft.y / tileSize);
    const endY = Math.floor(bottomRight.y / tileSize);
    const maxTile = 2 ** zoom;
    const tiles: Array<{
      key: string;
      src: string;
      left: number;
      top: number;
      width: number;
      height: number;
    }> = [];

    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        if (y < 0 || y >= maxTile) {
          continue;
        }

        const wrappedX = ((x % maxTile) + maxTile) % maxTile;
        const subdomain = ((wrappedX + y) % 4) + 1;
        tiles.push({
          key: `${zoom}-${wrappedX}-${y}`,
          src: `https://webrd0${subdomain}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=${wrappedX}&y=${y}&z=${zoom}`,
          left: ((x * tileSize - topLeft.x) / width) * 100,
          top: ((y * tileSize - topLeft.y) / height) * 100,
          width: (tileSize / width) * 100,
          height: (tileSize / height) * 100,
        });
      }
    }

    return { tiles, failedThreshold: Math.max(3, Math.ceil(tiles.length * 0.6)) };
  }, [mapCenter, mapDelta]);

  const showFallbackMap = failedTileCount >= tileView.failedThreshold;

  const visibleLandmarkMarkers = useMemo(
    () =>
      route.landmarks
        .map((landmark) => {
          const x =
            ((landmark.lng - (mapCenter.longitude - mapDelta.longitude)) /
              (mapDelta.longitude * 2)) *
            100;
          const y =
            (1 -
              (landmark.lat - (mapCenter.latitude - mapDelta.latitude)) /
                (mapDelta.latitude * 2)) *
            100;

          return {
            ...landmark,
            x,
            y,
            visible: x >= 0 && x <= 100 && y >= 0 && y <= 100,
          };
        })
        .filter((landmark) => landmark.visible),
    [mapCenter, mapDelta, route.landmarks],
  );

  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-[#EAF1EB]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(126,232,224,0.18),rgba(255,255,255,0.36)),linear-gradient(90deg,rgba(47,76,74,0.08)_1px,transparent_1px),linear-gradient(rgba(47,76,74,0.08)_1px,transparent_1px)] bg-[length:100%_100%,42px_42px,42px_42px]" />
        {!showFallbackMap &&
          tileView.tiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.src}
              alt=""
              aria-hidden="true"
              className="absolute max-w-none select-none"
              style={{
                left: `${tile.left}%`,
                top: `${tile.top}%`,
                width: `${tile.width}%`,
                height: `${tile.height}%`,
              }}
              draggable={false}
              referrerPolicy="no-referrer"
              onError={() => setFailedTileCount((count) => count + 1)}
            />
          ))}
        {showFallbackMap && (
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-[32px] border border-white/70 bg-white/70 px-5 py-4 text-center shadow-xl backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-dark">
              Map fallback
            </p>
            <p className="mt-2 text-xs font-bold leading-relaxed text-text-muted">
              Live tiles are unavailable. Route tracking can continue.
            </p>
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-brand/5 backdrop-blur-[1px]" />

      <div className="absolute inset-0 pointer-events-none">
        {visibleLandmarkMarkers.map((landmark) => (
          <div
            key={landmark.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${landmark.x}%`, top: `${landmark.y}%` }}
          >
            <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-md" />
          </div>
        ))}

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 rounded-full bg-brand/30 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-brand border-2 border-white shadow-md" />
          </div>
        </div>
      </div>
    </>
  );
};

export default RouteMap;
