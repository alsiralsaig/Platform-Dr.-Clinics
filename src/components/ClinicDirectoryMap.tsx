import React from 'react';
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Building2,
  Clock,
  Eye,
  EyeOff,
  MapPin,
  Navigation,
  RotateCcw,
  Star,
  Stethoscope,
} from 'lucide-react';
import {
  SUDAN_CENTER,
  SUDAN_REGIONS,
  SUDAN_STATE_COORDS,
  getCenterTypeLabel,
  getClinicCoordinates,
  translateLocality,
  translateRegion,
  translateState,
  type LatLngPoint,
  type SudanRegionKey,
} from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import type { ClinicCenter, DoctorProfile } from '../types/medical';

interface ClinicDirectoryMapProps {
  clinics: ClinicCenter[];
  doctors: DoctorProfile[];
  selectedState: string;
  selectedRegion?: SudanRegionKey | '';
  onSelectClinic: (clinic: ClinicCenter) => void;
  onResetStateFilter?: () => void;
}

interface ResolvedClinicEntry {
  clinic: ClinicCenter;
  position: LatLngPoint;
  isVerifiedPlace: boolean;
  formattedAddress?: string;
  doctorsCount: number;
}

const MAPS_API_KEY = (
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof __FALLBACK_GMAPS_KEY__ !== 'undefined' ? __FALLBACK_GMAPS_KEY__ : '') ||
  ''
).trim();

