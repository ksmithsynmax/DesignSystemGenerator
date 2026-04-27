import PreviewStage from "../shared/PreviewStage";
import DefaultPreview from "../previews/DefaultPreview";

export function DefaultPreviewContent({ brands, activeBrand, activeColorToken, previewTheme }) {
  return (
    <div>
      <PreviewStage label={activeColorToken} padding={48}>
        <DefaultPreview brands={brands} brandId={activeBrand} previewTheme={previewTheme} />
      </PreviewStage>
    </div>
  );
}
