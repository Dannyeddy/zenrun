import { publicAsset } from '../lib/publicAsset';

export interface LandmarkEntry {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  gallery: string[];
  audio: string | null;
  audioText?: string;
  routeId: string;
  lat: number;
  lng: number;
  triggerRadius: number;
  type: 'historical' | 'historical-landmark' | 'campus-test' | 'campus-landmark';
  fragmentIndex?: number;
  description: string;
}

const historicalAudioById: Partial<Record<string, string>> = {
  pingjianglu: publicAsset('audio/landmarks/pingjiang-road.mp3'),
  shizilin: publicAsset('audio/landmarks/shizilin.mp3'),
  suzoubowuguan: publicAsset('audio/landmarks/suzhou-museum.mp3'),
  zhuozhengyuan: publicAsset('audio/landmarks/zhuozhengyuan.mp3'),
  shantangjie: publicAsset('audio/landmarks/shantang-street.mp3'),
  liuyuan: publicAsset('audio/landmarks/liuyuan.mp3'),
  'xiyuan-temple': publicAsset('audio/landmarks/xiyuan-temple.mp3'),
};

const assetList = (paths: string[]) => paths.map((path) => publicAsset(path));

const createLandmark = (
  id: string,
  title: string,
  routeId: string,
  lat: number,
  lng: number,
  description: string,
  options: Partial<
    Pick<LandmarkEntry, 'image' | 'gallery' | 'audio' | 'subtitle' | 'fragmentIndex' | 'triggerRadius'>
  > = {},
): LandmarkEntry => ({
  id,
  title,
  subtitle: options.subtitle,
  image: options.image ?? publicAsset(`${id}.jpg`),
  gallery: options.gallery ?? assetList([`${id}.jpg`, `${id}2.jpg`]),
  audio: options.audio ?? historicalAudioById[id] ?? publicAsset(`${id}.mp3`),
  routeId,
  lat,
  lng,
  triggerRadius: options.triggerRadius ?? 120,
  type: 'historical-landmark',
  fragmentIndex: options.fragmentIndex,
  description,
});

// GCJ-02 coordinates from public/routes/西交利物浦大学测试路线.kml.
const XJTLU_TEST_COORDS = {
  lifeScience: { lat: 31.278294, lng: 120.732617 },
  centralBuilding: { lat: 31.277148, lng: 120.733629 },
  centralLibrary: { lat: 31.275026, lng: 120.733931 },
  sportsCentre: { lat: 31.272608, lng: 120.73894 },
  ibss: { lat: 31.271564, lng: 120.735386 },
  filmSchool: { lat: 31.272505, lng: 120.734958 },
};

const createXjtluLandmark = ({
  id,
  title,
  subtitle,
  gallery,
  audio,
  lat,
  lng,
  fragmentIndex,
  description,
}: {
  id: string;
  title: string;
  subtitle: string;
  gallery: string[];
  audio: string;
  lat: number;
  lng: number;
  fragmentIndex: number;
  description: string;
}): LandmarkEntry => ({
  id,
  title,
  subtitle,
  image: gallery[0],
  gallery,
  audio,
  routeId: 'xjtlu-test',
  lat,
  lng,
  triggerRadius: 100,
  type: 'campus-landmark',
  fragmentIndex,
  description,
});

