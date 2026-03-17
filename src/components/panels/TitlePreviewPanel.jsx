import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";
import TitlePreview from "../previews/TitlePreview";

export const TITLE_ORDER_OPTIONS = ["1", "2", "3", "4", "5", "6"];
export const TITLE_SIZE_OPTIONS = ["auto", "h1", "h2", "h3", "h4", "h5", "h6"];
export const TITLE_WRAP_OPTIONS = ["wrap", "balance", "nowrap"];
export const TITLE_LINE_CLAMP_OPTIONS = ["off", "2", "3"];

function PropertyRow({ label, value, onChange, options, disabled = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <SectionLabel mb={0}>{label}</SectionLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          background: disabled ? "#2A2C31" : "#25262B",
          color: disabled ? "#868E96" : "#E9ECEF",
          border: "1px solid #373A40",
          borderRadius: 6,
          padding: "6px 28px 6px 12px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "monospace",
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          appearance: "none",
          WebkitAppearance: "none",
          textTransform: "capitalize",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235C5F66' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

const textFieldStyle = {
  background: "#1A1B1E",
  border: "1px solid #373A40",
  borderRadius: 4,
  padding: "6px 8px",
  fontSize: 12,
  color: "#C1C2C5",
  fontFamily: "monospace",
  width: "100%",
  boxSizing: "border-box",
};

export function TitlePreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  order,
  sizeKey,
  textWrap,
  lineClamp,
  text,
}) {
  const matrixRows = TITLE_ORDER_OPTIONS.map((orderValue) => ({ label: `h${orderValue}`, orderValue }));
  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <TitlePreview
          brands={brands}
          brandId={activeBrand}
          order={order}
          sizeKey={sizeKey}
          textWrap={textWrap}
          lineClamp={lineClamp}
          text={text}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Heading Orders</SectionLabel>
      <PreviewMatrix
        sizeKeys={[sizeKey]}
        rows={matrixRows}
        renderCell={(row) => (
          <TitlePreview
            brands={brands}
            brandId={activeBrand}
            order={row.orderValue}
            sizeKey={sizeKey}
            textWrap={textWrap}
            lineClamp={lineClamp}
            text={text}
          />
        )}
      />
    </div>
  );
}

export function TitlePropertiesPanel({
  order,
  setOrder,
  sizeKey,
  setSizeKey,
  textWrap,
  setTextWrap,
  lineClamp,
  setLineClamp,
  text,
  setText,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Order" value={String(order)} onChange={setOrder} options={TITLE_ORDER_OPTIONS} />
      <PropertyRow label="Size" value={sizeKey} onChange={setSizeKey} options={TITLE_SIZE_OPTIONS} />
      <PropertyRow label="Text Wrap" value={textWrap} onChange={setTextWrap} options={TITLE_WRAP_OPTIONS} />
      <PropertyRow
        label="Line Clamp"
        value={lineClamp > 0 ? String(lineClamp) : "off"}
        onChange={(v) => setLineClamp(v === "off" ? 0 : Number(v))}
        options={TITLE_LINE_CLAMP_OPTIONS}
      />
      <div>
        <SectionLabel mb={6}>Text</SectionLabel>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} style={textFieldStyle} />
      </div>
    </div>
  );
}
