export interface AmapStartPoint {
  name: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  address?: string;
  amapName?: string;
}

export const createAmapNavigationUrl = (startPoint: AmapStartPoint) => {
  const latitude = startPoint.latitude ?? startPoint.lat;
  const longitude = startPoint.longitude ?? startPoint.lng;
  const label = encodeURIComponent(startPoint.amapName ?? startPoint.name);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://uri.amap.com/navigation?to=${longitude},${latitude},${label}&mode=walk&policy=1&src=zenrun&coordinate=gaode&callnative=1`;
  }

  const keyword = encodeURIComponent(startPoint.address ?? startPoint.amapName ?? startPoint.name);
  return `https://uri.amap.com/search?keyword=${keyword}`;
};