export const landmarks: LandmarkEntry[] = [
  createLandmark(
    'pingjianglu',
    'Pingjiang Road',
    'h1',
    31.316106,
    120.629586,
    'Pingjiang Road preserves the texture of old Suzhou with canal-side life, stone bridges, and lanes that still echo the rhythm of the ancient city.',
    { fragmentIndex: 1 },
  ),
  createLandmark(
    'shizilin',
    'Lion Grove Garden',
    'h1',
    31.322945,
    120.625529,
    'Lion Grove Garden is famed for its scholar-stone labyrinth, where winding rockeries invite visitors into a compact world of imagination and reflection.',
    { fragmentIndex: 2 },
  ),
  createLandmark(
    'suzoubowuguan',
    'Suzhou Museum',
    'h1',
    31.324834,
    120.623717,
    'Suzhou Museum bridges old and new, pairing local heritage collections with architectural language that responds carefully to the city cultural memory.',
    { fragmentIndex: 3 },
  ),
  createLandmark(
    'zhuozhengyuan',
    "Humble Administrator's Garden",
    'h1',
    31.325503,
    120.626257,
    'The Humble Administrator Garden is one of Suzhou most celebrated classical gardens, balancing water, halls, and pavilions in poetic harmony.',
    { fragmentIndex: 4 },
  ),
  createLandmark(
    'shantangjie',
    'Shantang Street',
    'h2',
    31.320119,
    120.596266,
    'Shantang Street combines commerce, canals, and lantern-lit atmosphere, preserving a lively corridor that has connected people through generations.',
    { fragmentIndex: 1 },
  ),
  createLandmark(
    'liuyuan',
    'Lingering Garden',
    'h2',
    31.317139,
    120.589152,
    'The Lingering Garden is known for its refined sequence of halls, courtyards, and framed views that turn movement itself into part of the scenery.',
    { fragmentIndex: 2 },
  ),
  createLandmark(
    'xiyuan-temple',
    'Xiyuan Temple',
    'h2',
    31.315508,
    120.583683,
    'Xiyuan Temple is a historic Buddhist temple in Suzhou, known for its peaceful courtyards, classical architecture, and long cultural memory.',
    {
      subtitle: '\u897f\u56ed\u5bfa',
      image: publicAsset('0.jpg'),
      gallery: assetList(['0.jpg', '1 (2).jpg']),
      fragmentIndex: 3,
      triggerRadius: 100,
    },
  ),
  createXjtluLandmark({
    id: 'xjtlu-central-building',
    title: 'XJTLU Foundation Building',
    subtitle: '\u897f\u4ea4\u5229\u7269\u6d66\u5927\u5b66\u4e2d\u6821\u533a\u57fa\u7840\u697c',
    gallery: [
      publicAsset('landmarks/xjtlu/foundation-building-1.jpg'),
    ],
    audio: publicAsset('landmarks/xjtlu/foundation-building.mp3'),
    lat: XJTLU_TEST_COORDS.centralBuilding.lat,
    lng: XJTLU_TEST_COORDS.centralBuilding.lng,
    fragmentIndex: 1,
    description:
      'As one of the earliest buildings on campus, the Foundation Building is where many students begin university life, adapting, exploring, and taking their first academic steps.',
  }),
  createXjtluLandmark({
    id: 'xjtlu-central-library',
    title: 'XJTLU Central Library',
    subtitle: '\u897f\u4ea4\u5229\u7269\u6d66\u5927\u5b66\u4e2d\u6821\u533a\u56fe\u4e66\u9986',
    gallery: [
      publicAsset('landmarks/xjtlu/central-library-1.jpg'),
      publicAsset('landmarks/xjtlu/central-library-2.jpg'),
      publicAsset('landmarks/xjtlu/central-library-3.jpg'),
    ],
    audio: publicAsset('landmarks/xjtlu/central-library.mp3'),
    lat: XJTLU_TEST_COORDS.centralLibrary.lat,
    lng: XJTLU_TEST_COORDS.centralLibrary.lng,
    fragmentIndex: 2,
    description:
      'The library checkpoint records a quiet study memory along the XJTLU route.',
  }),
  createXjtluLandmark({
    id: 'xjtlu-film-school',
    title: 'XJTLU School of Film and TV Arts',
    subtitle: '\u897f\u4ea4\u5229\u7269\u6d66\u5927\u5b66\u5f71\u89c6\u827a\u672f\u5b66\u9662',
    gallery: assetList(['landmarks/xjtlu/film-school-1.jpg', 'landmarks/xjtlu/film-school-2.jpg']),
    audio: publicAsset('landmarks/xjtlu/film-school.mp3'),
    lat: XJTLU_TEST_COORDS.filmSchool.lat,
    lng: XJTLU_TEST_COORDS.filmSchool.lng,
    fragmentIndex: 3,
    description:
      'This checkpoint connects the route with creative media and visual storytelling.',
  }),
  createXjtluLandmark({
    id: 'xjtlu-sports-centre',
    title: 'XJTLU Sports Centre',
    subtitle: '\u897f\u4ea4\u5229\u7269\u6d66\u5927\u5b66\u4f53\u80b2\u9986',
    gallery: assetList(['sports_centre.jpg', 'sports_centre(2).jpg']),
    audio: publicAsset('sports-centre.mp3'),
    lat: XJTLU_TEST_COORDS.sportsCentre.lat,
    lng: XJTLU_TEST_COORDS.sportsCentre.lng,
    fragmentIndex: 4,
    description:
      'The sports centre checkpoint marks the active campus rhythm of the XJTLU test route.',
  }),
  createXjtluLandmark({
    id: 'xjtlu-life-sciences-building',
    title: 'XJTLU Life Sciences Building',
    subtitle: '\u897f\u4ea4\u5229\u7269\u6d66\u5927\u5b66\u5317\u6821\u533a\u751f\u547d\u79d1\u5b66\u697c',
    gallery: [
      publicAsset('landmarks/xjtlu/life-sciences-building-1.jpg'),
    ],
    audio: publicAsset('life-science.mp3'),
    lat: XJTLU_TEST_COORDS.lifeScience.lat,
    lng: XJTLU_TEST_COORDS.lifeScience.lng,
    fragmentIndex: 5,
    description:
      'This point represents the science and research side of the XJTLU campus.',
  }),
  createXjtluLandmark({
    id: 'xjtlu-ibss',
    title: 'International Business School Suzhou',
    subtitle: '\u897f\u4ea4\u5229\u7269\u6d66\u5927\u5b66\u5357\u6821\u533a\u56fd\u9645\u5546\u5b66\u9662',
    gallery: assetList(['ibss-1.jpg']),
    audio: publicAsset('ibss.mp3'),
    lat: XJTLU_TEST_COORDS.ibss.lat,
    lng: XJTLU_TEST_COORDS.ibss.lng,
    fragmentIndex: 6,
    description:
      'IBSS marks the business school destination and completes this campus route memory.',
  }),
];

export const landmarksById = Object.fromEntries(landmarks.map((landmark) => [landmark.id, landmark])) as Record<
  string,
  LandmarkEntry
>;

export const getLandmarksForRoute = (routeId: string) =>
  landmarks.filter((landmark) => landmark.routeId === routeId);
