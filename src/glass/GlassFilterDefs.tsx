import React, { useMemo } from 'react';
import { buildOpticalDisplacementMapUri } from './glassEngine';

interface GlassFilterDefsProps {
  displacementScale: number;
  buttonDisplacementScale: number;
  glassDepth: number;
  chromaticPx: number;
  refractionActive: boolean;
}

export const GlassFilterDefs: React.FC<GlassFilterDefsProps> = React.memo(
  ({
    displacementScale,
    buttonDisplacementScale,
    glassDepth,
    chromaticPx,
    refractionActive,
  }) => {
    const mapUri = useMemo(
      () => buildOpticalDisplacementMapUri(glassDepth),
      [glassDepth]
    );

    if (!refractionActive || displacementScale <= 0) {
      return null;
    }

    const rShift = Math.max(0.4, chromaticPx * 0.85);

    return (
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed h-0 w-0 overflow-hidden"
        width="0"
        height="0"
      >
        <defs>
          <filter
            id="liquid-refract-panel"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={mapUri}
              result="dispMap"
              preserveAspectRatio="none"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="dispMap"
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            {chromaticPx > 0.2 ? (
              <>
                <feOffset in="displaced" dx={rShift} dy="0" result="redShift" />
                <feColorMatrix
                  in="redShift"
                  type="matrix"
                  values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                  result="redOnly"
                />
                <feOffset in="displaced" dx={-rShift} dy="0" result="blueShift" />
                <feColorMatrix
                  in="blueShift"
                  type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                  result="blueOnly"
                />
                <feColorMatrix
                  in="displaced"
                  type="matrix"
                  values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                  result="greenOnly"
                />
                <feBlend in="redOnly" in2="greenOnly" mode="screen" result="rg" />
                <feBlend in="rg" in2="blueOnly" mode="screen" />
              </>
            ) : (
              <feMerge>
                <feMergeNode in="displaced" />
              </feMerge>
            )}
          </filter>

          <filter
            id="liquid-refract-button"
            x="-4%"
            y="-4%"
            width="108%"
            height="108%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={mapUri}
              result="btnMap"
              preserveAspectRatio="none"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="btnMap"
              scale={buttonDisplacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    );
  }
);
