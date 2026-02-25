import { useState } from "react";
import TooltipPreview from "../previews/TooltipPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const TOOLTIP_POSITIONS = ["top", "bottom", "left", "right"];

export default function TooltipPreviewPanel({ brands, activeBrand }) {
  const [activePosition, setActivePosition] = useState("top");
  const [withArrow, setWithArrow] = useState(true);

  const matrixRows = TOOLTIP_POSITIONS.map((pos) => ({ label: pos, position: pos }));

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        <div>
          <SectionLabel mb={6}>Position</SectionLabel>
          <ToggleButtonGroup
            options={TOOLTIP_POSITIONS}
            value={activePosition}
            onChange={setActivePosition}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Arrow</SectionLabel>
          <button
            onClick={() => setWithArrow((v) => !v)}
            style={{
              background: withArrow ? "#373A40" : "transparent",
              color: withArrow ? "#E9ECEF" : "#5C5F66",
              border: "1px solid #373A40",
              borderRadius: 4,
              padding: "4px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            {withArrow ? "on" : "off"}
          </button>
        </div>
      </div>

      <PreviewStage padding={60}>
        <TooltipPreview
          brands={brands}
          brandId={activeBrand}
          position={activePosition}
          withArrow={withArrow}
        />
      </PreviewStage>

      <SectionLabel>All Positions</SectionLabel>
      <PreviewMatrix
        sizeKeys={["with arrow", "without arrow"]}
        rows={matrixRows}
        renderCell={(row, arrowCol) => (
          <div style={{ padding: "20px 10px" }}>
            <TooltipPreview
              brands={brands}
              brandId={activeBrand}
              position={row.position}
              withArrow={arrowCol === "with arrow"}
            />
          </div>
        )}
      />

    </div>
  );
}