function buildDirectionsUrl(entry: ResolvedClinicEntry): string {
  const query = `${entry.position.lat},${entry.position.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

interface ClinicPinMarkerProps {
  entry: ResolvedClinicEntry;
  isSelected: boolean;
  onSelect: () => void;
  onCloseInfo: () => void;
  onOpenClinicDetails: (clinic: ClinicCenter) => void;
}

const ClinicPinMarker: React.FC<ClinicPinMarkerProps> = ({
  entry,
  isSelected,
  onSelect,
  onCloseInfo,
  onOpenClinicDetails,
}) => {
  const { lang, t } = useI18n();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const { clinic, position, isVerifiedPlace, doctorsCount } = entry;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={onSelect}
        title={clinic.name}
        zIndex={isSelected ? 40 : 10}
      >
        <Pin
          background={isSelected ? '#D97706' : '#0F766E'}
          borderColor={isSelected ? '#92400E' : '#115E59'}
          glyphColor="#FFFFFF"
          scale={isSelected ? 1.2 : 1.0}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={onCloseInfo}
          maxWidth={320}
        >
          <div
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="p-1 space-y-2.5 text-slate-900 min-w-[230px]"
          >
            <div>
              <p className="text-[11px] font-semibold text-teal-800">
                {getCenterTypeLabel(clinic.centerType, lang)} · {t.directory.licenseLabel}{' '}
                {clinic.licenseNumber}
              </p>
              <h4 className="font-display text-sm font-bold text-slate-900 mt-0.5">
                {clinic.name}
              </h4>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>
                  {translateState(clinic.state, lang)} · {translateLocality(clinic.locality, lang)}
                  {clinic.area ? ` · ${clinic.area}` : ''}
                </span>
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{clinic.workingHours}</span>
              </p>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-800 font-semibold">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {clinic.ratingAvg > 0 ? clinic.ratingAvg.toFixed(1) : t.common.newLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                  <span className="font-mono tabular-nums">{doctorsCount}</span>{' '}
                  {t.map.doctorsCountSuffix}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {isVerifiedPlace ? t.map.verifiedPlaceNote : t.map.approxLocationNote}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenClinicDetails(clinic)}
                className="flex-1 px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer text-center whitespace-nowrap"
              >
                {t.map.viewCenterDetails}
              </button>
              <a
                href={buildDirectionsUrl(entry)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg whitespace-nowrap"
              >
                <Navigation className="w-3.5 h-3.5 text-teal-700" />
                <span>{t.map.getDirections}</span>
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

interface InteractiveMapCanvasProps {
  entries: ResolvedClinicEntry[];
  selectedState: string;
  selectedRegion?: SudanRegionKey | '';
  selectedClinicId: string | null;
  onSelectClinicId: (id: string | null) => void;
  onOpenClinicDetails: (clinic: ClinicCenter) => void;
  onPlacesResolved: (resolved: Record<string, { lat: number; lng: number; address?: string }>) => void;
  resolvedCache: Record<string, { lat: number; lng: number; address?: string }>;
}

const InteractiveMapCanvas: React.FC<InteractiveMapCanvasProps> = ({
  entries,
  selectedState,
  selectedRegion,
  selectedClinicId,
  onSelectClinicId,
  onOpenClinicDetails,
  onPlacesResolved,
  resolvedCache,
}) => {
  const { t } = useI18n();
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const apiStatus = useApiLoadingStatus();
  const attemptedRef = React.useRef<Record<string, boolean>>({});

  // Pan & zoom smoothly when state or geographic region filter changes
  React.useEffect(() => {
    if (!map) return;
    if (selectedState && SUDAN_STATE_COORDS[selectedState]) {
      map.panTo(SUDAN_STATE_COORDS[selectedState]);
      map.setZoom(11);
    } else if (selectedRegion) {
      const regionInfo = SUDAN_REGIONS.find((r) => r.id === selectedRegion);
      if (regionInfo) {
        map.panTo(regionInfo.center);
        map.setZoom(regionInfo.zoom);
      }
    } else if (!selectedClinicId) {
      map.panTo(SUDAN_CENTER);
      map.setZoom(6);
    }
  }, [map, selectedState, selectedRegion, selectedClinicId]);

  // Pan to selected clinic pin
  React.useEffect(() => {
    if (!map || !selectedClinicId) return;
    const found = entries.find((e) => e.clinic.id === selectedClinicId);
    if (found) {
      map.panTo(found.position);
      map.setZoom(13);
    }
  }, [map, selectedClinicId, entries]);

  // Enrich clinic pins via Places SDK (new Place.searchByText) when Places library is ready
  React.useEffect(() => {
    if (!placesLib || apiStatus !== APILoadingStatus.LOADED) return;
    const PlaceCtor = (placesLib as unknown as { Place?: { searchByText?: (req: unknown) => Promise<{ places?: Array<{ location?: { lat: () => number; lng: () => number }; formattedAddress?: string }> }> } }).Place;
    if (!PlaceCtor?.searchByText) return;

    const toLookup = entries
      .filter((e) => !resolvedCache[e.clinic.id] && !attemptedRef.current[e.clinic.id])
      .slice(0, 6);

    if (toLookup.length === 0) return;

    let cancelled = false;
    (async () => {
      const updates: Record<string, { lat: number; lng: number; address?: string }> = {};
      for (const item of toLookup) {
        attemptedRef.current[item.clinic.id] = true;
        try {
          const textQuery = `${item.clinic.name}, ${item.clinic.locality}, ${item.clinic.state}, Sudan`;
          const resp = await PlaceCtor.searchByText!({
            textQuery,
            fields: ['location', 'formattedAddress'],
            maxResultCount: 1,
          });
          const place = resp?.places?.[0];
          if (place?.location) {
            updates[item.clinic.id] = {
              lat: place.location.lat(),
              lng: place.location.lng(),
              address: place.formattedAddress,
            };
          }
        } catch {
          // Graceful fallback to Sudan state/locality coordinates already rendered
        }
      }
      if (!cancelled && Object.keys(updates).length > 0) {
        onPlacesResolved(updates);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [placesLib, apiStatus, entries, resolvedCache, onPlacesResolved]);

  if (apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="h-[460px] w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center space-y-2">
        <MapPin className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
          {t.map.loadErrorTitle}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">{t.map.loadErrorDesc}</p>
      </div>
    );
  }

  return (
    <div className="h-[460px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
      <GoogleMap
        defaultCenter={SUDAN_CENTER}
        defaultZoom={6}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        gestureHandling="greedy"
        className="w-full h-full"
        onClick={() => onSelectClinicId(null)}
      >
        {entries.map((entry) => (
          <ClinicPinMarker
            key={entry.clinic.id}
            entry={entry}
            isSelected={selectedClinicId === entry.clinic.id}
            onSelect={() => onSelectClinicId(entry.clinic.id)}
            onCloseInfo={() => onSelectClinicId(null)}
            onOpenClinicDetails={onOpenClinicDetails}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export const ClinicDirectoryMap: React.FC<ClinicDirectoryMapProps> = ({
  clinics,
  doctors,
  selectedState,
  selectedRegion = '',
  onSelectClinic,
  onResetStateFilter,
}) => {
  const { lang, t } = useI18n();
  const [mapExpanded, setMapExpanded] = React.useState(true);
  const [selectedClinicId, setSelectedClinicId] = React.useState<string | null>(null);
  const [resolvedPlaces, setResolvedPlaces] = React.useState<
    Record<string, { lat: number; lng: number; address?: string }>
  >({});

  const handlePlacesResolved = React.useCallback(
    (updates: Record<string, { lat: number; lng: number; address?: string }>) => {
      setResolvedPlaces((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const entries = React.useMemo<ResolvedClinicEntry[]>(() => {
    const clusterCounts: Record<string, number> = {};
    return clinics
      .filter((c) => c.approvalStatus === 'approved')
      .map((clinic) => {
        const clusterKey = `${clinic.state}::${clinic.locality}`;
        const indexInCluster = clusterCounts[clusterKey] || 0;
        clusterCounts[clusterKey] = indexInCluster + 1;

        const cached = resolvedPlaces[clinic.id];
        const position = cached
          ? { lat: cached.lat, lng: cached.lng }
          : getClinicCoordinates(clinic, indexInCluster);

        const doctorsCount = doctors.filter(
          (d) =>
            d.approvalStatus === 'approved' &&
            (d.clinicId === clinic.id ||
              (d.workplaceName &&
                d.workplaceName.trim().toLowerCase() === clinic.name.trim().toLowerCase()))
        ).length;

        return {
          clinic,
          position,
          isVerifiedPlace: Boolean(cached),
          formattedAddress: cached?.address,
          doctorsCount,
        };
      });
  }, [clinics, doctors, resolvedPlaces]);

  React.useEffect(() => {
    if (selectedClinicId && !entries.some((e) => e.clinic.id === selectedClinicId)) {
      setSelectedClinicId(null);
    }
  }, [entries, selectedClinicId]);

  const handleResetView = () => {
    setSelectedClinicId(null);
    onResetStateFilter?.();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0" />
            <span>{t.map.sectionTitle}</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t.map.sectionDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono tabular-nums font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
            {entries.length} {t.map.approvedCentersCount}
          </span>
          {(selectedState || selectedRegion || selectedClinicId) && (
            <button
              type="button"
              onClick={handleResetView}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.map.resetView}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMapExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
          >
            {mapExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{mapExpanded ? t.map.toggleHide : t.map.toggleShow}</span>
          </button>
        </div>
      </div>

      {mapExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Interactive Map Pane */}
          <div className="lg:col-span-8">
            {!MAPS_API_KEY ? (
              <div className="h-[460px] w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center space-y-2">
                <MapPin className="w-9 h-9 text-amber-600 dark:text-amber-400" />
                <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t.map.missingKeyTitle}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                  {t.map.missingKeyDesc}
                </p>
              </div>
            ) : (
              <APIProvider
                key={lang}
                apiKey={MAPS_API_KEY}
                libraries={['marker', 'places']}
                language={lang}
                region="SD"
              >
                <InteractiveMapCanvas
                  entries={entries}
                  selectedState={selectedState}
                  selectedRegion={selectedRegion}
                  selectedClinicId={selectedClinicId}
                  onSelectClinicId={setSelectedClinicId}
                  onOpenClinicDetails={onSelectClinic}
                  onPlacesResolved={handlePlacesResolved}
                  resolvedCache={resolvedPlaces}
                />
              </APIProvider>
            )}
          </div>

          {/* Synchronized Center List */}
          <div className="lg:col-span-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/60 dark:bg-slate-800/50 overflow-hidden flex flex-col h-[460px]">
            <div className="p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="font-display text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                {t.map.centerListTitle} ({entries.length})
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedState
                  ? translateState(selectedState, lang)
                  : selectedRegion
                    ? translateRegion(selectedRegion, lang)
                    : t.map.allSudanStates}
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <Building2 className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                <p>{t.map.noClinicsOnMap}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-700/70">
                {entries.map((entry) => {
                  const isSelected = selectedClinicId === entry.clinic.id;
                  return (
                    <div
                      key={entry.clinic.id}
                      className={`p-3.5 transition-colors ${
                        isSelected
                          ? 'bg-teal-50/90 dark:bg-teal-950/50'
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedClinicId(entry.clinic.id)}
                        className="w-full text-start space-y-1 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display text-xs font-bold text-slate-900 dark:text-slate-100">
                            {entry.clinic.name}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {entry.clinic.ratingAvg > 0
                              ? entry.clinic.ratingAvg.toFixed(1)
                              : t.common.newLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-teal-800 dark:text-teal-400 font-medium">
                          {getCenterTypeLabel(entry.clinic.centerType, lang)}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {translateState(entry.clinic.state, lang)} ·{' '}
                          {translateLocality(entry.clinic.locality, lang)}
                          {entry.clinic.area ? ` · ${entry.clinic.area}` : ''}
                        </p>
                      </button>

                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectClinic(entry.clinic)}
                          className="flex-1 px-2.5 py-1.5 text-[11px] font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-md cursor-pointer text-center whitespace-nowrap"
                        >
                          {t.map.viewCenterDetails}
                        </button>
                        <a
                          href={buildDirectionsUrl(entry)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md whitespace-nowrap"
                        >
                          <Navigation className="w-3 h-3 text-teal-700 dark:text-teal-400" />
                          <span>{t.map.getDirections}</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-3.5 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
              {t.map.clickPinHint}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
